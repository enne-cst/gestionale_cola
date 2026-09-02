"""Crea il catalogo cat_tipologie_certificazione_attestazione (Correzione
21, punto 5): 3 configurazioni iniziali (Certificazione di sistema/
Attestazione SOA/Altra) che determinano il sotto-form mostrato.

Revision ID: 0075
Revises: 0074
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0075"
down_revision = "0074"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/035_cat_tipologie_certificazione_attestazione.sql"


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
        "DROP TRIGGER IF EXISTS trg_cat_tipologie_certificazione_attestazione_set_updated_at "
        "ON cat_tipologie_certificazione_attestazione"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_cat_tipologie_certificazione_attestazione_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_tipologie_certificazione_attestazione")
