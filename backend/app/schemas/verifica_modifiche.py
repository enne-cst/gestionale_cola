"""Contratti dati (Pydantic) per il flusso di verifica e presa visione delle
modifiche (`app.core.verifica_modifiche`, `app.api.verifica_modifiche`)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VerificaModificaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    azienda_id: uuid.UUID
    utente_id: uuid.UUID
    entita: str
    record_id: uuid.UUID
    modifica_rilevata_at: datetime
    modifica_vista_at: datetime | None
    presa_visione_at: datetime | None
    stato_verifica_codice: str
    nota_verifica: str | None
    stato_verifica_at: datetime
    created_at: datetime
    updated_at: datetime


class RichiediRevisioneRequest(BaseModel):
    nota_verifica: str = Field(min_length=1)
