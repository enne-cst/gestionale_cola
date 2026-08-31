"""Correzione 16: crea ana_persone_giuridiche, l'anagrafica delle persone
giuridiche (società, enti) usata come titolare alternativo di un incarico
per i ruoli affidabili a un soggetto esterno (es. "Società di revisione
legale").

Revision ID: 0061
Revises: 0060
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0061"
down_revision = "0060"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/008_ana_persone_giuridiche.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_persone_giuridiche")
    op.execute("DROP FUNCTION IF EXISTS fn_ana_persone_giuridiche_set_updated_at")
