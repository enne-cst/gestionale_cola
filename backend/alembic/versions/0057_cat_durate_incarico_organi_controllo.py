"""Crea il catalogo cat_durate_incarico_organi_controllo (Correzione 13,
campo "Durata dell'incarico" della configurazione "Sindaco unico"): Fino
all'approvazione del bilancio, Tre esercizi, Fino a revoca o cessazione,
Altra durata risultante dall'atto di nomina.

Revision ID: 0057
Revises: 0056
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0057"
down_revision = "0056"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/024_cat_durate_incarico_organi_controllo.sql"


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
        "DROP TRIGGER IF EXISTS trg_cat_durate_incarico_organi_controllo_set_updated_at "
        "ON cat_durate_incarico_organi_controllo"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_cat_durate_incarico_organi_controllo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_durate_incarico_organi_controllo")
