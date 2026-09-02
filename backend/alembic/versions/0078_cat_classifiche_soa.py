"""Crea il catalogo cat_classifiche_soa (Correzione 21, punto 5.2,
sotto-form "Attestazione SOA") — 11 classifiche I..VIII, seminate subito
(elenco stabile, basso rischio di errore).

Revision ID: 0078
Revises: 0077
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0078"
down_revision = "0077"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/038_cat_classifiche_soa.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_classifiche_soa_set_updated_at ON cat_classifiche_soa")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_classifiche_soa_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_classifiche_soa")
