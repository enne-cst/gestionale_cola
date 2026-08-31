"""Motore generico "incarico" = persona + ruolo + caratteristiche.

Sostituisce le tabelle `qual_*` (rimosse): un incarico è la relazione
persona-ruolo (`PerIncarico`); i valori delle caratteristiche richieste dal
ruolo vivono in `PerIncaricoValore`, una riga per caratteristica, nella
colonna tipizzata corrispondente a `CatCaratteristicaIncarico.tipo_dato`.

L'obbligatorietà delle caratteristiche per ruolo è letta da
`RelRuoloCaratteristica` (non è un vincolo del catalogo caratteristiche, che
è condiviso tra tutti i ruoli). Solo `OBBLIGATORIA` è verificata qui in
creazione; `CONDIZIONALE` non ha una regola strutturata da valutare
automaticamente (il campo `condizione` è testo libero descrittivo, cfr.
commento nella migrazione Cataloghi/004) e `FACOLTATIVA` non è mai
obbligatoria.

Cessare un incarico (persona che lascia il ruolo) è un aggiornamento della
stessa riga (tipicamente le caratteristiche A02 "Data cessazione" e A25
"Stato dell'incarico"), non un DELETE: la storicizzazione di più mandati
della stessa persona nello stesso ruolo è ottenuta con più righe
`PerIncarico` distinte (nessun vincolo di unicità persona+ruolo), ciascuna
con le proprie date. Il DELETE dell'endpoint è riservato alla correzione di
un inserimento errato.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.registro_campi import STATO_API_TO_DB, STATO_DB_TO_API, registra_audit
from app.models.anagrafica import (
    AnaAmministrazioneControllo,
    AnaElencoSociEstremi,
    AnaOrganiControllo,
    CatAffidatarioRevisioneLegale,
    CatAssettoControllo,
    CatOrganoAmministrativo,
)
from app.models.personale import (
    AnaPersone,
    CatCaratteristicaIncarico,
    CatRuolo,
    PerIncarico,
    PerIncaricoValore,
    RelRuoloCaratteristica,
)
from app.models.sistema import SysRegistroStatoCampi, SysUtente
from app.schemas.registro_campi import VerificationStatus

_COLONNE_VALORE = (
    "valore_testo",
    "valore_numero",
    "valore_data",
    "valore_booleano",
    "valore_documento_id",
    "valore_multiplo",
)

_TIPO_COLONNA = {
    "TESTO": "valore_testo",
    "TESTO_LUNGO": "valore_testo",
    "CATALOGO": "valore_testo",
    "NUMERO": "valore_numero",
    "DATA": "valore_data",
    "BOOLEANO": "valore_booleano",
    "DOCUMENTO": "valore_documento_id",
    "CATALOGO_MULTIPLO": "valore_multiplo",
}


def _coerce_valore(caratteristica: CatCaratteristicaIncarico, raw: Any) -> Any:
    tipo = caratteristica.tipo_dato
    if raw is None:
        return None

    if tipo == "NUMERO":
        try:
            return Decimal(str(raw))
        except (InvalidOperation, ValueError) as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore non numerico per '{caratteristica.codice}'"
            ) from exc

    if tipo == "DATA":
        if isinstance(raw, date):
            return raw
        try:
            return date.fromisoformat(str(raw))
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Data non valida per '{caratteristica.codice}'"
            ) from exc

    if tipo == "BOOLEANO":
        if isinstance(raw, bool):
            return raw
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore booleano non valido per '{caratteristica.codice}'"
        )

    if tipo == "DOCUMENTO":
        try:
            return UUID(str(raw))
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Riferimento documento non valido per '{caratteristica.codice}'"
            ) from exc

    if tipo == "CATALOGO":
        valore = str(raw)
        ammessi = caratteristica.valori_ammessi
        if ammessi and valore not in ammessi:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Valore '{valore}' non ammesso per '{caratteristica.codice}' (ammessi: {', '.join(ammessi)})",
            )
        return valore

    if tipo == "CATALOGO_MULTIPLO":
        if not isinstance(raw, list):
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Valore multiplo non valido per '{caratteristica.codice}'"
            )
        return raw

    return str(raw)


def configurazione_ruolo(db: Session, ruolo_id: UUID) -> dict[str, tuple[RelRuoloCaratteristica, CatCaratteristicaIncarico]]:
    righe = db.execute(
        select(RelRuoloCaratteristica, CatCaratteristicaIncarico)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == RelRuoloCaratteristica.caratteristica_id)
        .where(RelRuoloCaratteristica.ruolo_id == ruolo_id, RelRuoloCaratteristica.attivo.is_(True))
    ).all()
    return {caratteristica.codice: (rel, caratteristica) for rel, caratteristica in righe}


def valida_e_salva_valori(db: Session, incarico: PerIncarico, valori_input: dict[str, Any], *, parziale: bool) -> None:
    """Valida `valori_input` (chiave = codice caratteristica, es. "A01")
    contro la configurazione del ruolo dell'incarico e salva/aggiorna le
    righe di `PerIncaricoValore` corrispondenti.

    `parziale=False` (creazione): verifica anche che tutte le caratteristiche
    `OBBLIGATORIA` per il ruolo siano presenti in `valori_input`.
    `parziale=True` (aggiornamento): applica solo le chiavi inviate, lascia
    invariate le altre.
    """
    config = configurazione_ruolo(db, incarico.ruolo_id)

    if not parziale:
        mancanti = sorted(
            codice
            for codice, (rel, _car) in config.items()
            if rel.obbligatorieta == "OBBLIGATORIA" and codice not in valori_input
        )
        if mancanti:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"Caratteristiche obbligatorie mancanti per il ruolo: {', '.join(mancanti)}",
            )

    for codice, raw in valori_input.items():
        if codice not in config:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, f"Caratteristica '{codice}' non prevista per questo ruolo"
            )
        _rel, caratteristica = config[codice]
        colonna = _TIPO_COLONNA[caratteristica.tipo_dato]
        valore = _coerce_valore(caratteristica, raw)

        riga = db.scalars(
            select(PerIncaricoValore).where(
                PerIncaricoValore.incarico_id == incarico.id,
                PerIncaricoValore.caratteristica_id == caratteristica.id,
            )
        ).first()
        if riga is None:
            riga = PerIncaricoValore(incarico_id=incarico.id, caratteristica_id=caratteristica.id)
            db.add(riga)
        for col in _COLONNE_VALORE:
            setattr(riga, col, None)
        setattr(riga, colonna, valore)


def leggi_valori(db: Session, incarico_id: UUID) -> dict[str, Any]:
    """Restituisce {codice_caratteristica: valore} per un incarico, leggendo
    la colonna tipizzata corretta di ogni riga in base al tipo_dato."""
    righe = db.execute(
        select(PerIncaricoValore, CatCaratteristicaIncarico)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(PerIncaricoValore.incarico_id == incarico_id)
    ).all()
    out: dict[str, Any] = {}
    for valore_riga, caratteristica in righe:
        colonna = _TIPO_COLONNA[caratteristica.tipo_dato]
        out[caratteristica.codice] = getattr(valore_riga, colonna)
    return out


# ===========================================================================
# "Attivo"/"in carica" = senza data di cessazione (A02), non lo stato
# testuale A25 (catalogo libero senza `valori_ammessi` imposti a livello di
# dominio, quindi non abbastanza affidabile da usare come unica fonte per
# bloccare un salvataggio). Helper condiviso da
# `verifica_amministratore_unico_disponibile` (Correzione 05) e da
# `verifica_transizione_nessun_organo_controllo` (Correzione 12): stessa
# nozione di "incarico attivo per un insieme di ruoli", non duplicata.
# ===========================================================================


def _incarichi_attivi(db: Session, azienda_id: UUID, ruoli_codici: frozenset[str]) -> list[PerIncarico]:
    sotto_query_cessati = (
        select(PerIncaricoValore.incarico_id)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(CatCaratteristicaIncarico.codice == "A02", PerIncaricoValore.valore_data.is_not(None))
    )
    return list(
        db.scalars(
            select(PerIncarico)
            .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
            .where(
                PerIncarico.azienda_id == azienda_id,
                CatRuolo.codice.in_(ruoli_codici),
                PerIncarico.id.not_in(sotto_query_cessati),
            )
        ).all()
    )


def cessa_incarichi(db: Session, incarichi: list[PerIncarico]) -> None:
    """Cessa (§ commento in testa al modulo: aggiornamento della riga
    esistente, mai un DELETE) tutti gli incarichi passati, valorizzando A02
    "Data cessazione" a oggi. Usata dalla Correzione 12 dopo che l'utente ha
    confermato esplicitamente la cessazione — mai chiamata senza conferma."""
    oggi = date.today().isoformat()
    for incarico in incarichi:
        valida_e_salva_valori(db, incarico, {"A02": oggi}, parziale=True)


# ===========================================================================
# Amministratore unico: al più un incarico attivo alla volta (Correzione 05)
# ===========================================================================
RUOLI_AMMINISTRATORI_ORGANO = frozenset({"AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"})


def verifica_amministratore_unico_disponibile(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """§ Correzione 05 punto 10: quando l'organo amministrativo in carica è
    "Amministratore unico", il pulsante "Aggiungi riga" non deve consentire
    il salvataggio di un secondo amministratore ancora attivo — la
    sostituzione (cessazione/storicizzazione del precedente) è una
    funzionalità futura, non implementata qui: per ora si blocca con un
    errore invece di sovrascrivere silenziosamente (§ vincoli punto 13).

    No-op per ogni ruolo diverso da quelli amministrativi e per ogni organo
    diverso da "Amministratore unico" (compreso "non disponibile")."""
    if ruolo_codice not in RUOLI_AMMINISTRATORI_ORGANO:
        return

    amministrazione = db.scalars(
        select(AnaAmministrazioneControllo).where(AnaAmministrazioneControllo.azienda_id == azienda_id)
    ).first()
    if amministrazione is None or amministrazione.organo_amministrativo_id is None:
        return
    organo = db.get(CatOrganoAmministrativo, amministrazione.organo_amministrativo_id)
    if organo is None or organo.codice != "AMMINISTRATORE_UNICO":
        return

    if _incarichi_attivi(db, azienda_id, RUOLI_AMMINISTRATORI_ORGANO):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "È già presente un amministratore unico in carica: per sostituirlo, cessare prima l'incarico esistente.",
        )


# ===========================================================================
# Organo amministrativo pluripersonale: sincronizzazione bidirezionale tra
# "Numero componenti" (capienza dichiarata, campo modificabile) e le righe
# della tabella "Titolari di cariche" (incarichi reali) — richiesta esplicita
# dell'utente (31/08/2026). Si applica solo alle 3 configurazioni la cui
# "Numero componenti" è un valore modificabile (non derivato, a differenza di
# "Amministratore unico" che vale sempre 1) — stessi 3 codici di
# `_ORGANI_CON_NUMERO_COMPONENTI_MODIFICABILE` in registro_campi.py,
# duplicati qui per evitare un import incrociato (registro_campi.py importa
# già da questo modulo, non il contrario).
#
# Regole concordate con l'utente (AskUserQuestion):
# - aggiungere una riga alla tabella non incrementa "Numero componenti" se
#   stava riempiendo un posto vuoto già conteggiato (nessuna capienza in più
#   creata) — lo incrementa SOLO quando supera la capienza attuale (una riga
#   davvero nuova, mai un posto già previsto): evita anche il loop "riga
#   aggiunta -> +1 -> nuovo posto vuoto -> riga aggiunta -> +1...".
# - eliminare una riga (il "cestino" della tabella: sempre una cancellazione
#   fisica, mai una cessazione, § docstring di testa al modulo) decrementa
#   sempre di 1 — la riga sparisce, non diventa un posto vuoto.
# - "Numero componenti" si scrive subito (mai tramite la bozza/"Salva
#   modifiche" della sezione, § scelta esplicita: coerenza con la tabella,
#   le cui righe sono già immediate) — vedi `imposta_numero_amministratori`
#   sotto e l'endpoint dedicato in `app.api.anagrafica_registry`.
# ===========================================================================
_ORGANI_NUMERO_COMPONENTI_MODIFICABILE = frozenset(
    {
        "CONSIGLIO_AMMINISTRAZIONE",
        "AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA",
        "AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA",
    }
)


def _amministrazione_con_numero_modificabile(db: Session, azienda_id: UUID) -> AnaAmministrazioneControllo | None:
    """Riga `AnaAmministrazioneControllo` dell'azienda, solo se l'organo
    amministrativo in carica è una delle 3 configurazioni con "Numero
    componenti" modificabile — `None` per ogni altro organo (compreso
    "Amministratore unico", derivato, e "non disponibile"), cosi' i
    chiamanti restano no-op senza ripetere il controllo."""
    amministrazione = db.scalars(
        select(AnaAmministrazioneControllo).where(AnaAmministrazioneControllo.azienda_id == azienda_id)
    ).first()
    if amministrazione is None or amministrazione.organo_amministrativo_id is None:
        return None
    organo = db.get(CatOrganoAmministrativo, amministrazione.organo_amministrativo_id)
    if organo is None or organo.codice not in _ORGANI_NUMERO_COMPONENTI_MODIFICABILE:
        return None
    return amministrazione


def sincronizza_numero_amministratori_dopo_aggiunta(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """Chiamata da `create_incarico` dopo aver salvato il nuovo incarico
    (stessa transazione, prima del commit). Se il nuovo incarico occupa un
    posto già previsto da "Numero componenti" (righe attive <= capienza
    attuale), non cambia nulla — quel posto era già conteggiato. Solo se
    supera la capienza la alza fino al nuovo conteggio reale."""
    if ruolo_codice not in RUOLI_AMMINISTRATORI_ORGANO:
        return
    amministrazione = _amministrazione_con_numero_modificabile(db, azienda_id)
    if amministrazione is None:
        return
    reale = len(_incarichi_attivi(db, azienda_id, RUOLI_AMMINISTRATORI_ORGANO))
    attuale = amministrazione.numero_amministratori_in_carica or 0
    if reale > attuale:
        amministrazione.numero_amministratori_in_carica = reale


def sincronizza_numero_amministratori_dopo_eliminazione(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """Simmetrica a `sincronizza_numero_amministratori_dopo_aggiunta`:
    chiamata da `delete_incarico` dopo la cancellazione fisica della riga
    (stessa transazione, prima del commit, con la riga già cancellata —
    `reale` riflette il conteggio dopo la cancellazione). La riga eliminata
    non diventa un posto vuoto: "Numero componenti" scende sempre di 1."""
    if ruolo_codice not in RUOLI_AMMINISTRATORI_ORGANO:
        return
    amministrazione = _amministrazione_con_numero_modificabile(db, azienda_id)
    if amministrazione is None:
        return
    reale = len(_incarichi_attivi(db, azienda_id, RUOLI_AMMINISTRATORI_ORGANO))
    attuale = amministrazione.numero_amministratori_in_carica
    if attuale is not None:
        amministrazione.numero_amministratori_in_carica = max(attuale - 1, reale, 1)


def imposta_numero_amministratori(
    db: Session,
    azienda_id: UUID,
    *,
    nuovo_valore: int,
    incarichi_da_eliminare: list[UUID] | None,
) -> None:
    """Scrittura diretta di "Numero componenti" (§ non passa dalla bozza
    della sezione, vedi commento di testa a questa sezione del modulo).
    Aumentare (o ridurre eliminando solo posti ancora vuoti) è sempre
    permesso senza conferma: nessun dato perso. Ridurre sotto al numero di
    amministratori già in carica richiede di scegliere ESPLICITAMENTE chi
    eliminare (mai "i più recenti", § decisione utente 31/08/2026, stesso
    principio-guida di `verifica_carica_collegio_sindacale_disponibile`) —
    stesso pattern a due tentativi già in uso altrove: senza
    `incarichi_da_eliminare` (o con un insieme che non corrisponde
    esattamente al numero richiesto) risponde con un 409 che elenca i
    titolari attuali; il secondo tentativo esegue l'eliminazione fisica (il
    "cestino" della tabella, mai una cessazione) e il nuovo valore nella
    stessa transazione."""
    amministrazione = db.scalars(
        select(AnaAmministrazioneControllo).where(AnaAmministrazioneControllo.azienda_id == azienda_id)
    ).first()
    if amministrazione is None or amministrazione.organo_amministrativo_id is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Nessun organo amministrativo configurato")
    organo = db.get(CatOrganoAmministrativo, amministrazione.organo_amministrativo_id)
    if organo is None or organo.codice not in _ORGANI_NUMERO_COMPONENTI_MODIFICABILE:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            'Il campo "Numero componenti" non è modificabile per l\'organo amministrativo in carica',
        )
    if nuovo_valore < 1:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Il numero componenti deve essere almeno 1")

    attivi = _incarichi_attivi(db, azienda_id, RUOLI_AMMINISTRATORI_ORGANO)
    if nuovo_valore >= len(attivi):
        amministrazione.numero_amministratori_in_carica = nuovo_valore
        return

    eccedenza = len(attivi) - nuovo_valore
    scelti = set(incarichi_da_eliminare or [])
    attivi_per_id = {i.id: i for i in attivi}
    if len(scelti) != eccedenza or not scelti <= attivi_per_id.keys():
        persone = {
            p.id: p
            for p in db.scalars(
                select(AnaPersone).where(AnaPersone.id.in_([i.persona_id for i in attivi if i.persona_id]))
            ).all()
        }
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "RIDUZIONE_AMMINISTRATORI_RICHIESTA",
                "message": (
                    f'"{nuovo_valore}" è inferiore ai {len(attivi)} amministratori attualmente in carica. '
                    f"Seleziona quali {eccedenza} eliminare per ridurre il numero componenti."
                ),
                "count": eccedenza,
                "titolari": [
                    {"id": str(i.id), "nome": f"{persone[i.persona_id].cognome} {persone[i.persona_id].nome}"}
                    for i in attivi
                    if i.persona_id in persone
                ],
            },
        )

    for incarico_id in scelti:
        db.delete(attivi_per_id[incarico_id])
    amministrazione.numero_amministratori_in_carica = nuovo_valore


# ===========================================================================
# Soci: sincronizzazione bidirezionale tra "Numero dei soci" (capienza
# dichiarata, campo modificabile) e le righe della tabella soci —
# richiesta esplicita dell'utente (31/08/2026), stesso identico
# comportamento della sezione sopra per l'organo amministrativo
# pluripersonale. Due differenze strutturali, non di comportamento:
# - "Estremi dell'elenco soci" è un singleton semplice (nessun organo da
#   scegliere prima): niente equivalente di
#   `_amministrazione_con_numero_modificabile`, la riga si crea al volo se
#   non esiste ancora quando serve (§ funzioni sotto), non c'è un 422 "non
#   configurato" come per l'organo amministrativo.
# - "reale" qui conta TUTTI gli incarichi ruolo SOCIO, storicizzati
#   compresi (§ decisione già presa il 27/08/2026, invariata: la tabella
#   soci non nasconde i soci cessati, a differenza degli amministratori),
#   non solo quelli "attivi" secondo A02 — niente `_incarichi_attivi` qui.
# ===========================================================================


def _soci_conteggio_reale(db: Session, azienda_id: UUID) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(PerIncarico)
            .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
            .where(PerIncarico.azienda_id == azienda_id, CatRuolo.codice == "SOCIO")
        )
        or 0
    )


def sincronizza_numero_soci_dopo_aggiunta(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """Chiamata da `create_incarico` dopo aver salvato il nuovo incarico
    (stessa transazione, prima del commit) — stesso identico comportamento
    di `sincronizza_numero_amministratori_dopo_aggiunta`: se il nuovo socio
    occupa un posto già previsto da "Numero dei soci", non cambia nulla;
    solo se supera la capienza la alza fino al nuovo conteggio reale. Crea
    la riga se non esiste ancora (nessun campo "organo" da scegliere prima
    per questa sezione, a differenza dell'organo amministrativo)."""
    if ruolo_codice != "SOCIO":
        return
    riga = db.scalars(select(AnaElencoSociEstremi).where(AnaElencoSociEstremi.azienda_id == azienda_id)).first()
    reale = _soci_conteggio_reale(db, azienda_id)
    if riga is None:
        db.add(AnaElencoSociEstremi(azienda_id=azienda_id, numero_soci=reale))
        return
    attuale = riga.numero_soci or 0
    if reale > attuale:
        riga.numero_soci = reale


def sincronizza_numero_soci_dopo_eliminazione(db: Session, azienda_id: UUID, ruolo_codice: str) -> None:
    """Simmetrica a `sincronizza_numero_soci_dopo_aggiunta`: chiamata da
    `delete_incarico` dopo la cancellazione fisica della riga (stessa
    transazione, prima del commit, con la riga già cancellata — `reale`
    riflette il conteggio dopo la cancellazione). La riga eliminata non
    diventa un posto vuoto: "Numero dei soci" scende sempre di 1."""
    if ruolo_codice != "SOCIO":
        return
    riga = db.scalars(select(AnaElencoSociEstremi).where(AnaElencoSociEstremi.azienda_id == azienda_id)).first()
    if riga is None or riga.numero_soci is None:
        return
    reale = _soci_conteggio_reale(db, azienda_id)
    riga.numero_soci = max(riga.numero_soci - 1, reale, 1)


def imposta_numero_soci(
    db: Session,
    azienda_id: UUID,
    *,
    nuovo_valore: int,
    incarichi_da_eliminare: list[UUID] | None,
) -> None:
    """Scrittura diretta di "Numero dei soci" (§ non passa dalla bozza
    della sezione, vedi commento di testa a questa sezione del modulo) —
    stesso identico comportamento di `imposta_numero_amministratori`:
    aumentare (o ridurre eliminando solo posti ancora vuoti) è sempre
    permesso senza conferma; ridurre sotto al numero di soci già
    registrati richiede di scegliere ESPLICITAMENTE chi eliminare (409 con
    l'elenco dei titolari attuali quando la scelta manca o non corrisponde
    esattamente al numero richiesto), poi elimina fisicamente i soci scelti
    (mai una cessazione: i soci cessati restano visibili in tabella, § nota
    di modulo, quindi "eliminare" qui significa correggere un inserimento
    errato, non far uscire un socio) e il nuovo valore nella stessa
    transazione."""
    if nuovo_valore < 1:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Il numero dei soci deve essere almeno 1")

    soci = list(
        db.scalars(
            select(PerIncarico)
            .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
            .where(PerIncarico.azienda_id == azienda_id, CatRuolo.codice == "SOCIO")
        ).all()
    )

    def _riga_soci() -> AnaElencoSociEstremi:
        riga = db.scalars(select(AnaElencoSociEstremi).where(AnaElencoSociEstremi.azienda_id == azienda_id)).first()
        if riga is None:
            riga = AnaElencoSociEstremi(azienda_id=azienda_id)
            db.add(riga)
        return riga

    if nuovo_valore >= len(soci):
        _riga_soci().numero_soci = nuovo_valore
        return

    eccedenza = len(soci) - nuovo_valore
    scelti = set(incarichi_da_eliminare or [])
    soci_per_id = {i.id: i for i in soci}
    if len(scelti) != eccedenza or not scelti <= soci_per_id.keys():
        persone = {
            p.id: p
            for p in db.scalars(
                select(AnaPersone).where(AnaPersone.id.in_([i.persona_id for i in soci if i.persona_id]))
            ).all()
        }
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "RIDUZIONE_SOCI_RICHIESTA",
                "message": (
                    f'"{nuovo_valore}" è inferiore ai {len(soci)} soci attualmente registrati. '
                    f"Seleziona quali {eccedenza} eliminare per ridurre il numero dei soci."
                ),
                "count": eccedenza,
                "titolari": [
                    {"id": str(i.id), "nome": f"{persone[i.persona_id].cognome} {persone[i.persona_id].nome}"}
                    for i in soci
                    if i.persona_id in persone
                ],
            },
        )

    for incarico_id in scelti:
        db.delete(soci_per_id[incarico_id])
    _riga_soci().numero_soci = nuovo_valore


