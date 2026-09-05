"""Schemas del vero modulo Personale (Fase 1 — Fondazioni: elenco Persone,
shell della scheda persona, tab Persona e rapporto).

Separato da `app.schemas.personale` (che resta il supporto minimo
all'anagrafica per il motore ruolo+caratteristiche CCIAA, § docstring di
`app.api.personale`): qui vive il DTO ricco per la vista Persone e per il
dossier, distinto anche nel contratto da `AnaPersoneRead`.
"""

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Cataloghi (mansioni/reparti per azienda, tipi di rapporto di sistema)
# ---------------------------------------------------------------------------


class CatalogoRead(_OrmModel):
    id: uuid.UUID
    codice: str
    denominazione: str
    descrizione: str | None = None
    attivo: bool


class CatalogoCreate(_OrmModel):
    codice: str
    denominazione: str
    descrizione: str | None = None


# ---------------------------------------------------------------------------
# Rapporto aziendale
# ---------------------------------------------------------------------------


class RapportoAziendaRead(_OrmModel):
    id: uuid.UUID
    tipo_rapporto: CatalogoRead
    data_inizio: date
    data_fine_prevista: date | None = None
    data_fine_effettiva: date | None = None
    mansione: CatalogoRead | None = None
    reparto: CatalogoRead | None = None
    stato: str
    tempo_lavoro: str
    percentuale_part_time: float | None = None
    ccnl: str | None = None
    livello_inquadramento: str | None = None
    note: str | None = None


class RapportoAziendaCreate(_OrmModel):
    tipo_rapporto_id: uuid.UUID
    data_inizio: date
    data_fine_prevista: date | None = None
    mansione_id: uuid.UUID | None = None
    reparto_id: uuid.UUID | None = None
    stato: str = "ATTIVO"
    tempo_lavoro: str = "PIENO"
    percentuale_part_time: float | None = None
    ccnl: str | None = None
    livello_inquadramento: str | None = None
    note: str | None = None

    @model_validator(mode="after")
    def _percentuale_coerente(self) -> "RapportoAziendaCreate":
        if self.tempo_lavoro == "PARZIALE" and not self.percentuale_part_time:
            raise ValueError("percentuale_part_time è obbligatoria quando tempo_lavoro è PARZIALE.")
        if self.tempo_lavoro == "PIENO" and self.percentuale_part_time is not None:
            raise ValueError("percentuale_part_time va valorizzata solo per un rapporto PARZIALE.")
        return self


# ---------------------------------------------------------------------------
# Persona — dati essenziali (§12.1)
# ---------------------------------------------------------------------------


class PersonaEssenzialiCreate(_OrmModel):
    nome: str
    cognome: str
    codice_fiscale: str
    telefono: str | None = None
    email: str | None = None


class PersonaEssenzialiUpdate(_OrmModel):
    nome: str | None = None
    cognome: str | None = None
    codice_fiscale: str | None = None
    telefono: str | None = None
    email: str | None = None


# ---------------------------------------------------------------------------
# Creazione atomica persona + primo rapporto (§9.4)
# ---------------------------------------------------------------------------


class NuovaPersonaRequest(_OrmModel):
    persona: PersonaEssenzialiCreate
    rapporto: RapportoAziendaCreate


# ---------------------------------------------------------------------------
# Elenco Persone (§9.1/§9.2/§24.2) — riga sintetica
# ---------------------------------------------------------------------------


class RapportoCorrenteSummary(_OrmModel):
    stato: str
    data_inizio: date
    mansione: CatalogoRead | None = None
    reparto: CatalogoRead | None = None


class PersonaListRow(_OrmModel):
    id: uuid.UUID
    nome: str
    cognome: str
    rapporto: RapportoCorrenteSummary | None = None
    ruoli_principali: list[str] = []
    # Stato registrazioni: rimandato a quando formazione/abilitazioni/
    # idoneità avranno un endpoint aggregato dedicato (Fase 4 della
    # specifica) — mostrare qui dei conteggi finti sarebbe peggio di non
    # mostrare la colonna.


