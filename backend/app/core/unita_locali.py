"""Motore della tabella "Sedi secondarie e unità locali" (Correzione 23).

Estende `AnaSede`/`ana_sedi` (già l'entità autorevole per le sedi: la sede
legale stessa vi convive come riga distinta, riconosciuta da
`tipo_sede ILIKE '%legale%'` in `app.core.registro_campi._sede_legale_di`) —
nessuna tabella nuova per l'unità in sé (§ punto 11, "non creare una seconda
struttura se esistono già tabelle equivalenti"). Le unità locali create da
questo modulo valorizzano `tipo_sede` con la costante fissa
`TIPO_SEDE_UNITA_LOCALE`, che non contiene mai "legale": la sede legale non
può quindi mai comparire nella tabella di questa card, e questo modulo non
tocca né rilegge mai le righe marcate come sede legale.

Operazione composita (riga `ana_sedi` + tipologie + attività + codici ATECO
+ contatti) in un'unica transazione (§ CLAUDE.md "operazioni composite =
transazione unica"): un `db.flush()` intermedio per avere l'id della riga
prima di sincronizzare le relazioni, un solo `db.commit()` finale. Le
relazioni molti-a-molti/ripetibili si scrivono con lo stesso pattern
delete-and-reinsert di `app.core.titoli_abilitativi`
(`_sincronizza_settori_iaf`/`_sincronizza_categorie_soa`).

La verifica per riga (colonna "Stato") riusa `app.core.verifica_riga`
(§ "non deve essere creato un secondo sistema di verifica"); lo stato
amministrativo dell'unità (catalogo `cat_stati_unita_locale`) è un campo
dati distinto, disponibile solo nel form completo (§ punto 7).
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_riga import applica_decisione_verifica_riga, elimina_stato_verifica_riga, leggi_stato_verifica_riga
from app.models.anagrafica import (
    AnaContatto,
    AnaSede,
    AnaSedeAttivita,
    CatCodiceAteco2025,
    CatStatoUnitaLocale,
    CatTipologiaUnitaLocale,
    RelUnitaLocaleCodiceAteco,
    RelUnitaLocaleTipologia,
)
from app.schemas.unita_locali import (
    UnitaLocaleCreate,
    UnitaLocaleDetailRead,
    UnitaLocaleSummaryRead,
)

SEZIONE_CODICE_VERIFICA_UNITA_LOCALI = "ANAGRAFICA_AZIENDALE.UNITA_LOCALI_RIGHE"

# § commento in testa al modulo: unico valore usato da questa card per
# `ana_sedi.tipo_sede` (NOT NULL, testo libero) — non contiene mai "legale",
# quindi `_sede_legale_di` non può mai selezionare una riga creata qui.
TIPO_SEDE_UNITA_LOCALE = "Unità locale"


def _unita_owned_or_404(db: Session, unita_id: UUID, azienda_id: UUID) -> AnaSede:
    unita = db.get(AnaSede, unita_id)
    if unita is None or unita.azienda_id != azienda_id or "legale" in unita.tipo_sede.lower():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unità locale non trovata")
    return unita


def _stato_verifica(db: Session, azienda_id: UUID, unita_id: UUID) -> dict[str, Any]:
    return leggi_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_UNITA_LOCALI, unita_id)


def applica_decisione_verifica_unita_locale(
    db: Session,
    ctx: AziendaContext,
    unita_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    applica_decisione_verifica_riga(
        db,
        ctx,
        SEZIONE_CODICE_VERIFICA_UNITA_LOCALI,
        unita_id,
        decisione=decisione,
        nota=nota,
        expected_version=expected_version,
    )


# ===========================================================================
# Vista riepilogativa (tabella, § punto 2)
# ===========================================================================


def _indirizzo_label(unita: AnaSede) -> str | None:
    via = " ".join(p for p in [unita.toponimo, unita.indirizzo, unita.numero_civico] if p)
    localita = " ".join(p for p in [unita.cap, unita.comune] if p)
    localita = f"{localita} ({unita.provincia})" if localita and unita.provincia else localita
    parti = [p for p in [via, localita, unita.nazione] if p]
    return ", ".join(parti) if parti else None


def _riferimento_cciaa(unita: AnaSede) -> str | None:
    if unita.numero_unita_locale:
        return unita.numero_unita_locale
    if unita.sigla_territoriale and unita.numero_progressivo:
        return f"{unita.sigla_territoriale}/{unita.numero_progressivo}"
    return None


def _tipologia_label(db: Session, unita_id: UUID) -> str | None:
    """§ punto 4, ultimo comma: la tabella riepilogativa riunisce le
    tipologie collegate in un'unica descrizione — mai una colonna separata
    per tipologia."""
    tipologie = db.scalars(
        select(CatTipologiaUnitaLocale)
        .join(RelUnitaLocaleTipologia, RelUnitaLocaleTipologia.tipologia_id == CatTipologiaUnitaLocale.id)
        .where(RelUnitaLocaleTipologia.unita_locale_id == unita_id)
        .order_by(CatTipologiaUnitaLocale.ordine_visualizzazione)
    ).all()
    return ", ".join(t.denominazione for t in tipologie) if tipologie else None


def _attivita_principale_label(db: Session, unita_id: UUID) -> str | None:
    attivita = db.scalars(
        select(AnaSedeAttivita).where(
            AnaSedeAttivita.sede_id == unita_id, AnaSedeAttivita.attivita_principale.is_(True)
        )
    ).first()
    return attivita.descrizione_attivita if attivita is not None else None


def _ateco_label(db: Session, unita_id: UUID) -> str | None:
    """§ punto 6: il codice principale per primo, gli altri sintetizzati
    come indicatore aggiuntivo (mai una colonna per codice)."""
    righe = db.scalars(
        select(RelUnitaLocaleCodiceAteco)
        .where(RelUnitaLocaleCodiceAteco.unita_locale_id == unita_id)
        .order_by(RelUnitaLocaleCodiceAteco.principale.desc(), RelUnitaLocaleCodiceAteco.created_at)
    ).all()
    if not righe:
        return None
    principale = next((r for r in righe if r.principale), righe[0])
    codice = db.get(CatCodiceAteco2025, principale.codice_attivita_id)
    etichetta = codice.codice if codice is not None else None
    if etichetta is None:
        return None
    altri = len(righe) - 1
    return f"{etichetta} (+{altri})" if altri > 0 else etichetta


def _riga_riepilogo(db: Session, unita: AnaSede) -> UnitaLocaleSummaryRead:
    stato = _stato_verifica(db, unita.azienda_id, unita.id)
    return UnitaLocaleSummaryRead(
        id=unita.id,
        riferimento_cciaa=_riferimento_cciaa(unita),
        tipologia_label=_tipologia_label(db, unita.id),
        indirizzo_label=_indirizzo_label(unita),
        data_apertura=unita.data_apertura,
        attivita_principale_label=_attivita_principale_label(db, unita.id),
        ateco_label=_ateco_label(db, unita.id),
        data_chiusura=unita.data_chiusura,
        created_at=unita.created_at,
        updated_at=unita.updated_at,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def elenco_unita_locali(db: Session, azienda_id: UUID) -> list[UnitaLocaleSummaryRead]:
    unita = db.scalars(
        select(AnaSede)
        .where(AnaSede.azienda_id == azienda_id, ~AnaSede.tipo_sede.ilike("%legale%"))
        .order_by(AnaSede.created_at)
    ).all()
    return [_riga_riepilogo(db, u) for u in unita]


# ===========================================================================
# Dettaglio / form completo (§ punto 8)
# ===========================================================================


def dettaglio_unita_locale(db: Session, azienda_id: UUID, unita_id: UUID) -> UnitaLocaleDetailRead:
    unita = _unita_owned_or_404(db, unita_id, azienda_id)
    stato = _stato_verifica(db, azienda_id, unita.id)

    tipologie = db.scalars(
        select(CatTipologiaUnitaLocale)
        .join(RelUnitaLocaleTipologia, RelUnitaLocaleTipologia.tipologia_id == CatTipologiaUnitaLocale.id)
        .where(RelUnitaLocaleTipologia.unita_locale_id == unita.id)
        .order_by(CatTipologiaUnitaLocale.ordine_visualizzazione)
    ).all()
    attivita = db.scalars(
        select(AnaSedeAttivita).where(AnaSedeAttivita.sede_id == unita.id).order_by(AnaSedeAttivita.created_at)
    ).all()
    codici_ateco_righe = db.scalars(
        select(RelUnitaLocaleCodiceAteco)
        .where(RelUnitaLocaleCodiceAteco.unita_locale_id == unita.id)
        .order_by(RelUnitaLocaleCodiceAteco.principale.desc(), RelUnitaLocaleCodiceAteco.created_at)
    ).all()
    codici_ateco = [
        dict(
            id=r.id,
            codice_attivita_id=r.codice_attivita_id,
            codice_attivita=db.get(CatCodiceAteco2025, r.codice_attivita_id),
            principale=r.principale,
            data_inizio=r.data_inizio,
            data_fine=r.data_fine,
        )
        for r in codici_ateco_righe
    ]
    contatti = db.scalars(
        select(AnaContatto).where(AnaContatto.sede_id == unita.id).order_by(AnaContatto.created_at)
    ).all()

    return UnitaLocaleDetailRead(
        id=unita.id,
        azienda_id=unita.azienda_id,
        numero_unita_locale=unita.numero_unita_locale,
        denominazione_sede=unita.denominazione_sede,
        data_apertura=unita.data_apertura,
        data_chiusura=unita.data_chiusura,
        toponimo=unita.toponimo,
        indirizzo=unita.indirizzo,
        numero_civico=unita.numero_civico,
        cap=unita.cap,
        comune=unita.comune,
        provincia=unita.provincia,
        frazione=unita.frazione,
        nazione=unita.nazione,
        stato_unita_id=unita.stato_unita_id,
        stato_unita=db.get(CatStatoUnitaLocale, unita.stato_unita_id) if unita.stato_unita_id else None,
        note=unita.note,
        created_at=unita.created_at,
        updated_at=unita.updated_at,
        tipologie=tipologie,
        attivita=attivita,
        codici_ateco=codici_ateco,
        contatti=contatti,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


_CAMPI_RELAZIONE = {"tipologia_ids", "attivita", "codici_ateco", "contatti"}


def _normalizza_principale_unica(righe: list[Any], campo: str) -> list[Any]:
    """Al più un elemento con `campo=True` (§ punti 5/6, applicato anche lato
    applicazione oltre all'indice unico parziale del database, per non far
    emergere un errore di integrità grezzo se il form invia più righe
    marcate come principali): tiene la prima, azzera le altre."""
    vista_prima = False
    normalizzate = []
    for riga in righe:
        valore = getattr(riga, campo)
        if valore and not vista_prima:
            vista_prima = True
            normalizzate.append(riga)
        elif valore:
            normalizzate.append(riga.model_copy(update={campo: False}))
        else:
            normalizzate.append(riga)
    return normalizzate


def _sincronizza_tipologie(db: Session, unita_id: UUID, tipologia_ids: list[UUID]) -> None:
    db.query(RelUnitaLocaleTipologia).filter(RelUnitaLocaleTipologia.unita_locale_id == unita_id).delete()
    for tipologia_id in tipologia_ids:
        db.add(RelUnitaLocaleTipologia(unita_locale_id=unita_id, tipologia_id=tipologia_id))


def _sincronizza_attivita(db: Session, unita_id: UUID, attivita: list[Any]) -> None:
    db.query(AnaSedeAttivita).filter(AnaSedeAttivita.sede_id == unita_id).delete()
    for riga in _normalizza_principale_unica(attivita, "attivita_principale"):
        db.add(
            AnaSedeAttivita(
                sede_id=unita_id,
                descrizione_attivita=riga.descrizione_attivita,
                data_inizio=riga.data_inizio,
                data_fine=riga.data_fine,
                attivita_principale=riga.attivita_principale,
            )
        )


def _sincronizza_codici_ateco(db: Session, unita_id: UUID, codici: list[Any]) -> None:
    db.query(RelUnitaLocaleCodiceAteco).filter(RelUnitaLocaleCodiceAteco.unita_locale_id == unita_id).delete()
    for riga in _normalizza_principale_unica(codici, "principale"):
        db.add(
            RelUnitaLocaleCodiceAteco(
                unita_locale_id=unita_id,
                codice_attivita_id=riga.codice_attivita_id,
                principale=riga.principale,
                data_inizio=riga.data_inizio,
                data_fine=riga.data_fine,
            )
        )


def _sincronizza_contatti(db: Session, azienda_id: UUID, unita_id: UUID, contatti: list[Any]) -> None:
    db.query(AnaContatto).filter(AnaContatto.sede_id == unita_id).delete()
    for riga in contatti:
        db.add(
            AnaContatto(
                azienda_id=azienda_id,
                sede_id=unita_id,
                tipo_contatto=riga.tipo_contatto,
                valore=riga.valore,
                descrizione=riga.descrizione,
                principale=riga.principale,
            )
        )


def crea_unita_locale(db: Session, ctx: AziendaContext, payload: UnitaLocaleCreate) -> UnitaLocaleDetailRead:
    dump = payload.model_dump(exclude=_CAMPI_RELAZIONE)
    unita = AnaSede(azienda_id=ctx.azienda_id, tipo_sede=TIPO_SEDE_UNITA_LOCALE, **dump)
    db.add(unita)
    db.flush()

    _sincronizza_tipologie(db, unita.id, payload.tipologia_ids)
    _sincronizza_attivita(db, unita.id, payload.attivita)
    _sincronizza_codici_ateco(db, unita.id, payload.codici_ateco)
    _sincronizza_contatti(db, ctx.azienda_id, unita.id, payload.contatti)

    db.commit()
    return dettaglio_unita_locale(db, ctx.azienda_id, unita.id)


def aggiorna_unita_locale(
    db: Session, ctx: AziendaContext, unita_id: UUID, payload: UnitaLocaleCreate
) -> UnitaLocaleDetailRead:
    unita = _unita_owned_or_404(db, unita_id, ctx.azienda_id)
    dump = payload.model_dump(exclude=_CAMPI_RELAZIONE)
    for campo, valore in dump.items():
        setattr(unita, campo, valore)

    _sincronizza_tipologie(db, unita.id, payload.tipologia_ids)
    _sincronizza_attivita(db, unita.id, payload.attivita)
    _sincronizza_codici_ateco(db, unita.id, payload.codici_ateco)
    _sincronizza_contatti(db, ctx.azienda_id, unita.id, payload.contatti)

    db.commit()
    return dettaglio_unita_locale(db, ctx.azienda_id, unita.id)


def elimina_unita_locale(db: Session, azienda_id: UUID, unita_id: UUID) -> None:
    unita = _unita_owned_or_404(db, unita_id, azienda_id)
    db.delete(unita)  # tipologie/attività/codici ATECO/contatti seguono via ON DELETE CASCADE
    elimina_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_UNITA_LOCALI, unita_id)
    db.commit()
