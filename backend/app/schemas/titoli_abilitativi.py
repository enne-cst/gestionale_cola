"""Contratti dati (Pydantic) per la tabella unificata "Albi, ruoli, licenze
e certificazioni" (Correzione 20, seconda parte della card "Attività, albi,
ruoli e licenze"): una riga principale con le sole informazioni comuni +
quattro strutture di dettaglio, una per macro-tipologia (§ punto 9).

Ogni macro-tipologia ha un proprio *Create/*Update/*Read (form dedicato,
mai un unico form generico con tutti i campi possibili, § punto 5): i campi
comuni sono condivisi tramite `_TitoloAbilitativoComuneBase`, quelli
specifici restano nel dettaglio della singola macro-tipologia.
`TitoloAbilitativoSummaryRead` è la sola forma usata dalla tabella
riepilogativa (§ punto 4: "Categoria / norma" viene già risolta qui dal
dettaglio, mai duplicata come colonna della tabella principale).
"""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Vista riepilogativa (tabella unificata)
# ===========================================================================


class TitoloAbilitativoSummaryRead(_OrmModel):
    id: uuid.UUID
    macro_tipologia_codice: str
    # Colonna "Tipologia" (§ punto 4): "Albo"/"Ruolo"/"Licenza" per le prime
    # tre macro-tipologie, "Certificazione" oppure "Attestazione SOA" per la
    # quarta a seconda del sotto-tipo del dettaglio (§ punto 7).
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
    created_at: datetime
    updated_at: datetime
    # Colonna "Stato" (§ punto 4): stesso motore di verifica per riga già in
    # uso per Soci/Amministratori/Sindaci (app.core.verifica_riga), mai un
    # secondo sistema di conferma.
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


# ===========================================================================
# Campi comuni alle 4 macro-tipologie (§ punto 6)
# ===========================================================================


class _TitoloAbilitativoComuneBase(_OrmModel):
    numero_attestazione: str | None = None
    ente_rilascio: str | None = None
    data_rilascio: date | None = None
    data_scadenza: date | None = None
    senza_scadenza: bool = False
    note: str | None = None


class _TitoloAbilitativoComuneRead(_TitoloAbilitativoComuneBase):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


# ===========================================================================
# Form Albo
# ===========================================================================


class TitoloAbilitativoAlboCreate(_TitoloAbilitativoComuneBase):
    categoria: str | None = None


class TitoloAbilitativoAlboUpdate(TitoloAbilitativoAlboCreate):
    pass


class TitoloAbilitativoAlboRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["ALBO"] = "ALBO"
    categoria: str | None = None


# ===========================================================================
# Form Ruolo
# ===========================================================================


class TitoloAbilitativoRuoloCreate(_TitoloAbilitativoComuneBase):
    denominazione_ruolo: str | None = None


class TitoloAbilitativoRuoloUpdate(TitoloAbilitativoRuoloCreate):
    pass


class TitoloAbilitativoRuoloRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["RUOLO"] = "RUOLO"
    denominazione_ruolo: str | None = None


# ===========================================================================
# Form Licenza
# ===========================================================================


class TitoloAbilitativoLicenzaCreate(_TitoloAbilitativoComuneBase):
    tipologia_licenza: str | None = None


class TitoloAbilitativoLicenzaUpdate(TitoloAbilitativoLicenzaCreate):
    pass


class TitoloAbilitativoLicenzaRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["LICENZA"] = "LICENZA"
    tipologia_licenza: str | None = None


# ===========================================================================
# Form Certificazione o attestazione (§ punto 7: ISO / SOA / altre)
# ===========================================================================

SottoTipoCertificazione = Literal["CERTIFICAZIONE", "ATTESTAZIONE_SOA"]


class TitoloAbilitativoCertificazioneCreate(_TitoloAbilitativoComuneBase):
    sotto_tipo: SottoTipoCertificazione
    categoria_norma: str | None = None


class TitoloAbilitativoCertificazioneUpdate(TitoloAbilitativoCertificazioneCreate):
    pass


class TitoloAbilitativoCertificazioneRead(_TitoloAbilitativoComuneRead):
    macro_tipologia_codice: Literal["CERTIFICAZIONE_ATTESTAZIONE"] = "CERTIFICAZIONE_ATTESTAZIONE"
    sotto_tipo: SottoTipoCertificazione
    categoria_norma: str | None = None


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
