"""Crea (vuoto) il catalogo cat_titoli_nomina_organo_controllo (Correzione
11, campo "Titolo della nomina" della sezione Organi di controllo): le
opzioni sono rimandate esplicitamente a una correzione successiva, questa
migrazione crea solo la struttura.

Revision ID: 0053
Revises: 0052
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0053"
down_revision = "0052"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/021_cat_titoli_nomina_organo_controllo.sql"


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
        "DROP TRIGGER IF EXISTS trg_cat_titoli_nomina_organo_controllo_set_updated_at "
        "ON cat_titoli_nomina_organo_controllo"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_cat_titoli_nomina_organo_controllo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_titoli_nomina_organo_controllo")
