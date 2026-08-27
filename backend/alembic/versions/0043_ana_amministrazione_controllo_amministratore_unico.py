"""Correzione 05: aggiunge a ana_amministrazione_controllo i campi della
configurazione "Amministratore unico" (durata in carica a catalogo con i
due campi condizionali, regime di rappresentanza a catalogo). "Numero
componenti" non ha colonna propria: per questo organo vale sempre 1 per
definizione, calcolato lato backend.

Revision ID: 0043
Revises: 0042
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0043"
down_revision = "0042"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/037_ana_amministrazione_controllo_amministratore_unico.sql"


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
        "DROP CONSTRAINT IF EXISTS chk_ana_amministrazione_controllo_durata_esercizi"
    )
    op.execute(
        "ALTER TABLE ana_amministrazione_controllo "
        "DROP COLUMN IF EXISTS durata_carica_tipo_id, "
        "DROP COLUMN IF EXISTS durata_carica_numero_esercizi, "
        "DROP COLUMN IF EXISTS durata_carica_data_scadenza, "
        "DROP COLUMN IF EXISTS regime_rappresentanza_id"
    )
