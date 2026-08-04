from uuid import UUID

from pydantic import BaseModel


class NuovaAziendaRequest(BaseModel):
    ragione_sociale: str
    partita_iva: str | None = None
    codice_fiscale: str | None = None
    nome_referente: str
    cognome_referente: str
    email: str
    password: str


class NuovaAziendaResponse(BaseModel):
    id: UUID
    ragione_sociale: str
    email: str
