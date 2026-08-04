from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConsulenteRead(BaseModel):
    id: UUID
    nome: str
    cognome: str
    email: str


class AziendaAmministrazioneRead(BaseModel):
    id: UUID
    ragione_sociale: str
    partita_iva: str | None
    codice_fiscale: str | None
    stato_approvazione: str
    created_at: datetime
    # Di norma uno solo (chi l'ha creata): una lista perché un'azienda può
    # avere più consulenti assegnati (vedi POST .../consulenti).
    consulenti: list[ConsulenteRead] = []


class AssociaConsulenteRequest(BaseModel):
    consulente_id: UUID


class AziendaSintesi(BaseModel):
    id: UUID
    ragione_sociale: str
    stato_approvazione: str


class ConsulenteAmministrazioneRead(BaseModel):
    id: UUID
    nome: str
    cognome: str
    email: str
    attivo: bool
    aziende: list[AziendaSintesi] = []


class NuovoConsulenteRequest(BaseModel):
    nome: str
    cognome: str
    email: str
    password: str
