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
    aggiorna_appuntamento_visita,
    aggiorna_competenza_ruolo,
    aggiorna_conoscenza,
    aggiorna_documento_persona,
    aggiorna_esperienza,
    aggiorna_giudizio_idoneita,
    aggiorna_nota,
    aggiorna_profilo_persona,
    aggiorna_registrazione_formativa,
    aggiorna_titolo_studio,
    aggiungi_competenza_ruolo,
    archivia_conoscenza,
    archivia_nota,
    competenze_persona,
    conoscenze_persona,
    crea_appuntamento_visita,
    crea_conoscenza,
    crea_corso_formazione,
    crea_documento_persona,
    crea_esperienza,
    crea_giudizio_idoneita,
    crea_mansione,
    crea_persona_con_rapporto,
    crea_promemoria_visita,
    crea_registrazione_formativa,
    crea_reparto,
    crea_nota,
    crea_titolo_studio,
    dettaglio_titolo_studio,
    elimina_documento_persona,
    elimina_esperienza,
    elimina_titolo_studio,
    idoneita_sanitaria_persona,
    lista_abilitazioni_catalogo,
    lista_catalogo_titoli_studio,
    lista_corsi_formazione,
    lista_documenti_persona,
    lista_esperienze_persona,
    lista_mansioni,
    lista_persone,
    lista_reparti,
    lista_tipi_documento,
    lista_tipi_rapporto,
    lista_tipi_visita,
    lista_categorie_nota,
    lista_titoli_studio_persona,
    macro_indicatori_persona,
    mansionario_ruolo,
    nascondi_competenza,
    note_persona,
    profilo_persona,
    rapporto_a_read,
    registrazioni_formative_persona,
    rimuovi_competenza_ruolo,
    ripristina_competenza,
    ruoli_persona,
    valuta_competenze,
    valuta_conoscenze,
    valuta_macro_indicatore,
    verifica_esperienza,
    SEZIONE_VERIFICA_TITOLI_STUDIO,
)
from app.core.registro_campi import require_consulente_ctx
from app.core.verifica_riga import applica_decisione_verifica_riga
from app.database import get_db
from app.models.personale import CatRuolo, PerRapportoAzienda
from app.schemas.personale_hr import (
    AppuntamentoVisitaCreate,
    AppuntamentoVisitaRead,
    AppuntamentoVisitaUpdate,
    CatalogoAbilitazioneRead,
    CatalogoCorsoCreate,
    CatalogoCorsoRead,
    CatalogoCreate,
    CatalogoRead,
    CompetenzaRuoloCreate,
    CompetenzaRuoloRead,
    CompetenzaRuoloUpdate,
    CompetenzePersonaRead,
    ConoscenzaCreate,
    ConoscenzaRead,
    ConoscenzaUpdate,
    DocumentoPersonaleCreate,
    DocumentoPersonaleRead,
    DocumentoPersonaleUpdate,
    EsperienzaCreate,
    EsperienzaRead,
    EsperienzaUpdate,
    EsperienzaVerificaRequest,
    GiudizioIdoneitaCreate,
    GiudizioIdoneitaRead,
    GiudizioIdoneitaUpdate,
    IdoneitaSanitariaRead,
    MacroIndicatoreRead,
    MacroIndicatoreValutaRequest,
    NascondiCompetenzaRequest,
    NotaCategoriaRead,
    NotaCreate,
    NotaRead,
    NotaUpdate,
    NuovaPersonaRequest,
    PersonaListRow,
    PersonaProfiloRead,
    PersonaProfiloUpdate,
    PersonaRuoloRead,
    PromemoriaVisitaCreate,
    PromemoriaVisitaRead,
    RapportoAziendaRead,
    RegistrazioneFormativaCreate,
    RegistrazioneFormativaRead,
    RegistrazioneFormativaUpdate,
    TipoRegistrazioneFormativa,
    TipoVisitaRead,
    TitoloStudioCreate,
    TitoloStudioRead,
    TitoloStudioUpdate,
    ValutaVociRequest,
)
from app.schemas.registro_campi import ReviewDecisionRequest

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


# ---------------------------------------------------------------------------
# Idoneità sanitaria — nessun controllo di profilo aggiuntivo oltre
# require_modulo/get_current_azienda già in vigore su tutto il router
# (decisione utente esplicita: non esiste ancora un sistema di permessi
# granulari in piattaforma).
# ---------------------------------------------------------------------------


