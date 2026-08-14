"""Aggiunge sys_registro_audit (log minimo delle azioni per campo del
registro: modifica valore, auto-pending, verifica, revisione, visibilita').

Revision ID: 0013
Revises: 0012
Create Date: 2026-08-14
"""

from pathlib import Path

from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/022_sys_registro_audit.sql"


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
    op.execute("DROP TABLE IF EXISTS sys_registro_audit")
