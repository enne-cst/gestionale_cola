"""Crea il catalogo cat_organi_amministrativi (Correzione 04, campo "Organo
amministrativo in carica" della sezione Amministratori/Amministrazione e
controllo): Amministratore unico, Consiglio di amministrazione,
Amministrazione pluripersonale congiuntiva, Amministrazione pluripersonale
disgiuntiva.

Revision ID: 0038
Revises: 0037
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0038"
down_revision = "0037"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/011_cat_organi_amministrativi.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_organi_amministrativi_set_updated_at ON cat_organi_amministrativi")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_organi_amministrativi_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_organi_amministrativi")
