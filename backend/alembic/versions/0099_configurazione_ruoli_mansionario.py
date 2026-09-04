"""Configurazione aziendale del ruolo, mansionario e voci base (modulo Personale).

Revision ID: 0099
Revises: 0098
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0099"
down_revision = "0098"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/012_configurazione_ruoli_mansionario.sql"


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
    op.execute("DROP TABLE IF EXISTS rel_ruoli_voci_valutazione")
    op.execute("DROP TABLE IF EXISTS cfg_ruoli_mansionario_voci")
    op.execute("DROP TABLE IF EXISTS cfg_ruoli_azienda")
