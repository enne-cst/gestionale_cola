"""Login e identità dell'utente corrente (doc. cap. 2.2.7). Unici endpoint
del backend che non richiedono un'azienda già risolta: `/login` è pubblico,
`/me` richiede solo un utente autenticato, non un profilo specifico."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import UtenteContext, get_current_user
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.models.sistema import RelUtenteAzienda, SysAzienda, SysProfilo, SysUtente
from app.schemas.auth import AziendaRead, LoginRequest, LoginResponse, MeResponse, UtenteRead

router = APIRouter(prefix="/api/auth", tags=["Autenticazione"])

# Messaggio deliberatamente generico: non deve rivelare se l'email esiste
# o se è la password a essere sbagliata.
_CREDENZIALI_NON_VALIDE = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o password non validi"
)


def _relazione_attiva_di(db: Session, utente_id) -> RelUtenteAzienda | None:
    """La relazione ruolo/azienda attiva più vecchia per l'utente. Con la
    regola attuale di un solo account per azienda e un solo ruolo per
    utente, ne esiste al più una; se in futuro un utente avrà più ruoli
    andrà introdotta una scelta esplicita (es. selezione azienda al login)."""
    return db.scalars(
        select(RelUtenteAzienda)
        .where(RelUtenteAzienda.utente_id == utente_id, RelUtenteAzienda.attivo.is_(True))
        .order_by(RelUtenteAzienda.created_at)
    ).first()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    utente = db.scalars(select(SysUtente).where(SysUtente.email == payload.email)).first()
    if utente is None or not utente.attivo or not verify_password(payload.password, utente.password_hash):
        raise _CREDENZIALI_NON_VALIDE

    relazione = _relazione_attiva_di(db, utente.id)
    if relazione is None:
        raise _CREDENZIALI_NON_VALIDE

    profilo = db.get(SysProfilo, relazione.profilo_id)
    azienda = db.get(SysAzienda, relazione.azienda_id) if relazione.azienda_id else None

    # A differenza di email/password sbagliate, qui le credenziali sono
    # corrette: il messaggio può essere specifico, non deve restare
    # generico (non rivela nulla che l'utente non sappia già).
    if azienda is not None and azienda.stato_approvazione != "approvata":
        if azienda.stato_approvazione == "in_attesa":
            messaggio = "L'azienda è in attesa di approvazione da parte del super admin"
        else:
            messaggio = "L'azienda è stata rifiutata dal super admin"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=messaggio)

    token = create_access_token(utente.id)
    return LoginResponse(
        access_token=token,
        profilo=profilo.codice,
        utente=UtenteRead(id=utente.id, nome=utente.nome, cognome=utente.cognome, email=utente.email),
        azienda=AziendaRead(id=azienda.id, ragione_sociale=azienda.ragione_sociale) if azienda else None,
    )


@router.get("/me", response_model=MeResponse)
def me(db: Session = Depends(get_db), utente: UtenteContext = Depends(get_current_user)):
    relazione = _relazione_attiva_di(db, utente.utente_id)
    profilo_codice = "SENZA_RUOLO"
    azienda = None
    if relazione is not None:
        profilo = db.get(SysProfilo, relazione.profilo_id)
        profilo_codice = profilo.codice
        if relazione.azienda_id:
            a = db.get(SysAzienda, relazione.azienda_id)
            azienda = AziendaRead(id=a.id, ragione_sociale=a.ragione_sociale)

    return MeResponse(
        utente=UtenteRead(id=utente.utente_id, nome=utente.nome, cognome=utente.cognome, email=utente.email),
        profilo=profilo_codice,
        azienda=azienda,
    )
