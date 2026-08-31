"""Logica del "registro campo-per-campo" (verifica + visibilita' per singolo
campo, §7/§12/§13/§15 della specifica Anagrafica Aziendale).

Generalizzato per più sezioni (vedi `SEZIONI` in fondo al modulo): ogni
sezione è descritta da un `SezioneRegistro` che lega una tabella singleton
esistente, il proprio `sezione_codice` (chiave libera di
`sys_registro_stato_campi`/`sys_registro_audit`, nessuna migrazione
necessaria per aggiungerne) e il proprio catalogo di gruppi/campi. La sezione
pilota è "informazioni-societarie", sostenuta da `ana_identificazione_camerale`
(catalogo finale della specifica, PARTE II §26.1/§28.1: 14 campi in 3 gruppi).

`registeredOffice` ("Sede legale") non ha una colonna propria: esiste gia'
un'entita' autorevole per le sedi (`ana_sedi`, §16.1/§29.1 "non duplicare
automaticamente"), quindi il valore e' derivato in lettura da li' (vedi
`_sede_legale_di`) ed e' l'unico campo non scrivibile da questa sezione
(`derived=True`): resta comunque verificabile/nascondibile come tutti gli
altri, perche' verifica e visibilita' sono metadati per chiave di campo,
indipendenti da dove il valore e' fisicamente memorizzato.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import AziendaContext, get_current_azienda
from app.models.anagrafica import (
    AnaAmministrazioneControllo,
    AnaCapitaleSociale,
    AnaCodiceAteco,
    AnaDurataSocietaEsercizi,
    AnaElencoSociEstremi,
    AnaIdentificazioneCamerale,
    AnaOrganiControllo,
    AnaSede,
    AnaSedeRev2,
    AnaStatutoRev2,
    CatAffidatarioRevisioneLegale,
    CatAssettoControllo,
    CatDelegheConsiglio,
    CatDurataCarica,
    CatDurataIncaricoOrganoControllo,
    CatFunzioneOrganoInterno,
    CatGestioneOpposizione,
    CatModalitaDecisioniConsiglio,
    CatModalitaEsercizioPoteri,
    CatOrganoAmministrativo,
    CatRegimeRappresentanza,
    CatTitoloNominaOrganoControllo,
)
from app.models.personale import CatCaratteristicaIncarico, CatRuolo, PerIncarico, PerIncaricoValore
from app.models.sistema import SysRegistroAudit, SysRegistroStatoCampi, SysUtente
from app.schemas.registro_campi import (
    CompletionStatus,
    FieldOptionRead,
    FieldStateRead,
    QualitySummaryRead,
    RecentChangeRead,
    SectionGroupRead,
    SectionRead,
    SectionSummaryRead,
    VerificationStatus,
)

_RE_GIORNO_MESE = re.compile(r"^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$")
_RE_VALUTA = re.compile(r"^[A-Z]{3}$")

# Mappa stato interno (catalogo cat_stati_verifica_modifiche, condiviso con
# sys_presa_visione_modifiche) <-> stato logico esposto dall'API (§7.1).
# Non prefissate perché riusate anche da `app.core.incarichi` per la
# verifica a livello di riga-incarico (Soci/Amministratori/Sindaci): stesso
# significato degli stati, stessa tabella `sys_registro_stato_campi`, non
# duplicare la mappa in due moduli.
STATO_DB_TO_API: dict[str, VerificationStatus] = {
    "DA_VERIFICARE": "PENDING_VERIFICATION",
    "APPROVATO": "VERIFIED",
    "IN_REVISIONE": "REVISION_REQUIRED",
}
STATO_API_TO_DB = {v: k for k, v in STATO_DB_TO_API.items()}


@dataclass(frozen=True)
class CampoDef:
    key: str
    label: str
    data_type: str
    # True per i campi senza colonna propria sul model della sezione (es.
    # "Sede legale", derivato da ana_sedi): leggibile/verificabile/
    # nascondibile come ogni altro campo, ma escluso dalla scrittura via
    # PATCH sezione.
    derived: bool = False
    # Solo per campi derivati: nome/link della sezione sorgente, mostrati nel
    # suggerimento "Si modifica dalla sezione ..." quando il campo è aperto
    # in modifica (§16.1/§29.1: "non duplicare automaticamente"). `source_href`
    # è opzionale: alcune sorgenti (es. una card CCIAA senza pagina propria)
    # non hanno una route dedicata da linkare.
    source_label: str | None = None
    source_href: str | None = None
    # Solo per campi derivati che NON sono "si modifica altrove" (nessuna
    # sezione sorgente da linkare): una nota fissa da mostrare al posto del
    # messaggio "Si modifica ...", per campi calcolati automaticamente dal
    # backend (es. "Numero componenti" della configurazione "Amministratore
    # unico", sempre 1 per definizione — § Correzione 05). Mutuamente
    # alternativo a `source_label`: se entrambi sono impostati, il frontend
    # mostra solo `derived_note`.
    derived_note: str | None = None
    # Meccanismo generale di visibilità condizionata (Correzione 04 seguito:
    # "la scelta in 'Organo amministrativo in carica' determina i campi
    # successivamente mostrati"): se impostato, questo campo compare nella
    # sezione solo quando il campo `dipende_da` (stessa sezione) ha un
    # valore non vuoto — e, se `valori_dipendenza` è a sua volta impostato,
    # solo quando quel valore è uno dei codici indicati (es. un campo
    # mostrato solo per "Consiglio di amministrazione"). None/None su
    # entrambi = campo sempre visibile, comportamento invariato. Le regole
    # per le singole scelte del catalogo arriveranno una alla volta nelle
    # prossime correzioni: qui si generalizza solo il meccanismo.
    dipende_da: str | None = None
    valori_dipendenza: frozenset[str] | None = None
    # Solo per data_type "number": soglia minima ammessa, se diversa dal
    # default 0 (non negativo). Es. "Numero componenti" del Consiglio di
    # amministrazione deve essere un intero positivo (>= 1, § Correzione 06
    # punto 4), a differenza di "Titolari di cariche" che resta >= 0 come
    # tutti gli altri campi numerici (§ punto 10, "non negativi").
    valore_minimo: int | None = None
    # Solo per data_type "scelta": opzioni fisse (codice, etichetta) scritte
    # qui invece che in un catalogo (§ Correzione 14, "Sindaci effettivi":
    # solo 3 o 5, un vincolo di struttura, non una classificazione
    # estendibile — "Non è necessaria una tabella di catalogo"). A
    # differenza di un campo `catalogo` (`CampoCatalogo`, chiave esterna a
    # una tabella), la colonna di dominio qui è un valore diretto (es.
    # INTEGER): stesso trattamento di scrittura di "number", ma con un menu
    # a scelta invece di un campo libero lato frontend (`options` valorizzato
    # da queste coppie invece che da una query catalogo, § `costruisci_sezione`).
    opzioni_fisse: tuple[tuple[str, str], ...] | None = None


@dataclass(frozen=True)
class GruppoDef:
    key: str
    title: str
    campi: list[CampoDef]


CampoDerivatoLoader = Callable[[Session, UUID], "str | None"]


@dataclass(frozen=True)
class CampoCatalogo:
    """Descrive un campo a scelta singola il cui valore esposto/accettato
    dall'API è il `codice` stabile di una riga di un catalogo dedicato (§
    Correzione 04: "il frontend regola la visualizzazione usando il codice
    stabile, non la denominazione"), mentre la colonna di dominio sul model
    della sezione è una chiave esterna all'id di quella riga — mai la
    denominazione come testo libero. Meccanismo generale, riusabile da
    qualunque futuro campo a registro sostenuto da un catalogo con più di
    2-3 valori (qui: "Organo amministrativo in carica" ->
    `cat_organi_amministrativi`), a differenza dei campi `derived` (che non
    sono mai scrivibili): un campo a catalogo resta scrivibile via PATCH."""

    model: type
    colonna_fk: str


@dataclass(frozen=True)
class SezioneRegistro:
    section_key: str
    sezione_codice: str
    title: str
    model: type
    gruppi: list[GruppoDef]
    # Campo la cui sola presenza marca la sezione come "COMPLETE" (stessa
    # convenzione già in uso altrove nel modulo, es. `ragione_sociale` per
    # l'identificazione camerale). None per le sezioni senza un campo guida
    # unico (es. capitale sociale): in quel caso "COMPLETE" vale se almeno un
    # campo scrivibile è valorizzato, stessa regola già applicata da
    # `page.tsx` per queste sezioni.
    campo_completamento: str | None = None
    campi_derivati: dict[str, CampoDerivatoLoader] = field(default_factory=dict)
    campi_catalogo: dict[str, CampoCatalogo] = field(default_factory=dict)


@dataclass(frozen=True)
class _IndiceCampi:
    label: dict[str, str]
    tipo: dict[str, str]
    chiavi: set[str]
    derivate: set[str]
    scrivibili: set[str]
    # Solo le chiavi con una soglia diversa dal default (0); vedi
    # `CampoDef.valore_minimo`.
    minimi: dict[str, int]
    # Solo le chiavi con data_type "scelta"; vedi `CampoDef.opzioni_fisse`.
    opzioni_fisse: dict[str, tuple[tuple[str, str], ...]]


def _indice(sezione: SezioneRegistro) -> _IndiceCampi:
    label = {c.key: c.label for g in sezione.gruppi for c in g.campi}
    tipo = {c.key: c.data_type for g in sezione.gruppi for c in g.campi}
    chiavi = set(label)
    derivate = {c.key for g in sezione.gruppi for c in g.campi if c.derived}
    minimi = {c.key: c.valore_minimo for g in sezione.gruppi for c in g.campi if c.valore_minimo is not None}
    opzioni_fisse = {c.key: c.opzioni_fisse for g in sezione.gruppi for c in g.campi if c.opzioni_fisse is not None}
    return _IndiceCampi(
        label=label,
        tipo=tipo,
        chiavi=chiavi,
        derivate=derivate,
        scrivibili=chiavi - derivate,
        minimi=minimi,
        opzioni_fisse=opzioni_fisse,
    )


def is_empty(value: str | None) -> bool:
    """Stringhe vuote o di soli spazi, e None, sono vuote (§7.2)."""
    return value is None or value.strip() == ""


def _normalizza(valore: str | None) -> str | None:
    if valore is None:
        return None
    trimmed = valore.strip()
    return None if trimmed == "" else trimmed


def valida_campo(sezione: SezioneRegistro, campo: str, valore: str | None, db: Session | None = None) -> str | None:
    """Restituisce il messaggio di errore per un valore non vuoto e non
    valido, altrimenti None. Nessuna validazione `required` (§9.2): un
    valore vuoto non genera mai errore.

    `db` è opzionale (solo i campi a catalogo lo richiedono, per verificare
    che il codice inviato esista davvero): assente, resta la stessa funzione
    pura senza dipendenza da database usata dai test unitari."""
    if is_empty(valore):
        return None
    assert valore is not None

    indice = _indice(sezione)
    tipo = indice.tipo.get(campo)
    if tipo == "catalogo":
        catalogo = sezione.campi_catalogo.get(campo)
        if catalogo is not None and db is not None:
            esiste = db.scalar(
                select(func.count())
                .select_from(catalogo.model)
                .where(catalogo.model.codice == valore, catalogo.model.attivo.is_(True))
            )
            if not esiste:
                return "Valore non valido"
    elif campo == "partita_iva":
        if not re.fullmatch(r"\d{11}", valore):
            return "La Partita IVA deve contenere 11 cifre"
    elif campo == "codice_fiscale":
        if not re.fullmatch(r"[A-Za-z0-9]{11}|[A-Za-z0-9]{16}", valore):
            return "Il codice fiscale deve contenere 11 o 16 caratteri"
    elif tipo == "date":
        try:
            date.fromisoformat(valore)
        except ValueError:
            return "Data non valida"
    elif tipo == "day-month":
        if not _RE_GIORNO_MESE.fullmatch(valore):
            return "Usa il formato GG/MM"
    elif tipo == "importo":
        try:
            if Decimal(valore) < 0:
                return "L'importo non può essere negativo"
        except InvalidOperation:
            return "Importo non valido"
    elif tipo == "number":
        try:
            numero = int(valore)
        except ValueError:
            return "Numero non valido"
        else:
            minimo = indice.minimi.get(campo, 0)
            if numero < minimo:
                return "Il valore non può essere negativo" if minimo <= 0 else f"Il valore deve essere almeno {minimo}"
    elif tipo == "valuta":
        if not _RE_VALUTA.fullmatch(valore):
            return "Usa il codice valuta ISO a 3 lettere maiuscole (es. EUR)"
    elif tipo == "boolean":
        if valore not in ("true", "false"):
            return "Valore non valido"
    elif tipo == "scelta":
        # § Correzione 14: opzioni fisse scritte nel CampoDef, non in un
        # catalogo (es. "Sindaci effettivi": solo 3 o 5) — stessa idea di
        # `campi_catalogo` ma senza tabella/FK, quindi validata qui invece
        # che con una query.
        opzioni = indice.opzioni_fisse.get(campo)
        if opzioni is not None and valore not in {codice for codice, _ in opzioni}:
            return "Valore non valido"
    return None


def _valore_dal_record(row: object | None, campo: str) -> str | None:
    if row is None:
        return None
    valore = getattr(row, campo)
    if valore is None:
        return None
    if isinstance(valore, bool):
        return "true" if valore else "false"
    if isinstance(valore, date):
        return valore.isoformat()
    if isinstance(valore, Decimal):
        return str(valore)
    return str(valore)


def _sede_legale_di(db: Session, azienda_id: UUID) -> str | None:
    """Valore derivato del campo "Sede legale" (§16.1/§29.1): non duplica una
    colonna testuale perche' ana_sedi e' gia' l'entita' autorevole per le
    sedi. `tipo_sede` e' testo libero (nessun catalogo fisso in ana_sedi),
    quindi qui si usa il miglior riconoscimento possibile senza inventare un
    nuovo vincolo di dominio su un'altra tabella: la prima sede il cui tipo
    contiene "legale". Se nessuna sede e' marcata come tale, il campo resta
    vuoto (nessun indicatore di verifica, §7.2), esattamente come un dato mai
    inserito."""
    sede = db.scalars(
        select(AnaSede)
        .where(AnaSede.azienda_id == azienda_id, AnaSede.tipo_sede.ilike("%legale%"))
        .order_by(AnaSede.created_at.asc())
        .limit(1)
    ).first()
    if sede is None:
        return None
    via = " ".join(p for p in [sede.indirizzo, sede.numero_civico] if p)
    localita = " ".join(p for p in [sede.cap, sede.comune] if p)
    localita = f"{localita} ({sede.provincia})" if localita and sede.provincia else localita
    parti = [p for p in [via, localita, sede.nazione] if p]
    return ", ".join(parti) if parti else None


def _codice_nace_di(db: Session, azienda_id: UUID) -> str | None:
    """Valore derivato del "Codice NACE" di sintesi (mappatura CCIAA §0.3/
    §12.4, decisione D-P): non aggiunge una colonna indipendente perche'
    ana_codici_ateco gia' registra `codice_nace` su ogni riga ATECO
    (ripetuto identico, non un errore di per se': quella tabella e'
    pensata per righe multiple versionate). Qui si legge la riga più
    recente con `ruolo_codice` che indica prevalenza, altrimenti la più
    recente in assoluto."""
    riga = db.scalars(
        select(AnaCodiceAteco)
        .where(AnaCodiceAteco.azienda_id == azienda_id, AnaCodiceAteco.codice_nace.is_not(None))
        .order_by(AnaCodiceAteco.ruolo_codice.ilike("%preval%").desc(), AnaCodiceAteco.created_at.desc())
        .limit(1)
    ).first()
    return riga.codice_nace if riga else None


def _numero_soci_di(db: Session, azienda_id: UUID) -> str | None:
    """"Numero dei soci" della card omonima: mai una colonna propria, perché
    disallineerebbe dalla tabella soci mostrata nella stessa card (§18 del
    protocollo: "non hard-codificare conteggi"). Conta gli incarichi con
    ruolo SOCIO, storicizzati compresi (nessun filtro su cessazione: non
    richiesto, la tabella non nasconde i soci cessati)."""
    numero = db.scalar(
        select(func.count())
        .select_from(PerIncarico)
        .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
        .where(PerIncarico.azienda_id == azienda_id, CatRuolo.codice == "SOCIO")
    )
    return str(numero or 0)


def _capitale_rappresentato_di(db: Session, azienda_id: UUID) -> str | None:
    """"Capitale sociale rappresentato" della card "Soci": derivato dal
    capitale sottoscritto della sezione "Capitale sociale" invece di una
    colonna propria (decisione esplicita dell'utente, 27/08/2026) — è la
    parte di capitale effettivamente divisa in quote/azioni tra i soci, a
    differenza del deliberato (può eccedere il sottoscritto) o del versato
    (quanto è stato effettivamente pagato)."""
    capitale = db.scalars(select(AnaCapitaleSociale).where(AnaCapitaleSociale.azienda_id == azienda_id)).first()
    if capitale is None or capitale.capitale_sottoscritto is None:
        return None
    return str(capitale.capitale_sottoscritto)


def _numero_componenti_amministratore_unico(db: Session, azienda_id: UUID) -> str | None:
    """"Numero componenti" della configurazione "Amministratore unico" (§
    Correzione 05): nessuna colonna propria, vale sempre 1 per definizione
    (un amministratore unico è per l'appunto uno solo) — una costante, non
    un inserimento manuale. Il campo è comunque visibile solo quando
    "Organo amministrativo in carica" è "Amministratore unico" (`dipende_da`
    sul CampoDef), quindi non serve verificarlo di nuovo qui."""
    return "1"


def _numero_componenti_sindaco_unico(db: Session, azienda_id: UUID) -> str | None:
    """"Numero componenti" della configurazione "Sindaco unico" (§
    Correzione 13): a differenza dell'amministratore unico sopra (una
    costante "1" per definizione), qui il requisito è esplicito —
    "rimanere sincronizzato con l'unica riga della tabella" — quindi si
    conta davvero l'incarico SINDACO attivo (0 se non è ancora stato
    registrato nessuno, mai più di 1 per costruzione:
    `verifica_sindaco_unico_disponibile` impedisce di salvarne un secondo
    attivo). "Attivo" = senza data di cessazione (A02), stessa nozione già
    usata in `app.core.incarichi` — sotto-query duplicata qui (non
    importabile da `incarichi.py`, che already importa da questo modulo:
    l'importazione opposta creerebbe un ciclo)."""
    sotto_query_cessati = (
        select(PerIncaricoValore.incarico_id)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(CatCaratteristicaIncarico.codice == "A02", PerIncaricoValore.valore_data.is_not(None))
    )
    numero = db.scalar(
        select(func.count())
        .select_from(PerIncarico)
        .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
        .where(
            PerIncarico.azienda_id == azienda_id,
            CatRuolo.codice == "SINDACO",
            PerIncarico.id.not_in(sotto_query_cessati),
        )
    )
    return str(numero or 0)


def _sindaci_supplenti_collegio_sindacale(db: Session, azienda_id: UUID) -> str | None:
    """"Sindaci supplenti" della configurazione "Collegio sindacale" (§
    Correzione 14): nessuna colonna propria, sempre 2 per definizione del
    modello collegiale — una costante, stessa costruzione di
    `_numero_componenti_amministratore_unico` (non un conteggio reale come
    `_numero_componenti_sindaco_unico`: qui il numero non dipende da quante
    righe sono già state compilate)."""
    return "2"


def _numero_componenti_revisore_legale_persona_fisica(db: Session, azienda_id: UUID) -> str | None:
    """"Numero componenti" della configurazione "Revisore legale persona
    fisica" (§ Correzione 15): stessa costruzione di
    `_numero_componenti_sindaco_unico` (conta davvero l'incarico attivo,
    "rimanere sincronizzato con l'unica riga della tabella" § testo
    esplicito) — qui per il ruolo REVISORE_LEGALE invece di SINDACO. Chiave
    di campo propria (`numero_componenti_revisore`) invece di riusare
    "numero_componenti_organo": stesso pattern già seguito da "Collegio
    sindacale" (`numero_componenti_collegio`), una chiave per
    configurazione, mai una condivisa tra ruoli diversi. Conta solo i
    titolari persona FISICA (§ Correzione 16, stesso ruolo REVISORE_LEGALE
    anche per un titolare persona giuridica — conteggi indipendenti, vedi
    `_numero_componenti_societa_revisione_legale`)."""
    sotto_query_cessati = (
        select(PerIncaricoValore.incarico_id)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(CatCaratteristicaIncarico.codice == "A02", PerIncaricoValore.valore_data.is_not(None))
    )
    numero = db.scalar(
        select(func.count())
        .select_from(PerIncarico)
        .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
        .where(
            PerIncarico.azienda_id == azienda_id,
            CatRuolo.codice == "REVISORE_LEGALE",
            PerIncarico.persona_id.is_not(None),
            PerIncarico.id.not_in(sotto_query_cessati),
        )
    )
    return str(numero or 0)


def _numero_componenti_societa_revisione_legale(db: Session, azienda_id: UUID) -> str | None:
    """"Numero componenti" della configurazione "Società di revisione
    legale" (§ Correzione 16): stessa costruzione di
    `_numero_componenti_revisore_legale_persona_fisica` — "rappresentare un
    unico soggetto giuridico incaricato... rimanere sincronizzato con
    l'unica riga della tabella" (§ testo esplicito) — ma conta solo i
    titolari persona GIURIDICA."""
    sotto_query_cessati = (
        select(PerIncaricoValore.incarico_id)
        .join(CatCaratteristicaIncarico, CatCaratteristicaIncarico.id == PerIncaricoValore.caratteristica_id)
        .where(CatCaratteristicaIncarico.codice == "A02", PerIncaricoValore.valore_data.is_not(None))
    )
    numero = db.scalar(
        select(func.count())
        .select_from(PerIncarico)
        .join(CatRuolo, CatRuolo.id == PerIncarico.ruolo_id)
        .where(
            PerIncarico.azienda_id == azienda_id,
            CatRuolo.codice == "REVISORE_LEGALE",
            PerIncarico.persona_giuridica_id.is_not(None),
            PerIncarico.id.not_in(sotto_query_cessati),
        )
    )
    return str(numero or 0)


def _numero_componenti_collegio_sindacale(db: Session, azienda_id: UUID) -> str | None:
    """"Numero componenti" della configurazione "Collegio sindacale" (§
    Correzione 14): sindaci effettivi (3 o 5, scelta dell'utente) + i 2
    supplenti fissi — calcolato dalla struttura prescritta, non contando le
    righe già compilate della tabella (a differenza di "Sindaco unico": qui
    la tabella si riempie progressivamente fino alla capienza prevista, il
    numero mostrato è quello a cui la composizione deve arrivare, non
    quanto è già stato inserito). Vuoto finché "Sindaci effettivi" non è
    stato scelto."""
    riga = db.scalars(select(AnaOrganiControllo).where(AnaOrganiControllo.azienda_id == azienda_id)).first()
    if riga is None or riga.sindaci_effettivi is None:
        return None
    return str(riga.sindaci_effettivi + 2)


def _opzioni_catalogo(db: Session, catalogo: CampoCatalogo) -> list[FieldOptionRead]:
    """Opzioni attive del catalogo, nell'ordine di visualizzazione
    configurato: il menu a tendina del frontend le usa cosi' come sono,
    senza valori scritti a mano lato client (§ Correzione 04)."""
    righe = db.scalars(
        select(catalogo.model).where(catalogo.model.attivo.is_(True)).order_by(catalogo.model.ordine_visualizzazione)
    ).all()
    return [FieldOptionRead(code=r.codice, label=r.denominazione) for r in righe]


def _valore_catalogo_di(db: Session, catalogo: CampoCatalogo, row: object | None) -> str | None:
    """Codice stabile del catalogo puntato dalla chiave esterna sul record
    di dominio (§ Correzione 04): mai la denominazione, cosi' il frontend
    puo' confrontare/instradare sul codice invece che sul testo mostrato."""
    if row is None:
        return None
    riga_id = getattr(row, catalogo.colonna_fk)
    if riga_id is None:
        return None
    riga = db.get(catalogo.model, riga_id)
    return riga.codice if riga is not None else None


def _valore_campo(db: Session, ctx: AziendaContext, sezione: SezioneRegistro, row: object | None, campo: str) -> str | None:
    """Valore attuale di un campo del catalogo, qualunque sia la sua origine
    (colonna di dominio, derivata o a catalogo): usato ovunque serva leggere
    "il valore attuale" a prescindere da dove sia fisicamente memorizzato
    (verifica, visibilita')."""
    loader = sezione.campi_derivati.get(campo)
    if loader is not None:
        return loader(db, ctx.azienda_id)
    catalogo = sezione.campi_catalogo.get(campo)
    if catalogo is not None:
        return _valore_catalogo_di(db, catalogo, row)
    return _valore_dal_record(row, campo)


def _campo_compilato(sezione: SezioneRegistro, row: object, campo: str) -> bool:
    """Come `_valore_dal_record`, ma senza bisogno di `db`: per i campi a
    catalogo (§ Correzione 04) basta sapere se la chiave esterna e'
    valorizzata, non serve risolvere il codice (usato solo da
    `stato_completamento`, che non ha una sessione)."""
    catalogo = sezione.campi_catalogo.get(campo)
    if catalogo is not None:
        return getattr(row, catalogo.colonna_fk) is not None
    return not is_empty(_valore_dal_record(row, campo))


def stato_completamento(sezione: SezioneRegistro, row: object | None) -> CompletionStatus:
    """Server-authoritative, non dedotta da campi `required` (§14): nessuna
    soglia di completezza e' inventata qui. Il campo derivato (dove presente)
    non entra nel controllo "in corso": la sua presenza dipende da un altro
    modulo, non da una compilazione fatta qui."""
    if row is None:
        return "NOT_STARTED"
    scrivibili = _indice(sezione).scrivibili
    qualcosa_compilato = any(_campo_compilato(sezione, row, c) for c in scrivibili)
    if sezione.campo_completamento is not None:
        if _campo_compilato(sezione, row, sezione.campo_completamento):
            return "COMPLETE"
        return "IN_PROGRESS" if qualcosa_compilato else "NOT_STARTED"
    # Nessun campo guida unico (es. capitale sociale): completa se almeno un
    # campo scrivibile e' valorizzato, stessa convenzione gia' in uso in
    # `page.tsx` per queste sezioni.
    return "COMPLETE" if qualcosa_compilato else "NOT_STARTED"


def _carica_stati(db: Session, azienda_id: UUID, sezione_codice: str) -> dict[str, SysRegistroStatoCampi]:
    righe = db.scalars(
        select(SysRegistroStatoCampi).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.sezione_codice == sezione_codice,
        )
    ).all()
    return {r.campo_codice: r for r in righe}


