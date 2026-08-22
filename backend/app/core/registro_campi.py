"""Logica del "registro campo-per-campo" (verifica + visibilita' per singolo
campo, §7/§12/§13/§15 della specifica Anagrafica Aziendale).

Pilota: una sola sezione, "informazioni-societarie", sostenuta dalla tabella
esistente `ana_identificazione_camerale`. Il catalogo campi qui sotto e'
quello finale della specifica (PARTE II, §26.1 "regola di fusione" e §28.1):
14 campi in 3 gruppi. Le colonne mancanti (numero_iscrizione, data_iscrizione,
termine_esercizio, inizio_esercizio, data_ultimo_bilancio_approvato) sono
state aggiunte dalla migrazione 0014. Le colonne legacy non riprese nel
catalogo finale (camera_commercio_competente, ufficio_registro_imprese,
data_inizio_attivita, data_ultimo_protocollo, §28.2) restano nello schema ma
non sono elencate qui.

`registeredOffice` ("Sede legale") non ha una colonna propria: esiste gia'
un'entita' autorevole per le sedi (`ana_sedi`, §16.1/§29.1 "non duplicare
automaticamente"), quindi il valore e' derivato in lettura da li' (vedi
`_sede_legale_di`) ed e' l'unico campo non scrivibile da questa sezione
(`derived=True`): resta comunque verificabile/nascondibile come tutti gli
altri, perche' verifica e visibilita' sono metadati per chiave di campo,
indipendenti da dove il valore e' fisicamente memorizzato.

`sezione_codice`/`campo_codice` sono pero' pensati per essere generici: una
futura sezione puo' riusare `sys_registro_stato_campi`/`sys_registro_audit`
registrando qui sotto la propria mappa di campi, senza nuove tabelle.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.models.anagrafica import AnaIdentificazioneCamerale, AnaSede
from app.models.sistema import SysRegistroAudit, SysRegistroStatoCampi, SysUtente
from app.schemas.registro_campi import (
    CompletionStatus,
    FieldStateRead,
    QualitySummaryRead,
    RecentChangeRead,
    SectionGroupRead,
    SectionRead,
    VerificationStatus,
)

_RE_GIORNO_MESE = re.compile(r"^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$")

SEZIONE_INFORMAZIONI_SOCIETARIE = "ANAGRAFICA_AZIENDALE.INFORMAZIONI_SOCIETARIE"

# Mappa stato interno (catalogo cat_stati_verifica_modifiche, condiviso con
# sys_presa_visione_modifiche) <-> stato logico esposto dall'API (§7.1).
_STATO_DB_TO_API: dict[str, VerificationStatus] = {
    "DA_VERIFICARE": "PENDING_VERIFICATION",
    "APPROVATO": "VERIFIED",
    "IN_REVISIONE": "REVISION_REQUIRED",
}
_STATO_API_TO_DB = {v: k for k, v in _STATO_DB_TO_API.items()}


@dataclass(frozen=True)
class CampoDef:
    key: str
    label: str
    data_type: str
    # True per l'unico campo senza colonna propria su ana_identificazione_camerale
    # ("Sede legale", derivato da ana_sedi): leggibile/verificabile/nascondibile
    # come ogni altro campo, ma escluso dalla scrittura via PATCH sezione.
    derived: bool = False


@dataclass(frozen=True)
class GruppoDef:
    key: str
    title: str
    campi: list[CampoDef]


# Catalogo finale (specifica Anagrafica Aziendale, PARTE II §28.1): 3 gruppi,
# 14 campi. Le chiavi restano i nomi delle colonne di dominio (convenzione
# gia' in uso nel resto del repository), non i fieldKey camelCase illustrativi
# del documento: e' l'adattamento allo stack esistente esplicitamente
# consentito dal blueprint (§25/§27.3).
GRUPPI_INFORMAZIONI_SOCIETARIE: list[GruppoDef] = [
    GruppoDef(
        key="identificazione-camerale",
        title="Identificazione camerale",
        campi=[
            CampoDef("ragione_sociale", "Ragione sociale", "text"),
            CampoDef("forma_giuridica", "Forma giuridica", "text"),
            CampoDef("codice_fiscale", "Codice fiscale", "codice-fiscale"),
            CampoDef("partita_iva", "Partita IVA", "partita-iva"),
        ],
    ),
    GruppoDef(
        key="iscrizione-registro-imprese",
        title="Iscrizione al Registro Imprese",
        campi=[
            CampoDef("numero_rea", "Numero REA", "text"),
            CampoDef("numero_iscrizione", "Numero iscrizione", "text"),
            CampoDef("provincia_rea", "Provincia REA", "text"),
            CampoDef("data_iscrizione", "Data iscrizione", "date"),
            CampoDef("sede_legale", "Sede legale", "address", derived=True),
            CampoDef("stato_attivita", "Stato impresa", "text"),
        ],
    ),
    GruppoDef(
        key="date",
        title="Date",
        campi=[
            CampoDef("data_atto_costitutivo", "Data costituzione", "date"),
            CampoDef("termine_esercizio", "Termine esercizio", "day-month"),
            CampoDef("inizio_esercizio", "Inizio esercizio", "day-month"),
            CampoDef("data_ultimo_bilancio_approvato", "Data ultimo bilancio approvato", "date"),
        ],
    ),
]

CAMPO_LABEL: dict[str, str] = {c.key: c.label for g in GRUPPI_INFORMAZIONI_SOCIETARIE for c in g.campi}
CAMPO_TIPO: dict[str, str] = {c.key: c.data_type for g in GRUPPI_INFORMAZIONI_SOCIETARIE for c in g.campi}
CHIAVI_CAMPI: set[str] = set(CAMPO_LABEL)
CAMPI_DERIVATI: set[str] = {c.key for g in GRUPPI_INFORMAZIONI_SOCIETARIE for c in g.campi if c.derived}
# Colonne reali su ana_identificazione_camerale: usate per lo stato di
# completamento (nessun accesso a ana_sedi necessario li') e per filtrare gli
# aggiornamenti scrivibili via PATCH sezione (§30.5.5: rifiuta fieldKey non
# scrivibili, qui semplicemente ignorati come i fieldKey fuori catalogo).
CHIAVI_CAMPI_SCRIVIBILI: set[str] = CHIAVI_CAMPI - CAMPI_DERIVATI


def is_empty(value: str | None) -> bool:
    """Stringhe vuote o di soli spazi, e None, sono vuote (§7.2). I campi del
    pilota sono tutti testuali/data: nessun caso 0/False da gestire qui."""
    return value is None or value.strip() == ""


def _normalizza(valore: str | None) -> str | None:
    if valore is None:
        return None
    trimmed = valore.strip()
    return None if trimmed == "" else trimmed


def valida_campo(campo: str, valore: str | None) -> str | None:
    """Restituisce il messaggio di errore per un valore non vuoto e non
    valido, altrimenti None. Nessuna validazione `required` (§9.2): un
    valore vuoto non genera mai errore."""
    if is_empty(valore):
        return None
    assert valore is not None

    if campo == "partita_iva":
        if not re.fullmatch(r"\d{11}", valore):
            return "La Partita IVA deve contenere 11 cifre"
    elif campo == "codice_fiscale":
        if not re.fullmatch(r"[A-Za-z0-9]{11}|[A-Za-z0-9]{16}", valore):
            return "Il codice fiscale deve contenere 11 o 16 caratteri"
    elif CAMPO_TIPO.get(campo) == "date":
        try:
            date.fromisoformat(valore)
        except ValueError:
            return "Data non valida"
    elif CAMPO_TIPO.get(campo) == "day-month":
        if not _RE_GIORNO_MESE.fullmatch(valore):
            return "Usa il formato GG/MM"
    return None


def _valore_dal_record(row: AnaIdentificazioneCamerale | None, campo: str) -> str | None:
    if row is None:
        return None
    valore = getattr(row, campo)
    if isinstance(valore, date):
        return valore.isoformat()
    return valore


def _sede_legale_di(db: Session, azienda_id: UUID) -> str | None:
    """Valore derivato del campo "Sede legale" (§16.1/§29.1): non duplica una
    colonna testuale perche' ana_sedi (015) e' gia' l'entita' autorevole per
    le sedi. `tipo_sede` e' testo libero (nessun catalogo fisso in ana_sedi),
    quindi qui si usa il miglior riconoscimento possibile senza inventare un
    nuovo vincolo di dominio su un'altra tabella: la prima sede il cui tipo
    contiene "legale". Se nessuna sede e' marcata come tale, il campo resta
    vuoto (nessun indicatore di verifica, §7.2), esattamente come un dato mai
    inserito."""
    sede = db.scalars(
        select(AnaSede)
        .where(AnaSede.azienda_id == azienda_id, AnaSede.tipo_sede.ilike("%legale%"))
        .order_by(AnaSede.created_at.asc())
        .limit(1)
    ).first()
    if sede is None:
        return None
    via = " ".join(p for p in [sede.indirizzo, sede.numero_civico] if p)
    localita = " ".join(p for p in [sede.cap, sede.comune] if p)
    localita = f"{localita} ({sede.provincia})" if localita and sede.provincia else localita
    parti = [p for p in [via, localita, sede.nazione] if p]
    return ", ".join(parti) if parti else None


def _valore_campo(db: Session, ctx: AziendaContext, row: AnaIdentificazioneCamerale | None, campo: str) -> str | None:
    """Valore attuale di un campo del catalogo, qualunque sia la sua origine
    (colonna di dominio o derivato): usato ovunque serva leggere "il valore
    attuale" a prescindere da dove sia fisicamente memorizzato (verifica,
    visibilita')."""
    if campo in CAMPI_DERIVATI:
        return _sede_legale_di(db, ctx.azienda_id)
    return _valore_dal_record(row, campo)


