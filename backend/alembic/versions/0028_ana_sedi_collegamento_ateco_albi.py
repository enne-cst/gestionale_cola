"""Aggiunge sede_id opzionale su ana_codici_ateco e ana_albi_ruoli_licenze,
per collegare classificazioni ATECO e albi/licenze a una specifica unità
locale invece che all'intera azienda (mappatura CCIAA §10.2).

Revision ID: 0028
Revises: 0027
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/028_ana_sedi_collegamento_ateco_albi.sql"


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
    op.execute("DROP INDEX IF EXISTS idx_ana_codici_ateco_sede")
    op.execute("ALTER TABLE ana_codici_ateco DROP CONSTRAINT IF EXISTS fk_ana_codici_ateco_sede")
    op.execute("ALTER TABLE ana_codici_ateco DROP COLUMN IF EXISTS sede_id")
    op.execute("DROP INDEX IF EXISTS idx_ana_albi_ruoli_licenze_sede")
    op.execute("ALTER TABLE ana_albi_ruoli_licenze DROP CONSTRAINT IF EXISTS fk_ana_albi_ruoli_licenze_sede")
    op.execute("ALTER TABLE ana_albi_ruoli_licenze DROP COLUMN IF EXISTS sede_id")