def _nome_utente(utente: SysUtente) -> str:
    # Stesso formato "Nome I." già usato da `ultime_modifiche`.
    return f"{utente.nome} {utente.cognome[:1]}."


def _carica_verificatori(db: Session, stati: dict[str, SysRegistroStatoCampi]) -> dict[UUID, str]:
    """Nomi (§9.4) degli autori di verifica presenti tra gli stati caricati,
    in un'unica query invece di una per campo."""
    ids = {s.verificato_da for s in stati.values() if s.verificato_da is not None}
    if not ids:
        return {}
    utenti = db.scalars(select(SysUtente).where(SysUtente.id.in_(ids))).all()
    return {u.id: _nome_utente(u) for u in utenti}


def costruisci_sezione(
    db: Session,
    ctx: AziendaContext,
    sezione: SezioneRegistro,
    *,
    row: object | None,
) -> SectionRead:
    stati = _carica_stati(db, ctx.azienda_id, sezione.sezione_codice)
    consulente = ctx.profilo == "CONSULENTE"
    # Stato, nota e audit di verifica sono visibili anche all'Azienda in
    # sola lettura (§13 del prompt master): le servono per capire cosa
    # correggere quando un campo è "da revisionare". Solo l'occhietto
    # (visibilità) e le decisioni di verifica restano riservate al
    # Consulente, applicate lato UI (§9.3) e comunque riverificate qui.
    verificatori = _carica_verificatori(db, stati)

    gruppi: list[SectionGroupRead] = []
    for gruppo in sezione.gruppi:
        # Valori dell'intero gruppo pre-calcolati una volta sola: servono
        # sia per il campo corrente sia per valutare `dipende_da` di un
        # altro campo dello stesso gruppo, qualunque sia l'ordine di
        # dichiarazione (es. "organo_amministrativo_in_carica" e' il primo,
        # ma la regola non deve assumerlo).
        valori_gruppo = {c.key: _valore_campo(db, ctx, sezione, row, c.key) for c in gruppo.campi}
        campi_letti: list[FieldStateRead] = []
        for campo in gruppo.campi:
            # § Correzione 04/05 seguito: il filtro "campo non applicabile
            # perché dipende da un'altra scelta" non esclude più il campo
            # dalla risposta — resta esposto con `dependsOn`/
            # `dependsOnValues`, cosi' il frontend puo' mostrarlo/
            # nasconderlo istantaneamente durante la modifica (prima della
            # scelta corrente), non solo dopo un salvataggio. L'unico filtro
            # che continua a escludere righe qui e' l'occhietto
            # (visibile_azienda), un vincolo di accesso reale, non di
            # presentazione.
            valore = valori_gruppo[campo.key]
            stato_riga = stati.get(campo.key)
            visibile = stato_riga.visibile_azienda if stato_riga else True

            if not consulente and not visibile:
                continue  # §13.2: il campo nascosto non viene renderizzato per l'Azienda.

            # Un campo vuoto non ha mai uno stato di verifica, anche se e'
            # rimasta una riga di stato "stantia" da un valore poi svuotato
            # (invariante applicata anche in lettura, non solo in scrittura).
            vuoto = is_empty(valore)
            # Dato legacy compilato ma senza riga di stato (es. valorizzato
            # prima dell'introduzione di questo registro, o mai toccato da
            # un salvataggio passato da questo modulo): trattato come
            # DA_VERIFICARE, mai come "nessuno stato" (§7.2).
            if vuoto:
                stato_verifica = None
            elif stato_riga is not None:
                stato_verifica = STATO_DB_TO_API.get(stato_riga.stato_verifica_codice) or "PENDING_VERIFICATION"
            else:
                stato_verifica = "PENDING_VERIFICATION"
            nota = None if vuoto else (stato_riga.nota_revisione if stato_riga else None)
            # Stessa logica "pigra" del backfill sopra: una riga mai
            # materializzata parte concettualmente alla versione 1, la
            # stessa che _get_or_create_stato assegnera' quando verra'
            # davvero creata (es. dalla prima decisione di verifica).
            versione = None if vuoto else (stato_riga.versione if stato_riga else 1)
            verificato_il = (
                stato_riga.verificato_at.isoformat()
                if stato_riga is not None and stato_verifica == "VERIFIED" and stato_riga.verificato_at is not None
                else None
            )
            verificato_da_nome = (
                verificatori.get(stato_riga.verificato_da)
                if stato_riga is not None and stato_verifica == "VERIFIED" and stato_riga.verificato_da is not None
                else None
            )

            catalogo = sezione.campi_catalogo.get(campo.key)
            opzioni = (
                _opzioni_catalogo(db, catalogo)
                if catalogo is not None
                # § Correzione 14: data_type "scelta" — opzioni fisse dal
                # CampoDef, non da una query catalogo (vedi commento su
                # `CampoDef.opzioni_fisse`).
                else (
                    [FieldOptionRead(code=codice, label=etichetta) for codice, etichetta in campo.opzioni_fisse]
                    if campo.opzioni_fisse is not None
                    else None
                )
            )

            campo_letto = FieldStateRead(
                key=campo.key,
                label=campo.label,
                value=valore,
                dataType=campo.data_type,
                editable=not campo.derived,
                visibleToCompany=visibile,
                verificationStatus=stato_verifica,
                # Ancora di concorrenza ottimistica per la decisione di
                # verifica: usata solo dalla mutazione consulente-only, non
                # serve (e non va esposta) all'Azienda in sola lettura.
                verificationVersion=versione if consulente else None,
                revisionNote=nota,
                updatedAt=getattr(row, "updated_at", None).isoformat() if row is not None else None,
                verifiedAt=verificato_il,
                verifiedBy=verificato_da_nome,
                options=opzioni,
                sourceLabel=campo.source_label if campo.derived else None,
                sourceHref=campo.source_href if campo.derived else None,
                derivedNote=campo.derived_note if campo.derived else None,
                dependsOn=campo.dipende_da,
                dependsOnValues=sorted(campo.valori_dipendenza) if campo.valori_dipendenza is not None else None,
            )
            campi_letti.append(campo_letto)
        gruppi.append(SectionGroupRead(key=gruppo.key, title=gruppo.title, fields=campi_letti))

    return SectionRead(
        sectionKey=sezione.section_key,
        title=sezione.title,
        completionStatus=stato_completamento(sezione, row),
        groups=gruppi,
        version=getattr(row, "updated_at", None).isoformat() if row is not None else None,
    )


