"""Espone le sezioni (`sys_elementi.codice`) abilitate per l'azienda
corrente, così il frontend nasconde le sezioni non coperte da abbonamento
senza duplicare la logica di gating già applicata dal backend su ogni
endpoint (vedi `app/core/sezioni.py`). Speculare a `app/api/moduli.py`, ma a
grana più fine: qui non serve l'elenco completo del catalogo (le sezioni non
abilitate restano nascoste, non mostrate disattivate), basta l'insieme di
ciò che è visibile."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.sezioni import get_sezioni_abilitate
from app.database import get_db

router = APIRouter(prefix="/api/sezioni", tags=["Sezioni"])


@router.get("")
def elenco_sezioni_abilitate(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
) -> list[str]:
    return sorted(get_sezioni_abilitate(db, ctx.azienda_id))
