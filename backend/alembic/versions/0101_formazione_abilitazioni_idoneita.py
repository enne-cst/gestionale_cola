"""Formazione, abilitazioni e idoneità sanitaria (modulo Personale).

Revision ID: 0101
Revises: 0100
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0101"
down_revision = "0100"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/014_formazione_abilitazioni_idoneita.sql"


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
    op.execute("DROP TABLE IF EXISTS per_giudizi_idoneita")
    op.execute("DROP TABLE IF EXISTS per_abilitazioni")
    op.execute("DROP TABLE IF EXISTS cat_abilitazioni")
    op.execute("DROP TABLE IF EXISTS per_formazione")
    op.execute("DROP TABLE IF EXISTS cat_corsi_formazione")