def registra_audit(
    db: Session,
    ctx: AziendaContext,
    *,
    sezione_codice: str,
    campo_codice: str,
    azione: str,
    precedente: str | None,
    nuovo: str | None,
) -> None:
    db.add(
        SysRegistroAudit(
            azienda_id=ctx.azienda_id,
            utente_id=ctx.utente_id,
            sezione_codice=sezione_codice,
            campo_codice=campo_codice,
            azione=azione,
            valore_precedente=precedente,
            valore_nuovo=nuovo,
        )
    )


def applica_modifiche_sezione(
    db: Session,
    ctx: AziendaContext,
    sezione: SezioneRegistro,
    *,
    row: object,
    cambiamenti: dict[str, str | None],
) -> list[str]:
    """Applica solo i campi effettivamente cambiati al record di dominio e
    allo stato di verifica per campo (§7.3): un valore svuotato azzera lo
    stato, un valore non vuoto modificato torna DA_VERIFICARE. Nessun
    aggiornamento (ne' di stato ne' di audit) per campi inviati ma identici
    al valore gia' salvato. Restituisce le chiavi effettivamente cambiate."""
    indice = _indice(sezione)
    stati = _carica_stati(db, ctx.azienda_id, sezione.sezione_codice)
    cambiate: list[str] = []

    for campo, nuovo_raw in cambiamenti.items():
        if campo not in indice.scrivibili:
            continue  # fuori catalogo, oppure campo derivato (non scrivibile qui, §16.1/§29.1)
        nuovo = _normalizza(nuovo_raw)
        attuale = _valore_campo(db, ctx, sezione, row, campo)
        if nuovo == attuale:
            continue

        tipo = indice.tipo.get(campo)
        if tipo == "date":
            setattr(row, campo, date.fromisoformat(nuovo) if nuovo is not None else None)
        elif tipo == "importo":
            setattr(row, campo, Decimal(nuovo) if nuovo is not None else None)
        elif tipo == "number":
            setattr(row, campo, int(nuovo) if nuovo is not None else None)
        elif tipo == "scelta":
            # § Correzione 14: colonna diretta (es. INTEGER), non una FK —
            # stessa scrittura di "number", il vincolo alle sole opzioni
            # fisse è già stato verificato da `valida_campo`.
            setattr(row, campo, int(nuovo) if nuovo is not None else None)
        elif tipo == "boolean":
            setattr(row, campo, (nuovo == "true") if nuovo is not None else None)
        elif tipo == "catalogo":
            catalogo = sezione.campi_catalogo[campo]
            if nuovo is None:
                setattr(row, catalogo.colonna_fk, None)
            else:
                # Il codice e' gia' stato verificato da `valida_campo` (con
                # `db`) prima di arrivare qui: se manca comunque, il record
                # a catalogo e' stato disattivato/rimosso tra la validazione
                # e questo salvataggio, un errore da far emergere e non da
                # ignorare silenziosamente.
                riga_catalogo = db.scalars(
                    select(catalogo.model).where(catalogo.model.codice == nuovo, catalogo.model.attivo.is_(True))
                ).first()
                if riga_catalogo is None:
                    raise ValueError(f"Valore di catalogo non valido per {campo}: {nuovo!r}")
                setattr(row, catalogo.colonna_fk, riga_catalogo.id)
        else:
            setattr(row, campo, nuovo)

        stato_riga = stati.get(campo)
        if stato_riga is None:
            stato_riga = SysRegistroStatoCampi(
                azienda_id=ctx.azienda_id,
                sezione_codice=sezione.sezione_codice,
                campo_codice=campo,
                versione=1,
            )
            db.add(stato_riga)
            stati[campo] = stato_riga

        if is_empty(nuovo):
            if stato_riga.stato_verifica_codice is not None:
                stato_riga.versione += 1
            stato_riga.stato_verifica_codice = None
            stato_riga.nota_revisione = None
            stato_riga.verificato_da = None
            stato_riga.verificato_at = None
        else:
            stato_riga.stato_verifica_codice = "DA_VERIFICARE"
            stato_riga.nota_revisione = None
            stato_riga.verificato_da = None
            stato_riga.verificato_at = None
            stato_riga.versione += 1

        registra_audit(
            db,
            ctx,
            sezione_codice=sezione.sezione_codice,
            campo_codice=campo,
            azione="MODIFICA_VALORE",
            precedente=attuale,
            nuovo=nuovo,
        )
        cambiate.append(campo)

    return cambiate


