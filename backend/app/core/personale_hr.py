"""Servizio di dominio del vero modulo Personale (Fase 1 — Fondazioni).

Funzioni pure con `Session` esplicita come primo parametro, stesso stile di
`app.core.incarichi`/`app.core.aggiornamento_impresa` — niente classi
Service, mai usate altrove nel repository.
"""

import calendar
import re
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.incarichi import configurazione_ruolo, leggi_valori
from app.core.pagination import Page, PageParams, paginate
from app.core.verifica_riga import leggi_stato_verifica_riga
from app.models.personale import (
    AnaPersone,
    CatAbilitazione,
    CatCorsoFormazione,
    CatMansione,
    CatReparto,
    CatRuolo,
    CatTipoDocumentoIdentita,
    CatTipologiaTitoloStudio,
    CatTipoRapporto,
    CatTipoVisita,
    CatVoceValutazionePersonale,
    CfgRuoloAzienda,
    PerAbilitazione,
    PerAttivita,
    PerDocumentoPersonale,
    PerEsperienza,
    PerFormazione,
    PerGiudizioIdoneita,
    PerIncarico,
    PerNota,
    PerRapportoAzienda,
    PerTitoloStudio,
    PerValutazionePersonale,
    PerValutazionePersonaleDettaglio,
    PerVoceValutazionePersonale,
    RelPersonaVoceNascosta,
    RelRuoloVoceValutazione,
)
from app.models.sistema import SysUtente
from app.schemas.personale_hr import (
    AppuntamentoVisitaCreate,
    AppuntamentoVisitaRead,
    AppuntamentoVisitaUpdate,
    CatalogoAbilitazioneRead,
    CatalogoCorsoCreate,
    CatalogoCorsoRead,
    CatalogoCreate,
    CatalogoRead,
    CompetenzaNascostaRead,
    CompetenzaRead,
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
    GiudizioIdoneitaCreate,
    NotaCategoriaRead,
    NotaCreate,
    NotaRead,
    NotaUpdate,
    GiudizioIdoneitaRead,
    GiudizioIdoneitaUpdate,
    IdoneitaSanitariaRead,
    IndicatoriIdoneitaRead,
    MacroIndicatoreRead,
    MacroIndicatoreValutaRequest,
    NuovaPersonaRequest,
    PersonaDossierRead,
    PersonaDossierUpdate,
    PersonaListRow,
    PersonaProfiloRead,
    PersonaProfiloUpdate,
    PersonaRuoloRead,
    PromemoriaVisitaCreate,
    PromemoriaVisitaRead,
    RapportoAziendaCreate,
    RapportoAziendaRead,
    RapportoCorrenteSummary,
    RapportoDettagliUpdate,
    RegistrazioneFormativaCreate,
    RegistrazioneFormativaRead,
    RegistrazioneFormativaUpdate,
    TipoVisitaRead,
    TitoloStudioCreate,
    TitoloStudioRead,
    TitoloStudioUpdate,
    ValutaVociRequest,
)

SEZIONE_VERIFICA_TITOLI_STUDIO = "PERSONALE.COMPETENZE.TITOLI_STUDIO"
"""Sezione per verifica_riga.py: un solo sezione_codice per l'intera
famiglia di record "titoli di studio" (§ commento generale del motore),
mai un catalogo di campi statico."""

_DOSSIER_CAMPI_DIRETTI = (
    "matricola_interna",
    "provincia_nascita",
    "stato_nascita",
    "indirizzo_residenza",
    "cap_residenza",
    "comune_residenza",
    "provincia_residenza",
    "domicilio_coincide_residenza",
    "indirizzo_domicilio",
    "cap_domicilio",
    "comune_domicilio",
    "provincia_domicilio",
    "contatto_emergenza_nome",
    "contatto_emergenza_relazione",
    "contatto_emergenza_telefono",
    "lingua_madre",
    "supporto_linguistico_necessario",
    "altre_lingue",
)


def _persona_owned_or_none(db: Session, persona_id: uuid.UUID, azienda_id: uuid.UUID) -> AnaPersone | None:
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        return None
    return persona


def rapporto_corrente(db: Session, persona_id: uuid.UUID) -> PerRapportoAzienda | None:
    """Il rapporto "corrente" (§12.2) è quello ancora aperto
    (`data_fine_effettiva IS NULL`), il più recente per data_inizio se per
    qualche motivo ne esistesse più di uno aperto. Se nessuno è aperto
    (persona con solo rapporti storici cessati), ritorna comunque il più
    recente per non mostrare una scheda vuota — la card lo segnalerà come
    non attivo tramite `stato`."""

    stmt = (
        select(PerRapportoAzienda)
        .where(PerRapportoAzienda.persona_id == persona_id)
        .order_by(PerRapportoAzienda.data_fine_effettiva.is_(None).desc(), PerRapportoAzienda.data_inizio.desc())
        .limit(1)
    )
    return db.scalars(stmt).first()


def crea_persona_con_rapporto(db: Session, azienda_id: uuid.UUID, payload: NuovaPersonaRequest) -> AnaPersone:
    """Persona + primo rapporto in un'unica transazione (§9.4: "la
    creazione di persona e primo rapporto deve essere atomica"). Nessun
    commit qui: il chiamante (router) decide quando committare, così un
    controllo successivo può ancora abortire l'intera operazione."""

    persona = AnaPersone(
        azienda_id=azienda_id,
        nome=payload.persona.nome,
        cognome=payload.persona.cognome,
        codice_fiscale=payload.persona.codice_fiscale,
        telefono=payload.persona.telefono,
        email=payload.persona.email,
    )
    db.add(persona)
    db.flush()

    rapporto = _costruisci_rapporto(azienda_id, persona.id, payload.rapporto)
    db.add(rapporto)
    db.flush()

    return persona


def _costruisci_rapporto(azienda_id: uuid.UUID, persona_id: uuid.UUID, dati: RapportoAziendaCreate) -> PerRapportoAzienda:
    return PerRapportoAzienda(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipo_rapporto_id=dati.tipo_rapporto_id,
        data_inizio=dati.data_inizio,
        data_fine_prevista=dati.data_fine_prevista,
        mansione_id=dati.mansione_id,
        reparto_id=dati.reparto_id,
        stato=dati.stato,
        tempo_lavoro=dati.tempo_lavoro,
        percentuale_part_time=dati.percentuale_part_time,
        ccnl=dati.ccnl,
        livello_inquadramento=dati.livello_inquadramento,
        note=dati.note,
    )


def rapporto_a_read(db: Session, rapporto: PerRapportoAzienda) -> RapportoAziendaRead:
    """Costruisce a mano il DTO annidato (tipo_rapporto/mansione/reparto):
    `PerRapportoAzienda` ha solo le FK, nessuna `relationship()` ORM — stesso
    principio già in uso in `app.api.personale._to_read` (niente
    `from_attributes` automatico su relazioni)."""

    tipo_rapporto = db.get(CatTipoRapporto, rapporto.tipo_rapporto_id)
    mansione = db.get(CatMansione, rapporto.mansione_id) if rapporto.mansione_id else None
    reparto = db.get(CatReparto, rapporto.reparto_id) if rapporto.reparto_id else None
    return RapportoAziendaRead(
        id=rapporto.id,
        tipo_rapporto=tipo_rapporto,
        data_inizio=rapporto.data_inizio,
        data_fine_prevista=rapporto.data_fine_prevista,
        data_fine_effettiva=rapporto.data_fine_effettiva,
        mansione=mansione,
        reparto=reparto,
        stato=rapporto.stato,
        tempo_lavoro=rapporto.tempo_lavoro,
        percentuale_part_time=float(rapporto.percentuale_part_time) if rapporto.percentuale_part_time else None,
        ccnl=rapporto.ccnl,
        livello_inquadramento=rapporto.livello_inquadramento,
        note=rapporto.note,
    )


def calcola_eta(data_nascita: date | None) -> int | None:
    """Età derivata dalla data di nascita (§6): mai salvata, ricalcolata a
    ogni lettura sulla data corrente. Considera se il compleanno dell'anno
    corrente è già trascorso."""

    if data_nascita is None:
        return None
    oggi = date.today()
    eta = oggi.year - data_nascita.year
    if (oggi.month, oggi.day) < (data_nascita.month, data_nascita.day):
        eta -= 1
    return eta


def _dossier_a_read(persona: AnaPersone) -> PersonaDossierRead:
    dati = {campo: getattr(persona, campo) for campo in _DOSSIER_CAMPI_DIRETTI}
    return PersonaDossierRead(
        data_nascita=persona.data_nascita,
        eta=calcola_eta(persona.data_nascita),
        luogo_nascita=persona.luogo_nascita,
        sesso=persona.sesso,
        cittadinanza=persona.nazionalita,
        comprensione_lingua_italiana=persona.conoscenza_lingua_italiana,
        **dati,
    )


def profilo_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> PersonaProfiloRead | None:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        return None
    rapporto = rapporto_corrente(db, persona_id)
    return PersonaProfiloRead(
        id=persona.id,
        nome=persona.nome,
        cognome=persona.cognome,
        codice_fiscale=persona.codice_fiscale,
        telefono=persona.telefono,
        email=persona.email,
        dossier=_dossier_a_read(persona),
        rapporto_corrente=rapporto_a_read(db, rapporto) if rapporto is not None else None,
        created_at=persona.created_at,
        updated_at=persona.updated_at,
    )


def aggiorna_profilo_persona(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: PersonaProfiloUpdate
) -> AnaPersone | None:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        return None
    if payload.persona is not None:
        for campo, valore in payload.persona.model_dump(exclude_unset=True).items():
            setattr(persona, campo, valore)
    if payload.dossier is not None:
        _applica_dossier(persona, payload.dossier)
    if payload.rapporto is not None:
        _applica_dettagli_contrattuali(db, azienda_id, persona_id, payload.rapporto)
    return persona


def _applica_dossier(persona: AnaPersone, dossier: PersonaDossierUpdate) -> None:
    for campo in _DOSSIER_CAMPI_DIRETTI:
        setattr(persona, campo, getattr(dossier, campo))
    persona.sesso = dossier.sesso
    persona.nazionalita = dossier.cittadinanza
    persona.conoscenza_lingua_italiana = dossier.comprensione_lingua_italiana
    persona.data_nascita = dossier.data_nascita
    persona.luogo_nascita = dossier.luogo_nascita


