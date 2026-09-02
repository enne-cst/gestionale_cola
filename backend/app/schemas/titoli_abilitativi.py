"""Contratti dati (Pydantic) per la tabella unificata "Albi, ruoli, licenze
e certificazioni" (Correzione 20 + Correzione 21, card "Attività, albi,
ruoli e licenze"): una riga principale con le sole informazioni comuni +
quattro strutture di dettaglio, una per macro-tipologia (§ punto 9).

Ogni macro-tipologia ha un proprio *Create/*Update/*Read (form dedicato,
mai un unico form generico con tutti i campi possibili, § punto 5): i campi
comuni sono condivisi tramite `_TitoloAbilitativoComuneBase`, quelli
specifici restano nel dettaglio della singola macro-tipologia.
`TitoloAbilitativoSummaryRead` è la sola forma usata dalla tabella
riepilogativa (§ punto 4: "Categoria / norma" viene già risolta qui dal
dettaglio, mai duplicata come colonna della tabella principale).

Correzione 21 aggiunge i campi specifici rimandati da Correzione 20: catalogo
condiviso "Stato del titolo" sui campi comuni, cataloghi/collegamenti
specifici di ciascun form, e le 3 configurazioni del sotto-form
"Certificazione o attestazione" (§ punto 5) al posto delle 2 opzioni fisse
precedenti.
"""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.anagrafica_iso9001 import CatalogoRead
from app.schemas.personale import PersonaSummary
from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class _SedeSummary(_OrmModel):
    """Proiezione minima di `AnaSede` per il campo "Sede o unità locale
    interessata" del form Licenza (§ punto 4): mai duplica indirizzo o
    altri dati della sede, solo ciò che serve a identificarla in lettura."""

    id: uuid.UUID
    denominazione_sede: str | None = None
    comune: str | None = None


class SettoreIafRead(_OrmModel):
    """Voce di `cat_settori_iaf` (modulo Sistema), riusata senza
    duplicazione dal multi-select "Settori IAF" (§ punto 5.1)."""

    id: uuid.UUID
    nome: str


# ===========================================================================
# Vista riepilogativa (tabella unificata)
# ===========================================================================


class TitoloAbilitativoSummaryRead(_OrmModel):
    id: uuid.UUID
    # Chiave univoca della riga grafica (§ punto 7, ultimo comma): per un
    # record SOA con più categorie/classifiche compaiono più righe che
    # condividono lo stesso `id` (per aprire lo stesso form) ma hanno una
    # `riga_key` diversa (necessaria come React key lato frontend).
    riga_key: str
    macro_tipologia_codice: str
    # Colonna "Tipologia" (§ punto 4): "Albo"/"Ruolo"/"Licenza" per le prime
    # tre macro-tipologie, "Certificazione"/"Attestazione SOA"/"Altra
    # certificazione o attestazione" per la quarta a seconda del sotto-tipo
    # del dettaglio (§ punto 7 correzione 20, punto 5 correzione 21).
    tipologia_label: str
    # Colonna "Categoria / norma" (§ punto 4): risolta dal dettaglio
    # specifico, mai una colonna propria della tabella principale.
    categoria_norma: str | None = None
    numero_attestazione: str | None = None
    ente_rilascio: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None
    senza_scadenza: bool = False
    note: str | None = None
    # "Stato del titolo" (§ Correzione 21 punto 1), distinto dalla verifica
    # del consulente sotto.
    stato_titolo_label: str | None = None
    created_at: datetime
    updated_at: datetime
    # Colonna "Verifica": stesso motore di verifica per riga già in uso per
    # Soci/Amministratori/Sindaci (app.core.verifica_riga), mai un secondo
    # sistema di conferma.
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


# ===========================================================================
# Campi comuni alle 4 macro-tipologie (§ Correzione 20 punto 6, esteso da
# Correzione 21 punto 1 con "Stato del titolo")
# ===========================================================================


class _TitoloAbilitativoComuneBase(_OrmModel):
    numero_attestazione: str | None = None
    ente_rilascio: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None
    senza_scadenza: bool = False
    note: str | None = None
    stato_titolo_id: uuid.UUID | None = None


class _TitoloAbilitativoComuneRead(_TitoloAbilitativoComuneBase):
    id: uuid.UUID
    azienda_id: uuid.UUID
    stato_titolo: CatalogoRead | None = None
    created_at: datetime
    updated_at: datetime
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


# ===========================================================================
# Form Albo (§ Correzione 21 punto 2)
# ===========================================================================


class TitoloAbilitativoAlboCreate(_TitoloAbilitativoComuneBase):
    tipologia_albo_id: uuid.UUID | None = None
    categoria: str | None = None
    denominazione_albo: str | None = None
    sezione: str | None = None
    # "Soggetto iscritto": None = l'azienda, valorizzato = persona collegata.
    persona_id: uuid.UUID | None = None
    provincia_ambito: str | None = None
    attivita_abilitazioni: str | None = None


class TitoloAbilitativoAlboUpdate(TitoloAbilitativoAlboCreate):
    pass


class TitoloAbilitativoAlboRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["ALBO"] = "ALBO"
    tipologia_albo_id: uuid.UUID | None = None
    tipologia_albo: CatalogoRead | None = None
    categoria: str | None = None
    denominazione_albo: str | None = None
    sezione: str | None = None
    persona_id: uuid.UUID | None = None
    persona: PersonaSummary | None = None
    provincia_ambito: str | None = None
    attivita_abilitazioni: str | None = None