def valuta_qualita(db: Session, azienda_id: UUID) -> QualitySummaryRead:
    """Qualità dei *dati già inseriti e visibili all'azienda* (decisione
    esplicita dell'utente): l'indicatore "Qualità dei dati" misura quanto è
    affidabile ciò che è stato compilato, non quanto manca da compilare —
    per questo `percentage` e i conteggi `verified`/`pending`/
    `revisionRequired` restano sui soli campi compilati, cioè quelli con una
    riga di stato già creata (un campo mai toccato non ha ancora nulla da
    "verificare"). Un campo oscurato con l'occhietto (`visibile_azienda`
    false) è escluso dal calcolo, non solo nascosto all'Azienda: la qualità
    misura cosa l'azienda vede, non il lavoro interno del Consulente su dati
    che ha scelto di non mostrare ancora.

    Le query sotto non filtrano per `sezione_codice`: sommano già tutte le
    sezioni registrate per l'azienda, qualunque esse siano — `totalApplicable`
    e' l'unico numero che va sommato esplicitamente sui cataloghi di tutte le
    sezioni in `SEZIONI` (prima del pilota coincideva solo con quello di
    "informazioni-societarie").

    `hidden` (campi con `visibile_azienda=false`, indipendentemente dal fatto
    che siano compilati) è restituito a parte perché lo stato di
    completamento di una sezione (card della Home) deve ignorare i campi che
    il Consulente ha scelto di non mostrare ancora: un campo nascosto e
    non compilato non deve impedire alla sezione di risultare "completa"."""
    righe = db.scalars(
        select(SysRegistroStatoCampi.stato_verifica_codice).where(
            SysRegistroStatoCampi.azienda_id == azienda_id,
            SysRegistroStatoCampi.stato_verifica_codice.is_not(None),
            SysRegistroStatoCampi.visibile_azienda.is_(True),
        )
    ).all()
    verified = sum(1 for s in righe if s == "APPROVATO")
    pending = sum(1 for s in righe if s == "DA_VERIFICARE")
    revision = sum(1 for s in righe if s == "IN_REVISIONE")
    filled = verified + pending + revision
    percentage = round(verified / filled * 100) if filled > 0 else 0
    total_applicable = sum(len(_indice(s).chiavi) for s in SEZIONI.values())
    hidden = len(
        db.scalars(
            select(SysRegistroStatoCampi.campo_codice).where(
                SysRegistroStatoCampi.azienda_id == azienda_id,
                SysRegistroStatoCampi.visibile_azienda.is_(False),
            )
        ).all()
    )
    return QualitySummaryRead(
        verified=verified,
        pending=pending,
        revisionRequired=revision,
        percentage=percentage,
        totalApplicable=total_applicable,
        hidden=hidden,
    )


def riepilogo_sezioni(db: Session, azienda_id: UUID) -> list[SectionSummaryRead]:
    """Conteggi confermato/da-verificare/da-revisionare **per sezione**, usati
    dalle card della Home (§6.4) invece di far ricalcolare al frontend
    qualcosa che il backend già sa (niente logica duplicata, CLAUDE.md)."""
    risultati: list[SectionSummaryRead] = []
    for sezione in SEZIONI.values():
        righe = db.scalars(
            select(SysRegistroStatoCampi.stato_verifica_codice).where(
                SysRegistroStatoCampi.azienda_id == azienda_id,
                SysRegistroStatoCampi.sezione_codice == sezione.sezione_codice,
                SysRegistroStatoCampi.stato_verifica_codice.is_not(None),
                SysRegistroStatoCampi.visibile_azienda.is_(True),
            )
        ).all()
        risultati.append(
            SectionSummaryRead(
                sectionKey=sezione.section_key,
                verified=sum(1 for s in righe if s == "APPROVATO"),
                pending=sum(1 for s in righe if s == "DA_VERIFICARE"),
                revisionRequired=sum(1 for s in righe if s == "IN_REVISIONE"),
                totalApplicable=len(_indice(sezione).chiavi),
            )
        )
    return risultati


def _campo_label_globale() -> dict[str, str]:
    label: dict[str, str] = {}
    for sezione in SEZIONI.values():
        label.update(_indice(sezione).label)
    return label


def ultime_modifiche(db: Session, azienda_id: UUID, *, limite: int = 5) -> list[RecentChangeRead]:
    righe = db.execute(
        select(SysRegistroAudit, SysUtente)
        .join(SysUtente, SysUtente.id == SysRegistroAudit.utente_id, isouter=True)
        .where(SysRegistroAudit.azienda_id == azienda_id)
        .order_by(SysRegistroAudit.created_at.desc())
        .limit(limite)
    ).all()

    _ETICHETTE_AZIONE = {
        "MODIFICA_VALORE": "aggiornato",
        "VERIFICA": "verificato",
        "RICHIESTA_REVISIONE": "segnalato per revisione",
        "CAMBIO_VISIBILITA": "visibilità modificata",
    }

    campo_label = _campo_label_globale()
    esiti: list[RecentChangeRead] = []
    for audit, utente in righe:
        etichetta_campo = campo_label.get(audit.campo_codice, audit.campo_codice)
        azione = _ETICHETTE_AZIONE.get(audit.azione, audit.azione)
        attore = f"{utente.nome} {utente.cognome[:1]}." if utente is not None else None
        esiti.append(
            RecentChangeRead(
                id=str(audit.id),
                label=f"{etichetta_campo} {azione}",
                timestamp=audit.created_at.isoformat(),
                actor=attore,
            )
        )
    return esiti


def _get_or_create_stato(
    db: Session, ctx: AziendaContext, sezione: SezioneRegistro, campo: str, *, valore_attuale: str | None
) -> SysRegistroStatoCampi:
    stati = _carica_stati(db, ctx.azienda_id, sezione.sezione_codice)
    stato_riga = stati.get(campo)
    if stato_riga is not None:
        return stato_riga
    stato_riga = SysRegistroStatoCampi(
        azienda_id=ctx.azienda_id,
        sezione_codice=sezione.sezione_codice,
        campo_codice=campo,
        # Backfill "pigro" per dati legacy compilati ma mai passati da
        # questo registro (§7.2): se il valore e' gia' non vuoto la riga
        # nasce DA_VERIFICARE, mai senza stato.
        stato_verifica_codice="DA_VERIFICARE" if not is_empty(valore_attuale) else None,
        # Valorizzata esplicitamente (non solo il default lato colonna):
        # il default di mapped_column si applica solo all'INSERT, ma qui
        # serve leggerla subito dopo, prima del flush (es. `versione += 1`).
        versione=1,
    )
    db.add(stato_riga)
    return stato_riga


def applica_decisione_verifica(
    db: Session,
    ctx: AziendaContext,
    sezione: SezioneRegistro,
    *,
    row: object | None,
    campo: str,
    decisione: str,
    nota: str | None,
    expected_field_version: int | None,
) -> SysRegistroStatoCampi:
    valore = _valore_campo(db, ctx, sezione, row, campo)
    if is_empty(valore):
        raise HTTPException(status.HTTP_409_CONFLICT, "Il campo è vuoto: nessun valore da verificare")

    # Vincolo di dominio (non solo di schema, §2.3 CLAUDE.md "la logica di
    # business sta nel backend"): una richiesta di revisione deve sempre
    # spiegare cosa correggere. Verificato qui esplicitamente, prima del
    # CHECK chk_sys_registro_stato_campi_nota_se_in_revisione (021), per
    # restituire un 422 leggibile invece di un errore di integrità del DB.
    if decisione == "REVISION_REQUIRED" and is_empty(nota):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "La richiesta di revisione richiede una nota che spieghi cosa correggere",
        )

    stato_riga = _get_or_create_stato(db, ctx, sezione, campo, valore_attuale=valore)

    if expected_field_version is not None and stato_riga.versione != expected_field_version:
        raise HTTPException(status.HTTP_409_CONFLICT, "Il campo è stato modificato nel frattempo: ricaricare e riprovare")

    codice_db = STATO_API_TO_DB[decisione]
    # Un campo già confermato che riceve di nuovo la decisione VERIFIED (il
    # pulsante "Salva nota" del popup, §9.2 punto 6/§23.1) aggiorna solo la
    # nota: non deve aggiornare falsamente la data/autore di verifica, che
    # restano quelli della verifica originale. Resta comunque azione
    # "VERIFICA" nell'audit (chk_sys_registro_audit_azione, 022, non
    # modificabile senza una nuova migrazione: nessun valore nuovo introdotto
    # qui, solo riuso di uno già ammesso).
    solo_nota = decisione == "VERIFIED" and stato_riga.stato_verifica_codice == "APPROVATO"
    stato_riga.stato_verifica_codice = codice_db
    stato_riga.versione += 1
    if decisione == "REVISION_REQUIRED":
        stato_riga.nota_revisione = nota
        stato_riga.verificato_da = None
        stato_riga.verificato_at = None
        azione = "RICHIESTA_REVISIONE"
    elif solo_nota:
        stato_riga.nota_revisione = nota
        azione = "VERIFICA"
    else:
        stato_riga.nota_revisione = nota
        stato_riga.verificato_da = ctx.utente_id
        stato_riga.verificato_at = datetime.now(timezone.utc)
        azione = "VERIFICA"

    registra_audit(
        db,
        ctx,
        sezione_codice=sezione.sezione_codice,
        campo_codice=campo,
        azione=azione,
        precedente=None,
        nuovo=nota,
    )
    return stato_riga


