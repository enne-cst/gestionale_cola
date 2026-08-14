"""API del "registro campo-per-campo" per la sezione Informazioni societarie
(pilota, vedi `app.core.registro_campi`): lettura/scrittura a batch con
concorrenza ottimistica, visibilità e verifica per singolo campo, KPI di
qualità e ultime modifiche per la Panoramica.

Prefisso separato da `/api/anagrafica` (le altre sotto-risorse del modulo,
`app/api/anagrafica.py`) perché il contratto è deliberatamente diverso
(sezione a gruppi/campi invece di record piatti, §15 della specifica)."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.registro_campi import (
    applica_decisione_verifica,
    applica_modifiche_sezione,
    applica_visibilita,
    costruisci_sezione,
    require_consulente_ctx,
    ultime_modifiche,
    valida_campo,
    valuta_qualita,
)
from app.database import get_db
from app.models.anagrafica import AnaIdentificazioneCamerale
from app.schemas.registro_campi import (
    OverviewRead,
    ReviewDecisionRequest,
    SectionRead,
    SectionUpdateRequest,
    VisibilityUpdateRequest,
)

MODULO = "Anagrafica Aziendale"
_modulo_dep = require_modulo(MODULO)

router = APIRouter(prefix="/api/anagrafica/registro", tags=["Anagrafica Aziendale - Registro"])

# Un solo section_key nel pilota: la validazione qui sotto tiene comunque il
# 404 pronto per quando altre sezioni adotteranno lo stesso registro, invece
# di lasciar passare silenziosamente una chiave sconosciuta.
_SEZIONI_SUPPORTATE = {"informazioni-societarie"}


def _richiedi_sezione_nota(section_key: str) -> None:
    if section_key not in _SEZIONI_SUPPORTATE:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sezione non trovata")


def _carica_record(db: Session, ctx: AziendaContext) -> AnaIdentificazioneCamerale | None:
    return db.scalars(
        select(AnaIdentificazioneCamerale).where(AnaIdentificazioneCamerale.azienda_id == ctx.azienda_id)
    ).first()


@router.get("/overview", response_model=OverviewRead)
def leggi_overview(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    quality = valuta_qualita(db, ctx.azienda_id) if ctx.profilo == "CONSULENTE" else None
    return OverviewRead(quality=quality, recentChanges=ultime_modifiche(db, ctx.azienda_id))


@router.get("/sections/{section_key}", response_model=SectionRead)
def leggi_sezione(
    section_key: str,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    _richiedi_sezione_nota(section_key)
    row = _carica_record(db, ctx)
    return costruisci_sezione(db, ctx, row=row)


@router.patch("/sections/{section_key}", response_model=SectionRead)
def salva_sezione(
    section_key: str,
    payload: SectionUpdateRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
    if_match: str | None = Header(default=None, alias="If-Match"),
):
    _richiedi_sezione_nota(section_key)
    row = _carica_record(db, ctx)

    # Concorrenza ottimistica (§15.6): la sezione appena creata (row is None,
    # nessuna versione ancora esistita) non ha nulla con cui confrontarsi, in
    # ogni altro caso un If-Match assente o divergente e' un conflitto.
    if row is not None:
        if if_match is None or if_match != row.updated_at.isoformat():
            raise HTTPException(status.HTTP_409_CONFLICT, "I dati sono stati modificati nel frattempo: ricaricare la sezione")
    elif if_match is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "I dati sono stati modificati nel frattempo: ricaricare la sezione")

    errori = {campo: msg for campo, msg in ((c, valida_campo(c, v)) for c, v in payload.fields.items()) if msg}
    if errori:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": ["fields", campo], "msg": msg} for campo, msg in errori.items()],
        )

    if row is None:
        row = AnaIdentificazioneCamerale(azienda_id=ctx.azienda_id)
        db.add(row)
        db.flush()

    applica_modifiche_sezione(db, ctx, row=row, cambiamenti=payload.fields)
    db.commit()
    db.refresh(row)
    return costruisci_sezione(db, ctx, row=row)


@router.patch("/sections/{section_key}/fields/{field_key}/visibility", response_model=SectionRead)
def imposta_visibilita_campo(
    section_key: str,
    field_key: str,
    payload: VisibilityUpdateRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    _richiedi_sezione_nota(section_key)
    row = _carica_record(db, ctx)
    # Nessun guard "sezione non compilata": la visibilità è una
    # configurazione autonoma (§13.3) e deve poter nascondere anche un campo
    # ancora vuoto o derivato da un'altra tabella (es. "Sede legale"), come
    # negli esempi della fixture canonica della specifica (§52, taxCode
    # nascosto e vuoto).

    applica_visibilita(db, ctx, row=row, campo=field_key, visibile=payload.visibleToCompany)
    db.commit()
    return costruisci_sezione(db, ctx, row=row)


@router.post("/sections/{section_key}/fields/{field_key}/review", response_model=SectionRead)
def decidi_verifica_campo(
    section_key: str,
    field_key: str,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    _richiedi_sezione_nota(section_key)
    row = _carica_record(db, ctx)
    # Nessun guard "sezione non compilata": se il campo è vuoto (inclusa una
    # sezione mai salvata) `applica_decisione_verifica` risponde già 409
    # "campo vuoto", coerente con §7.3 (solo un valore compilato è
    # verificabile) senza un 404 fuorviante prima ancora di controllarlo.

    applica_decisione_verifica(
        db,
        ctx,
        row=row,
        campo=field_key,
        decisione=payload.decision,
        nota=payload.note,
        expected_field_version=payload.expectedFieldVersion,
    )
    db.commit()
    return costruisci_sezione(db, ctx, row=row)
