"""Richiesta esplicita (31/08/2026): "Numero dei soci" diventa una capienza
modificabile sincronizzata con la tabella soci, stesso comportamento già
applicato a "Numero componenti" dell'organo amministrativo pluripersonale
— aggiunge la colonna numero_soci a ana_elenco_soci_estremi.

Revision ID: 0063
Revises: 0062
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0063"
down_revision = "0062"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/044_ana_elenco_soci_estremi_numero_soci_modificabile.sql"


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
    op.execute("ALTER TABLE ana_elenco_soci_estremi DROP COLUMN IF EXISTS numero_soci")
