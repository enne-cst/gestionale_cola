"""Turni di lavoro: colonne nullable per il registro campo-per-campo.

Revision ID: 0096
Revises: 0095
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0096"
down_revision = "0095"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Sezioni ISO 9001/Organizzazione/018_ana_turni_lavoro_nullable.sql"


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
        ALTER TABLE ana_turni_lavoro
            ALTER COLUMN presenza_turnazioni SET NOT NULL,
            ALTER COLUMN lavoro_notturno SET NOT NULL,
            ALTER COLUMN lavoro_festivo SET NOT NULL,
            ALTER COLUMN lavoro_ciclo_continuo SET NOT NULL
        """
    )