def stato_completamento(row: AnaIdentificazioneCamerale | None) -> CompletionStatus:
    """Stessa convenzione gia' in uso nel resto del modulo (dashboard
    esistente): "compilata" = ragione sociale presente. Server-authoritative,
    non dedotta da campi `required` (§14): nessuna soglia di completezza e'
    inventata qui, solo questa unica regola di dominio gia' condivisa.
    Il campo derivato (sede legale) non entra nel controllo "in corso": la
    sua presenza dipende dal modulo Sedi, non da una compilazione fatta qui."""
    if row is None:
        return "NOT_STARTED"
    if not is_empty(row.ragione_sociale):
        return "COMPLETE"
    if any(not is_empty(_valore_dal_record(row, c)) for c in CHIAVI_CAMPI_SCRIVIBILI):
        return "IN_PROGRESS"
    return "NOT_STARTED"


def _carica_stati(db: Session, azienda_id: UUID, sezione_codice: str) -> dict[str, SysRegistroStatoCampi]:
    righe = db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == sezione_codice,
        )
    ).all()
    return {r.campo_codice: r for r in righe}


def _nome_utente(utente: SysUtente) -> str:
    # Stesso formato "Nome I." già usato da `ultime_modifiche`.
    return f"{utente.nome} {utente.cognome[:1]}."