def applica_visibilita(
    db: Session,
    ctx: AziendaContext,
    sezione: SezioneRegistro,
    *,
    row: object | None,
    campo: str,
    visibile: bool,
) -> SysRegistroStatoCampi:
    """Configurazione autonoma (§13.3): non tocca stato di verifica ne'
    versione (l'ancora di concorrenza della verifica), non sporca la bozza
    del modulo dati."""
    valore = _valore_campo(db, ctx, sezione, row, campo)
    stato_riga = _get_or_create_stato(db, ctx, sezione, campo, valore_attuale=valore)
    stato_riga.visibile_azienda = visibile
    registra_audit(
        db,
        ctx,
        sezione_codice=sezione.sezione_codice,
        campo_codice=campo,
        azione="CAMBIO_VISIBILITA",
        precedente=None,
        nuovo="nascosto" if not visibile else "visibile",
    )
    return stato_riga


def require_consulente_ctx(ctx: AziendaContext = Depends(get_current_azienda)) -> AziendaContext:
    """Come `require_consulente` (app.core.deps) ma a valle di
    `get_current_azienda`: qui serve anche l'azienda attiva del consulente
    (header X-Azienda-Id), non solo l'identita' dell'utente."""
    if ctx.profilo != "CONSULENTE":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Operazione riservata al consulente")
    return ctx


# ===========================================================================
# Catalogo delle sezioni registrate
# ===========================================================================

# Catalogo finale (specifica Anagrafica Aziendale, PARTE II §28.1): 3 gruppi,
# 14 campi. Le chiavi restano i nomi delle colonne di dominio (convenzione
# gia' in uso nel resto del repository), non i fieldKey camelCase illustrativi
# del documento: e' l'adattamento allo stack esistente esplicitamente
# consentito dal blueprint (§25/§27.3).
SEZIONE_INFORMAZIONI_SOCIETARIE = SezioneRegistro(
    section_key="informazioni-societarie",
    sezione_codice="ANAGRAFICA_AZIENDALE.INFORMAZIONI_SOCIETARIE",
    title="Informazioni societarie",
    model=AnaIdentificazioneCamerale,
    campo_completamento="ragione_sociale",
    campi_derivati={"sede_legale": _sede_legale_di, "codice_nace": _codice_nace_di},
    gruppi=[
        GruppoDef(
            key="identificazione-camerale",
            title="Identificazione camerale",
            campi=[
                CampoDef("ragione_sociale", "Ragione sociale", "text"),
                CampoDef("forma_giuridica", "Forma giuridica", "text"),
                CampoDef("codice_fiscale", "Codice fiscale", "codice-fiscale"),
                CampoDef("partita_iva", "Partita IVA", "partita-iva"),
            ],
        ),
        GruppoDef(
            key="iscrizione-registro-imprese",
            title="Iscrizione al Registro Imprese",
            campi=[
                CampoDef("numero_rea", "Numero REA", "text"),
                CampoDef("numero_iscrizione", "Numero iscrizione", "text"),
                CampoDef("provincia_rea", "Provincia REA", "text"),
                CampoDef("data_iscrizione", "Data iscrizione", "date"),
                CampoDef(
                    "sede_legale", "Sede legale", "address", derived=True,
                    source_label="dalla sezione Sedi", source_href="/anagrafica/sedi",
                ),
                CampoDef("stato_attivita", "Stato impresa", "text"),
            ],
        ),
        GruppoDef(
            key="date",
            title="Date",
            campi=[
                CampoDef("data_atto_costitutivo", "Data costituzione", "date"),
                CampoDef("termine_esercizio", "Termine esercizio", "day-month"),
                CampoDef("inizio_esercizio", "Inizio esercizio", "day-month"),
                CampoDef("data_ultimo_bilancio_approvato", "Data ultimo bilancio approvato", "date"),
            ],
        ),
        # Blocco condizionale (mappatura CCIAA §1.4): mostrato dal frontend
        # solo se almeno un campo è valorizzato, la sezione resta comunque
        # sempre presente nel catalogo come le altre.
        GruppoDef(
            key="trasferimento-provincia",
            title="Trasferimento da altra provincia",
            campi=[
                CampoDef("provincia_provenienza", "Provincia di provenienza", "text"),
                CampoDef("numero_rea_precedente", "Numero REA precedente", "text"),
                CampoDef("data_trasferimento_provincia", "Data del trasferimento", "date"),
            ],
        ),
        # Mappatura CCIAA §0.4 "L'impresa in cifre": snapshot numerici dalla
        # fonte camerale, mostrati nella sezione 0 di sintesi (§0) oltre che
        # qui per la verifica/compilazione.
        GruppoDef(
            key="impresa-in-cifre",
            title="Impresa in cifre",
            campi=[
                CampoDef("pratiche_ultimi_12_mesi", "Pratiche inviate ultimi 12 mesi", "number"),
                CampoDef("trasferimenti_quote", "Trasferimenti di quote", "number"),
                CampoDef("trasferimenti_sede", "Trasferimenti di sede", "number"),
                CampoDef("partecipazioni_altre_societa", "Partecipazioni in altre società", "boolean"),
            ],
        ),
        # Mappatura CCIAA §0.3: valore di sintesi derivato dalla riga ATECO
        # prevalente/più recente (decisione D-P), nessuna colonna propria.
        GruppoDef(
            key="attivita-sintesi",
            title="Attività (sintesi)",
            campi=[
                CampoDef(
                    "codice_nace", "Codice NACE", "text", derived=True,
                    source_label="dalla sezione Codici ATECO", source_href="/anagrafica/codici-ateco",
                ),
            ],
        ),
    ],
)

# Nuova (fusione CCIAA, card "Capitale sociale"): nessun campo guida unico,
# stessa convenzione di `page.tsx` (compilata = uno qualunque dei tre importi
# presente). Ordine campi allineato a `cciaaSections` del prototipo HTML
# 25-08-26 (deliberato/sottoscritto/versato/valuta): stesse colonne di
# sempre, nessuna nuova tabella necessaria qui, la card era già fedele.
SEZIONE_CAPITALE_SOCIALE = SezioneRegistro(
    section_key="capitale-sociale",
    sezione_codice="ANAGRAFICA_AZIENDALE.CAPITALE_SOCIALE",
    title="Capitale sociale",
    model=AnaCapitaleSociale,
    gruppi=[
        GruppoDef(
            key="capitale",
            title="Capitale sociale",
            campi=[
                CampoDef("capitale_deliberato", "Capitale deliberato", "importo"),
                CampoDef("capitale_sottoscritto", "Capitale sottoscritto", "importo"),
                CampoDef("capitale_versato", "Capitale versato", "importo"),
                CampoDef("valuta", "Valuta", "valuta"),
            ],
        ),
    ],
)

# Nuova (fusione CCIAA, card "Informazioni da statuto/atto costitutivo"):
# nessun campo guida unico, stessa convenzione di `page.tsx`.
SEZIONE_DURATA_SOCIETA_ESERCIZI = SezioneRegistro(
    section_key="durata-societa-esercizi",
    sezione_codice="ANAGRAFICA_AZIENDALE.DURATA_SOCIETA_ESERCIZI",
    title="Durata società ed esercizi",
    model=AnaDurataSocietaEsercizi,
    gruppi=[
        GruppoDef(
            key="durata",
            title="Durata società ed esercizi",
            campi=[
                CampoDef("data_termine_societa", "Data termine società", "date"),
                CampoDef("scadenza_primo_esercizio", "Scadenza primo esercizio", "date"),
                CampoDef("scadenza_esercizi_successivi", "Scadenza esercizi successivi", "day-month"),
            ],
        ),
    ],
)

# Nuova (fusione CCIAA, card "Informazioni da statuto/atto costitutivo" e
# card "Amministratori"/"Sindaci" per i soli conteggi aggregati — l'elenco
# nominativo vive in `per_incarichi`, fuori dal registro). Campo guida:
# `organo_amministrativo_in_carica`, stessa convenzione già usata da
# `page.tsx` per questa sezione.
#
# Correzione 04: e' anche il campo principale della sezione "Amministratori"
# (mostrato per primo, § sopra "campi[0]"), a scelta singola sostenuta dal
# catalogo `cat_organi_amministrativi` (piu' di 3 valori: niente opzioni
# scritte a mano nel frontend, §CLAUDE.md "Configurazione prima della
# programmazione"). La colonna di dominio è `organo_amministrativo_id`
# (chiave esterna, mai la denominazione come testo): `campi_catalogo` sotto
# instrada in lettura/scrittura sul `codice` stabile del catalogo — vedi
# `CampoCatalogo`. Il meccanismo di visualizzazione condizionale dei campi
# successivi in base alla scelta (Amministratore unico / Consiglio di
# amministrazione / pluripersonale congiuntiva o disgiuntiva) sarà definito
# nelle correzioni successive, una modalità alla volta: per ora, finché
# "Organo amministrativo in carica" è "Non disponibile" (nessuna scelta
# fatta), la sezione mostra esclusivamente quel campo.
#
# Correzione 05: prima configurazione definita, "Amministratore unico".
# Correzione 06: seconda configurazione definita, "Consiglio di
# amministrazione" — riusa gli stessi campi a catalogo "Durata in carica"/
# "Regime di rappresentanza" della Correzione 05 (§ punto 15 "non
# duplicare cataloghi già esistenti": estende `valori_dipendenza` a
# includere anche CONSIGLIO_AMMINISTRAZIONE, senza toccare il
# comportamento già in vigore per AMMINISTRATORE_UNICO) e "rivendica" per
# sé, rietichettandolo "Numero componenti", il campo generico
# `numero_amministratori_in_carica` (nessuna colonna nuova). I due campi
# rimasti generici (durata testo libero, numero minimo amministratori,
# numero sindaci) restano il comportamento di ripiego solo per le due
# configurazioni ancora non definite (pluripersonale congiuntiva/
# disgiuntiva — `_CONFIGURAZIONI_NON_DEFINITE`, non più anche per CDA).
# "Titolari di cariche" resta condiviso da tutte le configurazioni (nessuna
# `valori_dipendenza`). L'ordine dei campi qui sotto è quello che determina
# la disposizione a due colonne nella griglia del frontend (righe da 2
# campi ciascuna, in ordine): i campi non pertinenti alla scelta corrente
# vengono filtrati (dal frontend, in modo reattivo, § Correzione 04/05
# seguito), quindi i visibili restano consecutivi nell'ordine voluto senza
# bisogno di logica di layout separata. Quando compare il campo
# condizionale della durata, "Modalità delle decisioni"/"Deleghe" (e di
# conseguenza "Titolari di cariche") scalano di una riga: stessa
# conseguenza già accettata per "Amministratore unico" nella Correzione 05,
# "subito sotto il menu della durata" resta comunque vero (stessa colonna).
# § Correzione 05/06 punto sul riconoscimento CCIAA, per un futuro importer
# (non ancora presente in questo codebase — nessuna pipeline di estrazione
# esiste oggi, solo compilazione manuale dai form): quando un valore
# estratto dalla visura andrà ricondotto a uno di questi cataloghi, una
# corrispondenza incerta non deve selezionare una voce arbitraria — va
# conservato il testo originale (in un campo separato, non ancora esistente)
# e il campo va marcato "da verificare", mai auto-approvato; il numero dei
# componenti riconosciuti va confrontato con le persone estratte e le
# differenze segnalate, mai risolte cancellando dati.
# Correzione 07: "Amministrazione pluripersonale congiuntiva" è ora anche
# lei una configurazione definita — esce da `_CONFIGURAZIONI_NON_DEFINITE`
# (che resta il ripiego solo per la disgiuntiva, non ancora specificata) e
# si aggiunge sia a `_ORGANI_CON_DURATA_E_RAPPRESENTANZA` (riusa
# durata_carica_tipo/regime_rappresentanza di Amministratore unico/CDA) sia,
# per "Numero componenti", allo stesso campo generico modificabile già
# usato dal Consiglio di amministrazione (stesso comportamento, § spec:
# "esattamente come nella configurazione Consiglio di amministrazione").
# Correzione 08: "Amministrazione pluripersonale disgiuntiva" è l'ultima
# configurazione dell'organo amministrativo a essere definita —
# `_CONFIGURAZIONI_NON_DEFINITE` resta come costante ma è ora vuota: i tre
# campi che vi facevano ancora riferimento (`durata_in_carica_organo`,
# `numero_minimo_amministratori`, `numero_sindaci_organi_controllo`)
# diventano quindi permanentemente non applicabili per "Amministratori" (mai
# rimossi: `numero_sindaci_organi_controllo` è segnalato nella mappatura
# CCIAA come da riprendere per la futura sezione "Sindaci", che condivide
# questa stessa `SezioneRegistro` — vedi nota di
# `cciaa-sezioni-rev2-progresso`). Si aggiunge a `_ORGANI_CON_DURATA_E_
# RAPPRESENTANZA` (riusa durata_carica_tipo/regime_rappresentanza) e a
# `_ORGANI_CON_NUMERO_COMPONENTI_MODIFICABILE` (stesso comportamento del
# Consiglio/pluripersonale congiuntiva); "Modalità di esercizio dei poteri"
# riusa lo stesso catalogo/campo della congiuntiva (già pensato per questo
# riuso, § migrazione 018); "Gestione dell'opposizione" è invece propria di
# questo organo, nuovo catalogo `cat_gestione_opposizione` pur avendo solo
# due opzioni (§ Correzione 08, regola esplicita dell'utente: un catalogo
# anche per classificazioni a poche voci ma destinate a evolversi).
_CONFIGURAZIONI_NON_DEFINITE: frozenset[str] = frozenset()
_AMMINISTRATORE_UNICO = frozenset({"AMMINISTRATORE_UNICO"})
_CONSIGLIO_AMMINISTRAZIONE = frozenset({"CONSIGLIO_AMMINISTRAZIONE"})
_AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA = frozenset({"AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA"})
_AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA = frozenset({"AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA"})
_ORGANI_CON_NUMERO_COMPONENTI_MODIFICABILE = (
    _CONSIGLIO_AMMINISTRAZIONE
    | _AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA
    | _AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA
)
_ORGANI_CON_DURATA_E_RAPPRESENTANZA = (
    _AMMINISTRATORE_UNICO
    | _CONSIGLIO_AMMINISTRAZIONE
    | _AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA
    | _AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA
)
_ORGANI_PLURIPERSONALI = (
    _AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA | _AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA
)

