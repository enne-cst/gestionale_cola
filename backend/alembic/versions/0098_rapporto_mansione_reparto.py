"""Rapporto aziendale, mansione e reparto (modulo Personale).

Revision ID: 0098
Revises: 0097
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0098"
down_revision = "0097"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/011_rapporto_mansione_reparto.sql"


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
    op.execute("DROP TABLE IF EXISTS per_rapporti_azienda")
    op.execute("DROP TABLE IF EXISTS cat_reparti")
    op.execute("DROP TABLE IF EXISTS cat_mansioni")
    op.execute("DROP TABLE IF EXISTS cat_tipi_rapporto")
