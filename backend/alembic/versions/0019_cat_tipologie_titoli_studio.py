"""Crea cat_tipologie_titoli_studio (catalogo tipologie titolo di studio,
modulo Personale). File sorgente invariato, wired qui in Alembic.

Revision ID: 0019
Revises: 0018
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/005_cat_tipologie_titoli_studio.sql"


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
    op.execute("DROP TABLE IF EXISTS cat_tipologie_titoli_studio CASCADE")