# ---------------------------------------------------------------------------
# Dossier personale (§12.3) — anagrafica completa, residenza/domicilio,
# contatti di emergenza, lingua e comprensione, documenti personali.
# Sesso/data_nascita/luogo_nascita/cittadinanza/comprensione lingua italiana
# riusano le colonne di `ana_persone` condivise col motore CCIAA (nomi
# colonna diversi dal nome campo qui esposto: mappatura manuale nel
# servizio, non `from_attributes` automatico). Le altre colonne sono nuove,
# aggiunte dalla migrazione 018 dopo conferma esplicita dell'utente.
# ---------------------------------------------------------------------------


class PersonaDossierRead(_OrmModel):
    matricola_interna: str | None = None
    data_nascita: date | None = None
    eta: int | None = None  # derivato da data_nascita, mai salvato (§6)
    luogo_nascita: str | None = None
    provincia_nascita: str | None = None
    stato_nascita: str | None = None
    sesso: str | None = None
    cittadinanza: str | None = None

    indirizzo_residenza: str | None = None
    cap_residenza: str | None = None
    comune_residenza: str | None = None
    provincia_residenza: str | None = None
    domicilio_coincide_residenza: bool = True
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None

    contatto_emergenza_nome: str | None = None
    contatto_emergenza_relazione: str | None = None
    contatto_emergenza_telefono: str | None = None

    lingua_madre: str | None = None
    comprensione_lingua_italiana: str | None = None
    supporto_linguistico_necessario: bool = False
    altre_lingue: str | None = None


class PersonaDossierUpdate(_OrmModel):
    matricola_interna: str | None = None
    data_nascita: date | None = None
    luogo_nascita: str | None = None
    provincia_nascita: str | None = None
    stato_nascita: str | None = None
    sesso: str | None = None
    cittadinanza: str | None = None

    indirizzo_residenza: str | None = None
    cap_residenza: str | None = None
    comune_residenza: str | None = None
    provincia_residenza: str | None = None
    domicilio_coincide_residenza: bool = True
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None

    contatto_emergenza_nome: str | None = None
    contatto_emergenza_relazione: str | None = None
    contatto_emergenza_telefono: str | None = None

    lingua_madre: str | None = None
    comprensione_lingua_italiana: str | None = None
    supporto_linguistico_necessario: bool = False
    altre_lingue: str | None = None

    @model_validator(mode="after")
    def _validazioni(self) -> "PersonaDossierUpdate":
        if self.data_nascita is not None and self.data_nascita > date.today():
            raise ValueError("La data di nascita non può essere futura.")
        return self


# ---------------------------------------------------------------------------
# Documenti personali (completamento Dossier personale) — record multipli
# per persona, catalogo tipi dedicato (cat_tipi_documento_identita, colonna
# nuova approvata dall'utente). Il permesso di soggiorno è una delle
# tipologie del catalogo, non più un campo a parte (§5.4). Nessun
# collegamento ad allegati reali: `numero_allegati` è sempre 0 finché il
# modulo Documenti non sarà costruito (decisione utente esplicita).
# ---------------------------------------------------------------------------


class DocumentoPersonaleRead(_OrmModel):
    id: uuid.UUID
    tipo_documento: CatalogoRead
    numero: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None
    numero_allegati: int = 0


class DocumentoPersonaleCreate(_OrmModel):
    tipo_documento_id: uuid.UUID
    numero: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None

    @model_validator(mode="after")
    def _date_coerenti(self) -> "DocumentoPersonaleCreate":
        if self.data_rilascio is not None and self.data_scadenza is not None and self.data_scadenza < self.data_rilascio:
            raise ValueError("La data di scadenza non può precedere la data di rilascio.")
        return self


class DocumentoPersonaleUpdate(DocumentoPersonaleCreate):
    pass


