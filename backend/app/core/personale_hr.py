"""Servizio di dominio del vero modulo Personale (Fase 1 — Fondazioni).

Funzioni pure con `Session` esplicita come primo parametro, stesso stile di
`app.core.incarichi`/`app.core.aggiornamento_impresa` — niente classi
Service, mai usate altrove nel repository.
"""

import re
import uuid
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.incarichi import configurazione_ruolo, leggi_valori
from app.core.pagination import Page, PageParams, paginate
from app.models.personale import (
    AnaPersone,
    CatAbilitazione,
    CatCorsoFormazione,
    CatMansione,
    CatReparto,
    CatRuolo,
    CatTipoDocumentoIdentita,
    CatTipoRapporto,
    CatVoceValutazionePersonale,
    CfgRuoloAzienda,
    PerAbilitazione,
    PerDocumentoPersonale,
    PerFormazione,
    PerIncarico,
    PerRapportoAzienda,
    RelRuoloVoceValutazione,
)
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
    RegistrazioneFormativaCreate,
    RegistrazioneFormativaRead,
    RegistrazioneFormativaUpdate,
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
