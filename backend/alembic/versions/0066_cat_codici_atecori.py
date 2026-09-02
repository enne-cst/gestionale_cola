"""Crea il catalogo cat_codici_atecori (Correzione 19, prima parte della
card "Attività, albi, ruoli e licenze": campo "ATECORI 2007-2022" della
nuova sezione "Attività economica"). Nasce vuoto: da popolare con un import
dedicato, fuori dallo scopo di questa correzione.

Revision ID: 0066
Revises: 0065
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0066"
down_revision = "0065"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/028_cat_codici_atecori.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_codici_atecori_set_updated_at ON cat_codici_atecori")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_codici_atecori_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_codici_atecori")
