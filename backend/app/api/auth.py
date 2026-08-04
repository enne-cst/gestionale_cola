"""Login e identità dell'utente corrente (doc. cap. 2.2.7). Unici endpoint
del backend che non richiedono un'azienda già risolta: `/login` è pubblico,
`/me` richiede solo un utente autenticato, non un profilo specifico."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import UtenteContext, get_current_azienda, get_current_user, profilo_utente
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


def _azienda_aziendale_di(db: Session, utente_id, profilo_codice: str) -> SysAzienda | None:
    """Azienda associata quando il profilo è aziendale (AZIENDA_ADMIN o
    OPERATORE): questi profili sono sempre legati a una singola azienda.
    Un consulente o un super admin non lo sono (possono operare su più
    aziende, o su nessuna) e ottengono sempre None qui: la loro azienda
    "attiva", se c'è, viene risolta da get_current_azienda via X-Azienda-Id,
    non al login."""
    if profilo_codice not in ("AZIENDA_ADMIN", "OPERATORE"):
        return None
    relazione = db.scalars(
        select(RelUtenteAzienda)
        .join(SysProfilo, RelUtenteAzienda.profilo_id == SysProfilo.id)
        .where(
            RelUtenteAzienda.utente_id == utente_id,
            RelUtenteAzienda.attivo.is_(True),
            SysProfilo.codice == profilo_codice,
        )
    ).first()
    return db.get(SysAzienda, relazione.azienda_id) if relazione is not None else None


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    utente = db.scalars(select(SysUtente).where(SysUtente.email == payload.email)).first()
    if utente is None or not utente.attivo or not verify_password(payload.password, utente.password_hash):
        raise _CREDENZIALI_NON_VALIDE

    profilo_codice = profilo_utente(db, utente.id)
    if profilo_codice is None:
        raise _CREDENZIALI_NON_VALIDE

    azienda = _azienda_aziendale_di(db, utente.id, profilo_codice)

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
        profilo=profilo_codice,
        utente=UtenteRead(id=utente.id, nome=utente.nome, cognome=utente.cognome, email=utente.email),
        azienda=AziendaRead(id=azienda.id, ragione_sociale=azienda.ragione_sociale) if azienda else None,
    )


@router.get("/me", response_model=MeResponse)
def me(
    db: Session = Depends(get_db),
    utente: UtenteContext = Depends(get_current_user),
    x_azienda_id: UUID | None = Header(default=None, alias="X-Azienda-Id"),
):
    profilo_codice = profilo_utente(db, utente.utente_id) or "SENZA_RUOLO"

    # Riusa get_current_azienda (unica fonte di verità sul contesto azienda,
    # incluso il caso consulente + X-Azienda-Id) invece di reimplementarne la
    # logica: un 403 qui significa solo "nessuna azienda attiva al momento",
    # non un errore da propagare.
    azienda = None
    in_impersonificazione = False
    try:
        ctx = get_current_azienda(db=db, utente=utente, x_azienda_id=x_azienda_id)
    except HTTPException:
        ctx = None
    if ctx is not None:
        azienda_obj = db.get(SysAzienda, ctx.azienda_id)
        azienda = AziendaRead(id=azienda_obj.id, ragione_sociale=azienda_obj.ragione_sociale)
        in_impersonificazione = ctx.profilo == "CONSULENTE"

    return MeResponse(
        utente=UtenteRead(id=utente.utente_id, nome=utente.nome, cognome=utente.cognome, email=utente.email),
        profilo=profilo_codice,
        azienda=azienda,
        in_impersonificazione=in_impersonificazione,
    )
