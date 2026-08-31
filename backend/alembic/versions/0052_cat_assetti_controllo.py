"""Crea il catalogo cat_assetti_controllo (Correzione 11, campo "Assetto di
controllo in carica" della nuova sezione Organi di controllo, card
"Sindaci"): Nessun organo di controllo o revisore, Sindaco unico, Collegio
sindacale, Revisore legale persona fisica, Società di revisione legale,
Sindaco unico + revisore esterno, Collegio sindacale + revisore esterno.

Revision ID: 0052
Revises: 0051
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0052"
down_revision = "0051"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/020_cat_assetti_controllo.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_assetti_controllo_set_updated_at ON cat_assetti_controllo")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_assetti_controllo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_assetti_controllo")
