"""Contratti dati (Pydantic) per "Sedi secondarie e unità locali"
(Correzione 23): una riga (`AnaSede`, filtrata su quelle diverse dalla sede
legale) con tipologie multiple, attività e codici ATECO come liste
ripetibili, contatti opzionali — mai testo con virgole per le tipologie/i
codici multipli (§ punti 4/5/6).

`UnitaLocaleSummaryRead` è la sola forma usata dalla tabella riepilogativa
(§ punto 2): le colonne "Tipologia"/"Attività"/"ATECO" sono già risolte qui
dalle relazioni, mai duplicate come testo nella riga principale.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.anagrafica_iso9001 import CatalogoRead
from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Righe ripetibili del form completo (§ punti 5/6/8)
# ===========================================================================


class UnitaLocaleAttivitaIn(_OrmModel):
    descrizione_attivita: str
    data_inizio: date | None = None
    data_fine: date | None = None
    attivita_principale: bool = False


class UnitaLocaleAttivitaRead(UnitaLocaleAttivitaIn):
    id: uuid.UUID


class UnitaLocaleCodiceAtecoIn(_OrmModel):
    codice_attivita_id: uuid.UUID
    principale: bool = False
    data_inizio: date | None = None
    data_fine: date | None = None


class UnitaLocaleCodiceAtecoRead(UnitaLocaleCodiceAtecoIn):
    id: uuid.UUID
    codice_attivita: CatalogoRead


class UnitaLocaleContattoIn(_OrmModel):
    tipo_contatto: str
    valore: str
    descrizione: str | None = None
    principale: bool = False


class UnitaLocaleContattoRead(UnitaLocaleContattoIn):
    id: uuid.UUID


# ===========================================================================
# Vista riepilogativa (tabella, § punto 2)
# ===========================================================================


class UnitaLocaleSummaryRead(_OrmModel):
    id: uuid.UUID
    riferimento_cciaa: str | None = None
    tipologia_label: str | None = None
    indirizzo_label: str | None = None
    data_apertura: date | None = None
    attivita_principale_label: str | None = None
    ateco_label: str | None = None
    data_chiusura: date | None = None
    created_at: datetime
    updated_at: datetime
    # Colonna "Stato" (§ punto 2): conferma del consulente, stesso motore di
    # verifica per riga già in uso per Soci/Amministratori/Titoli
    # abilitativi (app.core.verifica_riga) — distinta dallo stato
    # amministrativo dell'unità (§ punto 7, disponibile solo nel form
    # completo tramite `UnitaLocaleDetailRead.stato_unita`).
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


# ===========================================================================
# Form completo (§ punto 8)
# ===========================================================================


class UnitaLocaleCreate(_OrmModel):
    numero_unita_locale: str | None = None  # riferimento CCIAA, es. "TV/1"
    denominazione_sede: str | None = None
    data_apertura: date | None = None
    data_chiusura: date | None = None
    toponimo: str | None = None
    indirizzo: str | None = None
    numero_civico: str | None = None
    cap: str | None = None
    comune: str | None = None
    provincia: str | None = None
    frazione: str | None = None
    nazione: str | None = None
    stato_unita_id: uuid.UUID | None = None
    note: str | None = None
    tipologia_ids: list[uuid.UUID] = []
    attivita: list[UnitaLocaleAttivitaIn] = []
    codici_ateco: list[UnitaLocaleCodiceAtecoIn] = []
    contatti: list[UnitaLocaleContattoIn] = []


class UnitaLocaleDetailRead(_OrmModel):
    id: uuid.UUID
    azienda_id: uuid.UUID
    numero_unita_locale: str | None = None
    denominazione_sede: str | None = None
    data_apertura: date | None = None
    data_chiusura: date | None = None
    toponimo: str | None = None
    indirizzo: str | None = None
    numero_civico: str | None = None
    cap: str | None = None
    comune: str | None = None
    provincia: str | None = None
    frazione: str | None = None
    nazione: str | None = None
    stato_unita_id: uuid.UUID | None = None
    stato_unita: CatalogoRead | None = None
    note: str | None = None
    created_at: datetime
    updated_at: datetime
    tipologie: list[CatalogoRead] = []
    attivita: list[UnitaLocaleAttivitaRead] = []
    codici_ateco: list[UnitaLocaleCodiceAtecoRead] = []
    contatti: list[UnitaLocaleContattoRead] = []
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None
