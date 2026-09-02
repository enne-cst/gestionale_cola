"""Crea il catalogo cat_stati_attivita (Correzione 19, prima parte della
card "Attività, albi, ruoli e licenze": campo "Stato attività" della nuova
sezione "Attività economica"). Nasce vuoto per scelta esplicita
dell'utente: le opzioni si aggiungono dopo l'analisi dei valori reali
presenti nelle visure.

Revision ID: 0064
Revises: 0063
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0064"
down_revision = "0063"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/026_cat_stati_attivita.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_cat_stati_attivita_set_updated_at ON cat_stati_attivita")
    op.execute("DROP FUNCTION IF EXISTS fn_cat_stati_attivita_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_stati_attivita")
