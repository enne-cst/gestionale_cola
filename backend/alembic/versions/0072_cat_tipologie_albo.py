"""Crea il catalogo cat_tipologie_albo (Correzione 21, punto 2, form
"Aggiungi albo") — nato vuoto in attesa di un elenco ufficiale verificato.

Revision ID: 0072
Revises: 0071
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0072"
down_revision = "0071"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/032_cat_tipologie_albo.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_tipologie_albo_set_updated_at ON cat_tipologie_albo")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_tipologie_albo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_tipologie_albo")
