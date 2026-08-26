"""Completa ana_sedi con toponimo/indirizzo originale (sezione Sede) e con
numero REA unità/data chiusura/stato/sigla territoriale/numero progressivo
(sezione Sedi secondarie e unità locali) — mappatura CCIAA §1.1/§10.2.

Revision ID: 0026
Revises: 0025
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/026_ana_sedi_dettaglio_indirizzo_unita.sql"


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
    op.execute("ALTER TABLE ana_sedi DROP CONSTRAINT IF EXISTS chk_ana_sedi_date_apertura_chiusura")
    op.execute(
        "ALTER TABLE ana_sedi "
        "DROP COLUMN IF EXISTS toponimo, "
        "DROP COLUMN IF EXISTS indirizzo_originale, "
        "DROP COLUMN IF EXISTS numero_rea_unita, "
        "DROP COLUMN IF EXISTS data_chiusura, "
        "DROP COLUMN IF EXISTS stato, "
        "DROP COLUMN IF EXISTS sigla_territoriale, "
        "DROP COLUMN IF EXISTS numero_progressivo"
    )
