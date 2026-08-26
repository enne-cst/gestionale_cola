"""A02 "Data cessazione" passa da OBBLIGATORIA a FACOLTATIVA per tutti i 35
ruoli: non ha senso richiederla in creazione per un incarico ancora attivo.

Revision ID: 0023
Revises: 0022
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0023"
down_revision = "0022"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/006_rel_ruoli_caratteristiche_a02_facoltativa.sql"


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
        "UPDATE rel_ruoli_caratteristiche SET obbligatorieta = 'OBBLIGATORIA' "
        "WHERE caratteristica_id = (SELECT id FROM cat_caratteristiche_incarico WHERE codice = 'A02')"
    )
