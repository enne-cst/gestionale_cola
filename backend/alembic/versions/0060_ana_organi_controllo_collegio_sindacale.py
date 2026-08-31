"""Correzione 14: aggiunge a ana_organi_controllo la colonna della
configurazione "Collegio sindacale" (sindaci effettivi, vincolata a 3 o 5
via CHECK — nessun catalogo). "Sindaci supplenti" e "Numero componenti"
non hanno colonna propria, calcolati lato backend.

Revision ID: 0060
Revises: 0059
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0060"
down_revision = "0059"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/043_ana_organi_controllo_collegio_sindacale.sql"


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
        "ALTER TABLE ana_organi_controllo "
        "DROP CONSTRAINT IF EXISTS chk_ana_organi_controllo_sindaci_effettivi, "
        "DROP COLUMN IF EXISTS sindaci_effettivi"
    )
