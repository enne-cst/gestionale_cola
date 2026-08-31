import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AnaPersoneCreate(_OrmModel):
    fotografia: str | None = None
    cognome: str
    nome: str
    sesso: str | None = None
    data_nascita: date | None = None
    luogo_nascita: str | None = None
    nazionalita: str | None = None
    conoscenza_lingua_italiana: str | None = None
    codice_fiscale: str
    residenza: str | None = None
    tipologia_contratto: str | None = None
    data_assunzione: date | None = None
    data_fine_rapporto: date | None = None
    mansione: str | None = None
    persona_backup_id: uuid.UUID | None = None
    processi_speciali_eseguiti: str | None = None
    conoscenza_organizzazione_livello_id: uuid.UUID | None = None
    competenze_livello_id: uuid.UUID | None = None
    consapevolezza_livello_id: uuid.UUID | None = None
    frequenza_visite_mediche: int | None = None
    altro: str | None = None
    note: str | None = None


class AnaPersoneUpdate(_OrmModel):
    fotografia: str | None = None
    cognome: str | None = None
    nome: str | None = None
    sesso: str | None = None
    data_nascita: date | None = None
    luogo_nascita: str | None = None
    nazionalita: str | None = None
    conoscenza_lingua_italiana: str | None = None
    codice_fiscale: str | None = None
    residenza: str | None = None
    tipologia_contratto: str | None = None
    data_assunzione: date | None = None
    data_fine_rapporto: date | None = None
    mansione: str | None = None
    persona_backup_id: uuid.UUID | None = None
    processi_speciali_eseguiti: str | None = None
    conoscenza_organizzazione_livello_id: uuid.UUID | None = None
    competenze_livello_id: uuid.UUID | None = None
    consapevolezza_livello_id: uuid.UUID | None = None
    frequenza_visite_mediche: int | None = None
    altro: str | None = None
    note: str | None = None


class AnaPersoneRead(AnaPersoneCreate):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AnaPersoneGiuridicheCreate(_OrmModel):
    denominazione: str
    codice_fiscale: str
    partita_iva: str | None = None
    sede: str | None = None
    note: str | None = None


class AnaPersoneGiuridicheUpdate(_OrmModel):
    denominazione: str | None = None
    codice_fiscale: str | None = None
    partita_iva: str | None = None
    sede: str | None = None
    note: str | None = None


class AnaPersoneGiuridicheRead(AnaPersoneGiuridicheCreate):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class PersonaSummary(_OrmModel):
    """Dati anagrafici per la compilazione automatica e sola lettura delle
    righe incarico (specifica CCIAA §5.2/5.3/6.2: nome, nascita, cittadinanza
    e domicilio del soggetto sono "letti dal soggetto", mai duplicati o
    modificabili nel record della carica). Nessuna colonna nuova: sono già
    tutte presenti su `ana_persone`, prima non esposte qui."""

    id: uuid.UUID
    nome: str
    cognome: str
    codice_fiscale: str
    data_nascita: date | None = None
    luogo_nascita: str | None = None
    nazionalita: str | None = None
    residenza: str | None = None


class PersonaGiuridicaSummary(_OrmModel):
    """Come `PersonaSummary` sopra, per un titolare persona giuridica (§
    Correzione 16) — nessun campo di persona fisica (nascita, cittadinanza,
    domicilio): solo i dati identificativi del soggetto giuridico."""

    id: uuid.UUID
    denominazione: str
    codice_fiscale: str
    partita_iva: str | None = None
    sede: str | None = None


class RuoloSummary(_OrmModel):
    id: uuid.UUID
    codice: str
    codice_documento: str | None = None
    denominazione: str


class CaratteristicaRuoloRead(_OrmModel):
    """Configurazione di una caratteristica per un ruolo (join
    rel_ruoli_caratteristiche + cat_caratteristiche_incarico): usata dal
    frontend per costruire il form dinamico di un incarico senza duplicare
    lato client le regole già lette da `app.core.incarichi`."""

    id: uuid.UUID
    codice: str
    denominazione: str
    tipoDato: str
    valoriAmmessi: list[str] | None = None
    obbligatorieta: str


class IncaricoCreate(_OrmModel):
    # § Correzione 16: esattamente uno dei due titolari, mai entrambi né
    # nessuno — stesso vincolo di `chk_per_incarichi_titolare_esclusivo` a
    # livello DB, verificato qui per un errore di validazione immediato
    # invece di un errore di integrità del database.
    persona_id: uuid.UUID | None = None
    persona_giuridica_id: uuid.UUID | None = None
    ruolo_id: uuid.UUID
    note: str | None = None
    valori: dict[str, Any] = {}

    @model_validator(mode="after")
    def _titolare_esclusivo(self) -> "IncaricoCreate":
        if (self.persona_id is None) == (self.persona_giuridica_id is None):
            raise ValueError("Specificare esattamente uno tra persona_id e persona_giuridica_id.")
        return self


class IncaricoUpdate(_OrmModel):
    persona_id: uuid.UUID | None = None
    persona_giuridica_id: uuid.UUID | None = None
    ruolo_id: uuid.UUID | None = None
    note: str | None = None
    valori: dict[str, Any] | None = None

    @model_validator(mode="after")
    def _titolare_non_ambiguo(self) -> "IncaricoUpdate":
        if self.persona_id is not None and self.persona_giuridica_id is not None:
            raise ValueError("persona_id e persona_giuridica_id non possono essere valorizzati insieme.")
        return self


class IncaricoRead(_OrmModel):
    id: uuid.UUID
    azienda_id: uuid.UUID
    persona_id: uuid.UUID | None = None
    persona_giuridica_id: uuid.UUID | None = None
    ruolo_id: uuid.UUID
    note: str | None = None
    valori: dict[str, Any] = {}
    persona: PersonaSummary | None = None
    persona_giuridica: PersonaGiuridicaSummary | None = None
    ruolo: RuoloSummary
    created_at: datetime
    updated_at: datetime
    # Verifica del consulente sulla riga (vedi app/core/incarichi.py): non
    # più la caratteristica A32 dentro il form, ma lo stesso trattamento del
    # registro campo-per-campo (nota, audit, concorrenza ottimistica).
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None
