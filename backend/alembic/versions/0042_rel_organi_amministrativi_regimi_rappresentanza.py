"""Crea la relazione tra organi amministrativi e regimi di rappresentanza
(Correzione 05), con la sola associazione già certa: Amministratore unico ->
Rappresentanza generale attribuita all'amministratore unico. Le altre
associazioni verranno completate una configurazione alla volta.

Revision ID: 0042
Revises: 0041
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0042"
down_revision = "0041"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/014_rel_organi_amministrativi_regimi_rappresentanza.sql"


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
    op.execute("DROP TABLE IF EXISTS rel_organi_amministrativi_regimi_rappresentanza")
