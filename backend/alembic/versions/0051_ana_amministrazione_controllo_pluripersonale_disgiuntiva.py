"""Correzione 08: aggiunge a ana_amministrazione_controllo il campo della
configurazione "Amministrazione pluripersonale disgiuntiva" (gestione
dell'opposizione, a catalogo). "Numero componenti", "Durata in carica"/
"Regime di rappresentanza" e "Modalità di esercizio dei poteri" riusano
colonne già esistenti (nessuna colonna nuova per questi, solo
riassegnazione lato registro_campi.py).

Revision ID: 0051
Revises: 0050
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0051"
down_revision = "0050"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/040_ana_amministrazione_controllo_pluripersonale_disgiuntiva.sql"


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
        "DROP COLUMN IF EXISTS gestione_opposizione_id"
    )