# ===========================================================================
# Form Ruolo (§ Correzione 21 punto 3)
# ===========================================================================


class TitoloAbilitativoRuoloCreate(_TitoloAbilitativoComuneBase):
    tipologia_ruolo_id: uuid.UUID | None = None
    denominazione_ruolo: str | None = None
    sezione_categoria: str | None = None
    # "Titolare del ruolo": None = l'azienda, valorizzato = persona collegata.
    persona_id: uuid.UUID | None = None
    provincia_ambito: str | None = None
    attivita_abilitate: str | None = None


class TitoloAbilitativoRuoloUpdate(TitoloAbilitativoRuoloCreate):
    pass


class TitoloAbilitativoRuoloRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["RUOLO"] = "RUOLO"
    tipologia_ruolo_id: uuid.UUID | None = None
    tipologia_ruolo: CatalogoRead | None = None
    denominazione_ruolo: str | None = None
    sezione_categoria: str | None = None
    persona_id: uuid.UUID | None = None
    persona: PersonaSummary | None = None
    provincia_ambito: str | None = None
    attivita_abilitate: str | None = None


# ===========================================================================
# Form Licenza (§ Correzione 21 punto 4)
# ===========================================================================


class TitoloAbilitativoLicenzaCreate(_TitoloAbilitativoComuneBase):
    tipologia_licenza_id: uuid.UUID | None = None
    denominazione_licenza: str | None = None
    oggetto_attivita: str | None = None
    # "Soggetto titolare": None = l'azienda, valorizzato = persona collegata.
    persona_id: uuid.UUID | None = None
    # "Sede o unità locale interessata": riferisce sempre ana_sedi.
    sede_id: uuid.UUID | None = None
    ambito_territoriale: str | None = None
    data_efficacia: date | None = None
    condizioni_prescrizioni: str | None = None
    estremi_rinnovo: str | None = None


class TitoloAbilitativoLicenzaUpdate(TitoloAbilitativoLicenzaCreate):
    pass


class TitoloAbilitativoLicenzaRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["LICENZA"] = "LICENZA"
    tipologia_licenza_id: uuid.UUID | None = None
    tipologia_licenza: CatalogoRead | None = None
    denominazione_licenza: str | None = None
    oggetto_attivita: str | None = None
    persona_id: uuid.UUID | None = None
    persona: PersonaSummary | None = None
    sede_id: uuid.UUID | None = None
    sede: _SedeSummary | None = None
    ambito_territoriale: str | None = None
    data_efficacia: date | None = None
    condizioni_prescrizioni: str | None = None
    estremi_rinnovo: str | None = None


# ===========================================================================
# Form Certificazione o attestazione (§ Correzione 21 punto 5: 3
# configurazioni a catalogo, non più 2 opzioni fisse)
# ===========================================================================


class TitoloAbilitativoSoaCategoriaIn(_OrmModel):
    """Riga in scrittura della tabella ripetibile "Categorie e classifiche"
    (§ punto 5.2)."""

    categoria_soa_id: uuid.UUID
    classifica_soa_id: uuid.UUID | None = None


class TitoloAbilitativoSoaCategoriaRead(TitoloAbilitativoSoaCategoriaIn):
    id: uuid.UUID
    categoria_soa: CatalogoRead
    classifica_soa: CatalogoRead | None = None


class TitoloAbilitativoCertificazioneCreate(_TitoloAbilitativoComuneBase):
    sotto_tipo_id: uuid.UUID

    # --- Sotto-form "Certificazione di sistema" (§ punto 5.1) ---
    norma_id: uuid.UUID | None = None
    edizione_anno: str | None = None
    organismo_accreditamento: str | None = None
    campo_applicazione: str | None = None
    data_prima_emissione: date | None = None
    settori_iaf_ids: list[uuid.UUID] = []

    # --- Sotto-form "Attestazione SOA" (§ punto 5.2) ---
    categorie_soa: list[TitoloAbilitativoSoaCategoriaIn] = []

    # --- Sotto-form "Altra certificazione o attestazione" (§ punto 5.3) ---
    denominazione: str | None = None
    schema_norma: str | None = None


class TitoloAbilitativoCertificazioneUpdate(TitoloAbilitativoCertificazioneCreate):
    pass


class TitoloAbilitativoCertificazioneRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["CERTIFICAZIONE_ATTESTAZIONE"] = "CERTIFICAZIONE_ATTESTAZIONE"
    sotto_tipo_id: uuid.UUID | None = None
    sotto_tipo: CatalogoRead | None = None
    categoria_norma: str | None = None

    norma_id: uuid.UUID | None = None
    norma: CatalogoRead | None = None
    edizione_anno: str | None = None
    organismo_accreditamento: str | None = None
    campo_applicazione: str | None = None
    data_prima_emissione: date | None = None
    settori_iaf: list[SettoreIafRead] = []

    categorie_soa: list[TitoloAbilitativoSoaCategoriaRead] = []

    denominazione: str | None = None
    schema_norma: str | None = None


# Risposta di GET /{id} (§ punto 8: "selezionando una riga la piattaforma
# riconosce la tipologia e apre il form corretto") — unione discriminata su
# `macro_tipologia_codice`, cosi' il frontend sa quale dei 4 form montare
# senza bisogno di un'ulteriore chiamata.
TitoloAbilitativoDetailRead = (
    TitoloAbilitativoAlboRead
    | TitoloAbilitativoRuoloRead
    | TitoloAbilitativoLicenzaRead
    | TitoloAbilitativoCertificazioneRead
)
