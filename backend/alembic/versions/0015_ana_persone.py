"""Crea ana_persone (anagrafica unica del modulo Personale) e il catalogo
cat_livelli_sintetici_personale, come fonte autorevole per sostituire
per_persone (rimossa in 0022).

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/001_ana_persone.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_persone CASCADE")
    op.execute("DROP TABLE IF EXISTS cat_livelli_sintetici_personale CASCADE")
