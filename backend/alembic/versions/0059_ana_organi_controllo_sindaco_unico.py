"""Correzione 13: aggiunge a ana_organi_controllo le colonne della
configurazione "Sindaco unico" (funzioni dell'organo interno, revisione
legale affidata a, durata dell'incarico + i due campi condizionali data/
descrizione). "Numero componenti" resta la colonna già esistente
(migrazione 0054), non usata da questa configurazione (sincronizzata via
campo derivato lato backend).

Revision ID: 0059
Revises: 0058
Create Date: 2026-08-31
"""

from pathlib import Path

from alembic import op

revision = "0059"
down_revision = "0058"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/042_ana_organi_controllo_sindaco_unico.sql"


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
        "ALTER TABLE ana_organi_controllo "
        "DROP COLUMN IF EXISTS funzioni_organo_interno_id, "
        "DROP COLUMN IF EXISTS revisione_legale_affidata_a_id, "
        "DROP COLUMN IF EXISTS durata_incarico_tipo_id, "
        "DROP COLUMN IF EXISTS durata_incarico_data_bilancio, "
        "DROP COLUMN IF EXISTS durata_incarico_descrizione"
    )
