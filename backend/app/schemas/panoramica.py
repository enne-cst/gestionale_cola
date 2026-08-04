import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class PanoramicaVoceCreate(BaseModel):
    modulo: str
    sezione_slug: str
    etichetta: str
    campo: str | None = None
    record_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _campo_xor_record_id(self) -> "PanoramicaVoceCreate":
        if (self.campo is None) == (self.record_id is None):
            raise ValueError("Indicare esattamente uno tra 'campo' (sezione singleton) e 'record_id' (sezione a elenco)")
        return self


class PanoramicaVoceRead(PanoramicaVoceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    azienda_id: uuid.UUID
    ordine: int
    created_at: datetime
    updated_at: datetime


class PanoramicaOrdineUpdate(BaseModel):
    modulo: str
    ids: list[uuid.UUID]
    """Elenco degli id delle voci nel nuovo ordine desiderato: la posizione
    nell'elenco diventa il nuovo valore di `ordine` di ciascuna voce."""
