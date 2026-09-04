"""Estensioni formazione/abilitazioni (modulo Personale, correzione "Struttura di Formazione e abilitazioni").

Revision ID: 0107
Revises: 0106
Create Date: 2026-09-05
"""

from pathlib import Path

from alembic import op

revision = "0107"
down_revision = "0106"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/020_estensioni_formazione_abilitazioni.sql"


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
    op.execute("ALTER TABLE per_abilitazioni DROP CONSTRAINT IF EXISTS chk_per_abilitazioni_durata_positiva")
    op.execute("ALTER TABLE per_abilitazioni DROP COLUMN IF EXISTS durata_ore")
    op.execute("ALTER TABLE cat_corsi_formazione DROP COLUMN IF EXISTS obbligatorio")
    op.execute("ALTER TABLE cat_abilitazioni DROP COLUMN IF EXISTS obbligatorio")
    op.execute("ALTER TABLE cat_abilitazioni DROP COLUMN IF EXISTS soglia_preavviso_giorni")
