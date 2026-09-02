"""Crea il catalogo cat_macro_tipologie_titoli_abilitativi (Correzione 20,
seconda parte della card "Attività, albi, ruoli e licenze"): 4 macro-
tipologie (ALBO/RUOLO/LICENZA/CERTIFICAZIONE_ATTESTAZIONE) per la nuova
tabella unificata "Albi, ruoli, licenze e certificazioni".

Revision ID: 0069
Revises: 0068
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0069"
down_revision = "0068"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/030_cat_macro_tipologie_titoli_abilitativi.sql"


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
        "DROP TRIGGER IF EXISTS trg_cat_macro_tipologie_titoli_abilitativi_set_updated_at "
        "ON cat_macro_tipologie_titoli_abilitativi"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_cat_macro_tipologie_titoli_abilitativi_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS cat_macro_tipologie_titoli_abilitativi")
