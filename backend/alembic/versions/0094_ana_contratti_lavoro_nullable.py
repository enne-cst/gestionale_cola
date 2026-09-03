"""Contratto di lavoro: colonne nullable per il pilota registro campo-per-campo.

Revision ID: 0094
Revises: 0093
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0094"
down_revision = "0093"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Sezioni ISO 9001/Organizzazione/016_ana_contratti_lavoro_nullable.sql"


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
    op.execute(
        """
        ALTER TABLE ana_contratti_lavoro
            ALTER COLUMN ccnl_applicato SET NOT NULL,
            ALTER COLUMN settore_ccnl SET NOT NULL,
            ALTER COLUMN data_applicazione SET NOT NULL
        """
    )
