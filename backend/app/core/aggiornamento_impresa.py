"""Motore della card "Aggiornamento impresa" (Correzione 24).

Costruita come cronologia automatica, mai un form di inserimento manuale
(§10): questo modulo legge soltanto (indicatori derivati + cronologia dalla
vista `vw_ana_cronologia_aggiornamenti_impresa`), non scrive mai in
`ana_pratiche_camerali`/`ana_trasferimenti_quote`/`ana_variazioni_sede_legale`/
`ana_partecipazioni`/`sys_importazioni_visure_cciaa` — quelle tabelle
restano popolate da flussi futuri (pratiche registrate dal consulente,
import visure, variazioni societarie), fuori dallo scopo di questa
correzione (§ decisione esplicita: "solo infrastruttura").

La verifica per riga (colonna "Stato", § punto 6 — "deve usare il sistema
di conferma già presente... non deve duplicare l'esito") riusa
`app.core.verifica_riga`, chiave `evento_id` (uno UUID reale anche per
l'evento "conferma", derivato deterministicamente nella vista): nessun
secondo sistema di verifica.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_riga import applica_decisione_verifica_riga, leggi_stato_verifica_riga
from app.models.anagrafica import (
    AnaPartecipazione,
    AnaPraticaCamerale,
    AnaTrasferimentoQuote,
    AnaVariazioneSedeLegale,
    CatEsitoPraticaCamerale,
    CatOrigineAggiornamentoImpresa,
    CatTipologiaPraticaCamerale,
)
from app.models.sistema import CatStatoImportazioneVisura, SysImportazioneVisuraCciaa, SysUtente
from app.schemas.aggiornamento_impresa import (
    CampoDettaglioEvento,
    CronologiaEventoDettaglio,
    CronologiaEventoRead,
    IndicatoriAggiornamentoImpresa,
)

SEZIONE_CODICE_VERIFICA_CRONOLOGIA = "ANAGRAFICA_AZIENDALE.CRONOLOGIA_AGGIORNAMENTI"

_VISTA_CRONOLOGIA = "vw_ana_cronologia_aggiornamenti_impresa"


# ===========================================================================
# Indicatori riepilogativi (§1/§2)
# ===========================================================================


def calcola_indicatori(db: Session, azienda_id: UUID) -> IndicatoriAggiornamentoImpresa:
    dodici_mesi_fa = date.today() - timedelta(days=365)

    pratiche_12_mesi = db.scalar(
        select(func.count())
        .select_from(AnaPraticaCamerale)
        .where(
            AnaPraticaCamerale.azienda_id == azienda_id,
            func.coalesce(AnaPraticaCamerale.data_protocollo, AnaPraticaCamerale.data_presentazione) >= dodici_mesi_fa,
        )
    )
    trasferimenti_quote = db.scalar(
        select(func.count()).select_from(AnaTrasferimentoQuote).where(AnaTrasferimentoQuote.azienda_id == azienda_id)
    )
    trasferimenti_sede = db.scalar(
        select(func.count())
        .select_from(AnaVariazioneSedeLegale)
        .where(AnaVariazioneSedeLegale.azienda_id == azienda_id)
    )
    partecipazioni = db.scalar(
        select(func.count()).select_from(AnaPartecipazione).where(AnaPartecipazione.azienda_id == azienda_id)
    )

    return IndicatoriAggiornamentoImpresa(
        pratiche_ultimi_12_mesi=pratiche_12_mesi or 0,
        trasferimenti_quote=trasferimenti_quote or 0,
        trasferimenti_sede=trasferimenti_sede or 0,
        partecipazioni=partecipazioni or 0,
    )


# ===========================================================================
# Cronologia (§6/§7/§8): sola lettura dalla vista aggregata.
# ===========================================================================


def _stato_verifica(db: Session, azienda_id: UUID, evento_id: UUID) -> dict[str, Any]:
    return leggi_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_CRONOLOGIA, evento_id)


def elenco_cronologia(db: Session, azienda_id: UUID) -> list[CronologiaEventoRead]:
    """Ordine §8: dalla data più recente alla meno recente, `created_at`
    come secondo criterio in caso di parità. Nessun limite qui: la
    distinzione "eventi recenti" vs "cronologia completa" è solo di
    presentazione, lasciata al frontend (§ "la cronologia completa deve
    essere consultabile anche quando la tabella mostra soltanto gli eventi
    più recenti")."""
    righe = db.execute(
        text(
            f"SELECT evento_id, tipologia, data, origine, esito "
            f"FROM {_VISTA_CRONOLOGIA} WHERE azienda_id = :azienda_id "
            f"ORDER BY data DESC NULLS LAST, created_at DESC"
        ),
        {"azienda_id": str(azienda_id)},
    ).mappings().all()

    risultato = []
    for riga in righe:
        stato = _stato_verifica(db, azienda_id, riga["evento_id"])
        risultato.append(
            CronologiaEventoRead(
                evento_id=riga["evento_id"],
                tipologia=riga["tipologia"],
                data=riga["data"],
                origine=riga["origine"],
                esito=riga["esito"],
                verificationStatus=stato["status"],
                verificationVersion=stato["version"],
                revisionNote=stato["note"],
                verifiedAt=stato["verified_at"],
                verifiedBy=stato["verified_by"],
            )
        )
    return risultato


def _riga_vista(db: Session, azienda_id: UUID, evento_id: UUID) -> dict[str, Any] | None:
    riga = db.execute(
        text(f"SELECT * FROM {_VISTA_CRONOLOGIA} WHERE azienda_id = :azienda_id AND evento_id = :evento_id"),
        {"azienda_id": str(azienda_id), "evento_id": str(evento_id)},
    ).mappings().first()
    return dict(riga) if riga is not None else None


def _nome_utente(db: Session, utente_id: UUID | None) -> str | None:
    if utente_id is None:
        return None
    utente = db.get(SysUtente, utente_id)
    return f"{utente.nome} {utente.cognome}" if utente is not None else None


def _campi_pratica_camerale(db: Session, pratica_id: UUID) -> list[CampoDettaglioEvento]:
    pratica = db.get(AnaPraticaCamerale, pratica_id)
    if pratica is None:
        return []
    tipo = db.get(CatTipologiaPraticaCamerale, pratica.tipo_pratica_id) if pratica.tipo_pratica_id else None
    origine = db.get(CatOrigineAggiornamentoImpresa, pratica.origine_id) if pratica.origine_id else None
    esito = db.get(CatEsitoPraticaCamerale, pratica.esito_id) if pratica.esito_id else None
    return [
        CampoDettaglioEvento(label="Tipo di pratica", value=tipo.denominazione if tipo else None),
        CampoDettaglioEvento(label="Numero di protocollo", value=pratica.numero_protocollo),
        CampoDettaglioEvento(label="Data di presentazione", value=_fmt_data(pratica.data_presentazione)),
        CampoDettaglioEvento(label="Data di protocollazione", value=_fmt_data(pratica.data_protocollo)),
        CampoDettaglioEvento(label="Oggetto della pratica", value=pratica.oggetto),
        CampoDettaglioEvento(label="Origine del dato", value=origine.denominazione if origine else None),
        CampoDettaglioEvento(label="Esito tecnico", value=esito.denominazione if esito else None),
    ]


def _campi_importazione_visura(db: Session, importazione_id: UUID, *, conferma: bool) -> list[CampoDettaglioEvento]:
    importazione = db.get(SysImportazioneVisuraCciaa, importazione_id)
    if importazione is None:
        return []
    stato = (
        db.get(CatStatoImportazioneVisura, importazione.stato_importazione_id)
        if importazione.stato_importazione_id
        else None
    )
    campi = [
        CampoDettaglioEvento(label="Data caricata nella piattaforma", value=_fmt_datetime(importazione.data_importazione)),
        CampoDettaglioEvento(label="Data contenuta nella visura", value=_fmt_data(importazione.data_estrazione_visura)),
        CampoDettaglioEvento(label="Esito tecnico", value=stato.denominazione if stato else None),
        CampoDettaglioEvento(label="Documento collegato", value=str(importazione.documento_id) if importazione.documento_id else "Nessuno"),
        CampoDettaglioEvento(label="Versione del riconoscimento", value=importazione.versione_parser),
    ]
    if conferma:
        campi.append(CampoDettaglioEvento(label="Data di conferma del consulente", value=_fmt_datetime(importazione.confermata_at)))
        campi.append(CampoDettaglioEvento(label="Confermata da", value=_nome_utente(db, importazione.confermata_da)))
    return campi


def _campi_variazione_sede(db: Session, variazione_id: UUID) -> list[CampoDettaglioEvento]:
    variazione = db.get(AnaVariazioneSedeLegale, variazione_id)
    if variazione is None:
        return []
    origine = db.get(CatOrigineAggiornamentoImpresa, variazione.origine_id) if variazione.origine_id else None
    esito = db.get(CatEsitoPraticaCamerale, variazione.esito_id) if variazione.esito_id else None
    pratica = db.get(AnaPraticaCamerale, variazione.pratica_id) if variazione.pratica_id else None
    return [
        CampoDettaglioEvento(label="Data della variazione", value=_fmt_data(variazione.data_variazione)),
        CampoDettaglioEvento(label="Descrizione", value=variazione.descrizione),
        CampoDettaglioEvento(label="Origine del dato", value=origine.denominazione if origine else None),
        CampoDettaglioEvento(label="Esito tecnico", value=esito.denominazione if esito else None),
        CampoDettaglioEvento(label="Pratica collegata", value=pratica.numero_protocollo if pratica else None),
    ]


def _campi_trasferimento_quote(db: Session, trasferimento_id: UUID) -> list[CampoDettaglioEvento]:
    trasferimento = db.get(AnaTrasferimentoQuote, trasferimento_id)
    if trasferimento is None:
        return []
    origine = db.get(CatOrigineAggiornamentoImpresa, trasferimento.origine_id) if trasferimento.origine_id else None
    esito = db.get(CatEsitoPraticaCamerale, trasferimento.esito_id) if trasferimento.esito_id else None
    pratica = db.get(AnaPraticaCamerale, trasferimento.pratica_id) if trasferimento.pratica_id else None
    return [
        CampoDettaglioEvento(label="Data del trasferimento", value=_fmt_data(trasferimento.data_trasferimento)),
        CampoDettaglioEvento(label="Descrizione", value=trasferimento.descrizione),
        CampoDettaglioEvento(label="Origine del dato", value=origine.denominazione if origine else None),
        CampoDettaglioEvento(label="Esito tecnico", value=esito.denominazione if esito else None),
        CampoDettaglioEvento(label="Pratica collegata", value=pratica.numero_protocollo if pratica else None),
    ]


def _fmt_data(valore: date | None) -> str | None:
    return valore.isoformat() if valore is not None else None


def _fmt_datetime(valore: Any) -> str | None:
    return valore.isoformat() if valore is not None else None


_COSTRUTTORI_CAMPI = {
    "PRATICA_CAMERALE": lambda db, record_id: _campi_pratica_camerale(db, record_id),
    "IMPORTAZIONE_VISURA": lambda db, record_id: _campi_importazione_visura(db, record_id, conferma=False),
    "CONFERMA_VISURA": lambda db, record_id: _campi_importazione_visura(db, record_id, conferma=True),
    "VARIAZIONE_SEDE": lambda db, record_id: _campi_variazione_sede(db, record_id),
    "TRASFERIMENTO_QUOTE": lambda db, record_id: _campi_trasferimento_quote(db, record_id),
}


def dettaglio_evento(db: Session, azienda_id: UUID, evento_id: UUID) -> CronologiaEventoDettaglio:
    """§9: il form aperto dipende dal tipo di evento, mai una modifica dei
    log tecnici — questo endpoint è di sola lettura, nessuna scrittura sulle
    tabelle sorgente."""
    riga = _riga_vista(db, azienda_id, evento_id)
    if riga is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento non trovato")

    costruttore = _COSTRUTTORI_CAMPI.get(riga["tipologia"])
    campi = costruttore(db, riga["record_origine_id"]) if costruttore else []
    stato = _stato_verifica(db, azienda_id, evento_id)

    return CronologiaEventoDettaglio(
        evento_id=evento_id,
        tipologia=riga["tipologia"],
        tabella_origine=riga["tabella_origine"],
        record_origine_id=riga["record_origine_id"],
        campi=campi,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def applica_decisione_verifica_evento(
    db: Session,
    ctx: AziendaContext,
    evento_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    if _riga_vista(db, ctx.azienda_id, evento_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Evento non trovato")
    applica_decisione_verifica_riga(
        db,
        ctx,
        SEZIONE_CODICE_VERIFICA_CRONOLOGIA,
        evento_id,
        decisione=decisione,
        nota=nota,
        expected_version=expected_version,
    )