def _carica_verificatori(db: Session, stati: dict[str, SysRegistroStatoCampi]) -> dict[UUID, str]:
    """Nomi (§9.4) degli autori di verifica presenti tra gli stati caricati,
    in un'unica query invece di una per campo."""
    ids = {s.verificato_da for s in stati.values() if s.verificato_da is not None}
    if not ids:
        return {}
    utenti = db.scalars(select(SysUtente).where(SysUtente.id.in_(ids))).all()
    return {u.id: _nome_utente(u) for u in utenti}


def costruisci_sezione(
    db: Session,
    ctx: AziendaContext,
    *,
    row: AnaIdentificazioneCamerale | None,
) -> SectionRead:
    stati = _carica_stati(db, ctx.azienda_id, SEZIONE_INFORMAZIONI_SOCIETARIE)
    consulente = ctx.profilo == "CONSULENTE"
    # Stato, nota e audit di verifica sono visibili anche all'Azienda in
    # sola lettura (§13 del prompt master): le servono per capire cosa
    # correggere quando un campo è "da revisionare". Solo l'occhietto
    # (visibilità) e le decisioni di verifica restano riservate al
    # Consulente, applicate lato UI (§9.3) e comunque riverificate qui.
    verificatori = _carica_verificatori(db, stati)

    gruppi: list[SectionGroupRead] = []
    for gruppo in GRUPPI_INFORMAZIONI_SOCIETARIE:
        campi_letti: list[FieldStateRead] = []
        for campo in gruppo.campi:
            valore = _valore_campo(db, ctx, row, campo.key)
            stato_riga = stati.get(campo.key)
            visibile = stato_riga.visibile_azienda if stato_riga else True

            if not consulente and not visibile:
                continue  # §13.2: il campo nascosto non viene renderizzato per l'Azienda.

            # Un campo vuoto non ha mai uno stato di verifica, anche se e'
            # rimasta una riga di stato "stantia" da un valore poi svuotato
            # (invariante applicata anche in lettura, non solo in scrittura).
            vuoto = is_empty(valore)
            # Dato legacy compilato ma senza riga di stato (es. valorizzato
            # prima dell'introduzione di questo registro, o mai toccato da
            # un salvataggio passato da questo modulo): trattato come
            # DA_VERIFICARE, mai come "nessuno stato" (§7.2).
            if vuoto:
                stato_verifica = None
            elif stato_riga is not None:
                stato_verifica = _STATO_DB_TO_API.get(stato_riga.stato_verifica_codice) or "PENDING_VERIFICATION"
            else:
                stato_verifica = "PENDING_VERIFICATION"
            nota = None if vuoto else (stato_riga.nota_revisione if stato_riga else None)
            # Stessa logica "pigra" del backfill sopra: una riga mai
            # materializzata parte concettualmente alla versione 1, la
            # stessa che _get_or_create_stato assegnera' quando verra'
            # davvero creata (es. dalla prima decisione di verifica).
            versione = None if vuoto else (stato_riga.versione if stato_riga else 1)
            verificato_il = (
                stato_riga.verificato_at.isoformat()
                if stato_riga is not None and stato_verifica == "VERIFIED" and stato_riga.verificato_at is not None
                else None
            )
            verificato_da_nome = (
                verificatori.get(stato_riga.verificato_da)
                if stato_riga is not None and stato_verifica == "VERIFIED" and stato_riga.verificato_da is not None
                else None
            )

            campo_letto = FieldStateRead(
                key=campo.key,
                label=campo.label,
                value=valore,
                dataType=campo.data_type,
                editable=not campo.derived,
                visibleToCompany=visibile,
                verificationStatus=stato_verifica,
                # Ancora di concorrenza ottimistica per la decisione di
                # verifica: usata solo dalla mutazione consulente-only, non
                # serve (e non va esposta) all'Azienda in sola lettura.
                verificationVersion=versione if consulente else None,
                revisionNote=nota,
                updatedAt=row.updated_at.isoformat() if row is not None else None,
                verifiedAt=verificato_il,
                verifiedBy=verificato_da_nome,
            )
            campi_letti.append(campo_letto)
        gruppi.append(SectionGroupRead(key=gruppo.key, title=gruppo.title, fields=campi_letti))

    return SectionRead(
        sectionKey="informazioni-societarie",
        title="Informazioni societarie",
        completionStatus=stato_completamento(row),
        groups=gruppi,
        version=row.updated_at.isoformat() if row is not None else None,
    )


