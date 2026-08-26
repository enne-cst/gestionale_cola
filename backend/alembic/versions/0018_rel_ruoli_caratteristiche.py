"""Crea rel_ruoli_caratteristiche, la configurazione delle caratteristiche
richieste per ciascun ruolo (incluso SOCIO/R035).

Revision ID: 0018
Revises: 0017
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/004_rel_ruoli_caratteristiche.sql"


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
    op.execute("DROP TABLE IF EXISTS rel_ruoli_caratteristiche CASCADE")
