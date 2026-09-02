"""Crea il catalogo cat_norme_certificazione (Correzione 21, punto 5.1,
sotto-form "Certificazione di sistema") — nato vuoto, non duplica
cat_certificazioni.

Revision ID: 0076
Revises: 0075
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0076"
down_revision = "0075"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/036_cat_norme_certificazione.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_norme_certificazione_set_updated_at ON cat_norme_certificazione")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_norme_certificazione_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_norme_certificazione")