def _applica_dettagli_contrattuali(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, dettagli: RapportoDettagliUpdate
) -> None:
    rapporto = rapporto_corrente(db, persona_id)
    if rapporto is None:
        # Nessun rapporto ancora registrato per questa persona (es. un
        # incarico CCIAA senza rapporto di lavoro): la sezione "Dettagli
        # contrattuali" del Dossier deve poter registrare il primo rapporto,
        # non solo modificarne uno esistente — richiede in più "Durata del
        # rapporto" e "Data di inizio", altrimenti non compilabili altrove.
        if dettagli.tipo_rapporto_id is None or dettagli.data_inizio is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Durata del rapporto e data di inizio sono obbligatorie per registrare il primo rapporto.",
            )
        rapporto = PerRapportoAzienda(
            azienda_id=azienda_id,
            persona_id=persona_id,
            tipo_rapporto_id=dettagli.tipo_rapporto_id,
            data_inizio=dettagli.data_inizio,
            stato="ATTIVO",
        )
        db.add(rapporto)
        db.flush()
    tipo_rapporto = db.get(CatTipoRapporto, rapporto.tipo_rapporto_id)
    if tipo_rapporto is not None and tipo_rapporto.codice == "DETERMINATO" and dettagli.data_fine_prevista is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La data di fine prevista è obbligatoria per un rapporto a tempo determinato.",
        )
    if dettagli.data_fine_prevista is not None and dettagli.data_fine_prevista < rapporto.data_inizio:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La data di fine prevista non può precedere la data di inizio del rapporto.",
        )
    rapporto.data_fine_prevista = dettagli.data_fine_prevista
    rapporto.tempo_lavoro = dettagli.tempo_lavoro
    rapporto.percentuale_part_time = dettagli.percentuale_part_time
    rapporto.ccnl = dettagli.ccnl
    rapporto.livello_inquadramento = dettagli.livello_inquadramento


def lista_persone(
    db: Session,
    azienda_id: uuid.UUID,
    *,
    q: str | None,
    reparto_id: uuid.UUID | None,
    mansione_id: uuid.UUID | None,
    ruolo_id: uuid.UUID | None,
    stato_rapporto: str | None,
    params: PageParams,
) -> Page[PersonaListRow]:
    """Elenco Persone (§9.1/§9.2). Il rapporto corrente e i ruoli
    principali sono letti con una query per pagina (non per riga): evita
    N+1 sulle relazioni, richiesto esplicitamente dalla specifica (§9.5,
    AC-02)."""

    stmt = select(AnaPersone).where(AnaPersone.azienda_id == azienda_id)

    # Il filtro su rapporto/mansione/reparto/ruolo richiede un JOIN sul
    # rapporto corrente: costruito qui invece che in una subquery separata
    # perché la stessa condizione (rapporto aperto) serve sia per filtrare
    # sia per ordinare.
    rapporto_aperto = PerRapportoAzienda.data_fine_effettiva.is_(None)
    if reparto_id is not None or mansione_id is not None or stato_rapporto is not None:
        stmt = stmt.join(PerRapportoAzienda, PerRapportoAzienda.persona_id == AnaPersone.id).where(rapporto_aperto)
        if reparto_id is not None:
            stmt = stmt.where(PerRapportoAzienda.reparto_id == reparto_id)
        if mansione_id is not None:
            stmt = stmt.where(PerRapportoAzienda.mansione_id == mansione_id)
        if stato_rapporto is not None:
            stmt = stmt.where(PerRapportoAzienda.stato == stato_rapporto)

    if ruolo_id is not None:
        stmt = stmt.join(PerIncarico, PerIncarico.persona_id == AnaPersone.id).where(
            PerIncarico.ruolo_id == ruolo_id, PerIncarico.stato == "ATTIVO"
        )

    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where((AnaPersone.nome.ilike(pattern)) | (AnaPersone.cognome.ilike(pattern)))

    stmt = stmt.order_by(AnaPersone.cognome, AnaPersone.nome).distinct()

    persone, total = paginate(db, stmt, params)
    persona_ids = [p.id for p in persone]

    rapporti_per_persona: dict[uuid.UUID, PerRapportoAzienda] = {}
    if persona_ids:
        rapporti = db.scalars(
            select(PerRapportoAzienda)
            .where(PerRapportoAzienda.persona_id.in_(persona_ids))
            .order_by(PerRapportoAzienda.data_fine_effettiva.is_(None).desc(), PerRapportoAzienda.data_inizio.desc())
        ).all()
        for r in rapporti:
            rapporti_per_persona.setdefault(r.persona_id, r)  # il primo per persona è il più recente/aperto

    mansione_ids = {r.mansione_id for r in rapporti_per_persona.values() if r.mansione_id is not None}
    reparto_ids = {r.reparto_id for r in rapporti_per_persona.values() if r.reparto_id is not None}
    mansioni_per_id = {m.id: m for m in db.scalars(select(CatMansione).where(CatMansione.id.in_(mansione_ids)))} if mansione_ids else {}
    reparti_per_id = {r.id: r for r in db.scalars(select(CatReparto).where(CatReparto.id.in_(reparto_ids)))} if reparto_ids else {}

    def _summary(r: PerRapportoAzienda | None) -> RapportoCorrenteSummary | None:
        if r is None:
            return None
        return RapportoCorrenteSummary(
            stato=r.stato,
            data_inizio=r.data_inizio,
            mansione=mansioni_per_id.get(r.mansione_id) if r.mansione_id else None,
            reparto=reparti_per_id.get(r.reparto_id) if r.reparto_id else None,
        )

    ruoli_per_persona: dict[uuid.UUID, list[str]] = {pid: [] for pid in persona_ids}
    if persona_ids:
        righe_ruoli = db.execute(
            select(PerIncarico.persona_id, CatRuolo.denominazione)
            .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
            .where(PerIncarico.persona_id.in_(persona_ids), PerIncarico.stato == "ATTIVO")
            .order_by(CatRuolo.ordine_visualizzazione)
        ).all()
        for persona_id, denominazione in righe_ruoli:
            ruoli_per_persona.setdefault(persona_id, []).append(denominazione)

    items = [
        PersonaListRow(
            id=p.id,
            nome=p.nome,
            cognome=p.cognome,
            rapporto=_summary(rapporti_per_persona.get(p.id)),
            ruoli_principali=ruoli_per_persona.get(p.id, []),
        )
        for p in persone
    ]
    return Page(items=items, total=total, page=params.page, page_size=params.page_size)


# ---------------------------------------------------------------------------
# Cataloghi per azienda (mansioni/reparti) — CRUD minimo: lista + crea,
# nessun update/delete richiesto ancora dalla Fase 1.
# ---------------------------------------------------------------------------


def lista_mansioni(db: Session, azienda_id: uuid.UUID) -> list[CatMansione]:
    stmt = (
        select(CatMansione)
        .where(CatMansione.azienda_id == azienda_id, CatMansione.attivo.is_(True))
        .order_by(CatMansione.ordine_visualizzazione, CatMansione.denominazione)
    )
    return list(db.scalars(stmt).all())


def crea_mansione(db: Session, azienda_id: uuid.UUID, payload: CatalogoCreate) -> CatMansione:
    mansione = CatMansione(azienda_id=azienda_id, **payload.model_dump())
    db.add(mansione)
    db.commit()
    db.refresh(mansione)
    return mansione


def lista_reparti(db: Session, azienda_id: uuid.UUID) -> list[CatReparto]:
    stmt = (
        select(CatReparto)
        .where(CatReparto.azienda_id == azienda_id, CatReparto.attivo.is_(True))
        .order_by(CatReparto.ordine_visualizzazione, CatReparto.denominazione)
    )
    return list(db.scalars(stmt).all())


def crea_reparto(db: Session, azienda_id: uuid.UUID, payload: CatalogoCreate) -> CatReparto:
    reparto = CatReparto(azienda_id=azienda_id, **payload.model_dump())
    db.add(reparto)
    db.commit()
    db.refresh(reparto)
    return reparto


def lista_tipi_rapporto(db: Session) -> list[CatTipoRapporto]:
    stmt = select(CatTipoRapporto).where(CatTipoRapporto.attivo.is_(True)).order_by(CatTipoRapporto.ordine_visualizzazione)
    return list(db.scalars(stmt).all())


# ---------------------------------------------------------------------------
# Ruoli e responsabilità (§13) — riusa il motore ruolo+incarico esistente,
# nessuna query/scrittura propria su per_incarichi: la creazione/modifica/
# cessazione di un'assegnazione passa dagli endpoint già esistenti
# `POST/PUT /api/personale/incarichi` (app.api.personale, motore CCIAA),
# qui c'è solo la lettura per persona che non esisteva ancora.
# ---------------------------------------------------------------------------


def _documentazione_stato(fonte: str, codici_documento: list[str], valori: dict[str, object]) -> str:
    if fonte == "CCIAA":
        return "IMPORTATO_CCIAA"
    if not codici_documento:
        return "NON_RICHIESTO"
    compilati = [c for c in codici_documento if valori.get(c)]
    if len(compilati) == len(codici_documento):
        return "PRESENTE"
    if not compilati:
        return "NON_PRESENTE"
    return "DA_INTEGRARE"


def ruoli_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[PersonaRuoloRead]:
    stmt = (
        select(PerIncarico)
        .where(PerIncarico.persona_id == persona_id, PerIncarico.azienda_id == azienda_id)
        .order_by(PerIncarico.created_at)
    )
    incarichi = db.scalars(stmt).all()

    risultato: list[PersonaRuoloRead] = []
    for incarico in incarichi:
        ruolo = db.get(CatRuolo, incarico.ruolo_id)
        valori = leggi_valori(db, incarico.id)
        config = configurazione_ruolo(db, incarico.ruolo_id)
        codici_documento = [codice for codice, (_rel, car) in config.items() if car.tipo_dato == "DOCUMENTO"]
        risultato.append(
            PersonaRuoloRead(
                id=incarico.id,
                ruolo_id=incarico.ruolo_id,
                ruolo_denominazione=ruolo.denominazione if ruolo is not None else "—",
                ambito=ruolo.ambito if ruolo is not None else None,
                fonte=incarico.fonte,
                stato=incarico.stato,
                data_inizio=valori.get("A01"),
                data_fine=valori.get("A02"),
                documentazione=_documentazione_stato(incarico.fonte, codici_documento, valori),
                note=incarico.note,
            )
        )
    return risultato


