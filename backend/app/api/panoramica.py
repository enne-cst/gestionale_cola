"""Configurazione della scheda Panoramica: quali campi (per le sezioni
"singleton") o quali record interi (per le sezioni a elenco) il consulente
ha scelto di tenere sott'occhio in un unico posto.

Router scritto a mano (non con la fabbrica generica in app.crud.generic)
perché la semantica non è il solito CRUD azienda-scoped: la POST è
idempotente (fissare due volte la stessa voce non crea duplicati, ritorna
solo quella già esistente) e la DELETE identifica la voce da rimuovere per
chiave naturale (modulo, sezione, campo o record_id), non per id — il
frontend che mostra l'icona a fianco di un campo o di una riga conosce
quella chiave, non l'id del record di configurazione.

Non è legato a un modulo specifico: `modulo` è un parametro, non una
costante, così lo stesso meccanismo funziona per qualunque modulo futuro
senza modifiche a questo file.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.database import get_db
from app.models.panoramica import PanoramicaVoce
from app.schemas.panoramica import PanoramicaOrdineUpdate, PanoramicaVoceCreate, PanoramicaVoceRead

router = APIRouter(prefix="/api/panoramica", tags=["Panoramica"])


@router.get("", response_model=list[PanoramicaVoceRead])
def elenco_voci(
    modulo: str,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    stmt = (
        select(PanoramicaVoce)
        .where(PanoramicaVoce.azienda_id == ctx.azienda_id, PanoramicaVoce.modulo == modulo)
        .order_by(PanoramicaVoce.ordine, PanoramicaVoce.created_at)
    )
    return db.scalars(stmt).all()


@router.post("", response_model=PanoramicaVoceRead, status_code=status.HTTP_201_CREATED)
def fissa_voce(
    payload: PanoramicaVoceCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    stmt = select(PanoramicaVoce).where(
        PanoramicaVoce.azienda_id == ctx.azienda_id,
        PanoramicaVoce.modulo == payload.modulo,
        PanoramicaVoce.sezione_slug == payload.sezione_slug,
        PanoramicaVoce.campo == payload.campo,
        PanoramicaVoce.record_id == payload.record_id,
    )
    esistente = db.scalars(stmt).first()
    if esistente is not None:
        return esistente

    conteggio = db.scalar(
        select(func.count())
        .select_from(PanoramicaVoce)
        .where(PanoramicaVoce.azienda_id == ctx.azienda_id, PanoramicaVoce.modulo == payload.modulo)
    )
    voce = PanoramicaVoce(azienda_id=ctx.azienda_id, ordine=conteggio, **payload.model_dump())
    db.add(voce)
    db.commit()
    db.refresh(voce)
    return voce


@router.put("/ordine", status_code=status.HTTP_204_NO_CONTENT)
def riordina_voci(
    payload: PanoramicaOrdineUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    stmt = select(PanoramicaVoce).where(
        PanoramicaVoce.azienda_id == ctx.azienda_id,
        PanoramicaVoce.modulo == payload.modulo,
        PanoramicaVoce.id.in_(payload.ids),
    )
    voci_per_id = {voce.id: voce for voce in db.scalars(stmt)}
    for posizione, voce_id in enumerate(payload.ids):
        voce = voci_per_id.get(voce_id)
        if voce is not None:
            voce.ordine = posizione
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def rimuovi_voce(
    modulo: str,
    sezione_slug: str,
    campo: str | None = None,
    record_id: UUID | None = None,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
):
    if (campo is None) == (record_id is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Indicare esattamente uno tra 'campo' e 'record_id'",
        )

    stmt = select(PanoramicaVoce).where(
        PanoramicaVoce.azienda_id == ctx.azienda_id,
        PanoramicaVoce.modulo == modulo,
        PanoramicaVoce.sezione_slug == sezione_slug,
        PanoramicaVoce.campo == campo,
        PanoramicaVoce.record_id == record_id,
    )
    voce = db.scalars(stmt).first()
    if voce is not None:
        db.delete(voce)
        db.commit()