SEZIONE_AMMINISTRAZIONE_CONTROLLO = SezioneRegistro(
    section_key="amministrazione-controllo",
    sezione_codice="ANAGRAFICA_AZIENDALE.AMMINISTRAZIONE_CONTROLLO",
    title="Amministrazione e controllo",
    model=AnaAmministrazioneControllo,
    campo_completamento="organo_amministrativo_in_carica",
    campi_derivati={
        "numero_componenti_organo": _numero_componenti_amministratore_unico,
    },
    campi_catalogo={
        "organo_amministrativo_in_carica": CampoCatalogo(
            model=CatOrganoAmministrativo, colonna_fk="organo_amministrativo_id"
        ),
        "durata_carica_tipo": CampoCatalogo(model=CatDurataCarica, colonna_fk="durata_carica_tipo_id"),
        "regime_rappresentanza": CampoCatalogo(model=CatRegimeRappresentanza, colonna_fk="regime_rappresentanza_id"),
        "modalita_decisioni_consiglio": CampoCatalogo(
            model=CatModalitaDecisioniConsiglio, colonna_fk="modalita_decisioni_consiglio_id"
        ),
        "deleghe_consiglio": CampoCatalogo(model=CatDelegheConsiglio, colonna_fk="deleghe_consiglio_id"),
        "modalita_esercizio_poteri": CampoCatalogo(
            model=CatModalitaEsercizioPoteri, colonna_fk="modalita_esercizio_poteri_id"
        ),
        "gestione_opposizione": CampoCatalogo(
            model=CatGestioneOpposizione, colonna_fk="gestione_opposizione_id"
        ),
    },
    gruppi=[
        GruppoDef(
            key="amministrazione-controllo",
            title="Amministrazione e controllo",
            campi=[
                CampoDef("organo_amministrativo_in_carica", "Organo amministrativo in carica", "catalogo"),
                CampoDef(
                    "numero_componenti_organo", "Numero componenti", "number",
                    derived=True, derived_note="Determinato dall'organo scelto",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_AMMINISTRATORE_UNICO,
                ),
                CampoDef(
                    # Correzione 06/07: stesso campo generico di prima, ora
                    # "Numero componenti" del Consiglio di amministrazione e
                    # (Correzione 07) dell'Amministrazione pluripersonale
                    # congiuntiva — qui invece modificabile (intero
                    # positivo, § punto 4), a differenza del derivato/
                    # sempre-1 sopra per l'amministratore unico.
                    "numero_amministratori_in_carica", "Numero componenti", "number",
                    valore_minimo=1,
                    dipende_da="organo_amministrativo_in_carica",
                    valori_dipendenza=_ORGANI_CON_NUMERO_COMPONENTI_MODIFICABILE,
                ),
                CampoDef(
                    "durata_in_carica_organo", "Durata in carica dell'organo", "text",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_CONFIGURAZIONI_NON_DEFINITE,
                ),
                CampoDef(
                    "durata_carica_tipo", "Durata in carica", "catalogo",
                    dipende_da="organo_amministrativo_in_carica",
                    valori_dipendenza=_ORGANI_CON_DURATA_E_RAPPRESENTANZA,
                ),
                CampoDef(
                    "numero_minimo_amministratori", "Numero minimo amministratori", "number",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_CONFIGURAZIONI_NON_DEFINITE,
                ),
                CampoDef(
                    "regime_rappresentanza", "Regime di rappresentanza", "catalogo",
                    dipende_da="organo_amministrativo_in_carica",
                    valori_dipendenza=_ORGANI_CON_DURATA_E_RAPPRESENTANZA,
                ),
                CampoDef(
                    "durata_carica_numero_esercizi", "Numero di esercizi", "number",
                    dipende_da="durata_carica_tipo", valori_dipendenza=frozenset({"PER_NUMERO_ESERCIZI"}),
                ),
                CampoDef(
                    "durata_carica_data_scadenza", "Data di scadenza della carica", "date",
                    dipende_da="durata_carica_tipo",
                    valori_dipendenza=frozenset({"PER_NUMERO_ESERCIZI", "FINO_A_DATA"}),
                ),
                CampoDef(
                    "modalita_decisioni_consiglio", "Modalità delle decisioni del consiglio", "catalogo",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_CONSIGLIO_AMMINISTRAZIONE,
                ),
                CampoDef(
                    "deleghe_consiglio", "Deleghe del consiglio", "catalogo",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_CONSIGLIO_AMMINISTRAZIONE,
                ),
                CampoDef(
                    # Correzione 07/08: stesso catalogo/campo per entrambe
                    # le forme pluripersonali (congiuntiva e disgiuntiva),
                    # come previsto fin dalla migrazione 018.
                    "modalita_esercizio_poteri", "Modalità di esercizio dei poteri", "catalogo",
                    dipende_da="organo_amministrativo_in_carica",
                    valori_dipendenza=_ORGANI_PLURIPERSONALI,
                ),
                CampoDef(
                    # Correzione 08: propria della sola "Amministrazione
                    # pluripersonale disgiuntiva".
                    "gestione_opposizione", "Gestione dell'opposizione", "catalogo",
                    dipende_da="organo_amministrativo_in_carica",
                    valori_dipendenza=_AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA,
                ),
                CampoDef(
                    "numero_sindaci_organi_controllo", "Numero sindaci/organi di controllo", "number",
                    dipende_da="organo_amministrativo_in_carica", valori_dipendenza=_CONFIGURAZIONI_NON_DEFINITE,
                ),
                CampoDef(
                    "numero_titolari_cariche", "Titolari di cariche", "number",
                    dipende_da="organo_amministrativo_in_carica",
                ),
            ],
        ),
    ],
)

# Nuova (Correzione 11, "Impostazioni generali della sezione Sindaci"):
# finora la card "Sindaci e membri degli organi di controllo" mostrava la
# stessa `SEZIONE_AMMINISTRAZIONE_CONTROLLO` di "Amministratori" (solo
# `groupTitleOverrides` diverso lato frontend, nessuna configurazione
# propria — vedi `cciaa-sezioni-rev2-progresso`). Questa correzione le dà un
# campo principale proprio, "Assetto di controllo in carica", a scelta
# singola sostenuta dal catalogo `cat_assetti_controllo` (7 valori, § stessa
# convenzione di `organo_amministrativo_in_carica`): una `SezioneRegistro`
# non può avere due campi guida indipendenti con la propria cascata di
# campi condizionali (il meccanismo `dipende_da`/`valori_dipendenza` è
# pensato per UN campo principale per sezione), quindi la sezione va su una
# tabella dedicata (`AnaOrganiControllo`), non su `ana_amministrazione_controllo`
# — stesso principio già seguito per "Sede"/"Statuto" (tabelle "_rev2"
# quando la card non è più rappresentabile 1:1 da una tabella condivisa).
#
# "Numero componenti" e "Titolo della nomina" erano, alla Correzione 11,
# sempre visibili (nessuna condizione ancora). La Correzione 12 introduce la
# prima regola specifica per assetto: quando "Assetto di controllo in
# carica" è "Nessun organo di controllo o revisore"
# (NESSUN_ORGANO_CONTROLLO), la sezione mostra ESCLUSIVAMENTE il campo
# principale — stesso meccanismo `dipende_da`/`valori_dipendenza` già usato
# per l'organo amministrativo, qui invertito: invece di "mostra solo per
# questi codici", serve "mostra per ogni codice TRANNE questo", quindi
# `valori_dipendenza` elenca esplicitamente i 6 codici rimanenti
# (`_ASSETTI_CON_ORGANO_CONTROLLO`) — il meccanismo non supporta negazioni,
# solo liste positive. "Titolo della nomina" è già un campo a catalogo
# (`cat_titoli_nomina_organo_controllo`) anche se il catalogo è oggi vuoto —
# le opzioni sono state esplicitamente rimandate a una correzione
# successiva.
#
# Il comportamento dinamico per gli altri 6 assetti (campi mostrati, titolo
# della tabella, righe predisposte) sarà definito nelle correzioni
# successive, una alla volta — stesso percorso già seguito per l'organo
# amministrativo (Correzioni 05-08). Cambiare l'assetto selezionato non
# deve mai eliminare dati già registrati: soddisfatto per costruzione dallo
# stesso meccanismo di visibilità condizionale già in uso altrove (i valori
# restano nelle colonne anche quando il campo che li mostra è nascosto) —
# tranne "Numero componenti" per NESSUN_ORGANO_CONTROLLO, che la Correzione
# 12 impone esplicitamente a 0 (non un valore a scelta libera per questa
# configurazione, § `normalizza_numero_componenti_nessun_organo_controllo`
# sotto, applicata da `salva_sezione` dopo `applica_modifiche_sezione`,
# prima del commit — un'eccezione dichiarata al principio generale, non una
# cancellazione: il valore precedente per un ALTRO assetto non è mai stato
# 0 "per sbaglio", lo diventa solo quando si sceglie proprio questo
# assetto).
#
# Tabella degli incarichi (righe, conteggio, "Aggiungi riga") e cessazione
# confermata dei sindaci/revisori ancora attivi al passaggio a
# NESSUN_ORGANO_CONTROLLO: vedi `cciaa-section-panel.tsx` (nasconde la
# tabella) e `app.core.incarichi.verifica_transizione_nessun_organo_controllo`
# (blocca il salvataggio con una richiesta di conferma finché non arriva,
# poi cessa gli incarichi nella stessa transazione — mai una cancellazione
# silenziosa, § vincoli della Correzione 12).
#
# Riconoscimento CCIAA: nessuna colonna "testo originale"/"da verificare"
# qui — riusa il meccanismo generico già esistente `sys_registro_stato_campi`
# (per campo, non serve duplicarlo), vedi il commento in testa a
# `041_ana_organi_controllo.sql`.
_NESSUN_ORGANO_CONTROLLO = frozenset({"NESSUN_ORGANO_CONTROLLO"})
_ASSETTI_CON_ORGANO_CONTROLLO = frozenset(
    {
        "SINDACO_UNICO",
        "COLLEGIO_SINDACALE",
        "REVISORE_LEGALE_PERSONA_FISICA",
        "SOCIETA_REVISIONE_LEGALE",
        "SINDACO_UNICO_REVISORE_ESTERNO",
        "COLLEGIO_SINDACALE_REVISORE_ESTERNO",
    }
)

