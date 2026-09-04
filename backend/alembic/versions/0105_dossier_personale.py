"""Dossier personale su ana_persone (modulo Personale, correzione "Persona e rapporto").

Revision ID: 0105
Revises: 0104
Create Date: 2026-09-04
"""

from pathlib import Path

from alembic import op

revision = "0105"
down_revision = "0104"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Personale/018_dossier_personale.sql"


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
    op.execute("ALTER TABLE ana_persone DROP CONSTRAINT IF EXISTS chk_ana_persone_permesso_soggiorno_stato")
    for colonna in (
        "matricola_interna",
        "provincia_nascita",
        "stato_nascita",
        "indirizzo_residenza",
        "cap_residenza",
        "comune_residenza",
        "provincia_residenza",
        "domicilio_coincide_residenza",
        "indirizzo_domicilio",
        "cap_domicilio",
        "comune_domicilio",
        "provincia_domicilio",
        "contatto_emergenza_nome",
        "contatto_emergenza_relazione",
        "contatto_emergenza_telefono",
        "lingua_madre",
        "supporto_linguistico_necessario",
        "altre_lingue",
        "tipo_documento_identita",
        "numero_documento_identita",
        "scadenza_documento_identita",
        "permesso_soggiorno_stato",
        "permesso_soggiorno_dettaglio",
    ):
        op.execute(f"ALTER TABLE ana_persone DROP COLUMN IF EXISTS {colonna}")
