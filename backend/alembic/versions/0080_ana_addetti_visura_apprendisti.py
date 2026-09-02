"""Aggiunge la percentuale "Apprendisti" alla distribuzione per
inquadramento di "Addetti da visura" (Correzione 22, Personale e
occupazione), mancante nello schema originario (solo Operai/Impiegati).

Revision ID: 0080
Revises: 0079
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0080"
down_revision = "0079"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/048_ana_addetti_visura_apprendisti.sql"


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
        "ALTER TABLE ana_addetti_visura_periodi "
        "DROP CONSTRAINT IF EXISTS chk_ana_addetti_percentuale_apprendisti"
    )
    op.execute("ALTER TABLE ana_addetti_visura_periodi DROP COLUMN IF EXISTS percentuale_apprendisti")