# ===========================================================================
# Nessun organo di controllo o revisore: cessazione confermata degli
# incarichi esistenti (Correzione 12)
# ===========================================================================
RUOLI_ORGANO_CONTROLLO = frozenset({"SINDACO", "REVISORE_LEGALE"})


def incarichi_organo_controllo_attivi(db: Session, azienda_id: UUID) -> list[PerIncarico]:
    return _incarichi_attivi(db, azienda_id, RUOLI_ORGANO_CONTROLLO)


def verifica_transizione_nessun_organo_controllo(
    db: Session, azienda_id: UUID, *, row: object | None, nuovo_codice: str | None, confermata: bool
) -> None:
    """§ Correzione 12: quando "Assetto di controllo in carica" passa a
    "Nessun organo di controllo o revisore" e ci sono ancora sindaci/
    revisori attivi, il salvataggio non deve cancellare o storicizzare
    nulla silenziosamente — richiede una conferma esplicita del chiamante
    (`confermata`, propagata dal PATCH della sezione) e solo allora cessa
    gli incarichi attivi (A02 = oggi), nella stessa transazione del
    salvataggio della sezione (chiamata da `salva_sezione` prima del
    commit, mai a parte: § "operazioni composite = transazione unica").

    No-op se il nuovo valore non è questo assetto, o se lo era già (nessuna
    transizione reale, nessun bisogno di riproporre la conferma ogni
    salvataggio successivo)."""
    if nuovo_codice != "NESSUN_ORGANO_CONTROLLO":
        return

    precedente_codice = None
    if row is not None and getattr(row, "assetto_controllo_id", None) is not None:
        precedente = db.get(CatAssettoControllo, row.assetto_controllo_id)
        precedente_codice = precedente.codice if precedente is not None else None
    if precedente_codice == "NESSUN_ORGANO_CONTROLLO":
        return

    attivi = incarichi_organo_controllo_attivi(db, azienda_id)
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "CESSAZIONE_ORGANO_CONTROLLO_RICHIESTA",
                "message": (
                    f"Risultano {len(attivi)} sindaci/revisori ancora in carica. Confermando, gli incarichi "
                    "esistenti verranno cessati (data di cessazione impostata a oggi)."
                ),
                "count": len(attivi),
            },
        )
    cessa_incarichi(db, attivi)


