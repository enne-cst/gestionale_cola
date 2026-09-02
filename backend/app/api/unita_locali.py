"""Router della tabella "Sedi secondarie e unità locali" (Correzione 23,
card omonima dell'Anagrafica Aziendale)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.registro_campi import require_consulente_ctx
from app.core.unita_locali import (
    aggiorna_unita_locale,
    applica_decisione_verifica_unita_locale,
    crea_unita_locale,
    dettaglio_unita_locale,
    elenco_unita_locali,
    elimina_unita_locale,
)
from app.database import Base, get_db
from app.models.anagrafica import CatCodiceAteco2025, CatStatoUnitaLocale, CatTipologiaUnitaLocale
from app.schemas.anagrafica_iso9001 import CatalogoRead
from app.schemas.registro_campi import ReviewDecisionRequest
from app.schemas.unita_locali import UnitaLocaleCreate, UnitaLocaleDetailRead, UnitaLocaleSummaryRead

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]

router = APIRouter(prefix="/api/anagrafica/unita-locali")

_modulo_dep = require_modulo(MODULO)

# "codici-ateco" riusa lo stesso catalogo versionato cat_codici_ateco_2025
# della Correzione 19 (§ punto 6: "utilizzare il catalogo versionato dei
# codici di attività economica"), oggi vuoto — nessun catalogo duplicato.
_CATALOGHI_UNITA_LOCALI: dict[str, type[Base]] = {
    "tipologie": CatTipologiaUnitaLocale,
    "stati": CatStatoUnitaLocale,
    "codici-ateco": CatCodiceAteco2025,
}


@router.get("/cataloghi/{nome}", response_model=list[CatalogoRead], tags=TAGS)
def elenco_catalogo_unita_locale(
    nome: str,
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    modello = _CATALOGHI_UNITA_LOCALI.get(nome)
    if modello is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catalogo non trovato")
    return db.scalars(
        select(modello).where(modello.attivo.is_(True)).order_by(modello.ordine_visualizzazione)
    ).all()


@router.get("", response_model=list[UnitaLocaleSummaryRead], tags=TAGS)
def list_unita_locali(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return elenco_unita_locali(db, ctx.azienda_id)


@router.get("/{unita_id}", response_model=UnitaLocaleDetailRead, tags=TAGS)
def get_unita_locale(
    unita_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return dettaglio_unita_locale(db, ctx.azienda_id, unita_id)


@router.post("", response_model=UnitaLocaleDetailRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def create_unita_locale(
    payload: UnitaLocaleCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_unita_locale(db, ctx, payload)


@router.put("/{unita_id}", response_model=UnitaLocaleDetailRead, tags=TAGS)
def update_unita_locale(
    unita_id: UUID,
    payload: UnitaLocaleCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return aggiorna_unita_locale(db, ctx, unita_id, payload)


@router.post("/{unita_id}/review", response_model=UnitaLocaleDetailRead, tags=TAGS)
def review_unita_locale(
    unita_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sulla riga (§ commento in
    app/core/verifica_riga.py): stesso trattamento della verifica per campo
    del registro, qui applicato a un'intera unità locale."""
    applica_decisione_verifica_unita_locale(
        db,
        ctx,
        unita_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    return dettaglio_unita_locale(db, ctx.azienda_id, unita_id)


@router.delete("/{unita_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_unita_locale(
    unita_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    elimina_unita_locale(db, ctx.azienda_id, unita_id)
