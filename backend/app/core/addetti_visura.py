"""Motore di "Addetti da visura" (Correzione 22, poi unificata su richiesta
esplicita dell'utente con "Addetti per comune": le due risorse "vanno messe
insieme" — il comune eventualmente collegato a una rilevazione si compila
in fondo allo stesso form e viaggia annidato nella stessa lettura/scrittura,
invece di restare due sotto-risorse indipendenti gestite da due form
separati.

Sostituisce la registrazione generica `register_list_crud_with_children`
usata prima per `/addetti-visura` (non supporta un secondo figlio annidato
di un'altra risorsa): qui la scrittura di rilevazione + periodi + comune
collegato + periodi del comune è un'unica transazione (§ CLAUDE.md
"operazioni composite = transazione unica"). `/addetti-comune` resta invece
registrata sulla fabbrica generica, invariata — la sotto-risorsa esiste
ancora per compatibilità/consultazione diretta, la scrittura primaria passa
ora da qui."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.personale_occupazione import SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE
from app.core.verifica_riga import elimina_stato_verifica_riga
from app.models.anagrafica import AnaAddettiComune, AnaAddettiComunePeriodo, AnaAddettiVisura, AnaAddettiVisuraPeriodo
from app.schemas.anagrafica import (
    AddettiComunePeriodoRead,
    AddettiComuneRead,
    AddettiVisuraCreate,
    AddettiVisuraPeriodoRead,
    AddettiVisuraRead,
    AddettiVisuraUpdate,
    RilevazioneComuneIn,
)


def _rilevazione_owned_or_404(db: Session, rilevazione_id: UUID, azienda_id: UUID) -> AnaAddettiVisura:
    rilevazione = db.get(AnaAddettiVisura, rilevazione_id)
    if rilevazione is None or rilevazione.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Rilevazione non trovata")
    return rilevazione


def _comune_collegato(db: Session, rilevazione_id: UUID) -> AnaAddettiComune | None:
    return db.scalars(
        select(AnaAddettiComune)
        .where(AnaAddettiComune.rilevazione_addetti_id == rilevazione_id)
        .order_by(AnaAddettiComune.created_at)
    ).first()


def _leggi_rilevazione(db: Session, rilevazione: AnaAddettiVisura) -> AddettiVisuraRead:
    periodi = db.scalars(
        select(AnaAddettiVisuraPeriodo)
        .where(AnaAddettiVisuraPeriodo.rilevazione_addetti_id == rilevazione.id)
        .order_by(AnaAddettiVisuraPeriodo.created_at)
    ).all()

    comune_letto: AddettiComuneRead | None = None
    comune = _comune_collegato(db, rilevazione.id)
    if comune is not None:
        comune_periodi = db.scalars(
            select(AnaAddettiComunePeriodo)
            .where(AnaAddettiComunePeriodo.addetti_comune_id == comune.id)
            .order_by(AnaAddettiComunePeriodo.created_at)
        ).all()
        comune_letto = AddettiComuneRead(
            id=comune.id,
            azienda_id=comune.azienda_id,
            created_at=comune.created_at,
            updated_at=comune.updated_at,
            rilevazione_addetti_id=comune.rilevazione_addetti_id,
            comune=comune.comune,
            provincia=comune.provincia,
            numero_sedi_unita_locali=comune.numero_sedi_unita_locali,
            periodi=[AddettiComunePeriodoRead.model_validate(p) for p in comune_periodi],
        )

    return AddettiVisuraRead(
        id=rilevazione.id,
        azienda_id=rilevazione.azienda_id,
        created_at=rilevazione.created_at,
        updated_at=rilevazione.updated_at,
        fonte=rilevazione.fonte,
        anno_riferimento=rilevazione.anno_riferimento,
        data_rilevazione=rilevazione.data_rilevazione,
        periodi=[AddettiVisuraPeriodoRead.model_validate(p) for p in periodi],
        comune=comune_letto,
    )


def elenco_rilevazioni(db: Session, azienda_id: UUID) -> list[AddettiVisuraRead]:
    rilevazioni = db.scalars(
        select(AnaAddettiVisura).where(AnaAddettiVisura.azienda_id == azienda_id).order_by(AnaAddettiVisura.created_at)
    ).all()
    return [_leggi_rilevazione(db, r) for r in rilevazioni]


def dettaglio_rilevazione(db: Session, azienda_id: UUID, rilevazione_id: UUID) -> AddettiVisuraRead:
    rilevazione = _rilevazione_owned_or_404(db, rilevazione_id, azienda_id)
    return _leggi_rilevazione(db, rilevazione)


def _sostituisci_periodi(db: Session, rilevazione_id: UUID, periodi: list) -> None:
    db.query(AnaAddettiVisuraPeriodo).filter(AnaAddettiVisuraPeriodo.rilevazione_addetti_id == rilevazione_id).delete()
    for p in periodi:
        db.add(AnaAddettiVisuraPeriodo(rilevazione_addetti_id=rilevazione_id, **p.model_dump()))


def _sincronizza_comune(
    db: Session, ctx: AziendaContext, rilevazione_id: UUID, comune_in: RilevazioneComuneIn | None
) -> None:
    """Un comune "vuoto" (assente o nome bianco) non tocca l'eventuale dato
    territoriale già collegato — mai una cancellazione implicita di dati già
    salvati per un campo lasciato vuoto in un salvataggio successivo dello
    stesso form."""
    if comune_in is None or not comune_in.comune.strip():
        return

    comune = _comune_collegato(db, rilevazione_id)
    if comune is None:
        comune = AnaAddettiComune(azienda_id=ctx.azienda_id, rilevazione_addetti_id=rilevazione_id)
        db.add(comune)

    comune.comune = comune_in.comune
    comune.provincia = comune_in.provincia
    comune.numero_sedi_unita_locali = comune_in.numero_sedi_unita_locali
    db.flush()

    db.query(AnaAddettiComunePeriodo).filter(AnaAddettiComunePeriodo.addetti_comune_id == comune.id).delete()
    for p in comune_in.periodi:
        db.add(AnaAddettiComunePeriodo(addetti_comune_id=comune.id, **p.model_dump()))


def crea_rilevazione(db: Session, ctx: AziendaContext, payload: AddettiVisuraCreate) -> AddettiVisuraRead:
    rilevazione = AnaAddettiVisura(
        azienda_id=ctx.azienda_id,
        fonte=payload.fonte,
        anno_riferimento=payload.anno_riferimento,
        data_rilevazione=payload.data_rilevazione,
    )
    db.add(rilevazione)
    db.flush()

    for p in payload.periodi:
        db.add(AnaAddettiVisuraPeriodo(rilevazione_addetti_id=rilevazione.id, **p.model_dump()))
    _sincronizza_comune(db, ctx, rilevazione.id, payload.comune)

    db.commit()
    return _leggi_rilevazione(db, rilevazione)


def aggiorna_rilevazione(
    db: Session, ctx: AziendaContext, rilevazione_id: UUID, payload: AddettiVisuraUpdate
) -> AddettiVisuraRead:
    rilevazione = _rilevazione_owned_or_404(db, rilevazione_id, ctx.azienda_id)

    dump = payload.model_dump(exclude_unset=True, exclude={"periodi", "comune"})
    for campo, valore in dump.items():
        setattr(rilevazione, campo, valore)

    if payload.periodi is not None:
        _sostituisci_periodi(db, rilevazione.id, payload.periodi)
    _sincronizza_comune(db, ctx, rilevazione.id, payload.comune)

    db.commit()
    return _leggi_rilevazione(db, rilevazione)


def elimina_rilevazione(db: Session, azienda_id: UUID, rilevazione_id: UUID) -> None:
    rilevazione = _rilevazione_owned_or_404(db, rilevazione_id, azienda_id)
    db.delete(rilevazione)  # periodi + comune collegato + suoi periodi seguono via ON DELETE CASCADE
    elimina_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE, rilevazione_id)
    db.commit()
