"""Allinea ana_elenco_soci_estremi alla card "Soci e titolari di diritti su
azioni e quote" del prototipo HTML: rimuove data_atto/data_protocollo (non
previsti dal catalogo confermato dall'utente) e capitale_sociale_dichiarato
(diventa un campo derivato da ana_capitale_sociale.capitale_sottoscritto,
non più una colonna propria). Tabella mai popolata in produzione.

Revision ID: 0035
Revises: 0034
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0035"
down_revision = "0034"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/035_ana_elenco_soci_estremi_correzione.sql"


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
        "ALTER TABLE ana_elenco_soci_estremi "
        "ADD COLUMN IF NOT EXISTS data_atto DATE, "
        "ADD COLUMN IF NOT EXISTS data_protocollo DATE, "
        "ADD COLUMN IF NOT EXISTS capitale_sociale_dichiarato NUMERIC(15,2)"
    )