# ===========================================================================
# Sindaco unico: sostituzione confermata di un incarico già in carica
# (Correzione 13; estesa dalla Correzione 17 all'assetto combinato "Sindaco
# unico + revisore esterno" — stesso identico vincolo "al più un sindaco
# unico attivo", il revisore esterno affiancato non cambia questa regola)
# ===========================================================================

# Assetti in cui vale la regola "al più un sindaco unico attivo alla volta"
# (§ Correzione 17: il sindaco unico resta un organo INTERNO a sé, con lo
# stesso vincolo, anche quando affiancato da un revisore esterno).
_ASSETTI_SINDACO_UNICO = frozenset({"SINDACO_UNICO", "SINDACO_UNICO_REVISORE_ESTERNO"})


def _revisione_affidata_a_codice(db: Session, organi_controllo: AnaOrganiControllo) -> str | None:
    """Codice di `cat_affidatari_revisione_legale` attualmente salvato su
    "Revisione legale affidata a" (§ Correzione 17: usato per capire, nel
    solo assetto "Sindaco unico + revisore esterno", se il revisore esterno
    atteso è persona fisica o società — nei due assetti "revisore esterno
    standalone" questo non serve, l'affidatario coincide sempre con
    l'assetto stesso per costruzione, § Correzione 15/16)."""
    if organi_controllo.revisione_legale_affidata_a_id is None:
        return None
    affidatario = db.get(CatAffidatarioRevisioneLegale, organi_controllo.revisione_legale_affidata_a_id)
    return affidatario.codice if affidatario is not None else None


