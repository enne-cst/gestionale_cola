"""Router della scheda "Monitoraggio personale" (§ app/core/personale_
monitoraggio.py per l'architettura). Prefisso condiviso `/api/personale`
(stesso pattern di `app.api.personale_hr`/`app.api.personale_occupazione`:
più router sullo stesso prefisso, percorsi distinti):

- `/monitoraggio/riepilogo`   sei indicatori + conformità complessiva
- `/monitoraggio/matrice`     quadro generale del personale, paginato

Gating: `require_modulo("Personale")`, stesso modulo di `personale_hr`.
Sola lettura: nessun endpoint di scrittura, la scheda non possiede dati
propri.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.personale_monitoraggio import matrice_monitoraggio, riepilogo_monitoraggio
from app.database import get_db
from app.schemas.personale_monitoraggio import PaginaMonitoraggioRead, RiepilogoMonitoraggioRead

MODULO = "Personale"
TAGS = ["Personale"]

router = APIRouter(prefix="/api/personale/monitoraggio")

_modulo_dep = require_modulo(MODULO)


@router.get("/riepilogo", response_model=RiepilogoMonitoraggioRead, tags=TAGS)
def get_riepilogo_monitoraggio(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return riepilogo_monitoraggio(db, ctx.azienda_id)


@router.get("/matrice", response_model=PaginaMonitoraggioRead, tags=TAGS)
def get_matrice_monitoraggio(
    q: str | None = None,
    reparto_id: UUID | None = None,
    mansione_id: UUID | None = None,
    stato_complessivo: str | None = None,
    stato_cella: str | None = None,
    solo_anomalie: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return matrice_monitoraggio(
        db,
        ctx.azienda_id,
        q=q,
        reparto_id=reparto_id,
        mansione_id=mansione_id,
        stato_complessivo=stato_complessivo,
        stato_cella=stato_cella,
        solo_anomalie=solo_anomalie,
        page=page,
        page_size=page_size,
    )
