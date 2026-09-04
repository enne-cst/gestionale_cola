"""Documenti personali multipli (modulo Personale, correzione "Completamento Dossier personale").

Revision ID: 0106
Revises: 0105
Create Date: 2026-09-05
"""

from pathlib import Path

from alembic import op

revision = "0106"
down_revision = "0105"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/019_documenti_personali_multipli.sql"


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
    op.execute("DROP TABLE IF EXISTS per_documenti_personali")
    op.execute("DROP TABLE IF EXISTS cat_tipi_documento_identita")