# ---------------------------------------------------------------------------
# Dettagli contrattuali modificabili in place (§11/§12.3): "Durata del
# rapporto" (tipo_rapporto_id) resta di sola lettura come mansione/reparto
# quando un rapporto esiste già — cambiarla richiede chiudere il periodo
# corrente e aprirne uno nuovo (§12.2, storicizzazione), flusso non ancora
# costruito (decisione utente). `tipo_rapporto_id`/`data_inizio` servono
# solo per registrare il PRIMO rapporto di una persona che non ne ha ancora
# uno (es. un incarico CCIAA senza rapporto di lavoro): il backend le
# richiede solo in quel caso, le ignora altrimenti.
# ---------------------------------------------------------------------------


class RapportoDettagliUpdate(_OrmModel):
    tipo_rapporto_id: uuid.UUID | None = None
    data_inizio: date | None = None
    data_fine_prevista: date | None = None
    tempo_lavoro: str = "PIENO"
    percentuale_part_time: float | None = None
    ccnl: str | None = None
    livello_inquadramento: str | None = None

    @model_validator(mode="after")
    def _percentuale_coerente(self) -> "RapportoDettagliUpdate":
        if self.tempo_lavoro == "PARZIALE" and not self.percentuale_part_time:
            raise ValueError("percentuale_part_time è obbligatoria quando tempo_lavoro è PARZIALE.")
        if self.tempo_lavoro == "PIENO" and self.percentuale_part_time is not None:
            raise ValueError("percentuale_part_time va valorizzata solo per un rapporto PARZIALE.")
        if self.percentuale_part_time is not None and not (0 < self.percentuale_part_time <= 100):
            raise ValueError("percentuale_part_time deve essere maggiore di zero e non superiore a 100.")
        return self


# ---------------------------------------------------------------------------
# Profilo persona (tab Persona e rapporto, §12) — Dati essenziali +
# Dossier personale. Il rapporto corrente non è più mostrato come blocco
# autonomo (§3 della correzione): i suoi dati restano disponibili qui sotto
# `rapporto_corrente`, letti dal Dossier per i "Dettagli contrattuali".
# ---------------------------------------------------------------------------


class PersonaProfiloRead(_OrmModel):
    id: uuid.UUID
    nome: str
    cognome: str
    codice_fiscale: str
    telefono: str | None = None
    email: str | None = None
    dossier: PersonaDossierRead
    rapporto_corrente: RapportoAziendaRead | None = None
    created_at: datetime
    updated_at: datetime


class PersonaProfiloUpdate(_OrmModel):
    persona: PersonaEssenzialiUpdate | None = None
    dossier: PersonaDossierUpdate | None = None
    rapporto: RapportoDettagliUpdate | None = None


# ---------------------------------------------------------------------------
# Ruoli e responsabilità (§13) — riusa il motore ruolo+incarico esistente
# (cat_ruoli/per_incarichi/per_incarichi_valori, nato per le cariche CCIAA):
# nessuna nuova tabella. "Data inizio"/"Data fine" sono le caratteristiche
# A01/A02 già presenti per 34 dei 35 ruoli, "Ambito" è `cat_ruoli.ambito`
# (macro-categoria del ruolo, non un perimetro organizzativo per-assegnazione
# — decisione utente via AskUserQuestion), "Documentazione" è derivata dalle
# caratteristiche di tipo DOCUMENTO del ruolo (nessun vero modulo Documenti
# oggi disponibile — anche questo confermato con l'utente).
# ---------------------------------------------------------------------------


class PersonaRuoloRead(_OrmModel):
    id: uuid.UUID
    ruolo_id: uuid.UUID
    ruolo_denominazione: str
    ambito: str | None = None
    fonte: str
    stato: str
    data_inizio: date | None = None
    data_fine: date | None = None
    # PRESENTE / DA_INTEGRARE / NON_PRESENTE / IMPORTATO_CCIAA / NON_RICHIESTO
    documentazione: str
    note: str | None = None


