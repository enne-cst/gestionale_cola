"""Router minimo del modulo Personale.

Espone solo l'anagrafica di base della persona (`ana_persone`), necessaria
per selezionare o creare il nominativo da collegare agli incarichi
(`per_incarichi`, motore generico ruolo + caratteristiche che ha sostituito
le tabelle `qual_*` dell'Anagrafica Aziendale). Il modulo Personale completo
(formazione, DPI, mansioni dettagliate) non è ancora sviluppato; l'endpoint
CRUD per gli incarichi stessi è previsto in una fase successiva, dedicata.

Nota sul gating: in `cat_moduli` "Personale" non è un modulo base (si
sblocca con un pacchetto), ma qui l'anagrafica minima della persona serve
solo da supporto alle relazioni/incarichi dell'Anagrafica Aziendale, che è
invece un modulo base sempre disponibile. Per questo l'endpoint è
condizionato al modulo "Anagrafica Aziendale", non a "Personale": quando il
modulo Personale completo verrà sviluppato, questo endpoint andrà rivisto
insieme al resto di quel modulo.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.core.incarichi import (
    applica_decisione_verifica_incarico,
    configurazione_ruolo,
    leggi_stato_verifica_incarico,
    leggi_valori,
    sincronizza_numero_amministratori_dopo_aggiunta,
    sincronizza_numero_amministratori_dopo_eliminazione,
    sincronizza_numero_soci_dopo_aggiunta,
    sincronizza_numero_soci_dopo_eliminazione,
    valida_e_salva_valori,
    verifica_amministratore_unico_disponibile,
    verifica_carica_collegio_sindacale_disponibile,
    verifica_revisore_legale_persona_fisica_disponibile,
    verifica_sindaco_unico_disponibile,
    verifica_societa_revisione_disponibile,
)
from app.core.moduli import require_modulo
from app.core.registro_campi import require_consulente_ctx
from app.crud.generic import register_list_crud
from app.database import get_db
from app.models.personale import AnaPersonaGiuridica, AnaPersone, CatRuolo, PerIncarico
from app.schemas.personale import (
    AnaPersoneCreate,
    AnaPersoneGiuridicheCreate,
    AnaPersoneGiuridicheRead,
    AnaPersoneGiuridicheUpdate,
    AnaPersoneRead,
    AnaPersoneUpdate,
    CaratteristicaRuoloRead,
    IncaricoCreate,
    IncaricoRead,
    IncaricoUpdate,
    RuoloSummary,
)
from app.schemas.registro_campi import ReviewDecisionRequest

MODULO = "Anagrafica Aziendale"
TAGS = ["Personale"]

router = APIRouter(prefix="/api/personale")

register_list_crud(
    router,
    path="/persone",
    tags=TAGS,
    modulo=MODULO,
    model=AnaPersone,
    read_schema=AnaPersoneRead,
    create_schema=AnaPersoneCreate,
    update_schema=AnaPersoneUpdate,
)

# § Correzione 16: anagrafica delle persone giuridiche (titolare alternativo
# di un incarico, es. "Società di revisione legale") — stesso trattamento
# CRUD di /persone, nessuna logica su misura.
register_list_crud(
    router,
    path="/persone-giuridiche",
    tags=TAGS,
    modulo=MODULO,
    model=AnaPersonaGiuridica,
    read_schema=AnaPersoneGiuridicheRead,
    create_schema=AnaPersoneGiuridicheCreate,
    update_schema=AnaPersoneGiuridicheUpdate,
)


# ---------------------------------------------------------------------------
# Cataloghi di sola lettura (cat_ruoli / cat_caratteristiche_incarico +
# rel_ruoli_caratteristiche): non azienda-scoped, servono al frontend per
# costruire il form dinamico di un incarico (selezione ruolo, campi
# richiesti) senza duplicare la configurazione già letta da
# `app.core.incarichi.configurazione_ruolo`.
# ---------------------------------------------------------------------------


@router.get("/ruoli", response_model=list[RuoloSummary], tags=TAGS)
def list_ruoli(
    codici: str | None = None,
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(require_modulo(MODULO)),
):
    stmt = select(CatRuolo).where(CatRuolo.attivo.is_(True))
    if codici:
        richiesti = [c.strip() for c in codici.split(",") if c.strip()]
        if richiesti:
            stmt = stmt.where(CatRuolo.codice.in_(richiesti))
    stmt = stmt.order_by(CatRuolo.ordine_visualizzazione)
    return db.scalars(stmt).all()


@router.get("/ruoli/{ruolo_id}/caratteristiche", response_model=list[CaratteristicaRuoloRead], tags=TAGS)
def list_caratteristiche_ruolo(
    ruolo_id: UUID,
    db: Session = Depends(get_db),
    _ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(require_modulo(MODULO)),
):
    config = configurazione_ruolo(db, ruolo_id)
    risultato = [
        CaratteristicaRuoloRead(
            id=caratteristica.id,
            codice=caratteristica.codice,
            denominazione=caratteristica.denominazione,
            tipoDato=caratteristica.tipo_dato,
            valoriAmmessi=caratteristica.valori_ammessi,
            obbligatorieta=rel.obbligatorieta,
        )
        for rel, caratteristica in config.values()
    ]
    risultato.sort(key=lambda c: c.codice)
    return risultato


# ---------------------------------------------------------------------------
# Incarichi (motore generico ruolo + caratteristiche, sostituisce le
# tabelle qual_* rimosse — vedi app/core/incarichi.py). Non riusa
# `register_list_crud`: il payload include il dizionario dinamico `valori`,
# validato contro `rel_ruoli_caratteristiche` per il ruolo scelto, non un
# semplice mapping 1:1 campo-colonna.
# ---------------------------------------------------------------------------

_modulo_dep = require_modulo(MODULO)


def _incarico_owned_or_404(db: Session, incarico_id: UUID, azienda_id: UUID) -> PerIncarico:
    incarico = db.get(PerIncarico, incarico_id)
    if incarico is None or incarico.azienda_id != azienda_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incarico non trovato")
    return incarico


def _persona_owned_or_404(db: Session, persona_id: UUID, azienda_id: UUID) -> AnaPersone:
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona non trovata")
    return persona


def _persona_giuridica_owned_or_404(db: Session, persona_giuridica_id: UUID, azienda_id: UUID) -> AnaPersonaGiuridica:
    persona = db.get(AnaPersonaGiuridica, persona_giuridica_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona giuridica non trovata")
    return persona


def _to_read(db: Session, incarico: PerIncarico) -> IncaricoRead:
    # § Correzione 16: esattamente uno dei due è valorizzato
    # (chk_per_incarichi_titolare_esclusivo), l'altro resta None.
    persona = db.get(AnaPersone, incarico.persona_id) if incarico.persona_id is not None else None
    persona_giuridica = (
        db.get(AnaPersonaGiuridica, incarico.persona_giuridica_id)
        if incarico.persona_giuridica_id is not None
        else None
    )
    ruolo = db.get(CatRuolo, incarico.ruolo_id)
    stato = leggi_stato_verifica_incarico(db, incarico.azienda_id, incarico.id)
    return IncaricoRead(
        id=incarico.id,
        azienda_id=incarico.azienda_id,
        persona_id=incarico.persona_id,
        persona_giuridica_id=incarico.persona_giuridica_id,
        ruolo_id=incarico.ruolo_id,
        note=incarico.note,
        valori=leggi_valori(db, incarico.id),
        fonte=incarico.fonte,
        stato=incarico.stato,
        persona=persona,
        persona_giuridica=persona_giuridica,
        ruolo=ruolo,
        created_at=incarico.created_at,
        updated_at=incarico.updated_at,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


@router.get("/incarichi", response_model=list[IncaricoRead], tags=TAGS)
def list_incarichi(
    ruolo_codice: str | None = None,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    stmt = select(PerIncarico).where(PerIncarico.azienda_id == ctx.azienda_id)
    if ruolo_codice is not None:
        stmt = stmt.join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id).where(CatRuolo.codice == ruolo_codice)
    incarichi = db.scalars(stmt.order_by(PerIncarico.created_at)).all()
    return [_to_read(db, i) for i in incarichi]


@router.post("/incarichi", response_model=IncaricoRead, status_code=status.HTTP_201_CREATED, tags=TAGS)
def create_incarico(
    payload: IncaricoCreate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
    # § Correzione 13: solo per ruolo SINDACO quando l'assetto di controllo
    # in carica è "Sindaco unico" e ne esiste già uno attivo — vedi
    # `verifica_sindaco_unico_disponibile`. Ignorato per ogni altro ruolo.
    confirm_sostituzione_sindaco_unico: bool = False,
    # § Correzione 15: solo per ruolo REVISORE_LEGALE quando l'assetto è
    # "Revisore legale persona fisica" e ne esiste già uno attivo — stesso
    # pattern del flag precedente, vedi
    # `verifica_revisore_legale_persona_fisica_disponibile`.
    confirm_sostituzione_revisore_legale: bool = False,
    # § Correzione 16: come sopra, ma per ruolo REVISORE_LEGALE quando
    # l'assetto è "Società di revisione legale" — vedi
    # `verifica_societa_revisione_disponibile`.
    confirm_sostituzione_societa_revisione: bool = False,
    # § Correzione 14: solo per ruolo SINDACO quando l'assetto è "Collegio
    # sindacale" e la carica scelta (`valori["A28"]`) è già al completo —
    # l'ID dell'incarico da cessare e sostituire, scelto dall'utente tra i
    # titolari attuali mostrati dal 409 di `verifica_carica_collegio_sindacale_disponibile`.
    sostituisci_incarico_id: UUID | None = None,
):
    # § Correzione 16: esattamente uno dei due (già verificato dal validator
    # di IncaricoCreate), ma solo quello valorizzato va risolto/verificato —
    # l'altro resta assente dalla riga (chk_per_incarichi_titolare_esclusivo).
    if payload.persona_id is not None:
        _persona_owned_or_404(db, payload.persona_id, ctx.azienda_id)
    else:
        assert payload.persona_giuridica_id is not None
        _persona_giuridica_owned_or_404(db, payload.persona_giuridica_id, ctx.azienda_id)
    ruolo = db.get(CatRuolo, payload.ruolo_id)
    if ruolo is None or not ruolo.attivo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ruolo non trovato")
    verifica_amministratore_unico_disponibile(db, ctx.azienda_id, ruolo.codice)
    verifica_sindaco_unico_disponibile(
        db, ctx.azienda_id, ruolo.codice, confermata=confirm_sostituzione_sindaco_unico
    )
    verifica_revisore_legale_persona_fisica_disponibile(
        db, ctx.azienda_id, ruolo.codice, confermata=confirm_sostituzione_revisore_legale
    )
    verifica_societa_revisione_disponibile(
        db, ctx.azienda_id, ruolo.codice, confermata=confirm_sostituzione_societa_revisione
    )
    carica_codice = payload.valori.get("A28")
    verifica_carica_collegio_sindacale_disponibile(
        db,
        ctx.azienda_id,
        ruolo.codice,
        carica_codice=str(carica_codice) if carica_codice is not None else None,
        sostituisci_incarico_id=sostituisci_incarico_id,
    )

    incarico = PerIncarico(
        azienda_id=ctx.azienda_id,
        persona_id=payload.persona_id,
        persona_giuridica_id=payload.persona_giuridica_id,
        ruolo_id=payload.ruolo_id,
        note=payload.note,
        fonte=payload.fonte,
    )
    db.add(incarico)
    db.flush()
    valida_e_salva_valori(db, incarico, payload.valori, parziale=False)
    # § richiesta esplicita (31/08/2026): tiene "Numero componenti"
    # dell'organo amministrativo allineato alla tabella — vedi
    # `app.core.incarichi.sincronizza_numero_amministratori_dopo_aggiunta`.
    sincronizza_numero_amministratori_dopo_aggiunta(db, ctx.azienda_id, ruolo.codice)
    # Stesso comportamento per "Numero dei soci" (§ richiesta esplicita,
    # seguito): no-op per ogni ruolo diverso da SOCIO.
    sincronizza_numero_soci_dopo_aggiunta(db, ctx.azienda_id, ruolo.codice)
    db.commit()
    db.refresh(incarico)
    return _to_read(db, incarico)


@router.get("/incarichi/{incarico_id}", response_model=IncaricoRead, tags=TAGS)
def get_incarico(
    incarico_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    incarico = _incarico_owned_or_404(db, incarico_id, ctx.azienda_id)
    return _to_read(db, incarico)


@router.put("/incarichi/{incarico_id}", response_model=IncaricoRead, tags=TAGS)
def update_incarico(
    incarico_id: UUID,
    payload: IncaricoUpdate,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    incarico = _incarico_owned_or_404(db, incarico_id, ctx.azienda_id)

    if payload.persona_id is not None and payload.persona_id != incarico.persona_id:
        _persona_owned_or_404(db, payload.persona_id, ctx.azienda_id)
        incarico.persona_id = payload.persona_id
        incarico.persona_giuridica_id = None
    if payload.persona_giuridica_id is not None and payload.persona_giuridica_id != incarico.persona_giuridica_id:
        _persona_giuridica_owned_or_404(db, payload.persona_giuridica_id, ctx.azienda_id)
        incarico.persona_giuridica_id = payload.persona_giuridica_id
        incarico.persona_id = None
    if payload.ruolo_id is not None and payload.ruolo_id != incarico.ruolo_id:
        nuovo_ruolo = db.get(CatRuolo, payload.ruolo_id)
        if nuovo_ruolo is None or not nuovo_ruolo.attivo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ruolo non trovato")
        incarico.ruolo_id = payload.ruolo_id
    if payload.note is not None:
        incarico.note = payload.note
    if payload.stato is not None:
        incarico.stato = payload.stato

    if payload.valori is not None:
        valida_e_salva_valori(db, incarico, payload.valori, parziale=True)

    db.commit()
    db.refresh(incarico)
    return _to_read(db, incarico)


@router.post("/incarichi/{incarico_id}/review", response_model=IncaricoRead, tags=TAGS)
def review_incarico(
    incarico_id: UUID,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(require_consulente_ctx),
    _modulo: None = Depends(_modulo_dep),
):
    """Decisione di verifica sulla riga-incarico (§ commento in
    app/core/incarichi.py): stessa azione che prima viveva nella
    caratteristica A32 dentro il form di compilazione, ora un'azione
    dedicata come per i campi del registro."""
    incarico = _incarico_owned_or_404(db, incarico_id, ctx.azienda_id)
    applica_decisione_verifica_incarico(
        db,
        ctx,
        incarico_id,
        decisione=payload.decision,
        nota=payload.note,
        expected_version=payload.expectedFieldVersion,
    )
    db.commit()
    db.refresh(incarico)
    return _to_read(db, incarico)


@router.delete("/incarichi/{incarico_id}", status_code=status.HTTP_204_NO_CONTENT, tags=TAGS)
def delete_incarico(
    incarico_id: UUID,
    db: Session = Depends(get_db),
    ctx: AziendaContext = Depends(get_current_azienda),
    _modulo: None = Depends(_modulo_dep),
):
    """Rimuove fisicamente l'incarico: riservato alla correzione di un
    inserimento errato. Per cessare un incarico (la persona lascia il
    ruolo) va invece aggiornata la stessa riga con `PUT`, valorizzando le
    caratteristiche di data cessazione/stato — vedi `app/core/incarichi.py`."""
    incarico = _incarico_owned_or_404(db, incarico_id, ctx.azienda_id)
    ruolo = db.get(CatRuolo, incarico.ruolo_id)
    db.delete(incarico)  # i valori seguono via ON DELETE CASCADE
    db.flush()
    # § richiesta esplicita (31/08/2026): tiene "Numero componenti"
    # dell'organo amministrativo allineato alla tabella — vedi
    # `app.core.incarichi.sincronizza_numero_amministratori_dopo_eliminazione`.
    if ruolo is not None:
        sincronizza_numero_amministratori_dopo_eliminazione(db, ctx.azienda_id, ruolo.codice)
        sincronizza_numero_soci_dopo_eliminazione(db, ctx.azienda_id, ruolo.codice)
    db.commit()
