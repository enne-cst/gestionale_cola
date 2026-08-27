"""Crea il catalogo cat_modalita_esercizio_poteri (Correzione 07, campo
"Modalità di esercizio dei poteri" della configurazione "Amministrazione
pluripersonale congiuntiva"): Congiuntiva secondo atto di nomina, Disgiuntiva
secondo atto di nomina, Mista, A maggioranza secondo atto di nomina. Pensato
per essere riutilizzato anche dalla successiva "Amministrazione
pluripersonale disgiuntiva".

Revision ID: 0048
Revises: 0047
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0048"
down_revision = "0047"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/018_cat_modalita_esercizio_poteri.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_modalita_esercizio_poteri_set_updated_at ON cat_modalita_esercizio_poteri")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_modalita_esercizio_poteri_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_modalita_esercizio_poteri")
