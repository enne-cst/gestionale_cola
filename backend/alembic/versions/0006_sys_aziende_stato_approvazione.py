"""Aggiunge lo stato di approvazione (in_attesa/approvata/rifiutata) a
sys_aziende: le aziende create da un consulente restano in attesa finché un
super admin non le approva.

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-04
"""

from pathlib import Path

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/017_sys_aziende_stato_approvazione.sql"


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
    op.execute("ALTER TABLE sys_aziende DROP COLUMN IF EXISTS stato_approvazione;")
