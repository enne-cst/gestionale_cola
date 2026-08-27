"""Crea il catalogo cat_regimi_rappresentanza (Correzione 05, campo "Regime
di rappresentanza" della configurazione "Amministratore unico").

Revision ID: 0041
Revises: 0040
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0041"
down_revision = "0040"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/013_cat_regimi_rappresentanza.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_regimi_rappresentanza_set_updated_at ON cat_regimi_rappresentanza")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_regimi_rappresentanza_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_regimi_rappresentanza")
