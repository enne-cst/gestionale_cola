"""Correzione 04: "Organo amministrativo in carica" diventa una chiave
esterna a cat_organi_amministrativi invece di testo libero, su
ana_amministrazione_controllo.

Revision ID: 0039
Revises: 0038
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0039"
down_revision = "0038"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/036_ana_amministrazione_controllo_organo_fk.sql"


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
    op.execute("ALTER TABLE ana_amministrazione_controllo ADD COLUMN IF NOT EXISTS organo_amministrativo_in_carica VARCHAR(255)")
    op.execute("ALTER TABLE ana_amministrazione_controllo DROP COLUMN IF EXISTS organo_amministrativo_id")
