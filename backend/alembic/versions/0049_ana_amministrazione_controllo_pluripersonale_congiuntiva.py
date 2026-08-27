"""Correzione 07: aggiunge a ana_amministrazione_controllo il campo della
configurazione "Amministrazione pluripersonale congiuntiva" (modalità di
esercizio dei poteri, a catalogo). "Numero componenti" e "Durata in
carica"/"Regime di rappresentanza" riusano colonne già esistenti (nessuna
colonna nuova per questi tre, solo riassegnazione lato registro_campi.py).

Revision ID: 0049
Revises: 0048
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0049"
down_revision = "0048"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/039_ana_amministrazione_controllo_pluripersonale_congiuntiva.sql"


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
        "ALTER TABLE ana_amministrazione_controllo "
        "DROP COLUMN IF EXISTS modalita_esercizio_poteri_id"
    )
