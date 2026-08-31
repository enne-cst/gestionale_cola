"""API del "registro campo-per-campo" per le sezioni singleton dell'Anagrafica
Aziendale (vedi `app.core.registro_campi`): lettura/scrittura a batch con
concorrenza ottimistica, visibilità e verifica per singolo campo, KPI di
qualità e ultime modifiche per la Panoramica.

Prefisso separato da `/api/anagrafica` (le altre sotto-risorse del modulo,
`app/api/anagrafica.py`) perché il contratto è deliberatamente diverso
(sezione a gruppi/campi invece di record piatti, §15 della specifica)."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.incarichi import verifica_transizione_nessun_organo_controllo
from app.core.moduli import require_modulo
from app.core.registro_campi import (
    SEZIONI,
    SezioneRegistro,
    applica_decisione_verifica,
    applica_modifiche_sezione,
    applica_visibilita,
    costruisci_sezione,
    normalizza_numero_componenti_nessun_organo_controllo,
    require_consulente_ctx,
    riepilogo_sezioni,
    ultime_modifiche,
    valida_campo,
    valuta_qualita,
)
from app.database import get_db
from app.schemas.registro_campi import (
    OverviewRead,
    ReviewDecisionRequest,
    SectionRead,
    SectionSummaryRead,
    SectionUpdateRequest,
    VisibilityUpdateRequest,
)

MODULO = "Anagrafica Aziendale"
_modulo_dep = require_modulo(MODULO)

router = APIRouter(prefix="/api/anagrafica/registro", tags=["Anagrafica Aziendale - Registro"])


def _sezione_o_404(section_key: str) -> SezioneRegistro:
    sezione = SEZIONI.get(section_key)
    if sezione is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sezione non trovata")
    return sezione


def _carica_record(db: Session, ctx: AziendaContext, sezione: SezioneRegistro):
    return db.scalars(select(sezione.model).where(sezione.model.azienda_id == ctx.azienda_id)).first()


@router.get("/overview", response_model=OverviewRead)
def leggi_overview(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    # Visibile anche all'Azienda (non solo al Consulente): misura
    # l'affidabilità dei dati già inseriti, non un dettaglio riservato.
    quality = valuta_qualita(db, ctx.azienda_id)
    return OverviewRead(quality=quality, recentChanges=ultime_modifiche(db, ctx.azienda_id))


@router.get("/sections/summary", response_model=list[SectionSummaryRead])
def leggi_riepilogo_sezioni(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return riepilogo_sezioni(db, ctx.azienda_id)


@router.get("/sections/{section_key}", response_model=SectionRead)
def leggi_sezione(
    section_key: str,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    sezione = _sezione_o_404(section_key)
    row = _carica_record(db, ctx, sezione)
    return costruisci_sezione(db, ctx, sezione, row=row)


@router.patch("/sections/{section_key}", response_model=SectionRead)
def salva_sezione(
    section_key: str,
    payload: SectionUpdateRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
    if_match: str | None = Header(default=None, alias="If-Match"),
    # § Correzione 12: solo per section_key "organi-controllo", quando il
    # passaggio a "Nessun organo di controllo o revisore" lascerebbe
    # sindaci/revisori ancora attivi — vedi
    # `verifica_transizione_nessun_organo_controllo`. Ignorato da ogni altra
    # sezione: non generalizzato ad altre, e' un caso specifico di questa
    # sola sezione.
    confirm_cessazione_organo_controllo: bool = False,
):
    sezione = _sezione_o_404(section_key)
    row = _carica_record(db, ctx, sezione)

    # Concorrenza ottimistica (§15.6): la sezione appena creata (row is None,
    # nessuna versione ancora esistita) non ha nulla con cui confrontarsi, in
    # ogni altro caso un If-Match assente o divergente e' un conflitto.
    if row is not None:
        if if_match is None or if_match != row.updated_at.isoformat():
            raise HTTPException(status.HTTP_409_CONFLICT, "I dati sono stati modificati nel frattempo: ricaricare la sezione")
    elif if_match is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "I dati sono stati modificati nel frattempo: ricaricare la sezione")

    errori = {campo: msg for campo, msg in ((c, valida_campo(sezione, c, v, db)) for c, v in payload.fields.items()) if msg}
    if errori:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{"loc": ["fields", campo], "msg": msg} for campo, msg in errori.items()],
        )

    if section_key == "organi-controllo":
        verifica_transizione_nessun_organo_controllo(
            db,
            ctx.azienda_id,
            row=row,
            nuovo_codice=payload.fields.get("assetto_controllo_in_carica"),
            confermata=confirm_cessazione_organo_controllo,
        )

    if row is None:
        row = sezione.model(azienda_id=ctx.azienda_id)
        db.add(row)
        db.flush()

    applica_modifiche_sezione(db, ctx, sezione, row=row, cambiamenti=payload.fields)
    normalizza_numero_componenti_nessun_organo_controllo(db, row)
    db.commit()
    db.refresh(row)
    return costruisci_sezione(db, ctx, sezione, row=row)


@router.patch("/sections/{section_key}/fields/{field_key}/visibility", response_model=SectionRead)
def imposta_visibilita_campo(
    section_key: str,
    field_key: str,
    payload: VisibilityUpdateRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    sezione = _sezione_o_404(section_key)
    row = _carica_record(db, ctx, sezione)
    # Nessun guard "sezione non compilata": la visibilità è una
    # configurazione autonoma (§13.3) e deve poter nascondere anche un campo
    # ancora vuoto o derivato da un'altra tabella (es. "Sede legale"), come
    # negli esempi della fixture canonica della specifica (§52, taxCode
    # nascosto e vuoto).

    applica_visibilita(db, ctx, sezione, row=row, campo=field_key, visibile=payload.visibleToCompany)
    db.commit()
    return costruisci_sezione(db, ctx, sezione, row=row)


@router.post("/sections/{section_key}/fields/{field_key}/review", response_model=SectionRead)
def decidi_verifica_campo(
    section_key: str,
    field_key: str,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    sezione = _sezione_o_404(section_key)
    row = _carica_record(db, ctx, sezione)
    # Nessun guard "sezione non compilata": se il campo è vuoto (inclusa una
    # sezione mai salvata) `applica_decisione_verifica` risponde già 409
    # "campo vuoto", coerente con §7.3 (solo un valore compilato è
    # verificabile) senza un 404 fuorviante prima ancora di controllarlo.

    applica_decisione_verifica(
        db,
        ctx,
        sezione,
        row=row,
        campo=field_key,
        decisione=payload.decision,
        nota=payload.note,
        expected_field_version=payload.expectedFieldVersion,
    )
    db.commit()
    return costruisci_sezione(db, ctx, sezione, row=row)
