"""Router del riepilogo "Personale e occupazione" (Correzione 22): vista
calcolata a sola lettura sopra `ana_addetti_visura*`/`ana_addetti_comune*` +
conferma della rilevazione più recente (§ app/core/personale_occupazione.py
per l'architettura scelta). Le operazioni di scrittura sui dati restano sui
router generici già esistenti (`/api/anagrafica/addetti-visura`,
`/api/anagrafica/addetti-comune`, in app/api/anagrafica.py)."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.personale_occupazione import (
    applica_decisione_verifica_personale_occupazione,
    riepilogo_personale_occupazione,
)
from app.core.registro_campi import require_consulente_ctx
from app.database import get_db
from app.schemas.personale_occupazione import PersonaleOccupazioneRiepilogoRead
from app.schemas.registro_campi import ReviewDecisionRequest

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]

router = APIRouter(prefix="/api/anagrafica/personale-occupazione")

_modulo_dep = require_modulo(MODULO)


@router.get("/riepilogo", response_model=PersonaleOccupazioneRiepilogoRead, tags=TAGS)
def get_riepilogo(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return riepilogo_personale_occupazione(db, ctx.azienda_id)


@router.post("/{rilevazione_id}/review", response_model=PersonaleOccupazioneRiepilogoRead, tags=TAGS)
def review_rilevazione(
    rilevazione_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sulla rilevazione più recente (§ commento in
    app/core/verifica_riga.py): stesso trattamento della verifica per riga
    già usato da Soci/Amministratori/Titoli abilitativi."""
    applica_decisione_verifica_personale_occupazione(
        db,
        ctx,
        rilevazione_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    return riepilogo_personale_occupazione(db, ctx.azienda_id)
