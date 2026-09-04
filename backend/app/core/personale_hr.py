"""Servizio di dominio del vero modulo Personale (Fase 1 — Fondazioni).

Funzioni pure con `Session` esplicita come primo parametro, stesso stile di
`app.core.incarichi`/`app.core.aggiornamento_impresa` — niente classi
Service, mai usate altrove nel repository.
"""

import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.incarichi import configurazione_ruolo, leggi_valori
from app.core.pagination import Page, PageParams, paginate
from app.models.personale import (
    AnaPersone,
    CatMansione,
    CatReparto,
    CatRuolo,
    CatTipoRapporto,
    PerIncarico,
    PerRapportoAzienda,
)
from app.schemas.personale_hr import (
    CatalogoCreate,
    CatalogoRead,
    NuovaPersonaRequest,
    PersonaDossierRead,
    PersonaDossierUpdate,
    PersonaListRow,
    PersonaProfiloRead,
    PersonaProfiloUpdate,
    PersonaRuoloRead,
    RapportoAziendaCreate,
    RapportoAziendaRead,
    RapportoCorrenteSummary,
    RapportoDettagliUpdate,
)

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
    "tipo_documento_identita",
    "numero_documento_identita",
    "scadenza_documento_identita",
    "permesso_soggiorno_stato",
    "permesso_soggiorno_dettaglio",
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
        _applica_dettagli_contrattuali(db, persona_id, payload.rapporto)
    return persona


def _applica_dossier(persona: AnaPersone, dossier: PersonaDossierUpdate) -> None:
    for campo in _DOSSIER_CAMPI_DIRETTI:
        setattr(persona, campo, getattr(dossier, campo))
    persona.sesso = dossier.sesso
    persona.nazionalita = dossier.cittadinanza
    persona.conoscenza_lingua_italiana = dossier.comprensione_lingua_italiana
    persona.data_nascita = dossier.data_nascita
    persona.luogo_nascita = dossier.luogo_nascita


def _applica_dettagli_contrattuali(db: Session, persona_id: uuid.UUID, dettagli: RapportoDettagliUpdate) -> None:
    rapporto = rapporto_corrente(db, persona_id)
    if rapporto is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Nessun rapporto corrente a cui applicare i dettagli contrattuali."
        )
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
