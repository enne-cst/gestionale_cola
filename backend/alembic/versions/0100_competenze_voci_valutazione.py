"""Conoscenza, competenza e consapevolezza: catalogo voci, fonti e valutazioni (modulo Personale).

Revision ID: 0100
Revises: 0099
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0100"
down_revision = "0099"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/013_competenze_voci_valutazione.sql"


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
    op.execute("DROP TABLE IF EXISTS per_valutazioni_personale_dettagli")
    op.execute("DROP TABLE IF EXISTS per_valutazioni_personale")
    op.execute("DROP TABLE IF EXISTS rel_persone_voci_nascoste")
    op.execute("DROP TABLE IF EXISTS per_voci_valutazione_personali")
    op.execute("DROP TABLE IF EXISTS rel_azienda_voci_valutazione")
    op.execute("DROP TABLE IF EXISTS rel_mansioni_voci_valutazione")
    op.execute("ALTER TABLE rel_ruoli_voci_valutazione DROP CONSTRAINT IF EXISTS fk_rel_ruoli_voci_valutazione_voce")
    op.execute("DROP TABLE IF EXISTS cat_voci_valutazione_personale")