# ---------------------------------------------------------------------------
# Mansionario del ruolo (correzione "Mansionario e profilo standard delle
# competenze del ruolo") — riusa cfg_ruoli_azienda/rel_ruoli_voci_valutazione/
# cat_voci_valutazione_personale, già esistenti e mai popolati: nessuna
# nuova tabella. Una competenza = una voce di catalogo azienda-specifica
# (§ decisione utente) collegata al ruolo tramite la relazione; "id" qui è
# l'id della RELAZIONE (serve per disattivarla senza toccare il catalogo),
# "voce_id" è l'id della voce di catalogo (serve per modificarne nome e
# descrizione, che appartengono al profilo standard, non alla relazione).
# ---------------------------------------------------------------------------


class CompetenzaRuoloRead(_OrmModel):
    id: uuid.UUID
    voce_id: uuid.UUID
    nome: str
    descrizione: str | None = None


class CompetenzaRuoloCreate(_OrmModel):
    nome: str
    descrizione: str | None = None

    @model_validator(mode="after")
    def _nome_non_vuoto(self) -> "CompetenzaRuoloCreate":
        if not self.nome.strip():
            raise ValueError("Il nome della competenza è obbligatorio.")
        return self


class CompetenzaRuoloUpdate(CompetenzaRuoloCreate):
    pass


# ---------------------------------------------------------------------------
# Formazione e abilitazioni (correzione "Struttura di 'Formazione e
# abilitazioni'") — F e A restano due tabelle distinte lato backend
# (per_formazione+cat_corsi_formazione, per_abilitazioni+cat_abilitazioni,
# già esistenti dalla migrazione 014/0101 e mai usate finora), unificate qui
# in un'unica forma di lettura per il frontend (§19). "catalogo_id" è
# corso_id o abilitazione_catalogo_id a seconda di `tipo`; "id" è l'id della
# riga nella tabella di dominio (non ambiguo: la modifica specifica anche il
# tipo nell'URL, §17 — il tipo non è mai modificabile dopo la creazione
# perché F e A vivono in tabelle diverse).
# ---------------------------------------------------------------------------

TipoRegistrazioneFormativa = Literal["FORMAZIONE", "ABILITAZIONE"]
StatoRegistrazioneFormativa = Literal["VALIDA", "IN_SCADENZA", "SCADUTA"]


class CatalogoCorsoRead(_OrmModel):
    id: uuid.UUID
    codice: str
    denominazione: str
    obbligatorio: bool
    attivo: bool


class CatalogoCorsoCreate(_OrmModel):
    codice: str
    denominazione: str

    @model_validator(mode="after")
    def _denominazione_non_vuota(self) -> "CatalogoCorsoCreate":
        if not self.denominazione.strip():
            raise ValueError("La denominazione del corso è obbligatoria.")
        return self


class CatalogoAbilitazioneRead(_OrmModel):
    id: uuid.UUID
    codice: str
    denominazione: str
    obbligatorio: bool
    attivo: bool


class RegistrazioneFormativaRead(_OrmModel):
    id: uuid.UUID
    tipo: TipoRegistrazioneFormativa
    catalogo_id: uuid.UUID
    denominazione: str
    ente_formatore: str | None = None
    data_conseguimento: date
    data_scadenza: date
    durata_ore: Decimal
    documento_presente: bool
    obbligatorio: bool
    stato: StatoRegistrazioneFormativa


class RegistrazioneFormativaCreate(_OrmModel):
    tipo: TipoRegistrazioneFormativa
    catalogo_id: uuid.UUID
    data_conseguimento: date
    data_scadenza: date
    durata_ore: Decimal
    ente_formatore: str | None = None

    @model_validator(mode="after")
    def _validazioni(self) -> "RegistrazioneFormativaCreate":
        if self.data_conseguimento > self.data_scadenza:
            raise ValueError("La data di conseguimento non può essere successiva alla data di scadenza.")
        if self.durata_ore <= 0:
            raise ValueError("La durata deve essere maggiore di zero.")
        if self.tipo == "FORMAZIONE" and not (self.ente_formatore or "").strip():
            raise ValueError("L'ente formatore è obbligatorio per la Formazione.")
        return self


class RegistrazioneFormativaUpdate(RegistrazioneFormativaCreate):
    pass


