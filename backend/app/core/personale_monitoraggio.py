"""Servizio della scheda "Monitoraggio personale": cruscotto di sola
lettura calcolato in tempo reale dalle schede delle persone (Formazione e
abilitazioni, Idoneità sanitaria, Ruoli, Documenti personali, Attività
pianificate). Nessun dato autonomo: niente tabelle, colonne o conteggi
salvati — tutto deriva da query aggregate sulle tabelle già esistenti del
vero modulo Personale (`app.core.personale_hr`), le cui funzioni di stato
(`_stato_registrazione_formativa`, `_stato_giudizio`, `_documentazione_
stato`) vengono riusate qui, mai duplicate (CLAUDE.md: "niente logica
duplicata").

Escluse esplicitamente (richiesta utente): Conoscenza, Competenza,
Consapevolezza, Titoli di studio, Esperienze rilevanti, Note.

Attenzione N+1 (§21 della richiesta): ogni funzione pubblica qui sotto
carica i dati di TUTTE le persone coinvolte con query batch (`IN (...)`),
mai una query per persona.
"""

import uuid
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.incarichi import _TIPO_COLONNA, configurazione_ruolo
from app.core.personale_hr import (
    _SOGLIA_PREAVVISO_DEFAULT_GIORNI,
    _TIPO_ATTIVITA_PROMEMORIA,
    _TIPO_ATTIVITA_VISITA,
    _documentazione_stato,
    _stato_giudizio,
    _stato_registrazione_formativa,
)
from app.models.personale import (
    AnaPersone,
    CatAbilitazione,
    CatCaratteristicaIncarico,
    CatCorsoFormazione,
    CatMansione,
    CatReparto,
    CatTipoDocumentoIdentita,
    CatTipoVisita,
    PerAbilitazione,
    PerAttivita,
    PerDocumentoPersonale,
    PerFormazione,
    PerGiudizioIdoneita,
    PerIncarico,
    PerIncaricoValore,
    PerRapportoAzienda,
)
from app.schemas.personale_monitoraggio import (
    CellaMonitoraggioRead,
    ConformitaComplessivaRead,
    DistribuzioneConformitaRead,
    IndicatoriMonitoraggioRead,
    MonitoraggioRigaRead,
    PaginaMonitoraggioRead,
    RiepilogoMonitoraggioRead,
)

# Priorità della cella riepilogativa (§11): il primo stato presente nella
# lista dei record/attività della categoria vince.
_PRIORITA_CELLA = ["SCADUTO", "IN_SCADENZA", "INCOMPLETO", "PIANIFICATO", "VALIDO", "NESSUN_DATO"]
_ETICHETTA_CELLA = {
    "SCADUTO": "Scaduto",
    "IN_SCADENZA": "In scadenza",
    "INCOMPLETO": "Incompleto",
    "PIANIFICATO": "Pianificato",
    "VALIDO": "Valido",
    "NESSUN_DATO": "Nessun dato",
}
_MAPPA_STATO_RECORD = {"VALIDA": "VALIDO", "IN_SCADENZA": "IN_SCADENZA", "SCADUTA": "SCADUTO", "INCOMPLETA": "INCOMPLETO"}


def _collassa_stato_cella(stati: list[str]) -> str:
    presenti = set(stati)
    for candidato in _PRIORITA_CELLA:
        if candidato in presenti:
            return candidato
    return "NESSUN_DATO"


def _cella(stati_record: list[str], *, pianificato: bool, dettaglio_parti: list[str]) -> CellaMonitoraggioRead:
    stati_cella = [_MAPPA_STATO_RECORD[s] for s in stati_record]
    if pianificato:
        stati_cella.append("PIANIFICATO")
    stato = _collassa_stato_cella(stati_cella)
    dettaglio = " · ".join(dettaglio_parti) if dettaglio_parti else "Nessuna registrazione presente"
    return CellaMonitoraggioRead(stato=stato, etichetta=_ETICHETTA_CELLA[stato], dettaglio=dettaglio)


def _conteggio_testo(n: int, singolare: str, plurale: str) -> str:
    return f"{n} {singolare if n == 1 else plurale}"


