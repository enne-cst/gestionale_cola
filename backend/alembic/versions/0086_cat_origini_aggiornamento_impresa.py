"""Catalogo delle origini di aggiornamento impresa (Correzione 24, §4/§6).

Revision ID: 0086
Revises: 0085
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0086"
down_revision = "0085"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/043_cat_origini_aggiornamento_impresa.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_origini_aggiornamento_impresa_set_updated_at ON cat_origini_aggiornamento_impresa")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_origini_aggiornamento_impresa_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_origini_aggiornamento_impresa")
