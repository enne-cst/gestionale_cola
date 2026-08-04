"""Hashing password e gestione dei token JWT di sessione.

Centralizzato qui, non in `deps.py` né nei router: è l'unico modulo che deve
conoscere l'algoritmo di firma e il formato del token. Se in futuro cambierà
(refresh token, rotazione chiavi, ecc.) la modifica resta isolata qui.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
import jwt

from app.config import get_settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Hash malformato (es. dati residui pre-esistenti al login reale):
        # va trattato come credenziale non valida, non come errore 500.
        return False


def create_access_token(utente_id: UUID) -> str:
    settings = get_settings()
    scadenza = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(utente_id), "exp": scadenza}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> UUID | None:
    """Ritorna l'id utente se il token è valido e non scaduto, altrimenti
    None (nessuna eccezione: chi chiama deve solo decidere se autenticare)."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
