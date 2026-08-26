"""Completa ana_sistemi_amministrazione con il dettaglio degli organi
amministrativi previsti dallo statuto (mappatura CCIAA §2.4.4): numero
minimo/massimo componenti, regole decisionali, deleghe previste, regime di
rappresentanza, gestione dell'opposizione, flag "in carica".

Revision ID: 0025
Revises: 0024
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0025"
down_revision = "0024"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/025_ana_sistemi_amministrazione_dettaglio.sql"


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
    op.execute("ALTER TABLE ana_sistemi_amministrazione DROP CONSTRAINT IF EXISTS chk_ana_sistemi_amministrazione_componenti")
    op.execute(
        "ALTER TABLE ana_sistemi_amministrazione "
        "DROP COLUMN IF EXISTS numero_minimo_componenti, "
        "DROP COLUMN IF EXISTS numero_massimo_componenti, "
        "DROP COLUMN IF EXISTS regole_decisionali, "
        "DROP COLUMN IF EXISTS deleghe_previste, "
        "DROP COLUMN IF EXISTS regime_rappresentanza, "
        "DROP COLUMN IF EXISTS gestione_opposizione, "
        "DROP COLUMN IF EXISTS in_carica"
    )