def registra_audit(
    db: Session,
    ctx: AziendaContext,
    *,
    sezione_codice: str,
    campo_codice: str,
    azione: str,
    precedente: str | None,
    nuovo: str | None,
) -> None:
    db.add(
        SysRegistroAudit(
            azienda_id=ctx.azienda_id,
            utente_id=ctx.utente_id,
            sezione_codice=sezione_codice,
            campo_codice=campo_codice,
            azione=azione,
            valore_precedente=precedente,
            valore_nuovo=nuovo,
        )
    )


def applica_modifiche_sezione(
    db: Session,
    ctx: AziendaContext,
    *,
    row: AnaIdentificazioneCamerale,
    cambiamenti: dict[str, str | None],
) -> list[str]:
    """Applica solo i campi effettivamente cambiati al record di dominio e
    allo stato di verifica per campo (§7.3): un valore svuotato azzera lo
    stato, un valore non vuoto modificato torna DA_VERIFICARE. Nessun
    aggiornamento (ne' di stato ne' di audit) per campi inviati ma identici
    al valore gia' salvato. Restituisce le chiavi effettivamente cambiate."""
    stati = _carica_stati(db, ctx.azienda_id, SEZIONE_INFORMAZIONI_SOCIETARIE)
    cambiate: list[str] = []

    for campo, nuovo_raw in cambiamenti.items():
        if campo not in CHIAVI_CAMPI_SCRIVIBILI:
            continue  # fuori catalogo, oppure campo derivato (non scrivibile qui, §16.1/§29.1)
        nuovo = _normalizza(nuovo_raw)
        attuale = _valore_dal_record(row, campo)
        if nuovo == attuale:
            continue

        if CAMPO_TIPO.get(campo) == "date":
            setattr(row, campo, date.fromisoformat(nuovo) if nuovo is not None else None)
        else:
            setattr(row, campo, nuovo)

        stato_riga = stati.get(campo)
        if stato_riga is None:
            stato_riga = SysRegistroStatoCampi(
                azienda_id=ctx.azienda_id,
                sezione_codice=SEZIONE_INFORMAZIONI_SOCIETARIE,
                campo_codice=campo,
                versione=1,
            )
            db.add(stato_riga)
            stati[campo] = stato_riga

        if is_empty(nuovo):
            if stato_riga.stato_verifica_codice is not None:
                stato_riga.versione += 1
            stato_riga.stato_verifica_codice = None
            stato_riga.nota_revisione = None
            stato_riga.verificato_da = None
            stato_riga.verificato_at = None
        else:
            stato_riga.stato_verifica_codice = "DA_VERIFICARE"
            stato_riga.nota_revisione = None
            stato_riga.verificato_da = None
            stato_riga.verificato_at = None
            stato_riga.versione += 1

        registra_audit(
            db,
            ctx,
            sezione_codice=SEZIONE_INFORMAZIONI_SOCIETARIE,
            campo_codice=campo,
            azione="MODIFICA_VALORE",
            precedente=attuale,
            nuovo=nuovo,
        )
        cambiate.append(campo)

    return cambiate


