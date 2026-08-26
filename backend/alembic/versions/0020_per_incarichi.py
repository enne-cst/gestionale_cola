"""Crea per_incarichi/per_incarichi_valori (motore generico ruolo +
caratteristiche), sostituto delle tabelle qual_* (rimosse in 0021/0022).

Revision ID: 0020
Revises: 0019
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/006_per_incarichi.sql"


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
    op.execute("DROP TABLE IF EXISTS per_incarichi_valori CASCADE")
    op.execute("DROP TABLE IF EXISTS per_incarichi CASCADE")
