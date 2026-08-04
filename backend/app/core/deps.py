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

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente

_bearer_scheme = HTTPBearer(auto_error=False)

_NON_AUTENTICATO = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Accesso non valido o scaduto")

# Priorità esplicita per risolvere "il" profilo di un utente con più
# relazioni attive (es. un consulente associato anche a un'azienda propria):
# mai dedotta dall'ordine di creazione delle righe, che dipende solo da
# quando sono state fatte le associazioni.
ORDINE_PROFILI = ["SUPERADMIN", "CONSULENTE", "AZIENDA_ADMIN", "OPERATORE"]


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


def profilo_utente(db: Session, utente_id: UUID) -> str | None:
    """Codice del profilo "principale" dell'utente, per priorità esplicita
    (`ORDINE_PROFILI`), non per data di creazione della relazione: un
    consulente associato anche a un'azienda propria resta identificato come
    CONSULENTE, non come AZIENDA_ADMIN solo perché quella riga è più vecchia."""
    codici_attivi = set(
        db.scalars(
            select(SysProfilo.codice)
            .join(RelUtenteAzienda, RelUtenteAzienda.profilo_id == SysProfilo.id)
            .where(RelUtenteAzienda.utente_id == utente_id, RelUtenteAzienda.attivo.is_(True))
        )
    )
    for codice in ORDINE_PROFILI:
        if codice in codici_attivi:
            return codice
    return None


def get_current_azienda(
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(get_current_user),
    x_azienda_id: UUID | None = Header(default=None, alias="X-Azienda-Id"),
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

    if relazione is not None:
        # Un utente aziendale ha sempre la precedenza sul meccanismo
        # dell'header: un X-Azienda-Id spurio non può dirottarlo su
        # un'azienda diversa dalla propria.
        profilo_codice = db.get(SysProfilo, relazione.profilo_id).codice
        azienda_id = relazione.azienda_id
    elif x_azienda_id is not None:
        # Contesto "azienda attiva" del consulente: mai fidarsi dell'id
        # ricevuto dal client senza verificarne l'autorizzazione, quindi si
        # ricontrolla su DB, ad ogni richiesta, che esista una relazione
        # CONSULENTE attiva verso quella specifica azienda.
        relazione_consulente = db.scalars(
            select(RelUtenteAzienda)
            .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
            .where(
                RelUtenteAzienda.utente_id == utente.utente_id,
                RelUtenteAzienda.azienda_id == x_azienda_id,
                RelUtenteAzienda.attivo.is_(True),
                SysProfilo.codice == "CONSULENTE",
            )
        ).first()
        if relazione_consulente is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Nessun accesso a questa azienda")
        profilo_codice = "CONSULENTE"
        azienda_id = x_azienda_id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente non associato a un'azienda attiva",
        )

    # Verificato ad ogni richiesta, non solo al login/alla selezione: se un
    # super admin rifiuta un'azienda già approvata in precedenza, le sessioni
    # già aperte (incluso un consulente che ci aveva "fatto ingresso")
    # vengono bloccate subito (stesso principio del controllo `attivo` su
    # get_current_user).
    azienda = db.get(SysAzienda, azienda_id)
    if azienda is None or azienda.stato_approvazione != "approvata":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Azienda non ancora approvata")

    return AziendaContext(azienda_id=azienda_id, utente_id=utente.utente_id, profilo=profilo_codice)


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
