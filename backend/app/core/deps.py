"""Contesto utente/azienda corrente, risolto dal token JWT di sessione
(vedi `app/api/auth.py` per l'emissione del token e `app/core/security.py`
per la sua verifica).

Punto di sostituzione unico: il resto del backend dipende esclusivamente da
`get_current_user`, `get_current_azienda`, `require_consulente` o
`require_superadmin`. Nessun altro modulo (router, servizi) conosce il
meccanismo di autenticazione, né deve cambiare se in futuro cambierà (es.
refresh token).
"""

from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente

_bearer_scheme = HTTPBearer(auto_error=False)

_NON_AUTENTICATO = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Accesso non valido o scaduto")


@dataclass(frozen=True)
class UtenteContext:
    utente_id: UUID
    nome: str
    cognome: str
    email: str


@dataclass(frozen=True)
class AziendaContext:
    azienda_id: UUID
    utente_id: UUID
    profilo: str


def get_current_user(
    credenziali: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> UtenteContext:
    if credenziali is None:
        raise _NON_AUTENTICATO

    utente_id = decode_access_token(credenziali.credentials)
    if utente_id is None:
        raise _NON_AUTENTICATO

    # L'utente viene ricaricato dal DB ad ogni richiesta (non solo dal
    # claim del token): un disattivamento (`attivo=false`) blocca così le
    # richieste successive, non solo i login futuri.
    utente = db.get(SysUtente, utente_id)
    if utente is None or not utente.attivo:
        raise _NON_AUTENTICATO

    return UtenteContext(utente_id=utente.id, nome=utente.nome, cognome=utente.cognome, email=utente.email)


def get_current_azienda(
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(get_current_user),
) -> AziendaContext:
    relazione = db.scalars(
        select(RelUtenteAzienda)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id == utente.utente_id,
            RelUtenteAzienda.attivo.is_(True),
            RelUtenteAzienda.azienda_id.is_not(None),
            SysProfilo.codice.in_(["AZIENDA_ADMIN", "OPERATORE"]),
        )
    ).first()
    if relazione is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente non associato a un'azienda attiva",
        )

    # Verificato ad ogni richiesta, non solo al login: se un super admin
    # rifiuta un'azienda già approvata in precedenza, le sessioni già
    # aperte vengono bloccate subito (stesso principio del controllo
    # `attivo` su get_current_user).
    azienda = db.get(SysAzienda, relazione.azienda_id)
    if azienda is None or azienda.stato_approvazione != "approvata":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Azienda non ancora approvata")

    profilo = db.get(SysProfilo, relazione.profilo_id)
    return AziendaContext(azienda_id=relazione.azienda_id, utente_id=utente.utente_id, profilo=profilo.codice)


def _profilo_attivo(db: Session, utente_id: UUID, codici: list[str]) -> RelUtenteAzienda | None:
    return db.scalars(
        select(RelUtenteAzienda)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id == utente_id,
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice.in_(codici),
        )
    ).first()


def require_consulente(
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(get_current_user),
) -> UtenteContext:
    if _profilo_attivo(db, utente.utente_id, ["CONSULENTE"]) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione riservata ai consulenti")
    return utente


def require_superadmin(
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(get_current_user),
) -> UtenteContext:
    if _profilo_attivo(db, utente.utente_id, ["SUPERADMIN"]) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione riservata al super admin")
    return utente