# ---------------------------------------------------------------------------
# Idoneità sanitaria (precisazione "Struttura di 'Idoneità sanitaria'") —
# riusa per_giudizi_idoneita (§15.1, migrazione 014/0101, mai popolata) per
# le visite completate e per_attivita (Scadenziario, migrazione 015/0102,
# mai popolata né usata da alcun servizio) per l'appuntamento pianificato e
# il promemoria: nessuna tabella nuova per questi due concetti. Nessun
# controllo di profilo aggiuntivo oltre l'isolamento per azienda già in
# vigore altrove nel modulo (decisione utente esplicita via
# AskUserQuestion: non esiste ancora un sistema di permessi granulari in
# piattaforma — ampliarlo autonomamente non è nello scope di questa
# sessione). "documento_presente" segue lo stesso pattern già in uso per
# Formazione/Abilitazioni/Documenti personali: nessun upload/apertura file
# reale, solo presenza/assenza di `documento_id` (doc_documenti è ancora un
# placeholder, CLAUDE.md).
# ---------------------------------------------------------------------------

GiudizioIdoneitaValore = Literal["IDONEO", "IDONEO_CON_PRESCRIZIONI", "NON_IDONEO", "IDONEO_TEMPORANEAMENTE"]
StatoGiudizioIdoneita = Literal["VALIDA", "IN_SCADENZA", "SCADUTA", "SOSTITUITA"]
StatoAppuntamentoVisita = Literal["PIANIFICATA", "ANNULLATA"]


class TipoVisitaRead(_OrmModel):
    id: uuid.UUID
    codice: str
    denominazione: str


class GiudizioIdoneitaRead(_OrmModel):
    id: uuid.UUID
    tipo_visita: TipoVisitaRead
    data_visita: date
    giudizio: GiudizioIdoneitaValore
    periodicita_mesi: int | None = None
    data_scadenza: date | None = None
    medico_competente: str | None = None
    # Derivato dalla presenza di testo in prescrizioni_minime (§8): nessuna
    # colonna booleona separata, stesso principio di documento_presente.
    prescrizioni_presenti: bool
    prescrizioni_minime: str | None = None
    documento_presente: bool
    # VALIDA/IN_SCADENZA/SCADUTA solo per il giudizio vigente (la visita
    # completata più recente); ogni visita precedente è sempre SOSTITUITA
    # (§10), indipendentemente dalla propria scadenza originaria.
    stato: StatoGiudizioIdoneita


class GiudizioIdoneitaCreate(_OrmModel):
    tipo_visita_id: uuid.UUID
    data_visita: date
    giudizio: GiudizioIdoneitaValore
    periodicita_mesi: int | None = None
    # Proposta automaticamente dal frontend come data_visita + periodicità
    # (§5), ma sempre modificabile: se assente e la periodicità è presente,
    # il backend la calcola comunque (difesa in profondità, CLAUDE.md "ogni
    # regola che conta viene ri-verificata dalle API").
    data_scadenza: date | None = None
    medico_competente: str | None = None
    prescrizioni_presenti: bool = False
    prescrizioni_minime: str | None = None

    @model_validator(mode="after")
    def _validazioni(self) -> "GiudizioIdoneitaCreate":
        if self.data_visita > date.today():
            raise ValueError("La data della visita non può essere futura.")
        if self.periodicita_mesi is not None and self.periodicita_mesi <= 0:
            raise ValueError("La periodicità deve essere maggiore di zero.")
        if self.data_scadenza is not None and self.data_scadenza < self.data_visita:
            raise ValueError("La scadenza non può precedere la data della visita.")
        testo_prescrizioni = (self.prescrizioni_minime or "").strip()
        if self.prescrizioni_presenti and not testo_prescrizioni:
            raise ValueError(
                "Il testo delle prescrizioni è obbligatorio quando sono presenti limitazioni o prescrizioni."
            )
        if not self.prescrizioni_presenti and testo_prescrizioni:
            raise ValueError("Il testo delle prescrizioni è ammesso solo se sono segnalate limitazioni o prescrizioni.")
        if self.giudizio == "IDONEO_CON_PRESCRIZIONI" and not self.prescrizioni_presenti:
            raise ValueError("Il giudizio 'Idoneo con prescrizioni' richiede di segnalare le prescrizioni presenti.")
        return self


