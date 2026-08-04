"""Endpoint di sistema trasversali ai moduli applicativi (non legati a una
singola area funzionale come Anagrafica o Personale)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.database import get_db
from app.models.sistema import SysAzienda

router = APIRouter(prefix="/api/sistema", tags=["Sistema"])


class AziendaCorrenteRead(BaseModel):
    id: str
    ragione_sociale: str


@router.get("/azienda-corrente", response_model=AziendaCorrenteRead)
def azienda_corrente(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    azienda = db.get(SysAzienda, ctx.azienda_id)
    return AziendaCorrenteRead(id=str(azienda.id), ragione_sociale=azienda.ragione_sociale)
