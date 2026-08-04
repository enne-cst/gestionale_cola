"""Aggiunge sys_panoramica_voci (configurazione campi mostrati nella scheda
Panoramica di un modulo).

Segue la convenzione descritta in 0001: nuova tabella come file .sql
numerato nella cartella di categoria (Sistema), eseguito da una revisione
Alembic dedicata, senza toccare la baseline gia' applicata.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-04
"""

from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/013_sys_panoramica_voci.sql"


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
    op.execute("DROP TABLE IF EXISTS sys_panoramica_voci;")