class GiudizioIdoneitaUpdate(GiudizioIdoneitaCreate):
    pass


class IndicatoriIdoneitaRead(_OrmModel):
    ultimo_giudizio: GiudizioIdoneitaValore | None = None
    valido_fino_al: date | None = None
    limitazioni_segnalate: bool = False


class AppuntamentoVisitaRead(_OrmModel):
    id: uuid.UUID
    titolo: str
    data: date
    ora: time | None = None
    medico_competente: str | None = None
    luogo: str | None = None
    note: str | None = None
    stato: StatoAppuntamentoVisita


class AppuntamentoVisitaCreate(_OrmModel):
    tipo_visita_id: uuid.UUID
    data: date
    ora: time | None = None
    medico_competente: str | None = None
    luogo: str | None = None
    note: str | None = None

    @model_validator(mode="after")
    def _data_non_passata(self) -> "AppuntamentoVisitaCreate":
        if self.data < date.today():
            raise ValueError("La data dell'appuntamento non può essere nel passato.")
        return self


class AppuntamentoVisitaUpdate(_OrmModel):
    data: date
    ora: time | None = None
    medico_competente: str | None = None
    luogo: str | None = None
    note: str | None = None
    stato: StatoAppuntamentoVisita = "PIANIFICATA"


class PromemoriaVisitaCreate(_OrmModel):
    oggetto: str
    data: date
    ora: time | None = None
    destinatari: str | None = None
    nota: str | None = None

    @model_validator(mode="after")
    def _oggetto_non_vuoto(self) -> "PromemoriaVisitaCreate":
        if not self.oggetto.strip():
            raise ValueError("L'oggetto del promemoria è obbligatorio.")
        return self


class PromemoriaVisitaRead(_OrmModel):
    id: uuid.UUID
    oggetto: str
    data: date
    ora: time | None = None
    nota: str | None = None


class EsposizioneAssociataRead(_OrmModel):
    denominazione: str


class IdoneitaSanitariaRead(_OrmModel):
    indicatori: IndicatoriIdoneitaRead
    storico: list[GiudizioIdoneitaRead]
    prossimo_appuntamento: AppuntamentoVisitaRead | None = None
    # Sempre vuoto finché il modulo Sicurezza non esiste (§16): stato vuoto,
    # mai esposizioni dimostrative.
    esposizioni: list[EsposizioneAssociataRead] = []


# ---------------------------------------------------------------------------
# Competenze ("Costruzione completa della scheda 'Competenze'") — riusa le
# tabelle nate con Conoscenza/Competenza/Consapevolezza (migrazione 013/
# 0100, mai popolate) e Titoli di studio/Esperienze (migrazione 015/0102,
# mai popolate): nessuna tabella nuova, solo una colonna additiva su
# per_valutazioni_personale (livello_complessivo) autorizzata dall'utente.
#
# Tre concetti restano volutamente distinti (§14 della specifica):
# - MacroIndicatoreRead: valutazione diretta del macro-indicatore, mai una
#   media delle voci analitiche;
# - ConoscenzaRead/CompetenzaRead: voci analitiche (personali per
#   Conoscenza, ereditate dai mansionari dei ruoli attivi per Competenza),
#   con una propria valutazione indipendente dal macro-indicatore;
# - TitoloStudioRead/EsperienzaRead: record multipli indipendenti, non
#   collegati alle valutazioni.
# ---------------------------------------------------------------------------

MacroareaCompetenze = Literal["KNOWLEDGE", "COMPETENCE", "AWARENESS"]
LivelloValutazione = Literal["BASE", "INTERMEDIO", "AVANZATO"]


class MacroIndicatoreRead(_OrmModel):
    macroarea: MacroareaCompetenze
    livello: LivelloValutazione | None = None
    data_valutazione: date | None = None
    valutatore: str | None = None
    nota: str | None = None
    # Solo per Conoscenza/Competenza (§4): il conteggio non concorre al
    # livello complessivo, è solo informativo.
    voci_attive: int | None = None
    voci_nascoste: int | None = None


