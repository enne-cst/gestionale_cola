"""Correzione 16: aggiunge a per_incarichi il supporto per un titolare
persona giuridica (persona_id nullable + nuova persona_giuridica_id, con
vincolo di esclusività) — usato dalla configurazione "Società di revisione
legale".

Revision ID: 0062
Revises: 0061
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0062"
down_revision = "0061"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/009_per_incarichi_persona_giuridica.sql"


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
        "ALTER TABLE per_incarichi "
        "DROP CONSTRAINT IF EXISTS chk_per_incarichi_titolare_esclusivo, "
        "DROP CONSTRAINT IF EXISTS fk_per_incarichi_persona_giuridica, "
        "DROP COLUMN IF EXISTS persona_giuridica_id"
    )
    op.execute("ALTER TABLE per_incarichi ALTER COLUMN persona_id SET NOT NULL")
