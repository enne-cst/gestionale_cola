"""Riepilogo "Personale e occupazione" (Correzione 22).

La sezione conserva volutamente uno storico di rilevazioni (§9.1 della
mappatura funzionale: "snapshot storici"), a differenza delle altre card
CCIAA che rappresentano un unico stato corrente — per questo non ha mai
avuto un banner di conferma "a sezione" come Soci/Amministratori/Attività
economica. Per la Correzione 22 l'utente ha scelto esplicitamente di
applicare il comportamento di conferma/verifica e la presentazione a card
grafiche solo alla rilevazione più recente, lasciando lo storico precedente
come semplice elenco invariato (vedi memoria di sessione
"correzione22-personale-occupazione").

Questo modulo non introduce una tabella o un form paralleli: legge le
stesse `ana_addetti_visura`/`_periodi` e `ana_addetti_comune`/`_periodi` già
scritte dai dialog esistenti, e riusa `app.core.verifica_riga` (§ "non deve
essere creato un secondo sistema di verifica", Correzione 20) per la
conferma, con `campo_codice` = id della rilevazione più recente.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_riga import applica_decisione_verifica_riga, leggi_stato_verifica_riga
from app.models.anagrafica import AnaAddettiComune, AnaAddettiComunePeriodo, AnaAddettiVisura, AnaAddettiVisuraPeriodo
from app.models.sistema import SysRegistroStatoCampi
from app.schemas.personale_occupazione import DatiTerritorialiRead, GruppoCalcolatoRead, PersonaleOccupazioneRiepilogoRead

SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE = "ANAGRAFICA_AZIENDALE.PERSONALE_OCCUPAZIONE"

# Tolleranza sulla somma delle percentuali di un gruppo esaustivo (§ punto
# 13: "le percentuali della visura possono essere già arrotondate"): entro
# questa soglia la somma diversa da 100 è un arrotondamento della fonte da
# riconciliare col metodo dei maggiori resti; oltre, è un'incoerenza vera
# (§ punto 14) da segnalare senza calcolare numeri.
_TOLLERANZA_SOMMA_PERCENTUALI = Decimal("1.0")


def _maggiori_resti(percentuali: list[Decimal], totale: int) -> list[int]:
    """Metodo dei maggiori resti (§ punto 13): parte intera per troncamento,
    poi il resto (positivo o negativo, per tollerare somme non esattamente
    a 100) assegnato/tolto in ordine di parte decimale — a parità vince
    l'ordine di `percentuali`, stabile e mai casuale tra due caricamenti."""
    quote = [p * totale / Decimal(100) for p in percentuali]
    interi = [int(q) for q in quote]
    resto = totale - sum(interi)
    scarti = [q - i for q, i in zip(quote, interi)]
    if resto > 0:
        for i in sorted(range(len(percentuali)), key=lambda i: scarti[i], reverse=True)[:resto]:
            interi[i] += 1
    elif resto < 0:
        for i in sorted(range(len(percentuali)), key=lambda i: scarti[i])[:-resto]:
            interi[i] -= 1
    return interi


def _gruppo_calcolato(
    chiavi: list[str], percentuali_raw: list[Decimal | None], dipendenti: int | None
) -> GruppoCalcolatoRead:
    percentuali = dict(zip(chiavi, percentuali_raw))
    completo = dipendenti is not None and dipendenti >= 0 and all(p is not None for p in percentuali_raw)
    if not completo:
        return GruppoCalcolatoRead(
            completo=False,
            coerente=False,
            messaggio="Dati incompleti: mancano il numero dei dipendenti o una delle percentuali del gruppo.",
            percentuali=percentuali,
            numeri={k: None for k in chiavi},
        )
    somma = sum(percentuali_raw)  # type: ignore[arg-type]
    coerente = abs(somma - Decimal(100)) <= _TOLLERANZA_SOMMA_PERCENTUALI
    if not coerente:
        return GruppoCalcolatoRead(
            completo=True,
            coerente=False,
            messaggio=f"Le percentuali del gruppo sommano a {somma}%, non a 100%: verificare i valori estratti.",
            percentuali=percentuali,
            numeri={k: None for k in chiavi},
        )
    numeri = _maggiori_resti(percentuali_raw, dipendenti)  # type: ignore[arg-type]
    return GruppoCalcolatoRead(
        completo=True, coerente=True, messaggio=None, percentuali=percentuali, numeri=dict(zip(chiavi, numeri))
    )


