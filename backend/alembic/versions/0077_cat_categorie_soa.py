"""Crea il catalogo cat_categorie_soa (Correzione 21, punto 5.2, sotto-form
"Attestazione SOA") — nato vuoto in attesa di un import verificato
dell'elenco ufficiale OG/OS.

Revision ID: 0077
Revises: 0076
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0077"
down_revision = "0076"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/037_cat_categorie_soa.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_categorie_soa_set_updated_at ON cat_categorie_soa")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_categorie_soa_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_categorie_soa")
