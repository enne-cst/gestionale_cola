"""Crea il catalogo cat_stati_titoli_abilitativi (Correzione 21, punto 1):
"Stato del titolo" comune ai 4 form della tabella unificata "Albi, ruoli,
licenze e certificazioni", distinto dalla verifica del consulente.

Revision ID: 0071
Revises: 0070
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0071"
down_revision = "0070"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/031_cat_stati_titoli_abilitativi.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_stati_titoli_abilitativi_set_updated_at ON cat_stati_titoli_abilitativi")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_stati_titoli_abilitativi_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_stati_titoli_abilitativi")
