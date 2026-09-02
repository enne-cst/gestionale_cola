"""Crea il catalogo delle tipologie di unità locale (Correzione 23, card
"Sedi secondarie e unità locali"), seminato con gli 11 valori elencati
esplicitamente nella correzione.

Revision ID: 0081
Revises: 0080
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0081"
down_revision = "0080"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/039_cat_tipologie_unita_locale.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_tipologie_unita_locale_set_updated_at ON cat_tipologie_unita_locale")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_tipologie_unita_locale_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_tipologie_unita_locale")