def _parti_dettaglio(conteggi: dict[str, int], nome_singolare: str, nome_plurale: str, *, femminile: bool = True) -> list[str]:
    if femminile:
        ordine = [("SCADUTA", "scaduta", "scadute"), ("IN_SCADENZA", "in scadenza", "in scadenza"), ("INCOMPLETA", "incompleta", "incomplete"), ("VALIDA", "valida", "valide")]
    else:
        ordine = [("SCADUTA", "scaduto", "scaduti"), ("IN_SCADENZA", "in scadenza", "in scadenza"), ("INCOMPLETA", "incompleto", "incompleti"), ("VALIDA", "valido", "validi")]
    parti = []
    for chiave, sing, plur in ordine:
        n = conteggi.get(chiave, 0)
        if n:
            parti.append(f"{n} {nome_singolare if n == 1 else nome_plurale} {sing if n == 1 else plur}")
    return parti


@dataclass
class _PersonaAggregata:
    persona: AnaPersone
    rapporto: PerRapportoAzienda | None
    mansione: CatMansione | None
    reparto: CatReparto | None
    formazione: CellaMonitoraggioRead
    idoneita: CellaMonitoraggioRead
    ruoli: CellaMonitoraggioRead
    documenti: CellaMonitoraggioRead
    prossima_data: date | None
    prossima_data_origine: str | None
    stato_complessivo: str
    record_stati: list[str] = field(default_factory=list)


def _persone_attive(
    db: Session,
    azienda_id: uuid.UUID,
    *,
    q: str | None,
    reparto_id: uuid.UUID | None,
    mansione_id: uuid.UUID | None,
) -> list[tuple[AnaPersone, PerRapportoAzienda | None, CatMansione | None, CatReparto | None]]:
    """Persone attive (§5.1): rapporto aziendale aperto (`data_fine_effettiva
    IS NULL`), stesso criterio già usato da `rapporto_corrente`/`lista_persone`
    in `app.core.personale_hr` — non ridefinito qui, solo riapplicato."""

    rapporto_aperto = PerRapportoAzienda.data_fine_effettiva.is_(None)
    stmt = (
        select(AnaPersone)
        .join(PerRapportoAzienda, PerRapportoAzienda.persona_id == AnaPersone.id)
        .where(AnaPersone.azienda_id == azienda_id, rapporto_aperto)
    )
    if reparto_id is not None:
        stmt = stmt.where(PerRapportoAzienda.reparto_id == reparto_id)
    if mansione_id is not None:
        stmt = stmt.where(PerRapportoAzienda.mansione_id == mansione_id)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where((AnaPersone.nome.ilike(pattern)) | (AnaPersone.cognome.ilike(pattern)))
    stmt = stmt.order_by(AnaPersone.cognome, AnaPersone.nome).distinct()
    persone = list(db.scalars(stmt).all())
    persona_ids = [p.id for p in persone]

    rapporti_per_persona: dict[uuid.UUID, PerRapportoAzienda] = {}
    if persona_ids:
        rapporti = db.scalars(
            select(PerRapportoAzienda)
            .where(PerRapportoAzienda.persona_id.in_(persona_ids), PerRapportoAzienda.data_fine_effettiva.is_(None))
            .order_by(PerRapportoAzienda.data_inizio.desc())
        ).all()
        for r in rapporti:
            rapporti_per_persona.setdefault(r.persona_id, r)

    mansione_ids = {r.mansione_id for r in rapporti_per_persona.values() if r.mansione_id is not None}
    reparto_ids = {r.reparto_id for r in rapporti_per_persona.values() if r.reparto_id is not None}
    mansioni_per_id = {m.id: m for m in db.scalars(select(CatMansione).where(CatMansione.id.in_(mansione_ids)))} if mansione_ids else {}
    reparti_per_id = {r.id: r for r in db.scalars(select(CatReparto).where(CatReparto.id.in_(reparto_ids)))} if reparto_ids else {}

    risultato = []
    for p in persone:
        rapporto = rapporti_per_persona.get(p.id)
        mansione = mansioni_per_id.get(rapporto.mansione_id) if rapporto and rapporto.mansione_id else None
        reparto = reparti_per_id.get(rapporto.reparto_id) if rapporto and rapporto.reparto_id else None
        risultato.append((p, rapporto, mansione, reparto))
    return risultato


