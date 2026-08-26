"""Crea ana_elenco_soci_estremi: estremi di testata dell'elenco soci
depositato (data riferimento/atto/deposito/protocollo, numero protocollo,
capitale sociale dichiarato) — mappatura CCIAA §4.2, 1:1 con l'azienda.

Revision ID: 0030
Revises: 0029
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0030"
down_revision = "0029"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/030_ana_elenco_soci_estremi.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_elenco_soci_estremi CASCADE")