def _percentuale_derivata(parte: int | None, base: int | None) -> Decimal | None:
    if parte is None or base is None or base <= 0:
        return None
    return (Decimal(parte) * Decimal(100) / Decimal(base)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def _rilevazione_piu_recente(db: Session, azienda_id: UUID) -> AnaAddettiVisura | None:
    return db.scalars(
        select(AnaAddettiVisura)
        .where(AnaAddettiVisura.azienda_id == azienda_id)
        .order_by(
            AnaAddettiVisura.anno_riferimento.desc().nulls_last(),
            AnaAddettiVisura.data_rilevazione.desc().nulls_last(),
            AnaAddettiVisura.created_at.desc(),
        )
    ).first()


def _periodo_piu_recente(db: Session, rilevazione_id: UUID) -> AnaAddettiVisuraPeriodo | None:
    return db.scalars(
        select(AnaAddettiVisuraPeriodo)
        .where(AnaAddettiVisuraPeriodo.rilevazione_addetti_id == rilevazione_id)
        .order_by(AnaAddettiVisuraPeriodo.updated_at.desc())
    ).first()


def _comune_collegato(db: Session, azienda_id: UUID, rilevazione_id: UUID | None) -> AnaAddettiComune | None:
    if rilevazione_id is not None:
        collegato = db.scalars(
            select(AnaAddettiComune)
            .where(
                AnaAddettiComune.azienda_id == azienda_id,
                AnaAddettiComune.rilevazione_addetti_id == rilevazione_id,
            )
            .order_by(AnaAddettiComune.updated_at.desc())
        ).first()
        if collegato is not None:
            return collegato
    return db.scalars(
        select(AnaAddettiComune)
        .where(AnaAddettiComune.azienda_id == azienda_id)
        .order_by(AnaAddettiComune.updated_at.desc())
    ).first()


def _periodo_comune_piu_recente(db: Session, addetti_comune_id: UUID) -> AnaAddettiComunePeriodo | None:
    return db.scalars(
        select(AnaAddettiComunePeriodo)
        .where(AnaAddettiComunePeriodo.addetti_comune_id == addetti_comune_id)
        .order_by(AnaAddettiComunePeriodo.updated_at.desc())
    ).first()


def _stato_riga_raw(db: Session, azienda_id: UUID, rilevazione_id: UUID) -> SysRegistroStatoCampi | None:
    return db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE,
            SysRegistroStatoCampi.campo_codice == str(rilevazione_id),
        )
    ).first()