# § Correzione 18: stesso identico meccanismo di "Sindaco unico + revisore
# esterno" (Correzione 17) esteso a "Collegio sindacale + revisore
# esterno" — in entrambi il tipo di revisore atteso (persona fisica o
# società) non è ricavabile dall'assetto da solo (a differenza dei 2
# assetti "revisore esterno standalone"), va risolto da
# `_revisione_affidata_a_codice`.
_ASSETTI_CON_REVISORE_ESTERNO_TIPIZZATO = frozenset({"SINDACO_UNICO_REVISORE_ESTERNO", "COLLEGIO_SINDACALE_REVISORE_ESTERNO"})


def verifica_sindaco_unico_disponibile(db: Session, azienda_id: UUID, ruolo_codice: str, *, confermata: bool) -> None:
    """§ Correzione 13: quando l'assetto di controllo in carica è "Sindaco
    unico" (o, § Correzione 17, "Sindaco unico + revisore esterno") e ne
    esiste già uno attivo, l'inserimento di un nuovo sindaco unico è una
    SOSTITUZIONE (cessazione/storicizzazione del precedente, § testo
    esplicito "deve essere gestito come sostituzione"), non un secondo
    incarico attivo in parallelo — a differenza dell'amministratore unico
    (Correzione 05, tuttora bloccato senza percorso di conferma:
    "funzionalità futura, non implementata qui"), qui la sostituzione è
    implementata per davvero: richiede conferma esplicita del chiamante
    (stesso pattern a due tentativi di
    `verifica_transizione_nessun_organo_controllo`, § Correzione 12) e,
    solo allora, cessa il precedente (A02 = oggi) nella stessa transazione
    della creazione del nuovo incarico (chiamata da `create_incarico`
    prima del commit).

    No-op per ogni ruolo diverso da SINDACO e per ogni assetto diverso da
    quelli in `_ASSETTI_SINDACO_UNICO` (compreso "non disponibile")."""
    if ruolo_codice != "SINDACO":
        return

    organi_controllo = db.scalars(
        select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)
    ).first()
    if organi_controllo is None or organi_controllo.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, organi_controllo.assetto_controllo_id)
    if assetto is None or assetto.codice not in _ASSETTI_SINDACO_UNICO:
        return

    attivi = _incarichi_attivi(db, azienda_id, frozenset({"SINDACO"}))
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "SOSTITUZIONE_SINDACO_UNICO_RICHIESTA",
                "message": (
                    "È già presente un sindaco unico in carica. Confermando, l'incarico esistente verrà "
                    "cessato (data di cessazione impostata a oggi) e sostituito da questo nuovo incarico."
                ),
            },
        )
    cessa_incarichi(db, attivi)


