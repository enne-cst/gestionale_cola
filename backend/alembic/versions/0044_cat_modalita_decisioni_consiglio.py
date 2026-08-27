"""Crea il catalogo cat_modalita_decisioni_consiglio (Correzione 06, campo
"Modalità delle decisioni del consiglio" della configurazione "Consiglio di
amministrazione"): Riunione collegiale, Consultazione scritta prevista
dallo statuto, Consenso espresso per iscritto previsto dallo statuto.

Revision ID: 0044
Revises: 0043
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0044"
down_revision = "0043"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/015_cat_modalita_decisioni_consiglio.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_modalita_decisioni_consiglio_set_updated_at ON cat_modalita_decisioni_consiglio")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_modalita_decisioni_consiglio_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_modalita_decisioni_consiglio")
