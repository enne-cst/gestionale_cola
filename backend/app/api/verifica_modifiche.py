"""Flusso di verifica e presa visione delle modifiche: apertura (prima
visualizzazione), presa visione (conferma esplicita), approvazione e
richiesta di revisione. Riservato al profilo CONSULENTE (vedi
`app.core.verifica_modifiche.require_consulente_azienda`).

Nessuna entità applicativa è agganciata a questo meccanismo in questo
intervento: questi endpoint operano solo sulle righe già esistenti in
`sys_presa_visione_modifiche` (create da `apri_o_riapri_verifica`, il punto
di integrazione riservato ai moduli che in futuro vorranno sottoporre un
proprio record a verifica)."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext
from app.core.verifica_modifiche import (
    STATO_APPROVATO,
    STATO_IN_REVISIONE,
    get_owned_or_404,
    require_consulente_azienda,
)
from app.database import get_db
from app.models.sistema import SysPresaVisioneModifiche
from app.schemas.verifica_modifiche import RichiediRevisioneRequest, VerificaModificaRead

router = APIRouter(prefix="/api/verifica-modifiche", tags=["Verifica modifiche"])


@router.get("", response_model=list[VerificaModificaRead])
def elenco_verifiche(
    stato_verifica_codice: str | None = None,
    entita: str | None = None,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_azienda),
):
    stmt = select(SysPresaVisioneModifiche).where(
        SysPresaVisioneModifiche.azienda_id == ctx.azienda_id,
        SysPresaVisioneModifiche.utente_id == ctx.utente_id,
    )
    if stato_verifica_codice is not None:
        stmt = stmt.where(SysPresaVisioneModifiche.stato_verifica_codice == stato_verifica_codice)
    if entita is not None:
        stmt = stmt.where(SysPresaVisioneModifiche.entita == entita)
    stmt = stmt.order_by(SysPresaVisioneModifiche.modifica_rilevata_at.desc())
    return db.scalars(stmt).all()


@router.get("/{verifica_id}", response_model=VerificaModificaRead)
def apri_verifica(
    verifica_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_azienda),
):
    """Prima apertura da parte del consulente: valorizza `modifica_vista_at`
    solo se non è già impostato (le aperture successive non lo modificano,
    §6.4 della specifica)."""

    riga = get_owned_or_404(db, ctx, verifica_id)
    if riga.modifica_vista_at is None:
        riga.modifica_vista_at = func.now()
        db.commit()
        db.refresh(riga)
    return riga


@router.post("/{verifica_id}/presa-visione", response_model=VerificaModificaRead)
def conferma_presa_visione(
    verifica_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_azienda),
):
    riga = get_owned_or_404(db, ctx, verifica_id)
    riga.presa_visione_at = func.now()
    db.commit()
    db.refresh(riga)
    return riga


@router.post("/{verifica_id}/approva", response_model=VerificaModificaRead)
def approva_verifica(
    verifica_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_azienda),
):
    riga = get_owned_or_404(db, ctx, verifica_id)
    riga.stato_verifica_codice = STATO_APPROVATO
    riga.nota_verifica = None
    riga.stato_verifica_at = func.now()
    db.commit()
    db.refresh(riga)
    return riga


@router.post("/{verifica_id}/richiedi-revisione", response_model=VerificaModificaRead)
def richiedi_revisione(
    verifica_id: UUID,
    payload: RichiediRevisioneRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_azienda),
):
    riga = get_owned_or_404(db, ctx, verifica_id)
    riga.stato_verifica_codice = STATO_IN_REVISIONE
    riga.nota_verifica = payload.nota_verifica
    riga.stato_verifica_at = func.now()
    db.commit()
    db.refresh(riga)
    return riga