# ===========================================================================
# Revisore legale persona fisica: sostituzione confermata di un incarico
# già in carica (Correzione 15) — stesso identico pattern di
# `verifica_sindaco_unico_disponibile` sopra, per il ruolo REVISORE_LEGALE
# e l'assetto "Revisore legale persona fisica".
# ===========================================================================


def verifica_revisore_legale_persona_fisica_disponibile(
    db: Session, azienda_id: UUID, ruolo_codice: str, *, confermata: bool
) -> None:
    """§ Correzione 15: quando l'assetto di controllo in carica è "Revisore
    legale persona fisica" e ne esiste già uno attivo, un nuovo inserimento
    è una SOSTITUZIONE ("non permettere due revisori persone fisiche
    contemporaneamente in carica" + "gestire un nuovo inserimento come
    sostituzione quando esiste già un revisore attivo", § testo esplicito)
    — stesso pattern a due tentativi di `verifica_sindaco_unico_disponibile`
    (Correzione 13): richiede conferma esplicita del chiamante e, solo
    allora, cessa il precedente (A02 = oggi) nella stessa transazione della
    creazione del nuovo incarico.

    § Correzione 17: si applica anche all'assetto combinato "Sindaco unico
    + revisore esterno", ma SOLO quando "Revisione legale affidata a" vale
    proprio "Revisore legale persona fisica" (§ `_revisione_affidata_a_codice`
    — a differenza dell'assetto standalone, qui l'assetto da solo non basta
    a determinare il tipo di titolare atteso, potrebbe essere una società).

    No-op per ogni ruolo diverso da REVISORE_LEGALE e per ogni combinazione
    diversa dalle due sopra (compreso "non disponibile"). Conta solo i
    titolari persona FISICA (§ Correzione 16, che introduce lo stesso ruolo
    REVISORE_LEGALE anche per un titolare persona giuridica, "Società di
    revisione legale" — i due tipi di titolare non competono tra loro per
    lo stesso conteggio, ciascuno ha la propria configurazione)."""
    if ruolo_codice != "REVISORE_LEGALE":
        return

    organi_controllo = db.scalars(
        select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)
    ).first()
    if organi_controllo is None or organi_controllo.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, organi_controllo.assetto_controllo_id)
    if assetto is None:
        return
    if assetto.codice == "REVISORE_LEGALE_PERSONA_FISICA":
        pass
    elif assetto.codice in _ASSETTI_CON_REVISORE_ESTERNO_TIPIZZATO:
        if _revisione_affidata_a_codice(db, organi_controllo) != "REVISORE_LEGALE_PERSONA_FISICA":
            return
    else:
        return

    attivi = [i for i in _incarichi_attivi(db, azienda_id, frozenset({"REVISORE_LEGALE"})) if i.persona_id is not None]
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "SOSTITUZIONE_REVISORE_LEGALE_RICHIESTA",
                "message": (
                    "È già presente un revisore legale persona fisica in carica. Confermando, l'incarico "
                    "esistente verrà cessato (data di cessazione impostata a oggi) e sostituito da questo "
                    "nuovo incarico."
                ),
            },
        )
    cessa_incarichi(db, attivi)


