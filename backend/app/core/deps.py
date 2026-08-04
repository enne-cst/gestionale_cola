"""Contesto azienda/utente corrente.

TEMPORANEO (decisione esplicita: si sviluppa prima il ruolo azienda, il
login reale con JWT per consulente/superuser arriverà in una sessione
successiva). Finché non esiste autenticazione, questa dependency restituisce
sempre l'azienda e l'utente di sviluppo creati da app/seed.py.

Punto di sostituzione unico: quando verrà introdotto il login, va cambiata
SOLO questa funzione. Nessun altro modulo (router, servizi) conosce il
meccanismo di autenticazione: dipendono tutti esclusivamente da
`get_current_azienda`, quindi il resto del backend non dovrà cambiare.
"""

from dataclasses import dataclass
from uuid import UUID

from app.seed import DEV_AZIENDA_ID, DEV_UTENTE_ID


@dataclass(frozen=True)
class AziendaContext:
    azienda_id: UUID
    utente_id: UUID


def get_current_azienda() -> AziendaContext:
    return AziendaContext(azienda_id=DEV_AZIENDA_ID, utente_id=DEV_UTENTE_ID)
