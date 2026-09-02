"""Router della card "Aggiornamento impresa" (Correzione 24, Anagrafica
Aziendale): indicatori derivati + cronologia in sola lettura, nessun
endpoint di scrittura sulle tabelle sorgente (§ "solo infrastruttura")."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.aggiornamento_impresa import (
    applica_decisione_verifica_evento,
    calcola_indicatori,
    dettaglio_evento,
    elenco_cronologia,
)
from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.registro_campi import require_consulente_ctx
from app.database import get_db
from app.schemas.aggiornamento_impresa import (
    CronologiaEventoDettaglio,
    CronologiaEventoRead,
    IndicatoriAggiornamentoImpresa,
)
from app.schemas.registro_campi import ReviewDecisionRequest

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]

router = APIRouter(prefix="/api/anagrafica/aggiornamento-impresa")

_modulo_dep = require_modulo(MODULO)


@router.get("/indicatori", response_model=IndicatoriAggiornamentoImpresa, tags=TAGS)
def get_indicatori(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return calcola_indicatori(db, ctx.azienda_id)


@router.get("/cronologia", response_model=list[CronologiaEventoRead], tags=TAGS)
def list_cronologia(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return elenco_cronologia(db, ctx.azienda_id)


@router.get("/cronologia/{evento_id}", response_model=CronologiaEventoDettaglio, tags=TAGS)
def get_evento(
    evento_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return dettaglio_evento(db, ctx.azienda_id, evento_id)


@router.post("/cronologia/{evento_id}/review", response_model=CronologiaEventoDettaglio, tags=TAGS)
def review_evento(
    evento_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sull'evento (§ commento in
    app/core/verifica_riga.py): stesso trattamento della verifica per riga
    già in uso altrove, qui applicato a un evento della cronologia."""
    applica_decisione_verifica_evento(
        db,
        ctx,
        evento_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    return dettaglio_evento(db, ctx.azienda_id, evento_id)
