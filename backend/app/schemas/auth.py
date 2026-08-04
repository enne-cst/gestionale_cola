from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UtenteRead(BaseModel):
    id: UUID
    nome: str
    cognome: str
    email: str


class AziendaRead(BaseModel):
    id: UUID
    ragione_sociale: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    profilo: str
    utente: UtenteRead
    azienda: AziendaRead | None


class MeResponse(BaseModel):
    utente: UtenteRead
    profilo: str
    azienda: AziendaRead | None
    # Vero solo per un consulente che sta operando dentro il contesto di
    # un'azienda cliente (vedi X-Azienda-Id in app.core.deps): pilota il
    # banner "stai operando come" in interfaccia.
    in_impersonificazione: bool = False
