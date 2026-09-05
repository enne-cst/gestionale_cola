"""Competenze: livello complessivo del macro-indicatore (modulo Personale).

Revision ID: 0109
Revises: 0108
Create Date: 2026-09-05
"""

from pathlib import Path

from alembic import op

revision = "0109"
down_revision = "0108"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/022_competenze_livello_complessivo.sql"


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
    op.execute("ALTER TABLE per_valutazioni_personale DROP CONSTRAINT IF EXISTS chk_per_valutazioni_personale_livello_complessivo")
    op.execute("ALTER TABLE per_valutazioni_personale DROP COLUMN IF EXISTS livello_complessivo")
