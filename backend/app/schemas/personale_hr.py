"""Schemas del vero modulo Personale (Fase 1 — Fondazioni: elenco Persone,
shell della scheda persona, tab Persona e rapporto).

Separato da `app.schemas.personale` (che resta il supporto minimo
all'anagrafica per il motore ruolo+caratteristiche CCIAA, § docstring di
`app.api.personale`): qui vive il DTO ricco per la vista Persone e per il
dossier, distinto anche nel contratto da `AnaPersoneRead`.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator


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
