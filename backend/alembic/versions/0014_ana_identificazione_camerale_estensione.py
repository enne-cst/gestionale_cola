"""Aggiunge a ana_identificazione_camerale le colonne mancanti del catalogo
finale "Informazioni societarie" (specifica Anagrafica Aziendale, PARTE II,
§28.1/§29.1): numero_iscrizione, data_iscrizione, termine_esercizio,
inizio_esercizio, data_ultimo_bilancio_approvato.

Migrazione incrementale (non CREATE TABLE): la tabella esiste gia' dalla
baseline 0001, quindi qui si usa solo ALTER TABLE, come richiesto da
CLAUDE.md per gli schemi gia' applicati.

Revision ID: 0014
Revises: 0013
Create Date: 2026-08-14
"""

from pathlib import Path

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/023_ana_identificazione_camerale_estensione.sql"


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
        "ALTER TABLE ana_identificazione_camerale "
        "DROP CONSTRAINT IF EXISTS chk_ana_identificazione_termine_esercizio, "
        "DROP CONSTRAINT IF EXISTS chk_ana_identificazione_inizio_esercizio, "
        "DROP COLUMN IF EXISTS numero_iscrizione, "
        "DROP COLUMN IF EXISTS data_iscrizione, "
        "DROP COLUMN IF EXISTS termine_esercizio, "
        "DROP COLUMN IF EXISTS inizio_esercizio, "
        "DROP COLUMN IF EXISTS data_ultimo_bilancio_approvato;"
    )