class MacroIndicatoreValutaRequest(_OrmModel):
    livello: LivelloValutazione
    data_valutazione: date
    nota: str | None = None

    @model_validator(mode="after")
    def _data_non_futura(self) -> "MacroIndicatoreValutaRequest":
        if self.data_valutazione > date.today():
            raise ValueError("La data della valutazione non può essere futura.")
        return self


# ---------------------------------------------------------------------------
# Conoscenza — voci personali (per_voci_valutazione_personali, macroarea
# KNOWLEDGE): niente ereditarietà da mansione/ruoli/profilo generale (§8.1).
# ---------------------------------------------------------------------------


class ConoscenzaRead(_OrmModel):
    id: uuid.UUID
    nome: str
    descrizione: str | None = None
    livello: LivelloValutazione | None = None
    data_valutazione: date | None = None
    valutatore: str | None = None


class ConoscenzaCreate(_OrmModel):
    nome: str
    descrizione: str | None = None

    @model_validator(mode="after")
    def _nome_non_vuoto(self) -> "ConoscenzaCreate":
        if not self.nome.strip():
            raise ValueError("Il nome della conoscenza è obbligatorio.")
        return self


class ConoscenzaUpdate(ConoscenzaCreate):
    pass


class ValutazioneVoceRequest(_OrmModel):
    """`voce_id` è l'id della riga da valutare: una conoscenza personale
    (per_voci_valutazione_personali) o una voce di competenza di catalogo
    (cat_voci_valutazione_personale), a seconda dell'endpoint."""

    voce_id: uuid.UUID
    livello: LivelloValutazione
    evidenza_nota: str | None = None


class ValutaVociRequest(_OrmModel):
    """Sessione di valutazione analitica (§8.5/§9.4 'Valuta conoscenze'/
    'Valuta competenze'): una singola voce valutata usa la stessa forma con
    un solo elemento in `voci`, nessun endpoint duplicato."""

    data_valutazione: date
    nota_generale: str | None = None
    voci: list[ValutazioneVoceRequest]

    @model_validator(mode="after")
    def _validazioni(self) -> "ValutaVociRequest":
        if self.data_valutazione > date.today():
            raise ValueError("La data della valutazione non può essere futura.")
        if not self.voci:
            raise ValueError("Seleziona almeno una voce da valutare.")
        return self


# ---------------------------------------------------------------------------
# Competenza — esclusivamente dai mansionari dei ruoli attivi assegnati
# alla persona (§9.1): stesso motore ruolo+mansionario già usato da
# `mansionario_ruolo`, qui aggregato per persona invece che per ruolo.
# ---------------------------------------------------------------------------


class CompetenzaRead(_OrmModel):
    voce_id: uuid.UUID
    nome: str
    descrizione: str | None = None
    ruoli_origine: list[str]
    livello: LivelloValutazione | None = None
    data_valutazione: date | None = None
    valutatore: str | None = None


class CompetenzaNascostaRead(_OrmModel):
    voce_id: uuid.UUID
    nome: str
    descrizione: str | None = None
    ruoli_origine: list[str]
    livello: LivelloValutazione | None = None
    data_valutazione: date | None = None


class CompetenzePersonaRead(_OrmModel):
    attive: list[CompetenzaRead]
    nascoste: list[CompetenzaNascostaRead]


class NascondiCompetenzaRequest(_OrmModel):
    motivo: str | None = None


# ---------------------------------------------------------------------------
# Titoli di studio (per_titoli_studio_persona + catalogo condiviso
# cat_tipologie_titoli_studio, già popolato). Stato dichiarato/verificato:
# stesso motore verifica_riga già usato da Titoli abilitativi/Soci/
# Amministratori/Sindaci, mai un secondo sistema di conferma.
# ---------------------------------------------------------------------------