def valuta_qualita(db: Session, azienda_id: UUID) -> QualitySummaryRead:
    """Qualità dei *dati già inseriti e visibili all'azienda* (decisione
    esplicita dell'utente): l'indicatore "Qualità dei dati" misura quanto è
    affidabile ciò che è stato compilato, non quanto manca da compilare —
    per questo `percentage` e i conteggi `verified`/`pending`/
    `revisionRequired` restano sui soli campi compilati, cioè quelli con una
    riga di stato già creata (un campo mai toccato non ha ancora nulla da
    "verificare"). Un campo oscurato con l'occhietto (`visibile_azienda`
    false) è escluso dal calcolo, non solo nascosto all'Azienda: la qualità
    misura cosa l'azienda vede, non il lavoro interno del Consulente su dati
    che ha scelto di non mostrare ancora.

    `totalApplicable` (dimensione dell'intero catalogo, compilato o no) è
    invece quello che serve altrove (card della Home) per sapere se una
    sezione è compilata per intero, tenuto volutamente fuori da
    `percentage` qui — e non filtrato per visibilità: "compilato" resta
    vero anche per un campo oscurato.

    Nel pilota il catalogo applicabile coincide con quello di
    "informazioni-societarie" (`CHIAVI_CAMPI`, 14 campi): quando altre
    sezioni adotteranno lo stesso registro, `totalApplicable` dovrà sommare
    i loro cataloghi invece di usare solo questo.

    `hidden` (campi con `visibile_azienda=false`, indipendentemente dal fatto
    che siano compilati) è restituito a parte perché lo stato di
    completamento di una sezione (card della Home) deve ignorare i campi che
    il Consulente ha scelto di non mostrare ancora: un campo nascosto e
    non compilato non deve impedire alla sezione di risultare "completa"."""
    righe = db.scalars(
        select(SysRegistroStatoCampi.stato_verifica_codice).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.stato_verifica_codice.is_not(None),
            SysRegistroStatoCampi.visibile_azienda.is_(True),
        )
    ).all()
    verified = sum(1 for s in righe if s == "APPROVATO")
    pending = sum(1 for s in righe if s == "DA_VERIFICARE")
    revision = sum(1 for s in righe if s == "IN_REVISIONE")
    filled = verified + pending + revision
    percentage = round(verified / filled * 100) if filled > 0 else 0
    total_applicable = len(CHIAVI_CAMPI)
    hidden = len(
        db.scalars(
            select(SysRegistroStatoCampi.campo_codice).where(
                SysRegistroStatoCampi.azienda_id == azienda_id,
                SysRegistroStatoCampi.visibile_azienda.is_(False),
            )
        ).all()
    )
    return QualitySummaryRead(
        verified=verified,
        pending=pending,
        revisionRequired=revision,
        percentage=percentage,
        totalApplicable=total_applicable,
        hidden=hidden,
    )


