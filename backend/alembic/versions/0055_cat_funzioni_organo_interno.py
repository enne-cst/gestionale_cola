"""Crea il catalogo cat_funzioni_organo_interno (Correzione 13, campo
"Funzioni dell'organo interno" della configurazione "Sindaco unico"):
Vigilanza sulla gestione, Vigilanza sulla gestione e revisione legale,
Competenze definite dall'atto costitutivo.

Revision ID: 0055
Revises: 0054
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0055"
down_revision = "0054"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/022_cat_funzioni_organo_interno.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_funzioni_organo_interno_set_updated_at ON cat_funzioni_organo_interno")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_funzioni_organo_interno_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_funzioni_organo_interno")