# ---------------------------------------------------------------------------
# Documenti personali (completamento Dossier personale) — record multipli
# per persona, nessun collegamento ad allegati reali (§ decisione utente).
# ---------------------------------------------------------------------------


def lista_tipi_documento(db: Session) -> list[CatTipoDocumentoIdentita]:
    stmt = (
        select(CatTipoDocumentoIdentita)
        .where(CatTipoDocumentoIdentita.attivo.is_(True))
        .order_by(CatTipoDocumentoIdentita.ordine_visualizzazione)
    )
    return list(db.scalars(stmt).all())


def _documento_a_read(db: Session, documento: PerDocumentoPersonale) -> DocumentoPersonaleRead:
    tipo = db.get(CatTipoDocumentoIdentita, documento.tipo_documento_id)
    return DocumentoPersonaleRead(
        id=documento.id,
        tipo_documento=tipo,
        numero=documento.numero,
        data_rilascio=documento.data_rilascio,
        data_scadenza=documento.data_scadenza,
        numero_allegati=0,
    )


def lista_documenti_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[DocumentoPersonaleRead]:
    stmt = (
        select(PerDocumentoPersonale)
        .where(PerDocumentoPersonale.persona_id == persona_id, PerDocumentoPersonale.azienda_id == azienda_id)
        .order_by(PerDocumentoPersonale.created_at)
    )
    documenti = db.scalars(stmt).all()
    return [_documento_a_read(db, d) for d in documenti]


def crea_documento_persona(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: DocumentoPersonaleCreate
) -> DocumentoPersonaleRead:
    documento = PerDocumentoPersonale(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipo_documento_id=payload.tipo_documento_id,
        numero=payload.numero,
        data_rilascio=payload.data_rilascio,
        data_scadenza=payload.data_scadenza,
    )
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return _documento_a_read(db, documento)


def _documento_owned_or_none(db: Session, documento_id: uuid.UUID, azienda_id: uuid.UUID) -> PerDocumentoPersonale | None:
    documento = db.get(PerDocumentoPersonale, documento_id)
    if documento is None or documento.azienda_id != azienda_id:
        return None
    return documento


def aggiorna_documento_persona(
    db: Session, azienda_id: uuid.UUID, documento_id: uuid.UUID, payload: DocumentoPersonaleUpdate
) -> DocumentoPersonaleRead | None:
    documento = _documento_owned_or_none(db, documento_id, azienda_id)
    if documento is None:
        return None
    documento.tipo_documento_id = payload.tipo_documento_id
    documento.numero = payload.numero
    documento.data_rilascio = payload.data_rilascio
    documento.data_scadenza = payload.data_scadenza
    db.commit()
    db.refresh(documento)
    return _documento_a_read(db, documento)


def elimina_documento_persona(db: Session, azienda_id: uuid.UUID, documento_id: uuid.UUID) -> bool:
    documento = _documento_owned_or_none(db, documento_id, azienda_id)
    if documento is None:
        return False
    db.delete(documento)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Mansionario del ruolo (correzione "Mansionario e profilo standard delle
# competenze del ruolo") — cfg_ruoli_azienda + rel_ruoli_voci_valutazione +
# cat_voci_valutazione_personale, tabelle già esistenti mai popolate.
# Combinazione Azienda + Ruolo = un solo profilo, condiviso da tutte le
# persone che ricoprono il ruolo in quell'azienda (mai copiato altrove).
# ---------------------------------------------------------------------------


def _configurazione_ruolo_azienda(
    db: Session, azienda_id: uuid.UUID, ruolo_id: uuid.UUID, *, crea_se_assente: bool
) -> CfgRuoloAzienda | None:
    cfg = db.scalars(
        select(CfgRuoloAzienda).where(CfgRuoloAzienda.azienda_id == azienda_id, CfgRuoloAzienda.ruolo_id == ruolo_id)
    ).first()
    if cfg is None and crea_se_assente:
        cfg = CfgRuoloAzienda(azienda_id=azienda_id, ruolo_id=ruolo_id)
        db.add(cfg)
        db.flush()
    return cfg


def mansionario_ruolo(db: Session, azienda_id: uuid.UUID, ruolo_id: uuid.UUID) -> list[CompetenzaRuoloRead]:
    cfg = _configurazione_ruolo_azienda(db, azienda_id, ruolo_id, crea_se_assente=False)
    if cfg is None:
        return []
    righe = db.scalars(
        select(RelRuoloVoceValutazione)
        .where(RelRuoloVoceValutazione.configurazione_ruolo_id == cfg.id, RelRuoloVoceValutazione.attiva.is_(True))
        .order_by(RelRuoloVoceValutazione.ordine)
    ).all()
    risultato: list[CompetenzaRuoloRead] = []
    for riga in righe:
        voce = db.get(CatVoceValutazionePersonale, riga.voce_id)
        if voce is None or not voce.attiva:
            continue
        risultato.append(CompetenzaRuoloRead(id=riga.id, voce_id=voce.id, nome=voce.nome, descrizione=voce.descrizione))
    return risultato


def _slug_codice(nome: str) -> str:
    base = re.sub(r"[^A-Za-z0-9]+", "_", nome.strip().upper()).strip("_")
    return base[:70] or "VOCE"


def _codice_univoco_azienda(db: Session, azienda_id: uuid.UUID, nome: str) -> str:
    base = _slug_codice(nome)
    codice = base
    suffisso = 1
    while (
        db.scalars(
            select(CatVoceValutazionePersonale).where(
                CatVoceValutazionePersonale.azienda_id == azienda_id, CatVoceValutazionePersonale.codice == codice
            )
        ).first()
        is not None
    ):
        suffisso += 1
        codice = f"{base}_{suffisso}"
    return codice


def aggiungi_competenza_ruolo(
    db: Session, azienda_id: uuid.UUID, ruolo_id: uuid.UUID, payload: CompetenzaRuoloCreate
) -> CompetenzaRuoloRead:
    cfg = _configurazione_ruolo_azienda(db, azienda_id, ruolo_id, crea_se_assente=True)
    assert cfg is not None

    duplicato = db.execute(
        select(RelRuoloVoceValutazione)
        .join(CatVoceValutazionePersonale, CatVoceValutazionePersonale.id == RelRuoloVoceValutazione.voce_id)
        .where(
            RelRuoloVoceValutazione.configurazione_ruolo_id == cfg.id,
            RelRuoloVoceValutazione.attiva.is_(True),
            CatVoceValutazionePersonale.nome.ilike(payload.nome.strip()),
        )
    ).first()
    if duplicato is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Esiste già una competenza con questo nome per questo ruolo."
        )

    voce = CatVoceValutazionePersonale(
        azienda_id=azienda_id,
        codice=_codice_univoco_azienda(db, azienda_id, payload.nome),
        macroarea="COMPETENCE",
        nome=payload.nome.strip(),
        descrizione=payload.descrizione,
    )
    db.add(voce)
    db.flush()
    relazione = RelRuoloVoceValutazione(configurazione_ruolo_id=cfg.id, voce_id=voce.id)
    db.add(relazione)
    db.commit()
    db.refresh(relazione)
    return CompetenzaRuoloRead(id=relazione.id, voce_id=voce.id, nome=voce.nome, descrizione=voce.descrizione)


def _relazione_competenza_owned_or_none(
    db: Session, azienda_id: uuid.UUID, relazione_id: uuid.UUID
) -> RelRuoloVoceValutazione | None:
    relazione = db.get(RelRuoloVoceValutazione, relazione_id)
    if relazione is None:
        return None
    cfg = db.get(CfgRuoloAzienda, relazione.configurazione_ruolo_id)
    if cfg is None or cfg.azienda_id != azienda_id:
        return None
    return relazione


def aggiorna_competenza_ruolo(
    db: Session, azienda_id: uuid.UUID, relazione_id: uuid.UUID, payload: CompetenzaRuoloUpdate
) -> CompetenzaRuoloRead | None:
    relazione = _relazione_competenza_owned_or_none(db, azienda_id, relazione_id)
    if relazione is None:
        return None
    voce = db.get(CatVoceValutazionePersonale, relazione.voce_id)
    if voce is None:
        return None
    # Il nome/descrizione appartengono al profilo standard dell'azienda (§9
    # della correzione): un solo aggiornamento in place, mai una copia per
    # persona. Le valutazioni storiche non sono ancora implementate, ma
    # `per_valutazioni_personale_dettagli.snapshot_nome` è già pensata per
    # conservare il nome al momento della valutazione anche se qui cambia.
    voce.nome = payload.nome.strip()
    voce.descrizione = payload.descrizione
    db.commit()
    db.refresh(voce)
    return CompetenzaRuoloRead(id=relazione.id, voce_id=voce.id, nome=voce.nome, descrizione=voce.descrizione)


