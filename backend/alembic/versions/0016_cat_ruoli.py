"""Crea cat_ruoli, il catalogo estendibile dei ruoli/incarichi del modulo
Personale (34 ruoli iniziali + SOCIO/R035 per le partecipazioni camerali).

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/002_cat_ruoli.sql"


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
    op.execute("DROP TABLE IF EXISTS cat_ruoli CASCADE")
