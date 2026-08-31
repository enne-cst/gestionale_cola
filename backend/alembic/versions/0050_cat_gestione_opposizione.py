"""Crea il catalogo cat_gestione_opposizione (Correzione 08, campo
"Gestione dell'opposizione" della configurazione "Amministrazione
pluripersonale disgiuntiva"): Decisione rimessa ai soci, Regola specifica
prevista dallo statuto.

Revision ID: 0050
Revises: 0049
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0050"
down_revision = "0049"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/019_cat_gestione_opposizione.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_gestione_opposizione_set_updated_at ON cat_gestione_opposizione")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_gestione_opposizione_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_gestione_opposizione")