def _valori_incarichi_batch(db: Session, incarico_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict[str, object]]:
    if not incarico_ids:
        return {}
    righe = db.execute(
        select(PerIncaricoValore, CatCaratteristicaIncarico)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(PerIncaricoValore.incarico_id.in_(incarico_ids))
    ).all()
    out: dict[uuid.UUID, dict[str, object]] = {i: {} for i in incarico_ids}
    for valore_riga, caratteristica in righe:
        colonna = _TIPO_COLONNA[caratteristica.tipo_dato]
        out[valore_riga.incarico_id][caratteristica.codice] = getattr(valore_riga, colonna)
    return out


def _aggrega_persone(
    db: Session,
    azienda_id: uuid.UUID,
    persone: list[tuple[AnaPersone, PerRapportoAzienda | None, CatMansione | None, CatReparto | None]],
    *,
    oggi: date,
) -> list[_PersonaAggregata]:
    persona_ids = [p.id for p, _, _, _ in persone]
    if not persona_ids:
        return []

    # --- Formazione e abilitazioni (§12) --------------------------------
    formazione_per_persona: dict[uuid.UUID, list[tuple[str, date | None]]] = {pid: [] for pid in persona_ids}
    righe_f = db.execute(
        select(PerFormazione, CatCorsoFormazione)
        .join(CatCorsoFormazione, CatCorsoFormazione.id == PerFormazione.corso_id)
        .where(PerFormazione.persona_id.in_(persona_ids))
    ).all()
    for riga, corso in righe_f:
        stato = _stato_registrazione_formativa(riga.scadenza_esplicita, corso.soglia_preavviso_giorni, oggi) if riga.scadenza_esplicita else "VALIDA"
        formazione_per_persona[riga.persona_id].append((stato, riga.scadenza_esplicita))

    righe_a = db.execute(
        select(PerAbilitazione, CatAbilitazione)
        .join(CatAbilitazione, CatAbilitazione.id == PerAbilitazione.abilitazione_catalogo_id)
        .where(PerAbilitazione.persona_id.in_(persona_ids))
    ).all()
    for riga, abilitazione in righe_a:
        stato = _stato_registrazione_formativa(riga.data_scadenza, abilitazione.soglia_preavviso_giorni, oggi) if riga.data_scadenza else "VALIDA"
        formazione_per_persona[riga.persona_id].append((stato, riga.data_scadenza))

    # --- Idoneità sanitaria (§13): solo il giudizio vigente (il più recente
    # per data_visita) alimenta lo stato — gli altri sono "Sostituita" e
    # vengono esclusi qui, stesso criterio di `_storico_giudizi_idoneita`.
    giudizi_per_persona: dict[uuid.UUID, list[PerGiudizioIdoneita]] = {pid: [] for pid in persona_ids}
    righe_g = db.scalars(
        select(PerGiudizioIdoneita)
        .where(PerGiudizioIdoneita.persona_id.in_(persona_ids))
        .order_by(PerGiudizioIdoneita.persona_id, PerGiudizioIdoneita.data_visita.desc(), PerGiudizioIdoneita.created_at.desc())
    ).all()
    for g in righe_g:
        giudizi_per_persona[g.persona_id].append(g)
    giudizio_vigente_per_persona: dict[uuid.UUID, PerGiudizioIdoneita] = {
        pid: righe[0] for pid, righe in giudizi_per_persona.items() if righe
    }

    # --- Attività pianificate reali (§20, tabella per_attivita): un
    # promemoria non è un'attività pianificata (§5.6/§9), escluso qui alla
    # fonte per tutte le categorie, non solo per l'idoneità.
    attivita_per_persona: dict[uuid.UUID, list[PerAttivita]] = {pid: [] for pid in persona_ids}
    righe_att = db.scalars(
        select(PerAttivita)
        .where(
            PerAttivita.persona_id.in_(persona_ids),
            PerAttivita.stato == "PIANIFICATA",
            PerAttivita.tipo != _TIPO_ATTIVITA_PROMEMORIA,
            PerAttivita.data_scadenza >= oggi,
        )
        .order_by(PerAttivita.data_scadenza)
    ).all()
    for att in righe_att:
        attivita_per_persona[att.persona_id].append(att)

    # --- Ruoli (§14): solo gli incarichi ATTIVO contano; un ruolo cessato
    # non genera né "Nessun dato" né "Scaduto" (non esiste per gli incarichi
    # uno stato di scadenza).
    incarichi_per_persona: dict[uuid.UUID, list[PerIncarico]] = {pid: [] for pid in persona_ids}
    righe_inc = db.scalars(
        select(PerIncarico).where(PerIncarico.persona_id.in_(persona_ids), PerIncarico.stato == "ATTIVO")
    ).all()
    for inc in righe_inc:
        incarichi_per_persona[inc.persona_id].append(inc)
    tutti_incarico_ids = [inc.id for righe in incarichi_per_persona.values() for inc in righe]
    valori_incarichi = _valori_incarichi_batch(db, tutti_incarico_ids)
    config_per_ruolo: dict[uuid.UUID, dict] = {}
    for inc in righe_inc:
        if inc.ruolo_id not in config_per_ruolo:
            config_per_ruolo[inc.ruolo_id] = configurazione_ruolo(db, inc.ruolo_id)

    # --- Documenti personali (§15): solo quelli del Dossier personale,
    # nessun altro documento del modulo.
    documenti_per_persona: dict[uuid.UUID, list[PerDocumentoPersonale]] = {pid: [] for pid in persona_ids}
    righe_doc = db.scalars(
        select(PerDocumentoPersonale).where(PerDocumentoPersonale.persona_id.in_(persona_ids))
    ).all()
    tipi_documento = {
        t.id: t for t in db.scalars(select(CatTipoDocumentoIdentita))
    }
    for d in righe_doc:
        documenti_per_persona[d.persona_id].append(d)

    tipi_visita = {t.id: t for t in db.scalars(select(CatTipoVisita))}

    risultato: list[_PersonaAggregata] = []
    for persona, rapporto, mansione, reparto in persone:
        candidate_date: list[tuple[date, str]] = []
        record_stati: list[str] = []

        # Formazione e abilitazioni --------------------------------------
        conteggi_f: dict[str, int] = {}
        for stato, scadenza in formazione_per_persona[persona.id]:
            conteggi_f[stato] = conteggi_f.get(stato, 0) + 1
            record_stati.append(_MAPPA_STATO_RECORD[stato])
            if scadenza is not None and scadenza >= oggi:
                candidate_date.append((scadenza, "Formazione e abilitazioni"))
        cella_formazione = _cella(
            [s for s, _ in formazione_per_persona[persona.id]],
            pianificato=False,
            dettaglio_parti=_parti_dettaglio(conteggi_f, "registrazione", "registrazioni"),
        )

        # Idoneità sanitaria ----------------------------------------------
        giudizio = giudizio_vigente_per_persona.get(persona.id)
        appuntamenti_idoneita = [a for a in attivita_per_persona[persona.id] if a.tipo == _TIPO_ATTIVITA_VISITA]
        stati_idoneita: list[str] = []
        dettaglio_idoneita: list[str] = []
        if giudizio is not None:
            stato_g = _stato_giudizio(giudizio.data_scadenza, e_vigente=True, oggi=oggi)
            stati_idoneita.append(stato_g)
            record_stati.append(_MAPPA_STATO_RECORD[stato_g])
            tipo_visita = tipi_visita.get(giudizio.tipo_visita_id)
            dettaglio_idoneita.append(
                f"Giudizio {tipo_visita.denominazione if tipo_visita else ''} — {_ETICHETTA_CELLA[_MAPPA_STATO_RECORD[stato_g]].lower()}".strip()
            )
            if giudizio.data_scadenza is not None and giudizio.data_scadenza >= oggi:
                candidate_date.append((giudizio.data_scadenza, "Idoneità sanitaria: scadenza giudizio"))
        prossima_visita = appuntamenti_idoneita[0] if appuntamenti_idoneita else None
        if prossima_visita is not None:
            dettaglio_idoneita.append(f"Visita pianificata il {prossima_visita.data_scadenza.strftime('%d/%m/%Y')}")
            candidate_date.append((prossima_visita.data_scadenza, "Idoneità sanitaria: visita pianificata"))
        cella_idoneita = _cella(
            stati_idoneita,
            pianificato=prossima_visita is not None,
            dettaglio_parti=dettaglio_idoneita,
        )

        # Ruoli -------------------------------------------------------------
        incarichi_attivi = incarichi_per_persona[persona.id]
        stati_ruoli: list[str] = []
        n_incompleti = 0
        for inc in incarichi_attivi:
            config = config_per_ruolo.get(inc.ruolo_id, {})
            codici_documento = [codice for codice, (_rel, car) in config.items() if car.tipo_dato == "DOCUMENTO"]
            valori = valori_incarichi.get(inc.id, {})
            documentazione = _documentazione_stato(inc.fonte, codici_documento, valori)
            if documentazione in ("DA_INTEGRARE", "NON_PRESENTE"):
                stati_ruoli.append("INCOMPLETA")
                n_incompleti += 1
            else:
                stati_ruoli.append("VALIDA")
            record_stati.append("INCOMPLETO" if documentazione in ("DA_INTEGRARE", "NON_PRESENTE") else "VALIDO")
            data_fine = valori.get("A02")
            if isinstance(data_fine, date) and data_fine >= oggi:
                candidate_date.append((data_fine, "Ruoli: termine incarico"))
        dettaglio_ruoli = []
        if incarichi_attivi:
            dettaglio_ruoli.append(_conteggio_testo(len(incarichi_attivi), "incarico attivo", "incarichi attivi"))
            if n_incompleti:
                dettaglio_ruoli.append(_conteggio_testo(n_incompleti, "da integrare", "da integrare"))
        cella_ruoli = _cella(stati_ruoli, pianificato=False, dettaglio_parti=dettaglio_ruoli)

        # Documenti personali -----------------------------------------------
        conteggi_doc: dict[str, int] = {}
        stati_doc: list[str] = []
        for d in documenti_per_persona[persona.id]:
            if d.data_scadenza is not None:
                stato_d = _stato_registrazione_formativa(d.data_scadenza, None, oggi)
                if d.data_scadenza >= oggi:
                    tipo = tipi_documento.get(d.tipo_documento_id)
                    candidate_date.append((d.data_scadenza, f"Documenti personali: {tipo.denominazione if tipo else 'documento'}"))
            else:
                stato_d = "VALIDA"
            stati_doc.append(stato_d)
            conteggi_doc[stato_d] = conteggi_doc.get(stato_d, 0) + 1
            record_stati.append(_MAPPA_STATO_RECORD[stato_d])
        cella_documenti = _cella(
            stati_doc, pianificato=False, dettaglio_parti=_parti_dettaglio(conteggi_doc, "documento", "documenti", femminile=False)
        )

        # Prossima data (§16) -------------------------------------------
        prossima_data = None
        prossima_data_origine = None
        if candidate_date:
            candidate_date.sort(key=lambda c: c[0])
            prossima_data, prossima_data_origine = candidate_date[0]

        # Stato complessivo della persona (§8) ---------------------------
        celle = [cella_formazione, cella_idoneita, cella_ruoli, cella_documenti]
        stati_celle = [c.stato for c in celle]
        if "SCADUTO" in stati_celle:
            stato_complessivo = "DA_GESTIRE"
        elif any(s in ("IN_SCADENZA", "INCOMPLETO") for s in stati_celle):
            stato_complessivo = "IN_ATTENZIONE"
        elif all(s == "NESSUN_DATO" for s in stati_celle):
            stato_complessivo = "NESSUN_DATO"
        else:
            stato_complessivo = "REGOLARE"

        risultato.append(
            _PersonaAggregata(
                persona=persona,
                rapporto=rapporto,
                mansione=mansione,
                reparto=reparto,
                formazione=cella_formazione,
                idoneita=cella_idoneita,
                ruoli=cella_ruoli,
                documenti=cella_documenti,
                prossima_data=prossima_data,
                prossima_data_origine=prossima_data_origine,
                stato_complessivo=stato_complessivo,
                record_stati=record_stati,
            )
        )
    return risultato