def rimuovi_competenza_ruolo(db: Session, azienda_id: uuid.UUID, relazione_id: uuid.UUID) -> bool:
    relazione = _relazione_competenza_owned_or_none(db, azienda_id, relazione_id)
    if relazione is None:
        return False
    # Disattiva solo la relazione ruolo-competenza (§10): la voce di
    # catalogo non viene toccata, resta disponibile per lo storico e per
    # eventuali altri ruoli che la utilizzano.
    relazione.attiva = False
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Formazione e abilitazioni (correzione "Struttura di 'Formazione e
# abilitazioni'") — riusa cat_corsi_formazione/per_formazione e
# cat_abilitazioni/per_abilitazioni, già esistenti dalla migrazione
# 014/0101 e mai popolati. F e A restano due tabelle distinte lato
# dominio (cataloghi e vincoli diversi: corsi per azienda, abilitazioni
# di sistema); il servizio le unifica in un'unica lista/form per il
# frontend (§19), senza mai permettere di cambiare tipo dopo la
# creazione (§17: cambiare tabella non è un aggiornamento in place).
# ---------------------------------------------------------------------------

_SOGLIA_PREAVVISO_DEFAULT_GIORNI = 30
"""Usata solo quando il singolo corso/abilitazione non ha una soglia
configurata (colonna nullable): non esiste una soglia di sistema
centralizzata in piattaforma (§15 della correzione), quindi un corso o
un'abilitazione senza soglia propria ricade su questo valore finché
qualcuno non ne configura una specifica."""


def _stato_registrazione_formativa(data_scadenza: date, soglia_giorni: int | None, oggi: date | None = None) -> str:
    oggi = oggi or date.today()
    if data_scadenza < oggi:
        return "SCADUTA"
    soglia = soglia_giorni if soglia_giorni is not None else _SOGLIA_PREAVVISO_DEFAULT_GIORNI
    if data_scadenza <= oggi + timedelta(days=soglia):
        return "IN_SCADENZA"
    return "VALIDA"


def lista_corsi_formazione(db: Session, azienda_id: uuid.UUID) -> list[CatCorsoFormazione]:
    stmt = (
        select(CatCorsoFormazione)
        .where(CatCorsoFormazione.azienda_id == azienda_id, CatCorsoFormazione.attivo.is_(True))
        .order_by(CatCorsoFormazione.denominazione)
    )
    return list(db.scalars(stmt).all())


def crea_corso_formazione(db: Session, azienda_id: uuid.UUID, payload: CatalogoCorsoCreate) -> CatCorsoFormazione:
    corso = CatCorsoFormazione(azienda_id=azienda_id, codice=payload.codice, denominazione=payload.denominazione.strip())
    db.add(corso)
    db.commit()
    db.refresh(corso)
    return corso


def lista_abilitazioni_catalogo(db: Session) -> list[CatAbilitazione]:
    # Catalogo globale di sistema (come cat_ruoli): sola lettura da questo
    # modulo, nessun endpoint di creazione — l'elenco iniziale va proposto
    # e approvato a parte (commento esplicito della migrazione 014).
    stmt = (
        select(CatAbilitazione)
        .where(CatAbilitazione.attivo.is_(True))
        .order_by(CatAbilitazione.ordine_visualizzazione, CatAbilitazione.denominazione)
    )
    return list(db.scalars(stmt).all())


def _riga_da_formazione(riga: PerFormazione, corso: CatCorsoFormazione) -> RegistrazioneFormativaRead:
    return RegistrazioneFormativaRead(
        id=riga.id,
        tipo="FORMAZIONE",
        catalogo_id=corso.id,
        denominazione=corso.denominazione,
        ente_formatore=riga.ente_formatore,
        data_conseguimento=riga.data_completamento,
        data_scadenza=riga.scadenza_esplicita,
        durata_ore=riga.ore_riconosciute,
        documento_presente=riga.documento_id is not None,
        obbligatorio=corso.obbligatorio,
        stato=_stato_registrazione_formativa(riga.scadenza_esplicita, corso.soglia_preavviso_giorni),
    )


def _riga_da_abilitazione(riga: PerAbilitazione, abilitazione: CatAbilitazione) -> RegistrazioneFormativaRead:
    return RegistrazioneFormativaRead(
        id=riga.id,
        tipo="ABILITAZIONE",
        catalogo_id=abilitazione.id,
        denominazione=abilitazione.denominazione,
        ente_formatore=None,
        data_conseguimento=riga.data_conseguimento,
        data_scadenza=riga.data_scadenza,
        durata_ore=riga.durata_ore,
        documento_presente=riga.documento_id is not None,
        obbligatorio=abilitazione.obbligatorio,
        stato=_stato_registrazione_formativa(riga.data_scadenza, abilitazione.soglia_preavviso_giorni),
    )


def registrazioni_formative_persona(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID
) -> list[RegistrazioneFormativaRead]:
    stmt_f = (
        select(PerFormazione, CatCorsoFormazione)
        .join(CatCorsoFormazione, CatCorsoFormazione.id == PerFormazione.corso_id)
        .where(PerFormazione.azienda_id == azienda_id, PerFormazione.persona_id == persona_id)
    )
    righe = [_riga_da_formazione(riga, corso) for riga, corso in db.execute(stmt_f).all()]

    stmt_a = (
        select(PerAbilitazione, CatAbilitazione)
        .join(CatAbilitazione, CatAbilitazione.id == PerAbilitazione.abilitazione_catalogo_id)
        .where(PerAbilitazione.azienda_id == azienda_id, PerAbilitazione.persona_id == persona_id)
    )
    righe += [_riga_da_abilitazione(riga, abilitazione) for riga, abilitazione in db.execute(stmt_a).all()]

    righe.sort(key=lambda r: r.data_conseguimento, reverse=True)
    return righe


def crea_registrazione_formativa(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: RegistrazioneFormativaCreate
) -> RegistrazioneFormativaRead:
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")

    if payload.tipo == "FORMAZIONE":
        corso = db.get(CatCorsoFormazione, payload.catalogo_id)
        if corso is None or corso.azienda_id != azienda_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Corso di formazione non trovato.")
        riga = PerFormazione(
            azienda_id=azienda_id,
            persona_id=persona_id,
            corso_id=corso.id,
            data_completamento=payload.data_conseguimento,
            ore_riconosciute=payload.durata_ore,
            ente_formatore=(payload.ente_formatore or "").strip(),
            scadenza_esplicita=payload.data_scadenza,
        )
        db.add(riga)
        db.commit()
        db.refresh(riga)
        return _riga_da_formazione(riga, corso)

    abilitazione = db.get(CatAbilitazione, payload.catalogo_id)
    if abilitazione is None or not abilitazione.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Abilitazione non trovata.")
    riga = PerAbilitazione(
        azienda_id=azienda_id,
        persona_id=persona_id,
        abilitazione_catalogo_id=abilitazione.id,
        data_conseguimento=payload.data_conseguimento,
        data_scadenza=payload.data_scadenza,
        durata_ore=payload.durata_ore,
    )
    db.add(riga)
    db.commit()
    db.refresh(riga)
    return _riga_da_abilitazione(riga, abilitazione)


def aggiorna_registrazione_formativa(
    db: Session,
    azienda_id: uuid.UUID,
    tipo: str,
    registrazione_id: uuid.UUID,
    payload: RegistrazioneFormativaUpdate,
) -> RegistrazioneFormativaRead | None:
    if payload.tipo != tipo:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Il tipo di una registrazione non può essere cambiato dopo la creazione.",
        )

    if tipo == "FORMAZIONE":
        riga = db.get(PerFormazione, registrazione_id)
        if riga is None or riga.azienda_id != azienda_id:
            return None
        corso = db.get(CatCorsoFormazione, payload.catalogo_id)
        if corso is None or corso.azienda_id != azienda_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Corso di formazione non trovato.")
        riga.corso_id = corso.id
        riga.data_completamento = payload.data_conseguimento
        riga.scadenza_esplicita = payload.data_scadenza
        riga.ore_riconosciute = payload.durata_ore
        riga.ente_formatore = (payload.ente_formatore or "").strip()
        db.commit()
        db.refresh(riga)
        return _riga_da_formazione(riga, corso)

    riga = db.get(PerAbilitazione, registrazione_id)
    if riga is None or riga.azienda_id != azienda_id:
        return None
    abilitazione = db.get(CatAbilitazione, payload.catalogo_id)
    if abilitazione is None or not abilitazione.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Abilitazione non trovata.")
    riga.abilitazione_catalogo_id = abilitazione.id
    riga.data_conseguimento = payload.data_conseguimento
    riga.data_scadenza = payload.data_scadenza
    riga.durata_ore = payload.durata_ore
    db.commit()
    db.refresh(riga)
    return _riga_da_abilitazione(riga, abilitazione)


# ---------------------------------------------------------------------------
# Idoneità sanitaria (precisazione "Struttura di 'Idoneità sanitaria'") —
# riusa per_giudizi_idoneita (§15.1, migrazione 014/0101, mai popolata) per
# le visite completate e per_attivita (Scadenziario, migrazione 015/0102,
# mai popolata né usata altrove) per l'appuntamento pianificato e il
# promemoria. Nessuno stato "vigente"/"sostituita" viene salvato: è sempre
# ricalcolato in lettura dall'ordinamento per data_visita (§10 — la visita
# con data_visita più recente è l'unica "vigente", tutte le altre sono
# SOSTITUITA), così una modifica successiva a una visita non richiede mai
# di aggiornare le righe vicine.
# ---------------------------------------------------------------------------

_TIPO_ATTIVITA_VISITA = "VISITA_MEDICA"
_TIPO_ATTIVITA_PROMEMORIA = "PROMEMORIA_VISITA"
_CATEGORIA_SORVEGLIANZA = "SORVEGLIANZA_SANITARIA"


def lista_tipi_visita(db: Session) -> list[CatTipoVisita]:
    # Catalogo globale di sistema (come cat_abilitazioni): sola lettura da
    # questo modulo.
    stmt = select(CatTipoVisita).where(CatTipoVisita.attivo.is_(True)).order_by(CatTipoVisita.ordine_visualizzazione)
    return list(db.scalars(stmt).all())


def _aggiungi_mesi(base: date, mesi: int) -> date:
    """Somma mesi di calendario a una data, riducendo il giorno al massimo
    valido del mese di arrivo (es. 31/01 + 1 mese = 28 o 29/02): nessuna
    dipendenza da python-dateutil, non presente in requirements.txt."""

    mese_totale = base.month - 1 + mesi
    anno = base.year + mese_totale // 12
    mese = mese_totale % 12 + 1
    giorno = min(base.day, calendar.monthrange(anno, mese)[1])
    return date(anno, mese, giorno)


def _stato_giudizio(data_scadenza: date | None, *, e_vigente: bool, oggi: date | None = None) -> str:
    if not e_vigente:
        # Una visita completata precedente resta sempre "Sostituita" quando
        # ne esiste una più recente (§10): non alimenta più lo stato
        # corrente, indipendentemente dalla propria scadenza originaria.
        return "SOSTITUITA"
    if data_scadenza is None:
        return "VALIDA"
    oggi = oggi or date.today()
    if data_scadenza < oggi:
        return "SCADUTA"
    # Nessuna soglia di sistema centralizzata in piattaforma: stesso
    # fallback già in uso per Formazione/Abilitazioni (_stato_registrazione_
    # formativa sopra), non esiste un catalogo con soglia propria per le
    # tipologie di visita.
    if data_scadenza <= oggi + timedelta(days=_SOGLIA_PREAVVISO_DEFAULT_GIORNI):
        return "IN_SCADENZA"
    return "VALIDA"