# Correzione 13: prima configurazione definita della sezione, "Sindaco
# unico" — stesso schema evolutivo già seguito per l'organo amministrativo
# (Correzioni 05-08): finché una configurazione non è definita usa i campi
# generici sopra (`numero_componenti` modificabile), quando viene definita
# esce da `_ASSETTI_ORGANO_CONTROLLO_NON_DEFINITI` e riceve i propri campi.
# "Titolo della nomina" resta condiviso da tutte le configurazioni con un
# organo (`_ASSETTI_CON_ORGANO_CONTROLLO`, invariato): non è mai stato
# generico-in-attesa-di-definizione, è "impostazioni generali" fin dalla
# Correzione 11.
_SINDACO_UNICO = frozenset({"SINDACO_UNICO"})
# Correzione 14: seconda configurazione definita, "Collegio sindacale" —
# esce anch'essa da `_ASSETTI_ORGANO_CONTROLLO_NON_DEFINITI` e riceve i
# propri campi. I 3 campi condivisi (funzioni dell'organo interno,
# revisione legale affidata a, durata dell'incarico) usano ora
# `_SINDACO_UNICO_O_COLLEGIO_SINDACALE`: stesso comportamento già definito
# per "Sindaco unico" (§ richiesta esplicita "I valori e i campi
# condizionali devono mantenere il comportamento definito per la
# configurazione Sindaco unico"), nessun catalogo nuovo (§ richiesta
# esplicita "Devono essere riutilizzati senza creare nuovi cataloghi").
_COLLEGIO_SINDACALE = frozenset({"COLLEGIO_SINDACALE"})
_SINDACO_UNICO_O_COLLEGIO_SINDACALE = _SINDACO_UNICO | _COLLEGIO_SINDACALE
# Correzione 15: terza configurazione definita, "Revisore legale persona
# fisica" — a differenza di Sindaco Unico/Collegio Sindacale (un organo
# INTERNO, che può facoltativamente delegare la revisione legale
# all'esterno), qui non c'è alcun organo interno: il revisore è l'intero
# assetto, quindi "Funzioni dell'organo interno" non compare (resta
# condizionato solo a `_SINDACO_UNICO_O_COLLEGIO_SINDACALE`, invariato),
# mentre "Revisione legale affidata a"/"Durata dell'incarico" sono
# condivisi (§ richiesta esplicita, stesso pattern di Correzione 14) ma
# con un vincolo in più: per questo assetto il valore di "Revisione legale
# affidata a" DEVE coincidere con l'assetto stesso, verificato da
# `verifica_coerenza_affidatario_revisione_legale` al salvataggio — non
# un semplice suggerimento come per gli altri due.
_REVISORE_LEGALE_PERSONA_FISICA = frozenset({"REVISORE_LEGALE_PERSONA_FISICA"})
# Correzione 16: quarta configurazione definita, "Società di revisione
# legale" — stesso identico schema di "Revisore legale persona fisica"
# (nessun organo interno, coerenza vincolante con "Revisione legale
# affidata a"), qui per un titolare persona GIURIDICA (§
# `verifica_societa_revisione_disponibile`/`ana_persone_giuridiche`)
# invece che fisica.
_SOCIETA_REVISIONE_LEGALE = frozenset({"SOCIETA_REVISIONE_LEGALE"})
_ASSETTI_REVISORE_ESTERNO_STANDALONE = _REVISORE_LEGALE_PERSONA_FISICA | _SOCIETA_REVISIONE_LEGALE
_ASSETTI_CON_REVISIONE_ESTERNA_CONDIVISA = _SINDACO_UNICO_O_COLLEGIO_SINDACALE | _ASSETTI_REVISORE_ESTERNO_STANDALONE
_ASSETTI_ORGANO_CONTROLLO_NON_DEFINITI = (
    _ASSETTI_CON_ORGANO_CONTROLLO - _SINDACO_UNICO_O_COLLEGIO_SINDACALE - _ASSETTI_REVISORE_ESTERNO_STANDALONE
)
_DURATA_FINO_APPROVAZIONE_BILANCIO = frozenset({"FINO_APPROVAZIONE_BILANCIO"})
_DURATA_ALTRA = frozenset({"ALTRA_DURATA"})
# "Sindaci effettivi": solo 3 o 5, opzioni fisse (§ CampoDef.opzioni_fisse)
# non un catalogo — vincolo di struttura del collegio, non una
# classificazione estendibile (§ richiesta esplicita dell'utente).
_OPZIONI_SINDACI_EFFETTIVI: tuple[tuple[str, str], ...] = (("3", "3"), ("5", "5"))

SEZIONE_ORGANI_CONTROLLO = SezioneRegistro(
    section_key="organi-controllo",
    sezione_codice="ANAGRAFICA_AZIENDALE.ORGANI_CONTROLLO",
    title="Organi di controllo",
    model=AnaOrganiControllo,
    campo_completamento="assetto_controllo_in_carica",
    campi_derivati={
        "numero_componenti_organo": _numero_componenti_sindaco_unico,
        "numero_componenti_collegio": _numero_componenti_collegio_sindacale,
        "sindaci_supplenti": _sindaci_supplenti_collegio_sindacale,
        "numero_componenti_revisore": _numero_componenti_revisore_legale_persona_fisica,
        "numero_componenti_societa": _numero_componenti_societa_revisione_legale,
    },
    campi_catalogo={
        "assetto_controllo_in_carica": CampoCatalogo(
            model=CatAssettoControllo, colonna_fk="assetto_controllo_id"
        ),
        "titolo_nomina": CampoCatalogo(
            model=CatTitoloNominaOrganoControllo, colonna_fk="titolo_nomina_id"
        ),
        "funzioni_organo_interno": CampoCatalogo(
            model=CatFunzioneOrganoInterno, colonna_fk="funzioni_organo_interno_id"
        ),
        "revisione_legale_affidata_a": CampoCatalogo(
            model=CatAffidatarioRevisioneLegale, colonna_fk="revisione_legale_affidata_a_id"
        ),
        "durata_incarico_tipo": CampoCatalogo(
            model=CatDurataIncaricoOrganoControllo, colonna_fk="durata_incarico_tipo_id"
        ),
    },
    gruppi=[
        GruppoDef(
            key="organi-controllo",
            title="Organi di controllo",
            campi=[
                CampoDef("assetto_controllo_in_carica", "Assetto di controllo in carica", "catalogo"),
                CampoDef(
                    # Correzione 13: "rimanere sincronizzato con l'unica riga
                    # della tabella" (§ punto esplicito) — derivato per
                    # davvero (conta l'incarico SINDACO attivo), non una
                    # costante come per l'amministratore unico. Non
                    # modificabile (derived=True), con la nota richiesta
                    # testualmente dalla correzione.
                    "numero_componenti_organo", "Numero componenti", "number",
                    derived=True, derived_note="Allineato all'assetto selezionato e alle righe della tabella",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_SINDACO_UNICO,
                ),
                CampoDef(
                    # Correzione 14: "sincronizzato con le righe della
                    # tabella" (§ punto esplicito, stesso testo di Sindaco
                    # unico) — qui però calcolato dalla struttura prescritta
                    # (sindaci effettivi + 2), non contando le righe già
                    # compilate (che si riempiono progressivamente fino
                    # alla capienza), § `_numero_componenti_collegio_sindacale`.
                    "numero_componenti_collegio", "Numero componenti", "number",
                    derived=True, derived_note="Allineato all'assetto selezionato e alle righe della tabella",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_COLLEGIO_SINDACALE,
                ),
                CampoDef(
                    # Correzione 15: come "numero_componenti_organo" di
                    # Sindaco unico — "rimanere sincronizzato con l'unica
                    # riga della tabella" (§ punto esplicito), qui per il
                    # ruolo REVISORE_LEGALE. Impostato "automaticamente a 1"
                    # (§ testo) nel senso che, una volta registrato il
                    # revisore, il conteggio reale vale 1 per costruzione
                    # (`verifica_revisore_legale_persona_fisica_disponibile`
                    # impedisce un secondo incarico attivo in parallelo);
                    # vale 0 finché la riga non è ancora stata compilata,
                    # stesso comportamento di "Sindaco unico".
                    "numero_componenti_revisore", "Numero componenti", "number",
                    derived=True, derived_note="Allineato all'assetto selezionato e alle righe della tabella",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_REVISORE_LEGALE_PERSONA_FISICA,
                ),
                CampoDef(
                    # Correzione 16: stesso identico schema di
                    # "numero_componenti_revisore" sopra, per il titolare
                    # persona giuridica — "rappresentare un unico soggetto
                    # giuridico incaricato" (§ testo esplicito), non il
                    # numero di persone che lavorano per la società.
                    "numero_componenti_societa", "Numero componenti", "number",
                    derived=True, derived_note="Allineato all'assetto selezionato e alle righe della tabella",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_SOCIETA_REVISIONE_LEGALE,
                ),
                CampoDef(
                    "numero_componenti", "Numero componenti", "number",
                    dipende_da="assetto_controllo_in_carica",
                    valori_dipendenza=_ASSETTI_ORGANO_CONTROLLO_NON_DEFINITI,
                ),
                CampoDef(
                    # § Correzione 14: menu a due valori, non un catalogo (§
                    # richiesta esplicita — "non è una classificazione
                    # estendibile"). Il presidente è compreso nel numero
                    # (verificato/applicato lato incarichi.py: 1 Presidente +
                    # (effettivi-1) Sindaci effettivi + 2 Sindaci supplenti).
                    "sindaci_effettivi", "Sindaci effettivi", "scelta",
                    opzioni_fisse=_OPZIONI_SINDACI_EFFETTIVI,
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_COLLEGIO_SINDACALE,
                ),
                CampoDef(
                    "sindaci_supplenti", "Sindaci supplenti", "number",
                    derived=True, derived_note="Due supplenti nel modello collegiale",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_COLLEGIO_SINDACALE,
                ),
                CampoDef(
                    "funzioni_organo_interno", "Funzioni dell'organo interno", "catalogo",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_SINDACO_UNICO_O_COLLEGIO_SINDACALE,
                ),
                CampoDef(
                    # Correzione 13: catalogo condiviso (§ richiesta
                    # esplicita) — esteso dalla Correzione 14 a "Collegio
                    # sindacale" e dalla Correzione 15 a "Revisore legale
                    # persona fisica" (`_ASSETTI_CON_REVISIONE_ESTERNA_CONDIVISA`),
                    # si estenderà alle altre configurazioni quando
                    # verranno definite (stesso pattern di
                    # `modalita_esercizio_poteri` per Amministratori). Solo
                    # per gli assetti "revisore esterno standalone" il
                    # valore è vincolante, non un semplice suggerimento —
                    # vedi `verifica_coerenza_affidatario_revisione_legale`.
                    "revisione_legale_affidata_a", "Revisione legale affidata a", "catalogo",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_ASSETTI_CON_REVISIONE_ESTERNA_CONDIVISA,
                ),
                CampoDef(
                    "titolo_nomina", "Titolo della nomina", "catalogo",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_ASSETTI_CON_ORGANO_CONTROLLO,
                ),
                CampoDef(
                    "durata_incarico_tipo", "Durata dell'incarico", "catalogo",
                    dipende_da="assetto_controllo_in_carica", valori_dipendenza=_ASSETTI_CON_REVISIONE_ESTERNA_CONDIVISA,
                ),
                CampoDef(
                    # Mai una data dentro la denominazione del catalogo (§
                    # vincolo esplicito): campo separato, mostrato solo per
                    # "Fino all'approvazione del bilancio".
                    "durata_incarico_data_bilancio", "Data di approvazione del bilancio", "date",
                    dipende_da="durata_incarico_tipo", valori_dipendenza=_DURATA_FINO_APPROVAZIONE_BILANCIO,
                ),
                CampoDef(
                    "durata_incarico_descrizione", "Descrizione della durata", "text",
                    dipende_da="durata_incarico_tipo", valori_dipendenza=_DURATA_ALTRA,
                ),
            ],
        ),
    ],
)


