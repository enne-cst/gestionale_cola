"""Ruoli/incarichi: ambito su cat_ruoli, fonte e stato su per_incarichi (modulo Personale).

Revision ID: 0097
Revises: 0096
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0097"
down_revision = "0096"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/010_ruoli_incarichi_ambito_fonte_stato.sql"


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
    op.execute("ALTER TABLE cat_ruoli DROP COLUMN IF EXISTS ambito")
    op.execute("ALTER TABLE per_incarichi DROP COLUMN IF EXISTS fonte")
    op.execute("ALTER TABLE per_incarichi DROP COLUMN IF EXISTS stato")
