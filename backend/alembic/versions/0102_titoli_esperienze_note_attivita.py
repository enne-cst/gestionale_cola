"""Titoli di studio, esperienze, note e scadenziario (modulo Personale).

Revision ID: 0102
Revises: 0101
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0102"
down_revision = "0101"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/015_titoli_esperienze_note_attivita.sql"


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
    op.execute("DROP TABLE IF EXISTS per_attivita")
    op.execute("DROP TABLE IF EXISTS per_note")
    op.execute("DROP TABLE IF EXISTS per_esperienze")
    op.execute("DROP TABLE IF EXISTS per_titoli_studio_persona")
