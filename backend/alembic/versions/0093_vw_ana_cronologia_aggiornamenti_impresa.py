"""Vista aggregata della cronologia "Aggiornamento impresa" (Correzione 24, §7).

Revision ID: 0093
Revises: 0092
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0093"
down_revision = "0092"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/054_vw_ana_cronologia_aggiornamenti_impresa.sql"


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
    op.execute("DROP VIEW IF EXISTS vw_ana_cronologia_aggiornamenti_impresa")
