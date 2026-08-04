"""Estende sys_panoramica_voci per supportare il pin di un intero record
delle sezioni a elenco, non solo di un campo delle sezioni singleton.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-04
"""

from pathlib import Path

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/014_sys_panoramica_voci_record.sql"


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
    op.execute("DROP INDEX IF EXISTS uq_sys_panoramica_voci_record;")
    op.execute("DROP INDEX IF EXISTS uq_sys_panoramica_voci_campo;")
    op.execute(
        "ALTER TABLE sys_panoramica_voci ADD CONSTRAINT uq_sys_panoramica_voci "
        "UNIQUE (azienda_id, modulo, sezione_slug, campo);"
    )
    op.execute("ALTER TABLE sys_panoramica_voci DROP COLUMN IF EXISTS record_id;")
    op.execute("ALTER TABLE sys_panoramica_voci ALTER COLUMN campo SET NOT NULL;")