def ultime_modifiche(db: Session, azienda_id: UUID, *, limite: int = 5) -> list[RecentChangeRead]:
    righe = db.execute(
        select(SysRegistroAudit, SysUtente)
        .join(SysUtente, SysUtente.id == SysRegistroAudit.utente_id, isouter=True)
        .where(SysRegistroAudit.azienda_id == azienda_id)
        .order_by(SysRegistroAudit.created_at.desc())
        .limit(limite)
    ).all()

    _ETICHETTE_AZIONE = {
        "MODIFICA_VALORE": "aggiornato",
        "VERIFICA": "verificato",
        "RICHIESTA_REVISIONE": "segnalato per revisione",
        "CAMBIO_VISIBILITA": "visibilità modificata",
    }

    esiti: list[RecentChangeRead] = []
    for audit, utente in righe:
        etichetta_campo = CAMPO_LABEL.get(audit.campo_codice, audit.campo_codice)
        azione = _ETICHETTE_AZIONE.get(audit.azione, audit.azione)
        attore = f"{utente.nome} {utente.cognome[:1]}." if utente is not None else None
        esiti.append(
            RecentChangeRead(
                id=str(audit.id),
                label=f"{etichetta_campo} {azione}",
                timestamp=audit.created_at.isoformat(),
                actor=attore,
            )
        )
    return esiti


def _get_or_create_stato(db: Session, ctx: AziendaContext, campo: str, *, valore_attuale: str | None) -> SysRegistroStatoCampi:
    stati = _carica_stati(db, ctx.azienda_id, SEZIONE_INFORMAZIONI_SOCIETARIE)
    stato_riga = stati.get(campo)
    if stato_riga is not None:
        return stato_riga
    stato_riga = SysRegistroStatoCampi(
        azienda_id=ctx.azienda_id,
        sezione_codice=SEZIONE_INFORMAZIONI_SOCIETARIE,
        campo_codice=campo,
        # Backfill "pigro" per dati legacy compilati ma mai passati da
        # questo registro (§7.2): se il valore e' gia' non vuoto la riga
        # nasce DA_VERIFICARE, mai senza stato.
        stato_verifica_codice="DA_VERIFICARE" if not is_empty(valore_attuale) else None,
        # Valorizzata esplicitamente (non solo il default lato colonna):
        # il default di mapped_column si applica solo all'INSERT, ma qui
        # serve leggerla subito dopo, prima del flush (es. `versione += 1`).
        versione=1,
    )
    db.add(stato_riga)
    return stato_riga