def riepilogo_personale_occupazione(db: Session, azienda_id: UUID) -> PersonaleOccupazioneRiepilogoRead:
    rilevazione = _rilevazione_piu_recente(db, azienda_id)
    periodo = _periodo_piu_recente(db, rilevazione.id) if rilevazione is not None else None
    comune = _comune_collegato(db, azienda_id, rilevazione.id if rilevazione is not None else None)
    periodo_comune = _periodo_comune_piu_recente(db, comune.id) if comune is not None else None

    dipendenti = periodo.numero_dipendenti if periodo is not None else None

    tipologia_contrattuale = _gruppo_calcolato(
        ["tempo_determinato", "tempo_indeterminato"],
        [
            periodo.percentuale_tempo_determinato if periodo else None,
            periodo.percentuale_tempo_indeterminato if periodo else None,
        ],
        dipendenti,
    )
    orario_lavoro = _gruppo_calcolato(
        ["tempo_pieno", "tempo_parziale"],
        [periodo.percentuale_tempo_pieno if periodo else None, periodo.percentuale_tempo_parziale if periodo else None],
        dipendenti,
    )
    inquadramento = _gruppo_calcolato(
        ["apprendisti", "operai", "impiegati"],
        [
            periodo.percentuale_apprendisti if periodo else None,
            periodo.percentuale_operai if periodo else None,
            periodo.percentuale_impiegati if periodo else None,
        ],
        dipendenti,
    )

    addetti_totali_comune = periodo_comune.numero_totale_addetti if periodo_comune else None
    territorio = DatiTerritorialiRead(
        comune=comune.comune if comune else None,
        provincia=comune.provincia if comune else None,
        dipendenti_nel_comune=periodo_comune.numero_dipendenti if periodo_comune else None,
        indipendenti_nel_comune=periodo_comune.numero_indipendenti if periodo_comune else None,
        addetti_totali_nel_comune=addetti_totali_comune,
        percentuale_dipendenti_nel_comune=_percentuale_derivata(
            periodo_comune.numero_dipendenti if periodo_comune else None, addetti_totali_comune
        ),
        percentuale_indipendenti_nel_comune=_percentuale_derivata(
            periodo_comune.numero_indipendenti if periodo_comune else None, addetti_totali_comune
        ),
    )

    stato: dict[str, Any] = {"status": None, "version": None, "note": None, "verified_at": None, "verified_by": None}
    if rilevazione is not None:
        stato = leggi_stato_verifica_riga(db, azienda_id, SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE, rilevazione.id)
        # § punto 21: una modifica successiva ai dati di origine invalida una
        # conferma precedente ("la precedente conferma non deve rimanere
        # valida"). Confrontare gli `updated_at` con la data di verifica
        # copre qualunque modifica (percentuali, dipendenti, fonte...) senza
        # dover intercettare ogni singolo endpoint di scrittura esistente.
        stato_riga = _stato_riga_raw(db, azienda_id, rilevazione.id)
        if stato["status"] == "VERIFIED" and stato_riga is not None and stato_riga.verificato_at is not None:
            fonti_aggiornate = [t for t in [rilevazione.updated_at, periodo.updated_at if periodo else None] if t is not None]
            if any(t > stato_riga.verificato_at for t in fonti_aggiornate):
                stato = {**stato, "status": "PENDING_VERIFICATION"}

    return PersonaleOccupazioneRiepilogoRead(
        rilevazione_id=rilevazione.id if rilevazione else None,
        periodo_id=periodo.id if periodo else None,
        fonte=rilevazione.fonte if rilevazione else None,
        anno_riferimento=rilevazione.anno_riferimento if rilevazione else None,
        periodo=periodo.periodo if periodo else None,
        data_rilevazione=rilevazione.data_rilevazione if rilevazione else None,
        addetti_totali=periodo.numero_totale_addetti if periodo else None,
        dipendenti=dipendenti,
        indipendenti=periodo.numero_indipendenti if periodo else None,
        collaboratori=periodo.numero_collaboratori if periodo else None,
        tipologia_contrattuale=tipologia_contrattuale,
        orario_lavoro=orario_lavoro,
        inquadramento=inquadramento,
        territorio=territorio,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def applica_decisione_verifica_personale_occupazione(
    db: Session,
    ctx: AziendaContext,
    rilevazione_id: UUID,
    *,
    decisione: str,
    nota: str | None,
    expected_version: int | None,
) -> None:
    applica_decisione_verifica_riga(
        db,
        ctx,
        SEZIONE_CODICE_VERIFICA_PERSONALE_OCCUPAZIONE,
        rilevazione_id,
        decisione=decisione,
        nota=nota,
        expected_version=expected_version,
    )
