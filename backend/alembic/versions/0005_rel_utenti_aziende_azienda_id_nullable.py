"""Rende azienda_id opzionale in rel_utenti_aziende, per rappresentare
ruoli non legati a una singola azienda (Consulente, Super Admin).

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-04
"""

from pathlib import Path

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/016_rel_utenti_aziende_azienda_id_nullable.sql"


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
    op.execute("ALTER TABLE rel_utenti_aziende ALTER COLUMN azienda_id SET NOT NULL;")
