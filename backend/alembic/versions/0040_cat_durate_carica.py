"""Crea il catalogo cat_durate_carica (Correzione 05, campo "Durata in
carica" della configurazione "Amministratore unico"): A tempo indeterminato,
Fino a revoca, Per un numero determinato di esercizi, Fino a una data
stabilita.

Revision ID: 0040
Revises: 0039
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0040"
down_revision = "0039"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/012_cat_durate_carica.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_durate_carica_set_updated_at ON cat_durate_carica")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_durate_carica_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_durate_carica")