class TitoloStudioRead(_OrmModel):
    id: uuid.UUID
    tipologia: CatalogoRead
    indirizzo_specializzazione: str | None = None
    istituto: str | None = None
    anno: int | None = None
    votazione: str | None = None
    documento_presente: bool
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


class TitoloStudioCreate(_OrmModel):
    tipologia_titolo_id: uuid.UUID
    indirizzo_specializzazione: str | None = None
    istituto: str | None = None
    anno: int | None = None
    votazione: str | None = None

    @model_validator(mode="after")
    def _anno_valido(self) -> "TitoloStudioCreate":
        if self.anno is not None and not (1930 <= self.anno <= date.today().year):
            raise ValueError("L'anno di conseguimento non è valido.")
        return self


class TitoloStudioUpdate(TitoloStudioCreate):
    pass


# ---------------------------------------------------------------------------
# Esperienze rilevanti (per_esperienze). "rilevanza" riusa il CHECK
# esistente della tabella (§13.3, già esattamente Professionale/Tecnica/
# Organizzativa): nessun catalogo duplicato. "verificata" è una colonna
# booleana propria, distinta dal motore verifica_riga usato dai Titoli
# (decisione già presa dalla migrazione 015 che l'ha creata).
# ---------------------------------------------------------------------------

RilevanzaEsperienza = Literal["PROFESSIONALE", "TECNICA", "ORGANIZZATIVA"]


class EsperienzaRead(_OrmModel):
    id: uuid.UUID
    attivita_ruolo: str
    organizzazione: str | None = None
    data_inizio: date | None = None
    data_fine: date | None = None
    rilevanza: RilevanzaEsperienza
    descrizione: str | None = None
    verificata: bool
    documento_presente: bool


class EsperienzaCreate(_OrmModel):
    attivita_ruolo: str
    organizzazione: str | None = None
    data_inizio: date | None = None
    data_fine: date | None = None
    rilevanza: RilevanzaEsperienza
    descrizione: str | None = None

    @model_validator(mode="after")
    def _validazioni(self) -> "EsperienzaCreate":
        if not self.attivita_ruolo.strip():
            raise ValueError("Il ruolo o l'attività è obbligatorio.")
        if self.data_fine is not None and self.data_inizio is not None and self.data_fine < self.data_inizio:
            raise ValueError("La data di fine non può precedere la data di inizio.")
        return self


class EsperienzaUpdate(EsperienzaCreate):
    pass


class EsperienzaVerificaRequest(_OrmModel):
    verificata: bool


# ---------------------------------------------------------------------------
# Note (specificazione "Costruzione della scheda 'Note'") — riusa per_note
# (migrazione 015/0102, mai popolata): nessuna tabella nuova. "categoria" è
# un CHECK a valori fissi, non una FK a catalogo (nessun catalogo esiste
# per questo campo, decisione già presa dalla migrazione), esposta comunque
# tramite un piccolo endpoint di sola lettura per non duplicare il
# vocabolario nel frontend. "visibilita" è sempre SOLO_CONSULENTI per le
# note create da questa scheda (§3: nessun campo Visibilità nel form);
# "titolo"/"in_evidenza" restano sempre NULL/False, mai esposti. Nessun
# secondo campo di audit per "ultima modifica": non esiste già, la
# specifica vieta di aggiungerne uno.
# ---------------------------------------------------------------------------

NotaCategoria = Literal["GENERALE", "FORMAZIONE", "RUOLO", "SORVEGLIANZA_SANITARIA", "COMPETENZE"]


class NotaCategoriaRead(BaseModel):
    codice: NotaCategoria
    denominazione: str


class NotaRead(_OrmModel):
    id: uuid.UUID
    categoria: NotaCategoria
    testo: str
    autore: str | None = None
    created_at: datetime
    updated_at: datetime


class NotaCreate(_OrmModel):
    categoria: NotaCategoria
    testo: str

    @model_validator(mode="after")
    def _testo_non_vuoto(self) -> "NotaCreate":
        if not self.testo.strip():
            raise ValueError("Il testo della nota è obbligatorio.")
        return self


class NotaUpdate(NotaCreate):
    pass