# ===========================================================================
# Società di revisione legale: sostituzione confermata di un incarico già
# in carica (Correzione 16) — stesso identico pattern di
# `verifica_revisore_legale_persona_fisica_disponibile` sopra, per un
# titolare persona GIURIDICA invece che fisica.
# ===========================================================================


def verifica_societa_revisione_disponibile(db: Session, azienda_id: UUID, ruolo_codice: str, *, confermata: bool) -> None:
    """§ Correzione 16: quando l'assetto di controllo in carica è "Società
    di revisione legale" e ne esiste già una attiva, un nuovo inserimento è
    una SOSTITUZIONE E STORICIZZAZIONE del precedente ("non deve consentire
    la presenza contemporanea di due società di revisione incaricate... un
    nuovo inserimento deve essere gestito come sostituzione e
    storicizzazione del precedente", § testo esplicito) — stesso pattern a
    due tentativi già usato per Sindaco unico/Revisore legale persona
    fisica.

    § Correzione 17/18: si applica anche agli assetti combinati "Sindaco
    unico + revisore esterno"/"Collegio sindacale + revisore esterno", ma
    SOLO quando "Revisione legale affidata a" vale proprio "Società di
    revisione legale" — stesso identico schema di
    `verifica_revisore_legale_persona_fisica_disponibile` sopra.

    No-op per ogni ruolo diverso da REVISORE_LEGALE e per ogni combinazione
    diversa dalle sopra (compreso "non disponibile"). Conta solo i
    titolari persona GIURIDICA — vedi nota simmetrica in
    `verifica_revisore_legale_persona_fisica_disponibile`."""
    if ruolo_codice != "REVISORE_LEGALE":
        return

    organi_controllo = db.scalars(
        select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)
    ).first()
    if organi_controllo is None or organi_controllo.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, organi_controllo.assetto_controllo_id)
    if assetto is None:
        return
    if assetto.codice == "SOCIETA_REVISIONE_LEGALE":
        pass
    elif assetto.codice in _ASSETTI_CON_REVISORE_ESTERNO_TIPIZZATO:
        if _revisione_affidata_a_codice(db, organi_controllo) != "SOCIETA_REVISIONE_LEGALE":
            return
    else:
        return

    attivi = [
        i for i in _incarichi_attivi(db, azienda_id, frozenset({"REVISORE_LEGALE"})) if i.persona_giuridica_id is not None
    ]
    if not attivi:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "SOSTITUZIONE_SOCIETA_REVISIONE_RICHIESTA",
                "message": (
                    "È già presente una società di revisione legale incaricata. Confermando, l'incarico "
                    "esistente verrà cessato (data di cessazione impostata a oggi) e sostituito da questo "
                    "nuovo incarico."
                ),
            },
        )
    cessa_incarichi(db, attivi)


# ===========================================================================
# Collegio sindacale: carica per riga (Presidente/Sindaco effettivo/Sindaco
# supplente) e sostituzione confermata quando una carica è al completo
# (Correzione 14)
# ===========================================================================
#
# Nessuna nuova caratteristica: riusa A28 "Tipologia di incarico", già
# associata al ruolo SINDACO (R033) nel catalogo condiviso ma mai
# valorizzata finora (§ nota storica in registro_campi.py di
# `correzione09-colonne-tabella-amministratori`: "A28 CATALOGO condiviso
# con altri ruoli, valori NULL — valorizzarlo avrebbe contaminato altri usi
# del motore incarichi"). Qui non si tocca `valori_ammessi` di A28 (resta
# NULL, condiviso e senza restrizioni per tutti gli altri ruoli/usi): il
# menu a 3 opzioni fisse (Presidente/Sindaco effettivo/Sindaco supplente)
# è imposto solo lato frontend, nel form "Aggiungi riga" della card
# Sindaci quando l'assetto è "Collegio sindacale" — nessuna contaminazione
# di altri usi di A28.
CARICA_PRESIDENTE = "PRESIDENTE"
CARICA_SINDACO_EFFETTIVO = "SINDACO_EFFETTIVO"
CARICA_SINDACO_SUPPLENTE = "SINDACO_SUPPLENTE"
CARICHE_COLLEGIO_SINDACALE = frozenset({CARICA_PRESIDENTE, CARICA_SINDACO_EFFETTIVO, CARICA_SINDACO_SUPPLENTE})
ETICHETTE_CARICHE_COLLEGIO_SINDACALE = {
    CARICA_PRESIDENTE: "Presidente",
    CARICA_SINDACO_EFFETTIVO: "Sindaco effettivo",
    CARICA_SINDACO_SUPPLENTE: "Sindaco supplente",
}
# § Correzione 18: assetti in cui vale la struttura del collegio sindacale
# (Presidente/Sindaco effettivo/Sindaco supplente) — "Collegio sindacale"
# standalone (Correzione 14) e "Collegio sindacale + revisore esterno"
# (Correzione 18, dove il collegio coesiste con un revisore esterno in una
# riga a parte, § `verifica_revisore_legale_persona_fisica_disponibile`/
# `verifica_societa_revisione_disponibile` sotto).
_ASSETTI_COLLEGIO_SINDACALE = frozenset({"COLLEGIO_SINDACALE", "COLLEGIO_SINDACALE_REVISORE_ESTERNO"})


