"""Crea il catalogo cat_affidatari_revisione_legale (Correzione 13, campo
"Revisione legale affidata a", condiviso da tutte le configurazioni della
sezione Organi di controllo): Non attribuita, Sindaco unico, Collegio
sindacale, Revisore legale persona fisica, Società di revisione legale.

Revision ID: 0056
Revises: 0055
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0056"
down_revision = "0055"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/023_cat_affidatari_revisione_legale.sql"


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
    op.execute(
        "DROP TRIGGER IF EXISTS trg_cat_affidatari_revisione_legale_set_updated_at ON cat_affidatari_revisione_legale"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_cat_affidatari_revisione_legale_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_affidatari_revisione_legale")
