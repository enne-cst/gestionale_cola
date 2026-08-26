"""Completa ana_identificazione_camerale con il blocco "Trasferimento da
altra provincia" (§1.4) e gli indicatori "L'impresa in cifre" mancanti
(§0.4): pratiche ultimi 12 mesi, trasferimenti quote/sede, partecipazioni
in altre società.

Revision ID: 0029
Revises: 0028
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0029"
down_revision = "0028"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/029_ana_identificazione_camerale_trasferimento_e_cifre.sql"


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
    op.execute("ALTER TABLE ana_identificazione_camerale DROP CONSTRAINT IF EXISTS chk_ana_identificazione_impresa_cifre")
    op.execute(
        "ALTER TABLE ana_identificazione_camerale "
        "DROP COLUMN IF EXISTS provincia_provenienza, "
        "DROP COLUMN IF EXISTS numero_rea_precedente, "
        "DROP COLUMN IF EXISTS data_trasferimento_provincia, "
        "DROP COLUMN IF EXISTS pratiche_ultimi_12_mesi, "
        "DROP COLUMN IF EXISTS trasferimenti_quote, "
        "DROP COLUMN IF EXISTS trasferimenti_sede, "
        "DROP COLUMN IF EXISTS partecipazioni_altre_societa"
    )
