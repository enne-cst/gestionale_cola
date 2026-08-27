"""Correzione 06: aggiunge alla relazione organi<->regimi di
rappresentanza (migrazione 0038/014) l'associazione Consiglio di
amministrazione -> Rappresentanza attribuita al presidente e ai
consiglieri delegati.

Revision ID: 0046
Revises: 0045
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0046"
down_revision = "0045"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/017_rel_organi_amministrativi_regimi_rappresentanza_cda.sql"


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
        "DELETE FROM rel_organi_amministrativi_regimi_rappresentanza "
        "WHERE organo_amministrativo_id = (SELECT id FROM cat_organi_amministrativi WHERE codice = 'CONSIGLIO_AMMINISTRAZIONE') "
        "AND regime_rappresentanza_id = (SELECT id FROM cat_regimi_rappresentanza WHERE codice = 'RAPPRESENTANZA_PRESIDENTE_CONSIGLIERI_DELEGATI')"
    )
