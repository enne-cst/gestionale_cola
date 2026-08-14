"""Motore di configurazione a grana fine per sezioni/campi soggetti ad
abbonamento (documento di progetto, cap. 4.1 punto 013 e 4.2.2/4.2.3).

Complementare a `app.core.moduli`, non sostitutivo: quel motore decide se un
intero modulo è visibile (es. Piano Formativo abilitato o no), questo motore
decide se una singola sezione interna a un modulo già visibile lo è (es.
Anagrafica Aziendale → Organizzazione → Turni di lavoro). Entrambi leggono le
certificazioni attive da `certificazioni_attive_ids`, l'unico punto che
definisce cosa conta come "abbonamento attivo" (niente logica duplicata,
doc. cap. 2.3.6-2.3.7).
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.database import get_db
from app.models.sistema import (
    CatStatoCertificazione,
    RelAziendaSettoreIAF,
    RelElementoCertificazione,
    RelElementoCertificazioneSettoreIAF,
    SysAziendaCertificazione,
    SysElemento,
)

# PROVA conta come abbonamento attivo tanto quanto ATTIVA (periodi di prova
# reali); SCADUTA e DISATTIVATA no.
STATI_CERTIFICAZIONE_ATTIVI = ("ATTIVA", "PROVA")


def certificazioni_attive_ids(db: Session, azienda_id: UUID) -> set[UUID]:
    """Certificazioni che sbloccano moduli e sezioni per l'azienda: stato
    ATTIVA o PROVA e non ancora scadute. Il controllo sulla data evita che un
    abbonamento scaduto ma non ancora transitato allo stato SCADUTA continui
    a dare accesso."""

    return set(
        db.scalars(
            select(SysAziendaCertificazione.certificazione_id)
            .join(CatStatoCertificazione, SysAziendaCertificazione.stato_id == CatStatoCertificazione.id)
            .where(
                SysAziendaCertificazione.azienda_id == azienda_id,
                CatStatoCertificazione.nome.in_(STATI_CERTIFICAZIONE_ATTIVI),
                SysAziendaCertificazione.data_scadenza >= func.current_date(),
            )
        )
    )


def get_sezioni_abilitate(db: Session, azienda_id: UUID) -> set[str]:
    """Codici `sys_elementi.codice` visibili per l'azienda: un elemento è
    abilitato se legato ad almeno una certificazione attiva (semantica OR:
    una sezione condivisa tra più abbonamenti basta che ne abbia uno attivo)
    e il settore IAF dell'azienda è compatibile."""

    certificazioni_ids = certificazioni_attive_ids(db, azienda_id)
    if not certificazioni_ids:
        return set()

    settori_ids = set(
        db.scalars(select(RelAziendaSettoreIAF.settore_iaf_id).where(RelAziendaSettoreIAF.azienda_id == azienda_id))
    )

    abilitati: set[str] = set(
        db.scalars(
            select(SysElemento.codice)
            .join(RelElementoCertificazione, RelElementoCertificazione.elemento_id == SysElemento.id)
            .where(
                RelElementoCertificazione.certificazione_id.in_(certificazioni_ids),
                RelElementoCertificazione.tutti_settori_iaf.is_(True),
            )
        )
    )

    if settori_ids:
        abilitati |= set(
            db.scalars(
                select(SysElemento.codice)
                .join(RelElementoCertificazione, RelElementoCertificazione.elemento_id == SysElemento.id)
                .join(
                    RelElementoCertificazioneSettoreIAF,
                    (RelElementoCertificazioneSettoreIAF.elemento_id == RelElementoCertificazione.elemento_id)
                    & (
                        RelElementoCertificazioneSettoreIAF.certificazione_id
                        == RelElementoCertificazione.certificazione_id
                    ),
                )
                .where(
                    RelElementoCertificazione.certificazione_id.in_(certificazioni_ids),
                    RelElementoCertificazione.tutti_settori_iaf.is_(False),
                    RelElementoCertificazioneSettoreIAF.settore_iaf_id.in_(settori_ids),
                )
            )
        )

    return abilitati


def require_sezione(codice: str):
    """Dependency FastAPI: 403 se la sezione (`sys_elementi.codice`) non è
    abilitata per l'azienda corrente — l'abbonamento ne determina davvero la
    raggiungibilità, non solo la visibilità in interfaccia. Va applicata in
    aggiunta a `require_modulo`, non al suo posto: una sezione appartiene
    sempre a un modulo che deve comunque essere abilitato."""

    def _dependency(
        db: Session = Depends(get_db),
        ctx: AziendaContext = Depends(get_current_azienda),
    ) -> None:
        if codice not in get_sezioni_abilitate(db, ctx.azienda_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"La sezione '{codice}' non è abilitata per questa azienda.",
            )

    return _dependency