@router.get("/tipi-visita", response_model=list[TipoVisitaRead], tags=TAGS)
def get_tipi_visita(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_tipi_visita(db)


@router.get("/persone/{persona_id}/idoneita", response_model=IdoneitaSanitariaRead, tags=TAGS)
def get_idoneita_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return idoneita_sanitaria_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/visite",
    response_model=GiudizioIdoneitaRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_visita_idoneita(
    persona_id: UUID,
    payload: GiudizioIdoneitaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_giudizio_idoneita(db, ctx.azienda_id, persona_id, payload)


@router.put("/visite/{visita_id}", response_model=GiudizioIdoneitaRead, tags=TAGS)
def put_visita_idoneita(
    visita_id: UUID,
    payload: GiudizioIdoneitaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    giudizio = aggiorna_giudizio_idoneita(db, ctx.azienda_id, visita_id, payload)
    if giudizio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visita non trovata")
    return giudizio


@router.post(
    "/persone/{persona_id}/appuntamenti-visita",
    response_model=AppuntamentoVisitaRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_appuntamento_visita(
    persona_id: UUID,
    payload: AppuntamentoVisitaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_appuntamento_visita(db, ctx.azienda_id, persona_id, payload)


@router.put("/appuntamenti-visita/{appuntamento_id}", response_model=AppuntamentoVisitaRead, tags=TAGS)
def put_appuntamento_visita(
    appuntamento_id: UUID,
    payload: AppuntamentoVisitaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    appuntamento = aggiorna_appuntamento_visita(db, ctx.azienda_id, appuntamento_id, payload)
    if appuntamento is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appuntamento non trovato")
    return appuntamento


@router.post(
    "/persone/{persona_id}/promemoria-visita",
    response_model=PromemoriaVisitaRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_promemoria_visita(
    persona_id: UUID,
    payload: PromemoriaVisitaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_promemoria_visita(db, ctx.azienda_id, persona_id, payload)


# ---------------------------------------------------------------------------
# Competenze (Conoscenza, Competenza, Consapevolezza) — stessa assenza di
# controllo di profilo aggiuntivo del resto del router (nessun sistema di
# permessi granulari in piattaforma). "Valutatore" è sempre ctx.utente_id,
# mai un campo del payload: nessun selettore di utenti azienda esiste
# ancora.
# ---------------------------------------------------------------------------


@router.get("/persone/{persona_id}/competenze/macro-indicatori", response_model=list[MacroIndicatoreRead], tags=TAGS)
def get_macro_indicatori(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return macro_indicatori_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/competenze/macro-indicatori/{macroarea}/valuta",
    response_model=MacroIndicatoreRead,
    tags=TAGS,
)
def post_valuta_macro_indicatore(
    persona_id: UUID,
    macroarea: str,
    payload: MacroIndicatoreValutaRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return valuta_macro_indicatore(db, ctx.azienda_id, ctx.utente_id, persona_id, macroarea, payload)


@router.get("/persone/{persona_id}/conoscenze", response_model=list[ConoscenzaRead], tags=TAGS)
def get_conoscenze_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return conoscenze_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/conoscenze", response_model=ConoscenzaRead, status_code=status.HTTP_201_CREATED, tags=TAGS
)
def post_conoscenza(
    persona_id: UUID,
    payload: ConoscenzaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_conoscenza(db, ctx.azienda_id, ctx.utente_id, persona_id, payload)


@router.put("/conoscenze/{conoscenza_id}", response_model=ConoscenzaRead, tags=TAGS)
def put_conoscenza(
    conoscenza_id: UUID,
    payload: ConoscenzaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    conoscenza = aggiorna_conoscenza(db, ctx.azienda_id, conoscenza_id, payload)
    if conoscenza is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conoscenza non trovata")
    return conoscenza


@router.delete("/conoscenze/{conoscenza_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_conoscenza(
    conoscenza_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if not archivia_conoscenza(db, ctx.azienda_id, conoscenza_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conoscenza non trovata")


@router.post("/persone/{persona_id}/conoscenze/valuta", response_model=list[ConoscenzaRead], tags=TAGS)
def post_valuta_conoscenze(
    persona_id: UUID,
    payload: ValutaVociRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return valuta_conoscenze(db, ctx.azienda_id, ctx.utente_id, persona_id, payload)


@router.get("/persone/{persona_id}/competenze", response_model=CompetenzePersonaRead, tags=TAGS)
def get_competenze_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return competenze_persona(db, ctx.azienda_id, persona_id)


@router.post("/persone/{persona_id}/competenze/valuta", response_model=CompetenzePersonaRead, tags=TAGS)
def post_valuta_competenze(
    persona_id: UUID,
    payload: ValutaVociRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return valuta_competenze(db, ctx.azienda_id, ctx.utente_id, persona_id, payload)


@router.post("/persone/{persona_id}/competenze/{voce_id}/nascondi", response_model=CompetenzePersonaRead, tags=TAGS)
def post_nascondi_competenza(
    persona_id: UUID,
    voce_id: UUID,
    payload: NascondiCompetenzaRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return nascondi_competenza(db, ctx.azienda_id, ctx.utente_id, persona_id, voce_id, payload.motivo)


@router.post("/persone/{persona_id}/competenze/{voce_id}/ripristina", response_model=CompetenzePersonaRead, tags=TAGS)
def post_ripristina_competenza(
    persona_id: UUID,
    voce_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return ripristina_competenza(db, ctx.azienda_id, ctx.utente_id, persona_id, voce_id)


# ---------------------------------------------------------------------------
# Titoli di studio — stato dichiarato/verificato tramite verifica_riga.py
# (§ commento in app/core/verifica_riga.py), decisione di revisione
# riservata al consulente come per Titoli abilitativi/Soci/Amministratori.
# ---------------------------------------------------------------------------


@router.get("/catalogo-titoli-studio", response_model=list[CatalogoRead], tags=TAGS)
def get_catalogo_titoli_studio(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_catalogo_titoli_studio(db)


@router.get("/persone/{persona_id}/titoli-studio", response_model=list[TitoloStudioRead], tags=TAGS)
def get_titoli_studio_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return lista_titoli_studio_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/titoli-studio",
    response_model=TitoloStudioRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def post_titolo_studio(
    persona_id: UUID,
    payload: TitoloStudioCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_titolo_studio(db, ctx.azienda_id, persona_id, payload)


@router.put("/titoli-studio/{titolo_id}", response_model=TitoloStudioRead, tags=TAGS)
def put_titolo_studio(
    titolo_id: UUID,
    payload: TitoloStudioUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    titolo = aggiorna_titolo_studio(db, ctx.azienda_id, titolo_id, payload)
    if titolo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Titolo di studio non trovato")
    return titolo


@router.delete("/titoli-studio/{titolo_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_titolo_studio(
    titolo_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if not elimina_titolo_studio(db, ctx.azienda_id, titolo_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Titolo di studio non trovato")


@router.post("/titoli-studio/{titolo_id}/review", response_model=TitoloStudioRead, tags=TAGS)
def review_titolo_studio(
    titolo_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sulla riga (§ commento in
    app/core/verifica_riga.py): stesso trattamento già in uso per Titoli
    abilitativi/Soci/Amministratori/Sindaci."""
    applica_decisione_verifica_riga(
        db,
        ctx,
        SEZIONE_VERIFICA_TITOLI_STUDIO,
        titolo_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    titolo = dettaglio_titolo_studio(db, ctx.azienda_id, titolo_id)
    if titolo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Titolo di studio non trovato")
    return titolo


# ---------------------------------------------------------------------------
# Esperienze rilevanti — "verificata" è una decisione riservata al
# consulente (stesso principio di "review" sopra), anche se non passa dal
# motore verifica_riga.py: nessun campo booleano modificabile dall'azienda.
# ---------------------------------------------------------------------------


@router.get("/persone/{persona_id}/esperienze", response_model=list[EsperienzaRead], tags=TAGS)
def get_esperienze_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return lista_esperienze_persona(db, ctx.azienda_id, persona_id)


@router.post(
    "/persone/{persona_id}/esperienze", response_model=EsperienzaRead, status_code=status.HTTP_201_CREATED, tags=TAGS
)
def post_esperienza(
    persona_id: UUID,
    payload: EsperienzaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_esperienza(db, ctx.azienda_id, persona_id, payload)


@router.put("/esperienze/{esperienza_id}", response_model=EsperienzaRead, tags=TAGS)
def put_esperienza(
    esperienza_id: UUID,
    payload: EsperienzaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    esperienza = aggiorna_esperienza(db, ctx.azienda_id, esperienza_id, payload)
    if esperienza is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esperienza non trovata")
    return esperienza


@router.delete("/esperienze/{esperienza_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_esperienza(
    esperienza_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    if not elimina_esperienza(db, ctx.azienda_id, esperienza_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esperienza non trovata")


@router.post("/esperienze/{esperienza_id}/verifica", response_model=EsperienzaRead, tags=TAGS)
def post_verifica_esperienza(
    esperienza_id: UUID,
    payload: EsperienzaVerificaRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    esperienza = verifica_esperienza(db, ctx.azienda_id, esperienza_id, payload.verificata)
    if esperienza is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esperienza non trovata")
    return esperienza


# ---------------------------------------------------------------------------
# Note — interne, riservate ai consulenti (§3): l'intero segmento usa
# require_consulente_ctx invece di get_current_azienda, non solo sulle
# operazioni di scrittura come sopra. Un utente aziendale (AZIENDA_ADMIN/
# OPERATORE) riceve 403 anche sulla sola lettura, non solo un frontend che
# nasconde la scheda.
# ---------------------------------------------------------------------------


@router.get("/categorie-note", response_model=list[NotaCategoriaRead], tags=TAGS)
def get_categorie_nota(
    _ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    return lista_categorie_nota()


@router.get("/persone/{persona_id}/note", response_model=list[NotaRead], tags=TAGS)
def get_note_persona(
    persona_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    if profilo_persona(db, ctx.azienda_id, persona_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return note_persona(db, ctx.azienda_id, persona_id)


@router.post("/persone/{persona_id}/note", response_model=NotaRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def post_nota(
    persona_id: UUID,
    payload: NotaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_nota(db, ctx.azienda_id, ctx.utente_id, persona_id, payload)


@router.put("/note/{nota_id}", response_model=NotaRead, tags=TAGS)
def put_nota(
    nota_id: UUID,
    payload: NotaUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    nota = aggiorna_nota(db, ctx.azienda_id, nota_id, payload)
    if nota is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota non trovata")
    return nota


@router.delete("/note/{nota_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_nota(
    nota_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    if not archivia_nota(db, ctx.azienda_id, nota_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota non trovata")
