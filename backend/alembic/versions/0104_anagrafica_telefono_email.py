"""Telefono ed email su ana_persone (modulo Personale).

Revision ID: 0104
Revises: 0103
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0104"
down_revision = "0103"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/017_anagrafica_telefono_email.sql"


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
    op.execute("ALTER TABLE ana_persone DROP COLUMN IF EXISTS telefono")
    op.execute("ALTER TABLE ana_persone DROP COLUMN IF EXISTS email")