def riepilogo_monitoraggio(db: Session, azienda_id: uuid.UUID) -> RiepilogoMonitoraggioRead:
    """Sei indicatori (§5) + conformità complessiva (§7): sempre calcolati
    sull'intera azienda, non influenzati dai filtri della matrice (che
    invece filtrano solo il quadro generale, §5 ultimo paragrafo)."""

    oggi = date.today()
    persone = _persone_attive(db, azienda_id, q=None, reparto_id=None, mansione_id=None)
    valutate = _aggrega_persone(db, azienda_id, persone, oggi=oggi)

    conteggi_record: dict[str, int] = {}
    for pv in valutate:
        for stato in pv.record_stati:
            conteggi_record[stato] = conteggi_record.get(stato, 0) + 1

    n_attivita_pianificate = len(
        db.scalars(
            select(PerAttivita.id).where(
                PerAttivita.azienda_id == azienda_id,
                PerAttivita.stato == "PIANIFICATA",
                PerAttivita.tipo != _TIPO_ATTIVITA_PROMEMORIA,
                PerAttivita.data_scadenza >= oggi,
            )
        ).all()
    )

    indicatori = IndicatoriMonitoraggioRead(
        persone_attive=len(valutate),
        registrazioni_valide=conteggi_record.get("VALIDO", 0),
        in_scadenza=conteggi_record.get("IN_SCADENZA", 0),
        scadute=conteggi_record.get("SCADUTO", 0),
        registrazioni_incomplete=conteggi_record.get("INCOMPLETO", 0),
        attivita_pianificate=n_attivita_pianificate,
        calcolato_al=oggi,
    )

    n_regolari = sum(1 for pv in valutate if pv.stato_complessivo == "REGOLARE")
    n_attenzione = sum(1 for pv in valutate if pv.stato_complessivo == "IN_ATTENZIONE")
    n_gestire = sum(1 for pv in valutate if pv.stato_complessivo == "DA_GESTIRE")
    n_nessun_dato = sum(1 for pv in valutate if pv.stato_complessivo == "NESSUN_DATO")
    totale = len(valutate)
    percentuale = (n_regolari / totale * 100) if totale else 0.0

    conformita = ConformitaComplessivaRead(
        percentuale_regolari=round(percentuale, 1),
        persone_regolari=n_regolari,
        totale_persone_attive=totale,
        distribuzione=DistribuzioneConformitaRead(
            regolari=n_regolari, in_attenzione=n_attenzione, da_gestire=n_gestire, nessun_dato=n_nessun_dato
        ),
    )
    return RiepilogoMonitoraggioRead(indicatori=indicatori, conformita=conformita)


