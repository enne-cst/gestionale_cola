"""Crea ana_sede_rev2 (pilota): replica 1:1 i 12 campi della card "Sede"
del prototipo HTML 25-08-26 (indirizzo/comune/provincia/CAP/nazione, PEC,
partita IVA, codice fiscale, REA, camera di commercio, trasferimento da
altra provincia) in un'unica tabella dedicata, per verificare se questo
raggruppamento rende la grafica fedele al prototipo. Tabella sperimentale,
non ancora collegata a modelli/API/frontend.

Revision ID: 0032
Revises: 0031
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0032"
down_revision = "0031"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/032_ana_sede_rev2.sql"


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
    op.execute("DROP TABLE IF EXISTS ana_sede_rev2 CASCADE")