def normalizza_numero_componenti_nessun_organo_controllo(db: Session, row: object) -> None:
    """§ Correzione 12: impone Numero componenti = 0 quando l'assetto di
    controllo salvato è "Nessun organo di controllo o revisore" — chiamata
    da `salva_sezione` dopo `applica_modifiche_sezione`, prima del commit,
    così vale sia per una transizione appena fatta sia come rete di
    sicurezza per un salvataggio successivo nello stesso stato. No-op per
    ogni altro model/sezione o assetto."""
    if not isinstance(row, AnaOrganiControllo) or row.assetto_controllo_id is None:
        return
    assetto = db.get(CatAssettoControllo, row.assetto_controllo_id)
    if assetto is not None and assetto.codice == "NESSUN_ORGANO_CONTROLLO" and row.numero_componenti != 0:
        row.numero_componenti = 0


def verifica_coerenza_affidatario_revisione_legale(
    db: Session,
    ctx: AziendaContext,
    sezione: SezioneRegistro,
    *,
    row: object | None,
    cambiamenti: dict[str, str | None],
) -> str | None:
    """§ Correzione 15: per le configurazioni "revisore esterno standalone"
    (`_ASSETTI_REVISORE_ESTERNO_STANDALONE` — nessun organo interno, il
    revisore stesso è l'intero organo di controllo) "Revisione legale
    affidata a" non è un'informazione facoltativa come per Sindaco
    Unico/Collegio Sindacale (dove lo stesso campo è solo un suggerimento
    di passaggio non vincolante, § Correzione 13/14): deve coincidere
    ESATTAMENTE con l'assetto stesso — i due cataloghi condividono di
    proposito lo stesso codice per questi valori (vedi
    `023_cat_affidatari_revisione_legale.sql`), quindi il confronto è una
    semplice uguaglianza di stringhe. "Non deve essere possibile salvare
    una combinazione incoerente" (§ testo esplicito): ritorna il messaggio
    di errore da associare al campo nel payload 422 del salvataggio della
    sezione, None se la combinazione è coerente o non applicabile
    all'assetto risolto.

    Risolve i valori EFFETTIVI di entrambi i campi (dal payload di questo
    salvataggio se presenti, altrimenti dall'ultimo valore salvato) — il
    contratto di `SectionUpdateRequest.fields` non garantisce un payload
    completo (anche se il frontend oggi invia sempre l'intera bozza), un
    campo assente da `cambiamenti` significa "non toccato in questo
    salvataggio", non "vuoto"."""

    def _valore_effettivo(campo: str) -> str | None:
        if campo in cambiamenti:
            return cambiamenti[campo]
        return _valore_campo(db, ctx, sezione, row, campo)

    assetto_codice = _valore_effettivo("assetto_controllo_in_carica")
    if assetto_codice not in _ASSETTI_REVISORE_ESTERNO_STANDALONE:
        return None
    affidatario_codice = _valore_effettivo("revisione_legale_affidata_a")
    if affidatario_codice == assetto_codice:
        return None
    return "Deve coincidere con l'assetto di controllo selezionato."


# Nuova (mappatura CCIAA §4.2, decisione D-H): estremi di testata
# dell'elenco soci depositato, 1:1 con l'azienda come capitale sociale. Non
# è un dato del singolo socio (quello vive in `per_incarichi`, ruolo SOCIO).
# Corretta il 27/08/2026 per allinearla esattamente alla card "Soci e
# titolari di diritti su azioni e quote" del prototipo HTML (migrazione
# 035): rimossi data_atto/data_protocollo (non previsti), etichette
# allineate al testo del prototipo, "numero_soci" aggiunto come campo
# derivato (contato dagli incarichi ruolo SOCIO, mai una colonna propria:
# non deve poter disallinearsi dalla tabella soci sotto la stessa card) e
# "capitale_sociale_dichiarato" reso derivato da
# ana_capitale_sociale.capitale_sottoscritto invece che una colonna
# propria, per non duplicare un dato già verificabile in "Capitale
# sociale". Ordine campi allineato a `cciaaSections` del prototipo.
SEZIONE_ELENCO_SOCI_ESTREMI = SezioneRegistro(
    section_key="elenco-soci-estremi",
    sezione_codice="ANAGRAFICA_AZIENDALE.ELENCO_SOCI_ESTREMI",
    title="Estremi dell'elenco soci",
    model=AnaElencoSociEstremi,
    campi_derivati={"numero_soci": _numero_soci_di, "capitale_sociale_dichiarato": _capitale_rappresentato_di},
    gruppi=[
        GruppoDef(
            key="elenco-soci-estremi",
            title="Estremi dell'elenco soci",
            campi=[
                CampoDef(
                    "numero_soci", "Numero dei soci", "number", derived=True,
                    source_label="dai soci registrati nella tabella qui sotto",
                ),
                CampoDef("data_riferimento", "Data di riferimento dell'assetto", "date"),
                CampoDef("data_deposito", "Data deposito elenco soci", "date"),
                CampoDef("numero_protocollo", "Numero protocollo", "text"),
                CampoDef(
                    "capitale_sociale_dichiarato", "Capitale sociale rappresentato", "importo", derived=True,
                    source_label="dalla sezione Capitale sociale",
                ),
            ],
        ),
    ],
)

# Pilota richiesto esplicitamente dall'utente il 26/08/2026 (vedi
# 032_ana_sede_rev2.sql): replica 1:1 i 12 campi della card "Sede" del
# prototipo HTML in un'unica tabella/sezione dedicata, invece che nella
# combinazione "informazioni-societarie" + tabella `ana_sedi` usata finora
# (vedi `frontend/components/registro/cciaa-section-panel.tsx`, ora
# semplificato: "sede" non è più una vista composita ma una sezione a
# registro come `capitale-sociale`). Un solo gruppo, senza sottotitoli,
# perché così la mostra il prototipo. Campo guida: `indirizzo_sede_legale`,
# stessa convenzione delle altre sezioni con un campo identificativo unico.
# "Provincia di provenienza" riusa deliberatamente la stessa chiave e la
# stessa etichetta già presenti in "informazioni-societarie" per lo stesso
# concetto (coerenza nello stesso schema), non l'etichetta letterale del
# prototipo ("Trasferita da altra provincia", un campo composito booleano+
# testo che qui non esiste come colonna dedicata).
SEZIONE_SEDE = SezioneRegistro(
    section_key="sede",
    sezione_codice="ANAGRAFICA_AZIENDALE.SEDE",
    title="Sede",
    model=AnaSedeRev2,
    campo_completamento="indirizzo_sede_legale",
    gruppi=[
        GruppoDef(
            key="sede",
            title="Sede",
            campi=[
                CampoDef("indirizzo_sede_legale", "Indirizzo sede legale", "text"),
                CampoDef("comune", "Comune", "text"),
                CampoDef("provincia", "Provincia", "text"),
                CampoDef("cap", "CAP", "text"),
                CampoDef("nazione", "Nazione", "text"),
                CampoDef("pec", "Domicilio digitale / PEC", "text"),
                CampoDef("partita_iva", "Partita IVA", "partita-iva"),
                CampoDef("codice_fiscale", "Codice fiscale", "codice-fiscale"),
                CampoDef("numero_rea", "Numero REA", "text"),
                CampoDef("camera_commercio_competente", "Camera di Commercio competente", "text"),
                CampoDef("provincia_provenienza", "Provincia di provenienza", "text"),
                CampoDef("numero_rea_precedente", "Numero REA precedente", "text"),
            ],
        ),
    ],
)

# Secondo pilota "una tabella per sezione" (26/08/2026, stesso metodo di
# lavoro concordato con l'utente dopo `SEZIONE_SEDE`): replica 1:1 i 12
# campi della card "Informazioni da statuto/atto costitutivo" in
# `ana_statuto_rev2`, al posto della vecchia composizione di
# "informazioni-societarie" + "durata-societa-esercizi" +
# "amministrazione-controllo" + tabella "iscrizioni-registro-imprese" (vedi
# `frontend/components/registro/cciaa-section-panel.tsx`, ora semplificato
# come già fatto per "sede"). Un solo gruppo, campo guida `denominazione`.
# Corretto il 27/08/2026 (migrazione 034): rimossi due campi ("Sezione
# ordinaria"/"Sezione titolarità effettiva") non previsti dal catalogo
# confermato dall'utente — erano 14, restano 12.
SEZIONE_STATUTO = SezioneRegistro(
    section_key="statuto",
    sezione_codice="ANAGRAFICA_AZIENDALE.STATUTO",
    title="Informazioni da statuto/atto costitutivo",
    model=AnaStatutoRev2,
    campo_completamento="denominazione",
    gruppi=[
        GruppoDef(
            key="statuto",
            title="Informazioni da statuto/atto costitutivo",
            campi=[
                CampoDef("denominazione", "Denominazione", "text"),
                CampoDef("registro_imprese", "Registro delle Imprese", "text"),
                CampoDef("data_iscrizione", "Data di iscrizione", "date"),
                CampoDef("forma_giuridica", "Forma giuridica", "text"),
                CampoDef("data_atto_costitutivo", "Data atto di costituzione", "date"),
                CampoDef("data_termine_societa", "Data termine società", "date"),
                CampoDef("scadenza_primo_esercizio", "Scadenza primo esercizio", "date"),
                CampoDef("scadenza_esercizi_successivi", "Scadenza esercizi successivi", "day-month"),
                CampoDef("giorni_proroga_approvazione_bilancio", "Proroga approvazione bilancio", "number"),
                CampoDef("sistema_amministrazione_adottato", "Sistema di amministrazione adottato", "text"),
                CampoDef("controllo_contabile", "Controllo contabile", "text"),
                CampoDef("organi_amministrativi_previsti", "Organi amministrativi previsti", "text"),
            ],
        ),
    ],
)

SEZIONI: dict[str, SezioneRegistro] = {
    s.section_key: s
    for s in (
        SEZIONE_INFORMAZIONI_SOCIETARIE,
        SEZIONE_CAPITALE_SOCIALE,
        SEZIONE_DURATA_SOCIETA_ESERCIZI,
        SEZIONE_AMMINISTRAZIONE_CONTROLLO,
        SEZIONE_ORGANI_CONTROLLO,
        SEZIONE_ELENCO_SOCI_ESTREMI,
        SEZIONE_SEDE,
        SEZIONE_STATUTO,
    )
}
