"""Popola cat_titoli_nomina_organo_controllo (creato vuoto dalla migrazione
0053/Correzione 11) con i 4 valori richiesti dalla Correzione 13: Non
indicato nella visura, Nomina volontaria prevista dall'atto costitutivo,
Nomina obbligatoria per legge, Nomina disposta dal tribunale.

Revision ID: 0058
Revises: 0057
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0058"
down_revision = "0057"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/025_cat_titoli_nomina_organo_controllo_valori.sql"


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
        "DELETE FROM cat_titoli_nomina_organo_controllo WHERE codice IN ("
        "'NON_INDICATO_VISURA', 'NOMINA_VOLONTARIA_ATTO_COSTITUTIVO', "
        "'NOMINA_OBBLIGATORIA_LEGGE', 'NOMINA_DISPOSTA_TRIBUNALE')"
    )
