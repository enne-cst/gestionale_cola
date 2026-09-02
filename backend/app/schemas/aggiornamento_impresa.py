"""Contratti dati (Pydantic) per la card "Aggiornamento impresa" (Correzione
24): 4 indicatori riepilogativi non modificabili + la cronologia in sola
lettura (§7), mai un form di inserimento (§10)."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.registro_campi import VerificationStatus


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Indicatori riepilogativi (§1/§2): sempre calcolati, mai salvati.
# ===========================================================================


class IndicatoriAggiornamentoImpresa(_OrmModel):
    pratiche_ultimi_12_mesi: int
    trasferimenti_quote: int
    trasferimenti_sede: int
    partecipazioni: int


# ===========================================================================
# Cronologia (§6/§7): riga della vista vw_ana_cronologia_aggiornamenti_impresa
# + stato di conferma del consulente (§ app.core.verifica_riga).
# ===========================================================================


class CronologiaEventoRead(_OrmModel):
    evento_id: uuid.UUID
    tipologia: str
    data: date | None = None
    origine: str | None = None
    esito: str | None = None
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None


class CampoDettaglioEvento(_OrmModel):
    """Coppia label/valore già risolta lato backend (§9): il dettaglio
    dipende dal tipo di evento, ma il frontend resta generico — un solo
    componente che elenca queste coppie, mai 4 form diversi da mantenere."""

    label: str
    value: str | None = None


class CronologiaEventoDettaglio(_OrmModel):
    evento_id: uuid.UUID
    tipologia: str
    tabella_origine: str
    record_origine_id: uuid.UUID
    campi: list[CampoDettaglioEvento]
    verificationStatus: VerificationStatus | None = None
    verificationVersion: int | None = None
    revisionNote: str | None = None
    verifiedAt: str | None = None
    verifiedBy: str | None = None
