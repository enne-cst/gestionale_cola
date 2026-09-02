"""Crea il catalogo cat_tipologie_ruolo (Correzione 21, punto 3, form
"Aggiungi ruolo") — nato vuoto in attesa di un elenco ufficiale verificato.

Revision ID: 0073
Revises: 0072
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0073"
down_revision = "0072"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/033_cat_tipologie_ruolo.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_tipologie_ruolo_set_updated_at ON cat_tipologie_ruolo")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_tipologie_ruolo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_tipologie_ruolo")
