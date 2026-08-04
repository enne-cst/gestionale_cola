"""Aggiunge l'ordine di visualizzazione personalizzabile a
sys_panoramica_voci, per permettere di riordinare le voci nella scheda
Panoramica.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-04
"""

from pathlib import Path

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/015_sys_panoramica_voci_ordine.sql"


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
    op.execute("ALTER TABLE sys_panoramica_voci DROP COLUMN IF EXISTS ordine;")
