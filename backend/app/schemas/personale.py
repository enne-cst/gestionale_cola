import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class _OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PersonaCreate(_OrmModel):
    categoria: str
    nominativo: str
    codice_fiscale: str | None = None
    data_nascita: date | None = None
    comune_nascita: str | None = None
    provincia_nascita: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    frazione_domicilio: str | None = None
    pec: str | None = None


class PersonaUpdate(_OrmModel):
    categoria: str | None = None
    nominativo: str | None = None
    codice_fiscale: str | None = None
    data_nascita: date | None = None
    comune_nascita: str | None = None
    provincia_nascita: str | None = None
    comune_domicilio: str | None = None
    provincia_domicilio: str | None = None
    indirizzo_domicilio: str | None = None
    cap_domicilio: str | None = None
    frazione_domicilio: str | None = None
    pec: str | None = None


class PersonaRead(PersonaCreate):
    id: uuid.UUID
    azienda_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
