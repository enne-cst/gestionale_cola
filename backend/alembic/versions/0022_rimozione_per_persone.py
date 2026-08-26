"""Elimina per_persone, sostituita da ana_persone (0015) come unica fonte
autorevole dell'anagrafica persona.

Deve essere eseguita dopo 0021 (rimuove le tabelle qual_* che referenziavano
ancora per_persone).

Nessun dato reale presente al momento della decisione (verificato sul
database di sviluppo): una sola riga di test, persa con questa migrazione
per esplicita decisione dell'utente (cancellazione fisica, nessun
backfill).

Revision ID: 0022
Revises: 0021
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/007_rimozione_per_persone.sql"


def _sql_root() -> Path:
    here = Path(__file__).resolve()
    candidate = here.parents[2] / "database_struttura"
    if candidate.exists():
        return candidate
    candidate = here.parents[3] / "database_struttura"
    if candidate.exists():
        return candidate
    raise FileNotFoundError("Impossibile trovare la cartella database_struttura con lo schema SQL")


def upgrade() -> None:
    content = (_sql_root() / _SQL_FILE).read_text(encoding="utf-8").strip()
    op.execute(content)


def downgrade() -> None:
    # Non ricostruibile automaticamente: lo schema originale di per_persone
    # non e' conservato da nessuna parte dopo questa migrazione (il file
    # sorgente 001_per_persone.sql era gia' stato rimosso prima di questa
    # sessione). Se serve tornare indietro, ripristinare da un backup preso
    # prima di applicarla.
    pass
