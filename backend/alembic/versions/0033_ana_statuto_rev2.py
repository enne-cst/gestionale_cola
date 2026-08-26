"""Crea ana_statuto_rev2 (pilota): replica 1:1 i 14 campi della card
"Informazioni da statuto/atto costitutivo" del prototipo HTML 25-08-26 in
un'unica tabella dedicata, stesso criterio validato con ana_sede_rev2
(0032). Tabella sperimentale, non ancora collegata a modelli/API/frontend
al momento della creazione del file SQL (collegati nella stessa sessione,
vedi registro_campi.py::SEZIONE_STATUTO).

Revision ID: 0033
Revises: 0032
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0033"
down_revision = "0032"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/033_ana_statuto_rev2.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_statuto_rev2 CASCADE")
