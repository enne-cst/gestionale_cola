"""Importazioni di visure CCIAA, tabella indicativa (Correzione 24, §5).

Revision ID: 0088
Revises: 0087
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0088"
down_revision = "0087"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/023_sys_importazioni_visure_cciaa.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_sys_importazioni_visure_cciaa_set_updated_at ON sys_importazioni_visure_cciaa")
    op.execute("DROP FUNCTION IF EXISTS fn_sys_importazioni_visure_cciaa_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS sys_importazioni_visure_cciaa")