def _incarichi_attivi_con_carica(db: Session, azienda_id: UUID, carica_codice: str) -> list[PerIncarico]:
    """Incarichi SINDACO attivi (§ stessa nozione di "attivo" di
    `_incarichi_attivi`: senza data di cessazione A02) la cui
    caratteristica A28 vale `carica_codice` — ordinati per data di
    creazione (usato sia per contare gli occupanti di uno slot sia per
    scegliere, in modo deterministico, quali cessare quando si riduce
    "Sindaci effettivi", § `verifica_riduzione_sindaci_effettivi`)."""
    attivi = _incarichi_attivi(db, azienda_id, frozenset({"SINDACO"}))
    if not attivi:
        return []
    ids = [i.id for i in attivi]
    con_carica = set(
        db.scalars(
            select(PerIncaricoValore.incarico_id)
            .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
            .where(
                PerIncaricoValore.incarico_id.in_(ids),
                CatCaratteristicaIncarico.codice == "A28",
                PerIncaricoValore.valore_testo == carica_codice,
            )
        ).all()
    )
    return sorted((i for i in attivi if i.id in con_carica), key=lambda i: i.created_at)


def _cap_carica_collegio_sindacale(carica_codice: str, sindaci_effettivi: int | None) -> int | None:
    """Posti previsti per una carica, dato "Sindaci effettivi" (3 o 5): il
    presidente è compreso nel numero dei sindaci effettivi (§ vincolo
    esplicito), quindi gli altri "Sindaco effettivo" sono
    `sindaci_effettivi - 1`; i supplenti sono sempre 2, indipendenti dalla
    scelta. `None` se "Sindaci effettivi" non è ancora stato scelto (nessun
    vincolo applicabile finché la configurazione non è completa)."""
    if carica_codice == CARICA_PRESIDENTE:
        return 1
    if carica_codice == CARICA_SINDACO_SUPPLENTE:
        return 2
    if carica_codice == CARICA_SINDACO_EFFETTIVO:
        return max(sindaci_effettivi - 1, 0) if sindaci_effettivi is not None else None
    return None


def verifica_carica_collegio_sindacale_disponibile(
    db: Session,
    azienda_id: UUID,
    ruolo_codice: str,
    *,
    carica_codice: str | None,
    sostituisci_incarico_id: UUID | None,
) -> None:
    """§ Correzione 14: quando l'assetto di controllo in carica è "Collegio
    sindacale", ogni carica (Presidente/Sindaco effettivo/Sindaco
    supplente) ha un numero di posti prescritto dalla scelta "Sindaci
    effettivi" — "il pulsante 'Aggiungi riga' ... non deve consentire di
    superare la composizione prevista. Se tutte le righe sono già
    presenti, l'inserimento di una nuova persona deve essere gestito come
    sostituzione di un componente" (§ testo esplicito).

    A differenza di "Sindaco unico" (al più un titolare possibile, la
    conferma basta da sola), qui più persone possono già occupare la
    stessa carica: `sostituisci_incarico_id` indica QUALE cessare,
    scelto dall'utente in un secondo tentativo dopo aver visto l'elenco
    dei titolari attuali (§ decisione esplicita, non "il primo trovato").

    No-op per ogni ruolo diverso da SINDACO e per ogni assetto diverso da
    quelli in `_ASSETTI_COLLEGIO_SINDACALE` (compreso "non disponibile").
    § Correzione 18: si applica anche a "Collegio sindacale + revisore
    esterno" — il revisore esterno affiancato non cambia la struttura del
    collegio stesso (Presidente/Sindaco effettivo/Sindaco supplente),
    stesso identico vincolo di cap per carica."""
    if ruolo_codice != "SINDACO":
        return

    organi_controllo = db.scalars(
        select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)
    ).first()
    if organi_controllo is None or organi_controllo.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, organi_controllo.assetto_controllo_id)
    if assetto is None or assetto.codice not in _ASSETTI_COLLEGIO_SINDACALE:
        return

    if carica_codice not in CARICHE_COLLEGIO_SINDACALE:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Specifica la carica (Presidente, Sindaco effettivo o Sindaco supplente) per aggiungere un "
            "componente del collegio sindacale.",
        )
    cap = _cap_carica_collegio_sindacale(carica_codice, organi_controllo.sindaci_effettivi)
    if cap is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Seleziona prima il numero dei sindaci effettivi del collegio."
        )

    attivi = _incarichi_attivi_con_carica(db, azienda_id, carica_codice)
    if len(attivi) < cap:
        return

    if sostituisci_incarico_id is not None:
        target = next((i for i in attivi if i.id == sostituisci_incarico_id), None)
        if target is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "L'incarico da sostituire non è più valido: ricarica la pagina e riprova.",
            )
        cessa_incarichi(db, [target])
        return

    persone = {
        p.id: p for p in db.scalars(select(AnaPersone).where(AnaPersone.id.in_([i.persona_id for i in attivi]))).all()
    }
    raise HTTPException(
        status.HTTP_409_CONFLICT,
        detail={
            "code": "SOSTITUZIONE_CARICA_COLLEGIO_RICHIESTA",
            "message": (
                f"Tutti i posti per \"{ETICHETTE_CARICHE_COLLEGIO_SINDACALE[carica_codice]}\" sono già occupati. "
                "Scegli chi sostituire: l'incarico esistente verrà cessato (data di cessazione impostata a oggi) "
                "e sostituito da questo nuovo incarico."
            ),
            "titolari": [
                {"id": str(i.id), "nome": f"{persone[i.persona_id].cognome} {persone[i.persona_id].nome}"}
                for i in attivi
                if i.persona_id in persone
            ],
        },
    )