def applica_decisione_verifica(
    db: Session,
    ctx: AziendaContext,
    *,
    row: AnaIdentificazioneCamerale | None,
    campo: str,
    decisione: str,
    nota: str | None,
    expected_field_version: int | None,
) -> SysRegistroStatoCampi:
    valore = _valore_campo(db, ctx, row, campo)
    if is_empty(valore):
        raise HTTPException(status.HTTP_409_CONFLICT, "Il campo è vuoto: nessun valore da verificare")

    # Vincolo di dominio (non solo di schema, §2.3 CLAUDE.md "la logica di
    # business sta nel backend"): una richiesta di revisione deve sempre
    # spiegare cosa correggere. Verificato qui esplicitamente, prima del
    # CHECK chk_sys_registro_stato_campi_nota_se_in_revisione (021), per
    # restituire un 422 leggibile invece di un errore di integrità del DB.
    if decisione == "REVISION_REQUIRED" and is_empty(nota):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La richiesta di revisione richiede una nota che spieghi cosa correggere",
        )

    stato_riga = _get_or_create_stato(db, ctx, campo, valore_attuale=valore)

    if expected_field_version is not None and stato_riga.versione != expected_field_version:
        raise HTTPException(status.HTTP_409_CONFLICT, "Il campo è stato modificato nel frattempo: ricaricare e riprovare")

    codice_db = _STATO_API_TO_DB[decisione]
    # Un campo già confermato che riceve di nuovo la decisione VERIFIED (il
    # pulsante "Salva nota" del popup, §9.2 punto 6/§23.1) aggiorna solo la
    # nota: non deve aggiornare falsamente la data/autore di verifica, che
    # restano quelli della verifica originale. Resta comunque azione
    # "VERIFICA" nell'audit (chk_sys_registro_audit_azione, 022, non
    # modificabile senza una nuova migrazione: nessun valore nuovo introdotto
    # qui, solo riuso di uno già ammesso).
    solo_nota = decisione == "VERIFIED" and stato_riga.stato_verifica_codice == "APPROVATO"
    stato_riga.stato_verifica_codice = codice_db
    stato_riga.versione += 1
    if decisione == "REVISION_REQUIRED":
        stato_riga.nota_revisione = nota
        stato_riga.verificato_da = None
        stato_riga.verificato_at = None
        azione = "RICHIESTA_REVISIONE"
    elif solo_nota:
        stato_riga.nota_revisione = nota
        azione = "VERIFICA"
    else:
        stato_riga.nota_revisione = nota
        stato_riga.verificato_da = ctx.utente_id
        stato_riga.verificato_at = datetime.now(timezone.utc)
        azione = "VERIFICA"

    registra_audit(
        db,
        ctx,
        sezione_codice=SEZIONE_INFORMAZIONI_SOCIETARIE,
        campo_codice=campo,
        azione=azione,
        precedente=None,
        nuovo=nota,
    )
    return stato_riga


def applica_visibilita(
    db: Session,
    ctx: AziendaContext,
    *,
    row: AnaIdentificazioneCamerale | None,
    campo: str,
    visibile: bool,
) -> SysRegistroStatoCampi:
    """Configurazione autonoma (§13.3): non tocca stato di verifica ne'
    versione (l'ancora di concorrenza della verifica), non sporca la bozza
    del modulo dati."""
    valore = _valore_campo(db, ctx, row, campo)
    stato_riga = _get_or_create_stato(db, ctx, campo, valore_attuale=valore)
    stato_riga.visibile_azienda = visibile
    registra_audit(
        db,
        ctx,
        sezione_codice=SEZIONE_INFORMAZIONI_SOCIETARIE,
        campo_codice=campo,
        azione="CAMBIO_VISIBILITA",
        precedente=None,
        nuovo="nascosto" if not visibile else "visibile",
    )
    return stato_riga


def require_consulente_ctx(ctx: AziendaContext = Depends(get_current_azienda)) -> AziendaContext:
    """Come `require_consulente` (app.core.deps) ma a valle di
    `get_current_azienda`: qui serve anche l'azienda attiva del consulente
    (header X-Azienda-Id), non solo l'identita' dell'utente."""
    if ctx.profilo != "CONSULENTE":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Operazione riservata al consulente")
    return ctx
