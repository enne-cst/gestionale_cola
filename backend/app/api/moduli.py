"""Espone i moduli abilitati per l'azienda corrente, così il frontend può
mostrare/nascondere le sezioni in base all'abbonamento (pacchetti attivi)
senza duplicare la logica di gating già applicata dal backend su ogni
endpoint (vedi app/core/moduli.py)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import get_moduli_abilitati
from app.database import get_db
from app.models.sistema import CatModulo

router = APIRouter(prefix="/api/moduli", tags=["Moduli"])


@router.get("")
def elenco_moduli(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
) -> list[dict]:
    abilitati = get_moduli_abilitati(db, ctx.azienda_id)
    tutti = db.scalars(select(CatModulo).where(CatModulo.attiva.is_(True)).order_by(CatModulo.nome)).all()
    return [
        {"nome": m.nome, "base": m.base, "abilitato": m.nome in abilitati}
        for m in tutti
    ]