def verifica_riduzione_sindaci_effettivi(
    db: Session,
    azienda_id: UUID,
    *,
    precedente_effettivi: int | None,
    nuovo_effettivi: int | None,
    confermata: bool,
) -> None:
    """§ Correzione 14: "Passando da 5 a 3, eventuali righe già compilate
    non devono essere eliminate senza conferma e corretta cessazione o
    storicizzazione degli incarichi" — solo la carica "Sindaco effettivo"
    è interessata (Presidente resta 1, Sindaco supplente resta 2 a
    prescindere dalla scelta). Se la riduzione lascerebbe più titolari
    attivi di quanti posti restano, richiede conferma esplicita (stesso
    pattern a due tentativi di `verifica_transizione_nessun_organo_controllo`,
    § Correzione 12) e, solo allora, cessa gli eccedenti — i più recenti
    per anzianità di nomina (`_incarichi_attivi_con_carica` ordina per
    data di creazione, si mantengono i primi `nuovo_cap`), nella stessa
    transazione del salvataggio della sezione.

    No-op se non è una vera riduzione (valore nuovo assente, precedente
    assente/uguale/maggiore)."""
    if nuovo_effettivi is None or precedente_effettivi is None or nuovo_effettivi >= precedente_effettivi:
        return

    nuovo_cap = max(nuovo_effettivi - 1, 0)
    attivi = _incarichi_attivi_con_carica(db, azienda_id, CARICA_SINDACO_EFFETTIVO)
    eccedenti = attivi[nuovo_cap:]
    if not eccedenti:
        return
    if not confermata:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "code": "RIDUZIONE_SINDACI_EFFETTIVI_RICHIESTA",
                "message": (
                    f"Il collegio ha già {len(attivi)} sindaci effettivi in carica. Riducendo a {nuovo_effettivi}, "
                    f"{len(eccedenti)} di loro verranno cessati (data di cessazione impostata a oggi). Vuoi "
                    "continuare?"
                ),
                "count": len(eccedenti),
            },
        )
    cessa_incarichi(db, eccedenti)


# ===========================================================================
# Verifica del consulente sulla riga-incarico (Soci/Amministratori/Sindaci)
# ===========================================================================
#
# Prima di questa aggiunta lo stato di verifica viveva nella caratteristica
# condivisa A32 ("Stato verifica consulente"), modificabile solo dentro il
# form di compilazione dell'incarico — un semplice valore di catalogo, senza
# nota persistita, audit o concorrenza ottimistica. L'utente ha chiesto che
# la riga abbia lo stesso trattamento di "qualsiasi altra informazione" del
# registro campo-per-campo (popup ancorato, nota, verificato da/il,
# conflitto di concorrenza) e che non sia più editabile dal form.
#
# Riusa direttamente `sys_registro_stato_campi`/`sys_registro_audit`
# (già generiche per `sezione_codice`/`campo_codice`, vedi
# `app.core.registro_campi`) invece di introdurre uno schema parallelo: un
# incarico è trattato come un "campo" a sé, `campo_codice` = id dell'incarico.
# Un solo `sezione_codice` condiviso perché Soci/Amministratori/Sindaci sono
# la stessa entità di dominio (un incarico), non tre cataloghi diversi.
SEZIONE_CODICE_VERIFICA_INCARICHI = "ANAGRAFICA_AZIENDALE.INCARICHI"


def _campo_codice(incarico_id: UUID) -> str:
    return str(incarico_id)


def _stato_riga(db: Session, azienda_id: UUID, incarico_id: UUID) -> SysRegistroStatoCampi | None:
    return db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == SEZIONE_CODICE_VERIFICA_INCARICHI,
            SysRegistroStatoCampi.campo_codice == _campo_codice(incarico_id),
        )
    ).first()


def leggi_stato_verifica_incarico(db: Session, azienda_id: UUID, incarico_id: UUID) -> dict[str, Any]:
    """Un incarico esistente non è mai "vuoto" (a differenza di un campo del
    registro): senza riga di stato è semplicemente non ancora toccato dal
    meccanismo, quindi DA_VERIFICARE con versione 1 — stessa convenzione di
    backfill "pigro" già in uso per i campi legacy compilati senza stato."""
    riga = _stato_riga(db, azienda_id, incarico_id)
    if riga is None:
        return {"status": "PENDING_VERIFICATION", "version": 1, "note": None, "verified_at": None, "verified_by": None}
    stato: VerificationStatus = STATO_DB_TO_API.get(riga.stato_verifica_codice) or "PENDING_VERIFICATION"
    verificato_il = riga.verificato_at.isoformat() if stato == "VERIFIED" and riga.verificato_at is not None else None
    verificato_da_nome = None
    if stato == "VERIFIED" and riga.verificato_da is not None:
        utente = db.get(SysUtente, riga.verificato_da)
        if utente is not None:
            verificato_da_nome = f"{utente.nome} {utente.cognome[:1]}."
    return {
        "status": stato,
        "version": riga.versione,
        "note": riga.nota_revisione,
        "verified_at": verificato_il,
        "verified_by": verificato_da_nome,
    }


def applica_decisione_verifica_incarico(
    db: Session,
    ctx: AziendaContext,
    incarico_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    """Stessa logica di transizione di `registro_campi.applica_decisione_verifica`,
    senza il concetto di "valore vuoto" (un incarico esiste sempre) e senza
    dipendere da un catalogo di campi statico."""
    if decisione == "REVISION_REQUIRED" and (nota is None or nota.strip() == ""):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La richiesta di revisione richiede una nota che spieghi cosa correggere",
        )

    campo = _campo_codice(incarico_id)
    stato_riga = _stato_riga(db, ctx.azienda_id, incarico_id)
    if stato_riga is None:
        stato_riga = SysRegistroStatoCampi(
            azienda_id=ctx.azienda_id,
            sezione_codice=SEZIONE_CODICE_VERIFICA_INCARICHI,
            campo_codice=campo,
            versione=1,
        )
        db.add(stato_riga)

    if expected_version is not None and stato_riga.versione != expected_version:
        raise HTTPException(status.HTTP_409_CONFLICT, "L'incarico è stato modificato nel frattempo: ricaricare e riprovare")

    codice_db = STATO_API_TO_DB[decisione]
    # Un incarico già confermato che riceve di nuovo VERIFIED (pulsante
    # "Salva nota") aggiorna solo la nota, non la data/autore di verifica —
    # stessa regola di `applica_decisione_verifica`.
    solo_nota = decisione == "VERIFIED" and stato_riga.stato_verifica_codice == "APPROVATO"
    stato_riga.stato_verifica_codice = codice_db
    stato_riga.versione += 1
    stato_riga.nota_revisione = nota
    if decisione == "REVISION_REQUIRED":
        stato_riga.verificato_da = None
        stato_riga.verificato_at = None
        azione = "RICHIESTA_REVISIONE"
    elif solo_nota:
        azione = "VERIFICA"
    else:
        stato_riga.verificato_da = ctx.utente_id
        stato_riga.verificato_at = datetime.now(timezone.utc)
        azione = "VERIFICA"

    registra_audit(
        db,
        ctx,
        sezione_codice=SEZIONE_CODICE_VERIFICA_INCARICHI,
        campo_codice=campo,
        azione=azione,
        precedente=None,
        nuovo=nota,
    )
