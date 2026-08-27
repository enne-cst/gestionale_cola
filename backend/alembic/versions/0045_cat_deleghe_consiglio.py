"""Crea il catalogo cat_deleghe_consiglio (Correzione 06, campo "Deleghe
del consiglio" della configurazione "Consiglio di amministrazione").

Revision ID: 0045
Revises: 0044
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0045"
down_revision = "0044"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/016_cat_deleghe_consiglio.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_deleghe_consiglio_set_updated_at ON cat_deleghe_consiglio")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_deleghe_consiglio_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_deleghe_consiglio")
