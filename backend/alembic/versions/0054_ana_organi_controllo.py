"""Correzione 11: crea ana_organi_controllo, tabella singleton delle
"Impostazioni generali" della sezione Organi di controllo (card "Sindaci"):
assetto di controllo in carica (FK cat_assetti_controllo), numero
componenti, titolo della nomina (FK cat_titoli_nomina_organo_controllo).
Sezione ora indipendente da ana_amministrazione_controllo, che restava
finora condivisa (senza configurazione propria) dalla card "Sindaci".

Revision ID: 0054
Revises: 0053
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0054"
down_revision = "0053"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/041_ana_organi_controllo.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_organi_controllo")
