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
    aggiorna_competenza_ruolo,
    aggiorna_documento_persona,
    aggiorna_profilo_persona,
    aggiorna_registrazione_formativa,
    aggiungi_competenza_ruolo,
    crea_corso_formazione,
    crea_documento_persona,
    crea_mansione,
    crea_persona_con_rapporto,
    crea_registrazione_formativa,
    crea_reparto,
    elimina_documento_persona,
    lista_abilitazioni_catalogo,
    lista_corsi_formazione,
    lista_documenti_persona,
    lista_mansioni,
    lista_persone,
    lista_reparti,
    lista_tipi_documento,
    lista_tipi_rapporto,
    mansionario_ruolo,
    profilo_persona,
    rapporto_a_read,
    registrazioni_formative_persona,
    rimuovi_competenza_ruolo,
    ruoli_persona,
)
from app.database import get_db
from app.models.personale import CatRuolo, PerRapportoAzienda
from app.schemas.personale_hr import (
    CatalogoAbilitazioneRead,
    CatalogoCorsoCreate,
    CatalogoCorsoRead,
    CatalogoCreate,
    CatalogoRead,
    CompetenzaRuoloCreate,
    CompetenzaRuoloRead,
    CompetenzaRuoloUpdate,
    DocumentoPersonaleCreate,
    DocumentoPersonaleRead,
    DocumentoPersonaleUpdate,
    NuovaPersonaRequest,
    PersonaListRow,
    PersonaProfiloRead,
    PersonaProfiloUpdate,
    PersonaRuoloRead,
    RapportoAziendaRead,
    RegistrazioneFormativaCreate,
    RegistrazioneFormativaRead,
    RegistrazioneFormativaUpdate,
    TipoRegistrazioneFormativa,
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


@router.get("/persone/{persona_id}/documenti", response_model=list[DocumentoPersonaleRead], tags=TAGS)
def get_documenti_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return lista_documenti_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/documenti",
    response_model=DocumentoPersonaleRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_documento_persona(
    persona_id: UUID,
    payload: DocumentoPersonaleCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return crea_documento_persona(db, ctx.azienda_id, persona_id, payload)


@router.put("/documenti/{documento_id}", response_model=DocumentoPersonaleRead, tags=TAGS)
def put_documento_persona(
    documento_id: UUID,
    payload: DocumentoPersonaleUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    documento = aggiorna_documento_persona(db, ctx.azienda_id, documento_id, payload)
    if documento is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento non trovato")
    return documento


@router.delete("/documenti/{documento_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_documento_persona(
    documento_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if not elimina_documento_persona(db, ctx.azienda_id, documento_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento non trovato")


@router.get("/tipi-documento-identita", response_model=list[CatalogoRead], tags=TAGS)
def get_tipi_documento(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_tipi_documento(db)


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


# ---------------------------------------------------------------------------
# Mansionario del ruolo (profilo standard delle competenze) — Azienda +
# Ruolo, condiviso da tutte le persone che lo ricoprono. Non collega mai
# l'origine CCIAA dell'assegnazione: la configurazione appartiene
# all'azienda e al ruolo, non all'incarico.
# ---------------------------------------------------------------------------


def _ruolo_esistente_o_404(db: Session, ruolo_id: UUID) -> None:
    if db.get(CatRuolo, ruolo_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ruolo non trovato")


@router.get("/ruoli/{ruolo_id}/mansionario", response_model=list[CompetenzaRuoloRead], tags=TAGS)
def get_mansionario_ruolo(
    ruolo_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    _ruolo_esistente_o_404(db, ruolo_id)
    return mansionario_ruolo(db, ctx.azienda_id, ruolo_id)


@router.post(
    "/ruoli/{ruolo_id}/mansionario",
    response_model=CompetenzaRuoloRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_competenza_ruolo(
    ruolo_id: UUID,
    payload: CompetenzaRuoloCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    _ruolo_esistente_o_404(db, ruolo_id)
    return aggiungi_competenza_ruolo(db, ctx.azienda_id, ruolo_id, payload)


@router.put("/mansionario/competenze/{relazione_id}", response_model=CompetenzaRuoloRead, tags=TAGS)
def put_competenza_ruolo(
    relazione_id: UUID,
    payload: CompetenzaRuoloUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    competenza = aggiorna_competenza_ruolo(db, ctx.azienda_id, relazione_id, payload)
    if competenza is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competenza non trovata")
    return competenza


@router.delete("/mansionario/competenze/{relazione_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_competenza_ruolo(
    relazione_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if not rimuovi_competenza_ruolo(db, ctx.azienda_id, relazione_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competenza non trovata")


# ---------------------------------------------------------------------------
# Formazione e abilitazioni — F e A restano due tabelle distinte lato
# dominio (§19 della correzione), unificate qui in un'unica lista/form: il
# frontend mostra sempre "+ Aggiungi attestato" e una sola tabella.
# ---------------------------------------------------------------------------


@router.get("/corsi-formazione", response_model=list[CatalogoCorsoRead], tags=TAGS)
def get_corsi_formazione(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_corsi_formazione(db, ctx.azienda_id)


@router.post("/corsi-formazione", response_model=CatalogoCorsoRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def post_corso_formazione(
    payload: CatalogoCorsoCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_corso_formazione(db, ctx.azienda_id, payload)


@router.get("/abilitazioni-catalogo", response_model=list[CatalogoAbilitazioneRead], tags=TAGS)
def get_abilitazioni_catalogo(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_abilitazioni_catalogo(db)


@router.get(
    "/persone/{persona_id}/formazione-abilitazioni",
    response_model=list[RegistrazioneFormativaRead],
    tags=TAGS,
)
def get_formazione_abilitazioni_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return registrazioni_formative_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/formazione-abilitazioni",
    response_model=RegistrazioneFormativaRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_formazione_abilitazioni_persona(
    persona_id: UUID,
    payload: RegistrazioneFormativaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_registrazione_formativa(db, ctx.azienda_id, persona_id, payload)


@router.put(
    "/formazione-abilitazioni/{tipo}/{registrazione_id}",
    response_model=RegistrazioneFormativaRead,
    tags=TAGS,
)
def put_formazione_abilitazioni(
    tipo: TipoRegistrazioneFormativa,
    registrazione_id: UUID,
    payload: RegistrazioneFormativaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    registrazione = aggiorna_registrazione_formativa(db, ctx.azienda_id, tipo, registrazione_id, payload)
    if registrazione is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registrazione non trovata")
    return registrazione
