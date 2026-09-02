"""Variazioni di sede legale, tabella indicativa (Correzione 24, §2).

Revision ID: 0091
Revises: 0090
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0091"
down_revision = "0090"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/052_ana_variazioni_sede_legale.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_ana_variazioni_sede_legale_set_updated_at ON ana_variazioni_sede_legale")
    op.execute("DROP FUNCTION IF EXISTS fn_ana_variazioni_sede_legale_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS ana_variazioni_sede_legale")
