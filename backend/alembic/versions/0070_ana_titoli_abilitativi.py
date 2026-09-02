"""Crea la tabella principale ana_titoli_abilitativi_azienda e le 4
strutture di dettaglio (albo/ruolo/licenza/certificazione) per la tabella
unificata "Albi, ruoli, licenze e certificazioni" (Correzione 20, seconda
parte della card "Attività, albi, ruoli e licenze").

Revision ID: 0070
Revises: 0069
Create Date: 2026-09-03
"""

from pathlib import Path

from alembic import op

revision = "0070"
down_revision = "0069"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/046_ana_titoli_abilitativi.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_certificazione_set_updated_at ON ana_titoli_abilitativi_dettaglio_certificazione")
    op.execute("DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_licenza_set_updated_at ON ana_titoli_abilitativi_dettaglio_licenza")
    op.execute("DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_ruolo_set_updated_at ON ana_titoli_abilitativi_dettaglio_ruolo")
    op.execute("DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_albo_set_updated_at ON ana_titoli_abilitativi_dettaglio_albo")
    op.execute("DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_azienda_set_updated_at ON ana_titoli_abilitativi_azienda")
    op.execute("DROP FUNCTION IF EXISTS fn_ana_titoli_abilitativi_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS ana_titoli_abilitativi_dettaglio_certificazione")
    op.execute("DROP TABLE IF EXISTS ana_titoli_abilitativi_dettaglio_licenza")
    op.execute("DROP TABLE IF EXISTS ana_titoli_abilitativi_dettaglio_ruolo")
    op.execute("DROP TABLE IF EXISTS ana_titoli_abilitativi_dettaglio_albo")
    op.execute("DROP TABLE IF EXISTS ana_titoli_abilitativi_azienda")
