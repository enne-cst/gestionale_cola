"""Router del vero modulo Personale (Fase 1 — Fondazioni: §9-§12 della
specifica). Distinto da `app.api.personale` (motore CCIAA ruolo+
caratteristiche, resta invariato) — condivide il prefisso `/api/personale`
ma usa percorsi che non collidono con quelli già registrati lì (`/persone`
e `/persone/{id}` sono già presi dal CRUD minimo di quel router):

- `/schede-persona`            elenco (ricco) e creazione persona+rapporto
- `/persone/{id}/profilo`      lettura/aggiornamento profilo
- `/persone/{id}/rapporti`     storico rapporti
- `/mansioni`, `/reparti`      cataloghi per azienda
- `/tipi-rapporto`             catalogo di sistema, sola lettura

Gating: `require_modulo("Personale")`, non "Anagrafica Aziendale" — è il
vero modulo Personale, non il supporto minimo al motore CCIAA.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.pagination import Page, PageParams
from app.core.personale_hr import (
    aggiorna_profilo_persona,
    crea_mansione,
    crea_persona_con_rapporto,
    crea_reparto,
    lista_mansioni,
    lista_persone,
    lista_reparti,
    lista_tipi_rapporto,
    profilo_persona,
    rapporto_a_read,
    ruoli_persona,
)
from app.database import get_db
from app.models.personale import PerRapportoAzienda
from app.schemas.personale_hr import (
    CatalogoCreate,
    CatalogoRead,
    NuovaPersonaRequest,
    PersonaListRow,
    PersonaProfiloRead,
    PersonaProfiloUpdate,
    PersonaRuoloRead,
    RapportoAziendaRead,
)

MODULO = "Personale"
TAGS = ["Personale — Anagrafica"]

router = APIRouter(prefix="/api/personale")
_modulo_dep = require_modulo(MODULO)


@router.get("/schede-persona", response_model=Page[PersonaListRow], tags=TAGS)
def elenco_persone(
    q: str | None = None,
    reparto_id: UUID | None = None,
    mansione_id: UUID | None = None,
    ruolo_id: UUID | None = None,
    stato_rapporto: str | None = None,
    params: PageParams = Depends(),
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_persone(
        db,
        ctx.azienda_id,
        q=q,
        reparto_id=reparto_id,
        mansione_id=mansione_id,
        ruolo_id=ruolo_id,
        stato_rapporto=stato_rapporto,
        params=params,
    )


@router.post("/schede-persona", response_model=PersonaProfiloRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def nuova_persona(
    payload: NuovaPersonaRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    persona = crea_persona_con_rapporto(db, ctx.azienda_id, payload)
    db.commit()
    profilo = profilo_persona(db, ctx.azienda_id, persona.id)
    assert profilo is not None
    return profilo


@router.get("/persone/{persona_id}/profilo", response_model=PersonaProfiloRead, tags=TAGS)
def get_profilo_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    profilo = profilo_persona(db, ctx.azienda_id, persona_id)
    if profilo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return profilo


@router.patch("/persone/{persona_id}/profilo", response_model=PersonaProfiloRead, tags=TAGS)
def patch_profilo_persona(
    persona_id: UUID,
    payload: PersonaProfiloUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    persona = aggiorna_profilo_persona(db, ctx.azienda_id, persona_id, payload)
    if persona is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    db.commit()
    profilo = profilo_persona(db, ctx.azienda_id, persona_id)
    assert profilo is not None
    return profilo


@router.get("/persone/{persona_id}/rapporti", response_model=list[RapportoAziendaRead], tags=TAGS)
def get_rapporti_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    stmt = (
        select(PerRapportoAzienda)
        .where(PerRapportoAzienda.persona_id == persona_id, PerRapportoAzienda.azienda_id == ctx.azienda_id)
        .order_by(PerRapportoAzienda.data_inizio.desc())
    )
    rapporti = db.scalars(stmt).all()
    return [rapporto_a_read(db, r) for r in rapporti]


@router.get("/persone/{persona_id}/ruoli", response_model=list[PersonaRuoloRead], tags=TAGS)
def get_ruoli_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return ruoli_persona(db, ctx.azienda_id, persona_id)


# ---------------------------------------------------------------------------
# Cataloghi
# ---------------------------------------------------------------------------


@router.get("/mansioni", response_model=list[CatalogoRead], tags=TAGS)
def get_mansioni(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_mansioni(db, ctx.azienda_id)


@router.post("/mansioni", response_model=CatalogoRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def post_mansione(
    payload: CatalogoCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_mansione(db, ctx.azienda_id, payload)


@router.get("/reparti", response_model=list[CatalogoRead], tags=TAGS)
def get_reparti(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_reparti(db, ctx.azienda_id)


@router.post("/reparti", response_model=CatalogoRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def post_reparto(
    payload: CatalogoCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_reparto(db, ctx.azienda_id, payload)


@router.get("/tipi-rapporto", response_model=list[CatalogoRead], tags=TAGS)
def get_tipi_rapporto(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_tipi_rapporto(db)
