"""Rimuove da ana_statuto_rev2 due campi non previsti dal catalogo
definitivo della card "Informazioni da statuto/atto costitutivo"
(sezione_ordinaria, sezione_titolarita_effettiva) — correzione segnalata
dall'utente, tabella creata nella stessa sessione e mai popolata in
produzione.

Revision ID: 0034
Revises: 0033
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0034"
down_revision = "0033"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/034_ana_statuto_rev2_correzione.sql"


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
        "ALTER TABLE ana_statuto_rev2 "
        "ADD COLUMN IF NOT EXISTS sezione_ordinaria VARCHAR(255), "
        "ADD COLUMN IF NOT EXISTS sezione_titolarita_effettiva VARCHAR(255)"
    )