def _giudizio_a_read(giudizio: PerGiudizioIdoneita, tipo_visita: CatTipoVisita, *, e_vigente: bool) -> GiudizioIdoneitaRead:
    testo_prescrizioni = (giudizio.prescrizioni_minime or "").strip()
    return GiudizioIdoneitaRead(
        id=giudizio.id,
        tipo_visita=tipo_visita,
        data_visita=giudizio.data_visita,
        giudizio=giudizio.giudizio,
        periodicita_mesi=giudizio.periodicita_mesi,
        data_scadenza=giudizio.data_scadenza,
        medico_competente=giudizio.medico_competente,
        prescrizioni_presenti=bool(testo_prescrizioni),
        prescrizioni_minime=giudizio.prescrizioni_minime,
        documento_presente=giudizio.documento_id is not None,
        stato=_stato_giudizio(giudizio.data_scadenza, e_vigente=e_vigente),
    )


def _storico_giudizi_idoneita(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[GiudizioIdoneitaRead]:
    stmt = (
        select(PerGiudizioIdoneita, CatTipoVisita)
        .join(CatTipoVisita, CatTipoVisita.id == PerGiudizioIdoneita.tipo_visita_id)
        .where(PerGiudizioIdoneita.azienda_id == azienda_id, PerGiudizioIdoneita.persona_id == persona_id)
        .order_by(PerGiudizioIdoneita.data_visita.desc(), PerGiudizioIdoneita.created_at.desc())
    )
    righe = db.execute(stmt).all()
    return [_giudizio_a_read(giudizio, tipo_visita, e_vigente=(indice == 0)) for indice, (giudizio, tipo_visita) in enumerate(righe)]


def _indicatori_idoneita(storico: list[GiudizioIdoneitaRead]) -> IndicatoriIdoneitaRead:
    # Il giudizio vigente è sempre il primo dello storico (ordinato per
    # data_visita decrescente): "Ultimo giudizio"/"Valido fino al" non
    # devono mai leggere una visita solo pianificata (§3), che infatti non
    # vive in questa tabella ma nello Scadenziario (per_attivita).
    if not storico:
        return IndicatoriIdoneitaRead()
    vigente = storico[0]
    return IndicatoriIdoneitaRead(
        ultimo_giudizio=vigente.giudizio,
        valido_fino_al=vigente.data_scadenza,
        limitazioni_segnalate=vigente.prescrizioni_presenti,
    )


def _prossimo_appuntamento_visita(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> PerAttivita | None:
    stmt = (
        select(PerAttivita)
        .where(
            PerAttivita.azienda_id == azienda_id,
            PerAttivita.persona_id == persona_id,
            PerAttivita.tipo == _TIPO_ATTIVITA_VISITA,
            PerAttivita.stato == "PIANIFICATA",
            PerAttivita.data_scadenza >= date.today(),
        )
        .order_by(PerAttivita.data_scadenza, PerAttivita.ora)
        .limit(1)
    )
    return db.scalars(stmt).first()


def _appuntamento_a_read(appuntamento: PerAttivita) -> AppuntamentoVisitaRead:
    return AppuntamentoVisitaRead(
        id=appuntamento.id,
        titolo=appuntamento.titolo,
        data=appuntamento.data_scadenza,
        ora=appuntamento.ora,
        medico_competente=appuntamento.medico_competente,
        luogo=appuntamento.luogo,
        note=appuntamento.note,
        stato=appuntamento.stato,
    )


def idoneita_sanitaria_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> IdoneitaSanitariaRead:
    storico = _storico_giudizi_idoneita(db, azienda_id, persona_id)
    appuntamento = _prossimo_appuntamento_visita(db, azienda_id, persona_id)
    return IdoneitaSanitariaRead(
        indicatori=_indicatori_idoneita(storico),
        storico=storico,
        prossimo_appuntamento=_appuntamento_a_read(appuntamento) if appuntamento is not None else None,
        # Il modulo Sicurezza non esiste ancora in piattaforma (§16): stato
        # vuoto sempre, mai esposizioni dimostrative.
        esposizioni=[],
    )


def crea_giudizio_idoneita(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: GiudizioIdoneitaCreate
) -> GiudizioIdoneitaRead:
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    tipo_visita = db.get(CatTipoVisita, payload.tipo_visita_id)
    if tipo_visita is None or not tipo_visita.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipo di visita non trovato.")

    # La scadenza è proposta dal frontend come data_visita + periodicità
    # (§5) e resta sempre modificabile; se il chiamante non la invia
    # affatto ma la periodicità è presente, il backend la calcola comunque
    # (difesa in profondità: "ogni regola che conta viene ri-verificata
    # dalle API", CLAUDE.md).
    data_scadenza = payload.data_scadenza
    if data_scadenza is None and payload.periodicita_mesi is not None:
        data_scadenza = _aggiungi_mesi(payload.data_visita, payload.periodicita_mesi)

    giudizio = PerGiudizioIdoneita(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipo_visita_id=tipo_visita.id,
        data_visita=payload.data_visita,
        giudizio=payload.giudizio,
        periodicita_mesi=payload.periodicita_mesi,
        data_scadenza=data_scadenza,
        medico_competente=payload.medico_competente,
        prescrizioni_minime=payload.prescrizioni_minime if payload.prescrizioni_presenti else None,
    )
    db.add(giudizio)
    db.commit()
    db.refresh(giudizio)
    e_vigente = giudizio.id == _storico_giudizi_idoneita(db, azienda_id, persona_id)[0].id
    return _giudizio_a_read(giudizio, tipo_visita, e_vigente=e_vigente)


def _giudizio_owned_or_none(db: Session, azienda_id: uuid.UUID, visita_id: uuid.UUID) -> PerGiudizioIdoneita | None:
    giudizio = db.get(PerGiudizioIdoneita, visita_id)
    if giudizio is None or giudizio.azienda_id != azienda_id:
        return None
    return giudizio


def aggiorna_giudizio_idoneita(
    db: Session, azienda_id: uuid.UUID, visita_id: uuid.UUID, payload: GiudizioIdoneitaUpdate
) -> GiudizioIdoneitaRead | None:
    giudizio = _giudizio_owned_or_none(db, azienda_id, visita_id)
    if giudizio is None:
        return None
    tipo_visita = db.get(CatTipoVisita, payload.tipo_visita_id)
    if tipo_visita is None or not tipo_visita.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipo di visita non trovato.")

    data_scadenza = payload.data_scadenza
    if data_scadenza is None and payload.periodicita_mesi is not None:
        data_scadenza = _aggiungi_mesi(payload.data_visita, payload.periodicita_mesi)

    giudizio.tipo_visita_id = tipo_visita.id
    giudizio.data_visita = payload.data_visita
    giudizio.giudizio = payload.giudizio
    giudizio.periodicita_mesi = payload.periodicita_mesi
    giudizio.data_scadenza = data_scadenza
    giudizio.medico_competente = payload.medico_competente
    giudizio.prescrizioni_minime = payload.prescrizioni_minime if payload.prescrizioni_presenti else None
    db.commit()
    db.refresh(giudizio)
    e_vigente = giudizio.id == _storico_giudizi_idoneita(db, azienda_id, giudizio.persona_id)[0].id
    return _giudizio_a_read(giudizio, tipo_visita, e_vigente=e_vigente)


def crea_appuntamento_visita(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: AppuntamentoVisitaCreate
) -> AppuntamentoVisitaRead:
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    tipo_visita = db.get(CatTipoVisita, payload.tipo_visita_id)
    if tipo_visita is None or not tipo_visita.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipo di visita non trovato.")

    appuntamento = PerAttivita(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipo=_TIPO_ATTIVITA_VISITA,
        categoria=_CATEGORIA_SORVEGLIANZA,
        titolo=f"Visita {tipo_visita.denominazione.lower()}",
        data_scadenza=payload.data,
        ora=payload.ora,
        stato="PIANIFICATA",
        medico_competente=payload.medico_competente,
        luogo=payload.luogo,
        note=payload.note,
    )
    db.add(appuntamento)
    db.commit()
    db.refresh(appuntamento)
    return _appuntamento_a_read(appuntamento)


def _appuntamento_owned_or_none(db: Session, azienda_id: uuid.UUID, appuntamento_id: uuid.UUID) -> PerAttivita | None:
    appuntamento = db.get(PerAttivita, appuntamento_id)
    if appuntamento is None or appuntamento.azienda_id != azienda_id or appuntamento.tipo != _TIPO_ATTIVITA_VISITA:
        return None
    return appuntamento


def aggiorna_appuntamento_visita(
    db: Session, azienda_id: uuid.UUID, appuntamento_id: uuid.UUID, payload: AppuntamentoVisitaUpdate
) -> AppuntamentoVisitaRead | None:
    # La modifica aggiorna sempre l'appuntamento esistente, incluso
    # l'annullamento (stato ANNULLATA): non crea mai un secondo record
    # (§13 — "non continua a mostrare il pulsante come se mancasse
    # l'appuntamento").
    appuntamento = _appuntamento_owned_or_none(db, azienda_id, appuntamento_id)
    if appuntamento is None:
        return None
    appuntamento.data_scadenza = payload.data
    appuntamento.ora = payload.ora
    appuntamento.medico_competente = payload.medico_competente
    appuntamento.luogo = payload.luogo
    appuntamento.note = payload.note
    appuntamento.stato = payload.stato
    db.commit()
    db.refresh(appuntamento)
    return _appuntamento_a_read(appuntamento)


def crea_promemoria_visita(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: PromemoriaVisitaCreate
) -> PromemoriaVisitaRead:
    # Il promemoria non crea né modifica alcun appuntamento o giudizio
    # (§15): un record indipendente in per_attivita, che non alimenta
    # l'indicatore "Prossima visita" (letto solo da _TIPO_ATTIVITA_VISITA).
    persona = db.get(AnaPersone, persona_id)
    if persona is None or persona.azienda_id != azienda_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")

    nota = payload.nota or ""
    if payload.destinatari:
        prefisso = f"Destinatari: {payload.destinatari}"
        nota = f"{prefisso}\n\n{nota}".strip() if nota else prefisso

    promemoria = PerAttivita(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipo=_TIPO_ATTIVITA_PROMEMORIA,
        categoria=_CATEGORIA_SORVEGLIANZA,
        titolo=payload.oggetto.strip(),
        data_scadenza=payload.data,
        ora=payload.ora,
        stato="PIANIFICATA",
        note=nota or None,
    )
    db.add(promemoria)
    db.commit()
    db.refresh(promemoria)
    return PromemoriaVisitaRead(
        id=promemoria.id,
        oggetto=promemoria.titolo,
        data=promemoria.data_scadenza,
        ora=promemoria.ora,
        nota=promemoria.note,
    )


# ---------------------------------------------------------------------------
# Competenze (Conoscenza, Competenza, Consapevolezza) — riusa cat_voci_
# valutazione_personale/per_voci_valutazione_personali/rel_persone_voci_
# nascoste/per_valutazioni_personale(_dettagli), tutte esistenti dalla
# migrazione 013/0100 e mai popolate. "Valutatore" è sempre l'utente
# autenticato (nessun selettore di utenti azienda esiste ancora in
# piattaforma): stesso principio già in uso per verificato_da/hidden_by/
# created_by in questo stesso modulo.
# ---------------------------------------------------------------------------

_MACROAREE = ("KNOWLEDGE", "COMPETENCE", "AWARENESS")


def _nome_valutatore(db: Session, utente_id: uuid.UUID | None) -> str | None:
    if utente_id is None:
        return None
    utente = db.get(SysUtente, utente_id)
    return f"{utente.nome} {utente.cognome}" if utente is not None else None


def _ultima_valutazione_macro(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, macroarea: str
) -> PerValutazionePersonale | None:
    stmt = (
        select(PerValutazionePersonale)
        .where(
            PerValutazionePersonale.azienda_id == azienda_id,
            PerValutazionePersonale.persona_id == persona_id,
            PerValutazionePersonale.macroarea == macroarea,
            PerValutazionePersonale.livello_complessivo.is_not(None),
        )
        .order_by(PerValutazionePersonale.data_valutazione.desc(), PerValutazionePersonale.created_at.desc())
        .limit(1)
    )
    return db.scalars(stmt).first()


def _ultime_valutazioni_dettaglio(
    db: Session,
    persona_id: uuid.UUID,
    *,
    voce_ids: list[uuid.UUID] | None = None,
    voce_personale_ids: list[uuid.UUID] | None = None,
) -> dict[uuid.UUID, tuple[str, date, str | None]]:
    """Ultima valutazione analitica per voce (§8.5/§9.4): righe già ordinate
    dalla più recente, si tiene solo la prima incontrata per ciascuna voce
    (mai la media o un aggregato)."""

    if not voce_ids and not voce_personale_ids:
        return {}
    stmt = (
        select(PerValutazionePersonaleDettaglio, PerValutazionePersonale)
        .join(PerValutazionePersonale, PerValutazionePersonale.id == PerValutazionePersonaleDettaglio.valutazione_id)
        .where(PerValutazionePersonale.persona_id == persona_id)
        .order_by(PerValutazionePersonale.data_valutazione.desc(), PerValutazionePersonale.created_at.desc())
    )
    if voce_ids:
        stmt = stmt.where(PerValutazionePersonaleDettaglio.voce_id.in_(voce_ids))
    else:
        stmt = stmt.where(PerValutazionePersonaleDettaglio.voce_personale_id.in_(voce_personale_ids or []))

    risultato: dict[uuid.UUID, tuple[str, date, str | None]] = {}
    for dettaglio, testata in db.execute(stmt).all():
        chiave = dettaglio.voce_id or dettaglio.voce_personale_id
        assert chiave is not None
        if chiave not in risultato:
            risultato[chiave] = (dettaglio.livello, testata.data_valutazione, _nome_valutatore(db, testata.valutatore_user_id))
    return risultato


def _competenze_ereditate_raw(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID
) -> list[tuple[CatVoceValutazionePersonale, str]]:
    """Competenze dei mansionari dei SOLI ruoli attivi assegnati alla
    persona (§9.1): niente mansione, profilo generale o voci personali —
    a differenza del profilo "aziendale" completo, qui la fonte è
    esclusivamente il ruolo."""

    stmt = (
        select(CatVoceValutazionePersonale, CatRuolo.denominazione)
        .select_from(PerIncarico)
        .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
        .join(
            CfgRuoloAzienda,
            (CfgRuoloAzienda.azienda_id == PerIncarico.azienda_id) & (CfgRuoloAzienda.ruolo_id == PerIncarico.ruolo_id),
        )
        .join(
            RelRuoloVoceValutazione,
            (RelRuoloVoceValutazione.configurazione_ruolo_id == CfgRuoloAzienda.id)
            & (RelRuoloVoceValutazione.attiva.is_(True)),
        )
        .join(CatVoceValutazionePersonale, CatVoceValutazionePersonale.id == RelRuoloVoceValutazione.voce_id)
        .where(
            PerIncarico.persona_id == persona_id,
            PerIncarico.azienda_id == azienda_id,
            PerIncarico.stato == "ATTIVO",
            CatVoceValutazionePersonale.macroarea == "COMPETENCE",
            CatVoceValutazionePersonale.attiva.is_(True),
        )
    )
    return list(db.execute(stmt).all())


def _competenze_persona(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID
) -> tuple[list[CompetenzaRead], list[CompetenzaNascostaRead]]:
    righe = _competenze_ereditate_raw(db, azienda_id, persona_id)

    # Deduplica per identificativo stabile della voce (§9.3): due voci con
    # lo stesso nome ma id diversi restano due righe distinte, mai fuse.
    per_voce: dict[uuid.UUID, dict] = {}
    for voce, ruolo_denominazione in righe:
        entry = per_voce.setdefault(voce.id, {"voce": voce, "ruoli": set()})
        entry["ruoli"].add(ruolo_denominazione)

    if not per_voce:
        return [], []

    nascoste_ids = set(
        db.scalars(
            select(RelPersonaVoceNascosta.voce_id).where(
                RelPersonaVoceNascosta.persona_id == persona_id,
                RelPersonaVoceNascosta.voce_id.in_(per_voce.keys()),
                RelPersonaVoceNascosta.attiva.is_(True),
            )
        )
    )
    ultime = _ultime_valutazioni_dettaglio(db, persona_id, voce_ids=list(per_voce.keys()))

    attive: list[CompetenzaRead] = []
    nascoste: list[CompetenzaNascostaRead] = []
    for voce_id, entry in per_voce.items():
        voce: CatVoceValutazionePersonale = entry["voce"]
        ruoli = sorted(entry["ruoli"])
        ultima = ultime.get(voce_id)
        if voce_id in nascoste_ids:
            nascoste.append(
                CompetenzaNascostaRead(
                    voce_id=voce_id,
                    nome=voce.nome,
                    descrizione=voce.descrizione,
                    ruoli_origine=ruoli,
                    livello=ultima[0] if ultima else None,
                    data_valutazione=ultima[1] if ultima else None,
                )
            )
        else:
            attive.append(
                CompetenzaRead(
                    voce_id=voce_id,
                    nome=voce.nome,
                    descrizione=voce.descrizione,
                    ruoli_origine=ruoli,
                    livello=ultima[0] if ultima else None,
                    data_valutazione=ultima[1] if ultima else None,
                    valutatore=ultima[2] if ultima else None,
                )
            )
    attive.sort(key=lambda r: r.nome)
    nascoste.sort(key=lambda r: r.nome)
    return attive, nascoste


def macro_indicatori_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[MacroIndicatoreRead]:
    attive_competenza, nascoste_competenza = _competenze_persona(db, azienda_id, persona_id)
    conteggio_conoscenze = db.scalar(
        select(func.count())
        .select_from(PerVoceValutazionePersonale)
        .where(
            PerVoceValutazionePersonale.azienda_id == azienda_id,
            PerVoceValutazionePersonale.persona_id == persona_id,
            PerVoceValutazionePersonale.macroarea == "KNOWLEDGE",
            PerVoceValutazionePersonale.attiva.is_(True),
        )
    ) or 0

    risultato: list[MacroIndicatoreRead] = []
    for macroarea in _MACROAREE:
        valutazione = _ultima_valutazione_macro(db, azienda_id, persona_id, macroarea)
        voci_attive: int | None = None
        voci_nascoste: int | None = None
        if macroarea == "KNOWLEDGE":
            voci_attive, voci_nascoste = conteggio_conoscenze, 0
        elif macroarea == "COMPETENCE":
            voci_attive, voci_nascoste = len(attive_competenza), len(nascoste_competenza)
        risultato.append(
            MacroIndicatoreRead(
                macroarea=macroarea,
                livello=valutazione.livello_complessivo if valutazione else None,
                data_valutazione=valutazione.data_valutazione if valutazione else None,
                valutatore=_nome_valutatore(db, valutazione.valutatore_user_id) if valutazione else None,
                nota=valutazione.nota_generale if valutazione else None,
                voci_attive=voci_attive,
                voci_nascoste=voci_nascoste,
            )
        )
    return risultato


def valuta_macro_indicatore(
    db: Session,
    azienda_id: uuid.UUID,
    utente_id: uuid.UUID,
    persona_id: uuid.UUID,
    macroarea: str,
    payload: MacroIndicatoreValutaRequest,
) -> MacroIndicatoreRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    if macroarea not in _MACROAREE:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Macro-indicatore non riconosciuto.")

    # Riga di sola testata, nessun dettaglio collegato (§6): il salvataggio
    # non tocca mai conoscenze, competenze o voci nascoste.
    valutazione = PerValutazionePersonale(
        azienda_id=azienda_id,
        persona_id=persona_id,
        macroarea=macroarea,
        data_valutazione=payload.data_valutazione,
        valutatore_user_id=utente_id,
        nota_generale=payload.nota,
        livello_complessivo=payload.livello,
    )
    db.add(valutazione)
    db.commit()

    risultato = macro_indicatori_persona(db, azienda_id, persona_id)
    return next(m for m in risultato if m.macroarea == macroarea)


# ---------------------------------------------------------------------------
# Conoscenza — voci personali (§8): niente ereditarietà, appartengono solo
# alla persona.
# ---------------------------------------------------------------------------


def _conoscenza_a_read(db: Session, riga: PerVoceValutazionePersonale) -> ConoscenzaRead:
    ultima = _ultime_valutazioni_dettaglio(db, riga.persona_id, voce_personale_ids=[riga.id]).get(riga.id)
    return ConoscenzaRead(
        id=riga.id,
        nome=riga.nome,
        descrizione=riga.descrizione,
        livello=ultima[0] if ultima else None,
        data_valutazione=ultima[1] if ultima else None,
        valutatore=ultima[2] if ultima else None,
    )


def conoscenze_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[ConoscenzaRead]:
    stmt = (
        select(PerVoceValutazionePersonale)
        .where(
            PerVoceValutazionePersonale.azienda_id == azienda_id,
            PerVoceValutazionePersonale.persona_id == persona_id,
            PerVoceValutazionePersonale.macroarea == "KNOWLEDGE",
            PerVoceValutazionePersonale.attiva.is_(True),
        )
        .order_by(PerVoceValutazionePersonale.nome)
    )
    righe = db.scalars(stmt).all()
    if not righe:
        return []
    ultime = _ultime_valutazioni_dettaglio(db, persona_id, voce_personale_ids=[r.id for r in righe])
    return [
        ConoscenzaRead(
            id=r.id,
            nome=r.nome,
            descrizione=r.descrizione,
            livello=(ultime.get(r.id) or (None,))[0],
            data_valutazione=(ultime.get(r.id) or (None, None))[1],
            valutatore=(ultime.get(r.id) or (None, None, None))[2],
        )
        for r in righe
    ]


def crea_conoscenza(
    db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, payload: ConoscenzaCreate
) -> ConoscenzaRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    riga = PerVoceValutazionePersonale(
        azienda_id=azienda_id,
        persona_id=persona_id,
        macroarea="KNOWLEDGE",
        nome=payload.nome.strip(),
        descrizione=payload.descrizione,
        created_by=utente_id,
    )
    db.add(riga)
    db.commit()
    db.refresh(riga)
    return _conoscenza_a_read(db, riga)


def _conoscenza_owned_or_none(db: Session, azienda_id: uuid.UUID, conoscenza_id: uuid.UUID) -> PerVoceValutazionePersonale | None:
    riga = db.get(PerVoceValutazionePersonale, conoscenza_id)
    if riga is None or riga.azienda_id != azienda_id or riga.macroarea != "KNOWLEDGE":
        return None
    return riga


def aggiorna_conoscenza(
    db: Session, azienda_id: uuid.UUID, conoscenza_id: uuid.UUID, payload: ConoscenzaUpdate
) -> ConoscenzaRead | None:
    riga = _conoscenza_owned_or_none(db, azienda_id, conoscenza_id)
    if riga is None:
        return None
    riga.nome = payload.nome.strip()
    riga.descrizione = payload.descrizione
    db.commit()
    db.refresh(riga)
    return _conoscenza_a_read(db, riga)


def archivia_conoscenza(db: Session, azienda_id: uuid.UUID, conoscenza_id: uuid.UUID) -> bool:
    riga = _conoscenza_owned_or_none(db, azienda_id, conoscenza_id)
    if riga is None:
        return False
    # Archiviazione, non cancellazione fisica (§8.4 "rimozione o
    # archiviazione"): la colonna archived_at esiste apposta, le
    # valutazioni analitiche già registrate restano intatte nello storico.
    riga.attiva = False
    riga.archived_at = datetime.now(timezone.utc)
    db.commit()
    return True


def valuta_conoscenze(
    db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, payload: ValutaVociRequest
) -> list[ConoscenzaRead]:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")

    valutazione = PerValutazionePersonale(
        azienda_id=azienda_id,
        persona_id=persona_id,
        macroarea="KNOWLEDGE",
        data_valutazione=payload.data_valutazione,
        valutatore_user_id=utente_id,
        nota_generale=payload.nota_generale,
    )
    db.add(valutazione)
    db.flush()

    for voce in payload.voci:
        riga = _conoscenza_owned_or_none(db, azienda_id, voce.voce_id)
        if riga is None or riga.persona_id != persona_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conoscenza non trovata per questa persona.")
        db.add(
            PerValutazionePersonaleDettaglio(
                valutazione_id=valutazione.id,
                voce_personale_id=riga.id,
                livello=voce.livello,
                evidenza_nota=voce.evidenza_nota,
                snapshot_nome=riga.nome,
            )
        )
    db.commit()
    return conoscenze_persona(db, azienda_id, persona_id)


# ---------------------------------------------------------------------------
# Competenza — esclusivamente ereditata dai mansionari dei ruoli attivi
# (§9): nessun "Aggiungi voce personale" in questa categoria.
# ---------------------------------------------------------------------------


def competenze_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> CompetenzePersonaRead:
    attive, nascoste = _competenze_persona(db, azienda_id, persona_id)
    return CompetenzePersonaRead(attive=attive, nascoste=nascoste)


def valuta_competenze(
    db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, payload: ValutaVociRequest
) -> CompetenzePersonaRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")

    attive, _ = _competenze_persona(db, azienda_id, persona_id)
    validi = {c.voce_id for c in attive}

    valutazione = PerValutazionePersonale(
        azienda_id=azienda_id,
        persona_id=persona_id,
        macroarea="COMPETENCE",
        data_valutazione=payload.data_valutazione,
        valutatore_user_id=utente_id,
        nota_generale=payload.nota_generale,
    )
    db.add(valutazione)
    db.flush()

    for voce in payload.voci:
        if voce.voce_id not in validi:
            # Include il caso "voce nascosta" (§10.3, esclusa dall'elenco
            # attivo da valutare): non è un errore generico, è la stessa
            # regola applicata qui.
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Competenza non trovata o non attiva per questa persona.")
        cat_voce = db.get(CatVoceValutazionePersonale, voce.voce_id)
        assert cat_voce is not None
        db.add(
            PerValutazionePersonaleDettaglio(
                valutazione_id=valutazione.id,
                voce_id=voce.voce_id,
                livello=voce.livello,
                evidenza_nota=voce.evidenza_nota,
                snapshot_nome=cat_voce.nome,
            )
        )
    db.commit()
    return competenze_persona(db, azienda_id, persona_id)


def nascondi_competenza(
    db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, voce_id: uuid.UUID, motivo: str | None
) -> CompetenzePersonaRead:
    attive, _ = _competenze_persona(db, azienda_id, persona_id)
    if voce_id not in {c.voce_id for c in attive}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Competenza non trovata o già nascosta per questa persona.")

    riga = db.scalars(
        select(RelPersonaVoceNascosta).where(
            RelPersonaVoceNascosta.persona_id == persona_id, RelPersonaVoceNascosta.voce_id == voce_id
        )
    ).first()
    if riga is None:
        riga = RelPersonaVoceNascosta(azienda_id=azienda_id, persona_id=persona_id, voce_id=voce_id)
        db.add(riga)
    riga.attiva = True
    riga.motivo = motivo
    riga.hidden_by = utente_id
    riga.hidden_at = datetime.now(timezone.utc)
    riga.restored_by = None
    riga.restored_at = None
    db.commit()
    return competenze_persona(db, azienda_id, persona_id)


def ripristina_competenza(
    db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, voce_id: uuid.UUID
) -> CompetenzePersonaRead:
    riga = db.scalars(
        select(RelPersonaVoceNascosta).where(
            RelPersonaVoceNascosta.persona_id == persona_id,
            RelPersonaVoceNascosta.voce_id == voce_id,
            RelPersonaVoceNascosta.attiva.is_(True),
        )
    ).first()
    if riga is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La competenza non risulta nascosta per questa persona.")
    # La voce torna nell'elenco attivo conservando la valutazione
    # precedente (§10.4): nessuna nuova copia, la riga di nascondimento
    # resta per lo storico ma disattivata.
    riga.attiva = False
    riga.restored_by = utente_id
    riga.restored_at = datetime.now(timezone.utc)
    db.commit()
    return competenze_persona(db, azienda_id, persona_id)


# ---------------------------------------------------------------------------
# Titoli di studio (§12) — catalogo condiviso già popolato, stato dichiarato
# /verificato tramite verifica_riga.py (§ decisione già presa dalla
# migrazione 015, nessuna colonna qui).
# ---------------------------------------------------------------------------


def lista_catalogo_titoli_studio(db: Session) -> list[CatTipologiaTitoloStudio]:
    stmt = (
        select(CatTipologiaTitoloStudio)
        .where(CatTipologiaTitoloStudio.attivo.is_(True))
        .order_by(CatTipologiaTitoloStudio.ordine_visualizzazione)
    )
    return list(db.scalars(stmt).all())


def _titolo_studio_a_read(db: Session, azienda_id: uuid.UUID, titolo: PerTitoloStudio, tipologia: CatTipologiaTitoloStudio) -> TitoloStudioRead:
    stato = leggi_stato_verifica_riga(db, azienda_id, SEZIONE_VERIFICA_TITOLI_STUDIO, titolo.id)
    return TitoloStudioRead(
        id=titolo.id,
        tipologia=tipologia,
        indirizzo_specializzazione=titolo.indirizzo_specializzazione,
        istituto=titolo.istituto,
        anno=titolo.anno,
        votazione=titolo.votazione,
        documento_presente=titolo.documento_id is not None,
        verificationStatus=stato["status"],
        verificationVersion=stato["version"],
        revisionNote=stato["note"],
        verifiedAt=stato["verified_at"],
        verifiedBy=stato["verified_by"],
    )


def dettaglio_titolo_studio(db: Session, azienda_id: uuid.UUID, titolo_id: uuid.UUID) -> TitoloStudioRead | None:
    titolo = _titolo_studio_owned_or_none(db, azienda_id, titolo_id)
    if titolo is None:
        return None
    tipologia = db.get(CatTipologiaTitoloStudio, titolo.tipologia_titolo_id)
    assert tipologia is not None
    return _titolo_studio_a_read(db, azienda_id, titolo, tipologia)


def lista_titoli_studio_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[TitoloStudioRead]:
    stmt = (
        select(PerTitoloStudio, CatTipologiaTitoloStudio)
        .join(CatTipologiaTitoloStudio, CatTipologiaTitoloStudio.id == PerTitoloStudio.tipologia_titolo_id)
        .where(PerTitoloStudio.azienda_id == azienda_id, PerTitoloStudio.persona_id == persona_id)
        .order_by(PerTitoloStudio.anno.desc().nulls_last(), PerTitoloStudio.created_at.desc())
    )
    return [_titolo_studio_a_read(db, azienda_id, t, tip) for t, tip in db.execute(stmt).all()]


def crea_titolo_studio(
    db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: TitoloStudioCreate
) -> TitoloStudioRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    tipologia = db.get(CatTipologiaTitoloStudio, payload.tipologia_titolo_id)
    if tipologia is None or not tipologia.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipologia di titolo di studio non trovata.")

    titolo = PerTitoloStudio(
        azienda_id=azienda_id,
        persona_id=persona_id,
        tipologia_titolo_id=tipologia.id,
        indirizzo_specializzazione=payload.indirizzo_specializzazione,
        istituto=payload.istituto,
        anno=payload.anno,
        votazione=payload.votazione,
    )
    db.add(titolo)
    db.commit()
    db.refresh(titolo)
    return _titolo_studio_a_read(db, azienda_id, titolo, tipologia)


def _titolo_studio_owned_or_none(db: Session, azienda_id: uuid.UUID, titolo_id: uuid.UUID) -> PerTitoloStudio | None:
    titolo = db.get(PerTitoloStudio, titolo_id)
    if titolo is None or titolo.azienda_id != azienda_id:
        return None
    return titolo


def aggiorna_titolo_studio(
    db: Session, azienda_id: uuid.UUID, titolo_id: uuid.UUID, payload: TitoloStudioUpdate
) -> TitoloStudioRead | None:
    titolo = _titolo_studio_owned_or_none(db, azienda_id, titolo_id)
    if titolo is None:
        return None
    tipologia = db.get(CatTipologiaTitoloStudio, payload.tipologia_titolo_id)
    if tipologia is None or not tipologia.attivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipologia di titolo di studio non trovata.")

    titolo.tipologia_titolo_id = tipologia.id
    titolo.indirizzo_specializzazione = payload.indirizzo_specializzazione
    titolo.istituto = payload.istituto
    titolo.anno = payload.anno
    titolo.votazione = payload.votazione
    db.commit()
    db.refresh(titolo)
    return _titolo_studio_a_read(db, azienda_id, titolo, tipologia)


def elimina_titolo_studio(db: Session, azienda_id: uuid.UUID, titolo_id: uuid.UUID) -> bool:
    titolo = _titolo_studio_owned_or_none(db, azienda_id, titolo_id)
    if titolo is None:
        return False
    db.delete(titolo)
    db.commit()
    return True


# ---------------------------------------------------------------------------
# Esperienze rilevanti (§13) — "verificata" è una colonna booleana propria
# della tabella (decisione già presa dalla migrazione 015), non passa da
# verifica_riga.py.
# ---------------------------------------------------------------------------


def _esperienza_a_read(r: PerEsperienza) -> EsperienzaRead:
    return EsperienzaRead(
        id=r.id,
        attivita_ruolo=r.attivita_ruolo,
        organizzazione=r.organizzazione,
        data_inizio=r.data_inizio,
        data_fine=r.data_fine,
        rilevanza=r.rilevanza,
        descrizione=r.descrizione,
        verificata=r.verificata,
        documento_presente=r.documento_id is not None,
    )


def lista_esperienze_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[EsperienzaRead]:
    stmt = (
        select(PerEsperienza)
        .where(PerEsperienza.azienda_id == azienda_id, PerEsperienza.persona_id == persona_id)
        .order_by(PerEsperienza.data_inizio.desc().nulls_last(), PerEsperienza.created_at.desc())
    )
    return [_esperienza_a_read(r) for r in db.scalars(stmt).all()]


def crea_esperienza(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID, payload: EsperienzaCreate) -> EsperienzaRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    riga = PerEsperienza(
        azienda_id=azienda_id,
        persona_id=persona_id,
        attivita_ruolo=payload.attivita_ruolo.strip(),
        organizzazione=payload.organizzazione,
        data_inizio=payload.data_inizio,
        data_fine=payload.data_fine,
        rilevanza=payload.rilevanza,
        descrizione=payload.descrizione,
    )
    db.add(riga)
    db.commit()
    db.refresh(riga)
    return _esperienza_a_read(riga)


def _esperienza_owned_or_none(db: Session, azienda_id: uuid.UUID, esperienza_id: uuid.UUID) -> PerEsperienza | None:
    riga = db.get(PerEsperienza, esperienza_id)
    if riga is None or riga.azienda_id != azienda_id:
        return None
    return riga


def aggiorna_esperienza(
    db: Session, azienda_id: uuid.UUID, esperienza_id: uuid.UUID, payload: EsperienzaUpdate
) -> EsperienzaRead | None:
    riga = _esperienza_owned_or_none(db, azienda_id, esperienza_id)
    if riga is None:
        return None
    riga.attivita_ruolo = payload.attivita_ruolo.strip()
    riga.organizzazione = payload.organizzazione
    riga.data_inizio = payload.data_inizio
    riga.data_fine = payload.data_fine
    riga.rilevanza = payload.rilevanza
    riga.descrizione = payload.descrizione
    db.commit()
    db.refresh(riga)
    return _esperienza_a_read(riga)


def elimina_esperienza(db: Session, azienda_id: uuid.UUID, esperienza_id: uuid.UUID) -> bool:
    riga = _esperienza_owned_or_none(db, azienda_id, esperienza_id)
    if riga is None:
        return False
    db.delete(riga)
    db.commit()
    return True


def verifica_esperienza(db: Session, azienda_id: uuid.UUID, esperienza_id: uuid.UUID, verificata: bool) -> EsperienzaRead | None:
    riga = _esperienza_owned_or_none(db, azienda_id, esperienza_id)
    if riga is None:
        return None
    riga.verificata = verificata
    db.commit()
    db.refresh(riga)
    return _esperienza_a_read(riga)


# ---------------------------------------------------------------------------
# Note (§ specificazione "Costruzione della scheda 'Note'") — riusa per_note
# (migrazione 015/0102, mai popolata). Nessun catalogo esiste per
# "categoria" (CHECK a valori fissi): il vocabolario vive qui, unica fonte,
# invece di essere duplicato nel frontend. "visibilita" è sempre
# SOLO_CONSULENTI (§3, nessun campo nel form); "titolo"/"in_evidenza" non
# vengono mai valorizzati da questa scheda.
# ---------------------------------------------------------------------------

NOTA_CATEGORIE: list[tuple[str, str]] = [
    ("GENERALE", "Generale"),
    ("FORMAZIONE", "Formazione"),
    ("RUOLO", "Ruolo"),
    ("SORVEGLIANZA_SANITARIA", "Sorveglianza sanitaria"),
    ("COMPETENZE", "Competenza"),
]


def lista_categorie_nota() -> list[NotaCategoriaRead]:
    return [NotaCategoriaRead(codice=codice, denominazione=denominazione) for codice, denominazione in NOTA_CATEGORIE]


def _nota_a_read(db: Session, nota: PerNota) -> NotaRead:
    return NotaRead(
        id=nota.id,
        categoria=nota.categoria,
        testo=nota.testo,
        autore=_nome_valutatore(db, nota.autore_user_id),
        created_at=nota.created_at,
        updated_at=nota.updated_at,
    )


def note_persona(db: Session, azienda_id: uuid.UUID, persona_id: uuid.UUID) -> list[NotaRead]:
    stmt = (
        select(PerNota)
        .where(PerNota.azienda_id == azienda_id, PerNota.persona_id == persona_id, PerNota.archived_at.is_(None))
        .order_by(PerNota.created_at.desc(), PerNota.id.desc())
    )
    return [_nota_a_read(db, r) for r in db.scalars(stmt).all()]


def crea_nota(db: Session, azienda_id: uuid.UUID, utente_id: uuid.UUID, persona_id: uuid.UUID, payload: NotaCreate) -> NotaRead:
    persona = _persona_owned_or_none(db, persona_id, azienda_id)
    if persona is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Persona non trovata.")
    nota = PerNota(
        azienda_id=azienda_id,
        persona_id=persona_id,
        categoria=payload.categoria,
        testo=payload.testo.strip(),
        visibilita="SOLO_CONSULENTI",
        autore_user_id=utente_id,
    )
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return _nota_a_read(db, nota)


def _nota_owned_or_none(db: Session, azienda_id: uuid.UUID, nota_id: uuid.UUID) -> PerNota | None:
    nota = db.get(PerNota, nota_id)
    if nota is None or nota.azienda_id != azienda_id or nota.archived_at is not None:
        return None
    return nota


def aggiorna_nota(db: Session, azienda_id: uuid.UUID, nota_id: uuid.UUID, payload: NotaUpdate) -> NotaRead | None:
    # L'autore originale e created_at non vengono mai toccati (§11): solo
    # categoria/testo cambiano, updated_at si aggiorna da solo (trigger).
    nota = _nota_owned_or_none(db, azienda_id, nota_id)
    if nota is None:
        return None
    nota.categoria = payload.categoria
    nota.testo = payload.testo.strip()
    db.commit()
    db.refresh(nota)
    return _nota_a_read(db, nota)


def archivia_nota(db: Session, azienda_id: uuid.UUID, nota_id: uuid.UUID) -> bool:
    # Cancellazione logica (§12): archived_at esiste già per questo, stesso
    # principio già applicato a Conoscenza in questo modulo.
    nota = _nota_owned_or_none(db, azienda_id, nota_id)
    if nota is None:
        return False
    nota.archived_at = datetime.now(timezone.utc)
    db.commit()
    return True
