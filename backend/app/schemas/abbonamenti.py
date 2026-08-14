from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class CertificazioneCatalogoRead(BaseModel):
    id: UUID
    nome: str
    codice: str


class StatoCertificazioneRead(BaseModel):
    id: UUID
    nome: str


class AbbonamentoRead(BaseModel):
    certificazione_id: UUID
    certificazione_nome: str
    certificazione_codice: str
    stato_codice: str
    data_attivazione: date
    data_scadenza: date
    rinnovo_automatico: bool
    data_disattivazione: date | None
    updated_at: datetime


class AbbonamentoUpsert(BaseModel):
    stato_codice: str
    data_attivazione: date
    data_scadenza: date
    rinnovo_automatico: bool = True