def matrice_monitoraggio(
    db: Session,
    azienda_id: uuid.UUID,
    *,
    q: str | None,
    reparto_id: uuid.UUID | None,
    mansione_id: uuid.UUID | None,
    stato_complessivo: str | None,
    stato_cella: str | None,
    solo_anomalie: bool,
    page: int,
    page_size: int,
) -> PaginaMonitoraggioRead:
    """Quadro generale del personale (§10), paginato lato backend (§20): il
    filtro/ricerca è applicato prima della paginazione, come richiesto.

    `stato_cella` permette agli indicatori superiori di essere cliccabili
    (§5 ultimo paragrafo) anche per quelli che contano singoli record (es.
    "In scadenza"): filtra le persone che hanno almeno una cella con quello
    stato, non richiede una query separata."""

    oggi = date.today()
    persone = _persone_attive(db, azienda_id, q=q, reparto_id=reparto_id, mansione_id=mansione_id)
    valutate = _aggrega_persone(db, azienda_id, persone, oggi=oggi)

    if solo_anomalie:
        valutate = [pv for pv in valutate if pv.stato_complessivo != "REGOLARE"]
    if stato_complessivo:
        valutate = [pv for pv in valutate if pv.stato_complessivo == stato_complessivo]
    if stato_cella:
        valutate = [
            pv
            for pv in valutate
            if any(c.stato == stato_cella for c in (pv.formazione, pv.idoneita, pv.ruoli, pv.documenti))
        ]

    total = len(valutate)
    inizio = (page - 1) * page_size
    pagina = valutate[inizio : inizio + page_size]

    items = [
        MonitoraggioRigaRead(
            persona_id=pv.persona.id,
            nome=pv.persona.nome,
            cognome=pv.persona.cognome,
            mansione=pv.mansione,
            reparto=pv.reparto,
            formazione=pv.formazione,
            idoneita=pv.idoneita,
            ruoli=pv.ruoli,
            documenti=pv.documenti,
            prossima_data=pv.prossima_data,
            prossima_data_origine=pv.prossima_data_origine,
            stato_complessivo=pv.stato_complessivo,
        )
        for pv in pagina
    ]
    return PaginaMonitoraggioRead(items=items, total=total, page=page, page_size=page_size)
