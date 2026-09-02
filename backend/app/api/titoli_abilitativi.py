"""Router della tabella unificata "Albi, ruoli, licenze e certificazioni"
(Correzione 20, seconda parte della card "Attività, albi, ruoli e
licenze" dell'Anagrafica Aziendale).

Non usa la fabbrica generica `app.crud.generic` (pensata per un modello =
uno schema): qui un'unica riga logica si scrive tramite uno di quattro
endpoint dedicati a seconda della macro-tipologia scelta dall'utente
(§ punto 5, "ogni scelta apre un form personalizzato, non un unico form
generico"), ognuno dei quali crea/aggiorna in transazione la riga
principale + il proprio dettaglio (vedi app/core/titoli_abilitativi.py)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.moduli import require_modulo
from app.core.registro_campi import require_consulente_ctx
from app.core.titoli_abilitativi import (
    aggiorna_albo,
    aggiorna_certificazione,
    aggiorna_licenza,
    aggiorna_ruolo,
    applica_decisione_verifica_titolo,
    crea_albo,
    crea_certificazione,
    crea_licenza,
    crea_ruolo,
    dettaglio_titolo,
    elenco_titoli,
    elimina_titolo,
)
from app.database import Base, get_db
from app.models.anagrafica import (
    CatCategoriaSoa,
    CatClassificaSoa,
    CatNormaCertificazione,
    CatStatoTitoloAbilitativo,
    CatTipologiaAlbo,
    CatTipologiaCertificazioneAttestazione,
    CatTipologiaLicenza,
    CatTipologiaRuolo,
)
from app.models.sistema import CatSettoreIAF
from app.schemas.anagrafica_iso9001 import CatalogoRead
from app.schemas.registro_campi import ReviewDecisionRequest
from app.schemas.titoli_abilitativi import (
    SettoreIafRead,
    TitoloAbilitativoAlboCreate,
    TitoloAbilitativoAlboRead,
    TitoloAbilitativoCertificazioneCreate,
    TitoloAbilitativoCertificazioneRead,
    TitoloAbilitativoDetailRead,
    TitoloAbilitativoLicenzaCreate,
    TitoloAbilitativoLicenzaRead,
    TitoloAbilitativoRuoloCreate,
    TitoloAbilitativoRuoloRead,
    TitoloAbilitativoSummaryRead,
)

MODULO = "Anagrafica Aziendale"
TAGS = ["Anagrafica Aziendale"]

router = APIRouter(prefix="/api/anagrafica/titoli-abilitativi")

_modulo_dep = require_modulo(MODULO)

# ---------------------------------------------------------------------------
# Cataloghi dei campi specifici dei 4 form (§ Correzione 21): un solo
# endpoint generico per i 7 cataloghi che condividono la forma
# codice/denominazione/ordine/attivo (stesso pattern di
# `_CATALOGHI_ISO9001` in app/api/anagrafica.py), più un endpoint dedicato
# per i settori IAF (cat_settori_iaf ha una forma diversa: nome/attiva).
# ---------------------------------------------------------------------------

_CATALOGHI_TITOLI_ABILITATIVI: dict[str, type[Base]] = {
    "stati-titolo": CatStatoTitoloAbilitativo,
    "tipologie-albo": CatTipologiaAlbo,
    "tipologie-ruolo": CatTipologiaRuolo,
    "tipologie-licenza": CatTipologiaLicenza,
    "tipologie-certificazione-attestazione": CatTipologiaCertificazioneAttestazione,
    "norme-certificazione": CatNormaCertificazione,
    "categorie-soa": CatCategoriaSoa,
    "classifiche-soa": CatClassificaSoa,
}


@router.get("/cataloghi/settori-iaf", response_model=list[SettoreIafRead], tags=TAGS)
def elenco_settori_iaf(
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return db.scalars(select(CatSettoreIAF).where(CatSettoreIAF.attiva.is_(True)).order_by(CatSettoreIAF.nome)).all()


@router.get("/cataloghi/{nome}", response_model=list[CatalogoRead], tags=TAGS)
def elenco_catalogo_titolo_abilitativo(
    nome: str,
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    modello = _CATALOGHI_TITOLI_ABILITATIVI.get(nome)
    if modello is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catalogo non trovato")
    return db.scalars(
        select(modello).where(modello.attivo.is_(True)).order_by(modello.ordine_visualizzazione)
    ).all()


@router.get("", response_model=list[TitoloAbilitativoSummaryRead], tags=TAGS)
def list_titoli(
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return elenco_titoli(db, ctx.azienda_id)


@router.get("/{titolo_id}", response_model=TitoloAbilitativoDetailRead, tags=TAGS)
def get_titolo(
    titolo_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return dettaglio_titolo(db, ctx.azienda_id, titolo_id)


@router.post("/{titolo_id}/review", response_model=TitoloAbilitativoDetailRead, tags=TAGS)
def review_titolo(
    titolo_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sulla riga (§ commento in
    app/core/verifica_riga.py): stesso trattamento della verifica per
    campo del registro, qui applicato a un intero record."""
    applica_decisione_verifica_titolo(
        db,
        ctx,
        titolo_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    return dettaglio_titolo(db, ctx.azienda_id, titolo_id)


@router.delete("/{titolo_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_titolo(
    titolo_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    elimina_titolo(db, ctx.azienda_id, titolo_id)


# ---------------------------------------------------------------------------
# Form Albo
# ---------------------------------------------------------------------------


@router.post("/albo", response_model=TitoloAbilitativoAlboRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def create_albo(
    payload: TitoloAbilitativoAlboCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_albo(db, ctx, payload)


@router.put("/albo/{titolo_id}", response_model=TitoloAbilitativoAlboRead, tags=TAGS)
def update_albo(
    titolo_id: UUID,
    payload: TitoloAbilitativoAlboCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return aggiorna_albo(db, ctx, titolo_id, payload)


# ---------------------------------------------------------------------------
# Form Ruolo
# ---------------------------------------------------------------------------


@router.post("/ruolo", response_model=TitoloAbilitativoRuoloRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def create_ruolo(
    payload: TitoloAbilitativoRuoloCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_ruolo(db, ctx, payload)


@router.put("/ruolo/{titolo_id}", response_model=TitoloAbilitativoRuoloRead, tags=TAGS)
def update_ruolo(
    titolo_id: UUID,
    payload: TitoloAbilitativoRuoloCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return aggiorna_ruolo(db, ctx, titolo_id, payload)


# ---------------------------------------------------------------------------
# Form Licenza
# ---------------------------------------------------------------------------


@router.post("/licenza", response_model=TitoloAbilitativoLicenzaRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def create_licenza(
    payload: TitoloAbilitativoLicenzaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_licenza(db, ctx, payload)


@router.put("/licenza/{titolo_id}", response_model=TitoloAbilitativoLicenzaRead, tags=TAGS)
def update_licenza(
    titolo_id: UUID,
    payload: TitoloAbilitativoLicenzaCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return aggiorna_licenza(db, ctx, titolo_id, payload)


# ---------------------------------------------------------------------------
# Form Certificazione o attestazione
# ---------------------------------------------------------------------------


@router.post(
    "/certificazione",
    response_model=TitoloAbilitativoCertificazioneRead,
    status_code=status.HTTP_201_CREATED,
    tags=TAGS,
)
def create_certificazione(
    payload: TitoloAbilitativoCertificazioneCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return crea_certificazione(db, ctx, payload)


@router.put("/certificazione/{titolo_id}", response_model=TitoloAbilitativoCertificazioneRead, tags=TAGS)
def update_certificazione(
    titolo_id: UUID,
    payload: TitoloAbilitativoCertificazioneCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    return aggiorna_certificazione(db, ctx, titolo_id, payload)
