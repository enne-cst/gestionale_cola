"""Crea cat_caratteristiche_incarico, il catalogo configurabile delle
caratteristiche A01-A56 utilizzabili nei ruoli/incarichi (A52-A56 aggiunte
per il ruolo SOCIO: tipo di soggetto, quota nominale, percentuale di
partecipazione, tipo di diritto, valore versato).

Revision ID: 0017
Revises: 0016
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/003_cat_caratteristiche_incarico.sql"


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
    op.execute("DROP TABLE IF EXISTS cat_caratteristiche_incarico CASCADE")
