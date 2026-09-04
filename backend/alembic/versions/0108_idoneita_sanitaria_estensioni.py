"""Estensioni idoneità sanitaria (modulo Personale, precisazione "Struttura di Idoneità sanitaria").

Revision ID: 0108
Revises: 0107
Create Date: 2026-09-05
"""

from pathlib import Path

from alembic import op

revision = "0108"
down_revision = "0107"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/021_idoneita_sanitaria_estensioni.sql"


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
    op.execute("ALTER TABLE per_attivita DROP COLUMN IF EXISTS medico_competente")
    op.execute("ALTER TABLE per_attivita DROP COLUMN IF EXISTS luogo")
    op.execute("ALTER TABLE per_giudizi_idoneita DROP COLUMN IF EXISTS tipo_visita_id")
    op.execute("ALTER TABLE per_giudizi_idoneita ADD COLUMN IF NOT EXISTS tipo_visita VARCHAR(200)")
    op.execute("DROP TABLE IF EXISTS cat_tipi_visita")
