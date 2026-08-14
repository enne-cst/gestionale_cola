"""Applica l'unica differenza reale della Rev.2 di 012_ana_variazioni_organico.sql:
testi di denominazione/descrizione in sys_elementi (nessun cambio di
struttura o di codice, gia' sotto TREND dalla migrazione 0008).

Revision ID: 0011
Revises: 0010
Create Date: 2026-08-14
"""

from pathlib import Path

from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Sezioni ISO 9001/Organizzazione/015_ana_variazioni_organico_testi.sql"


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
    # Solo testo (denominazione/descrizione/commento tabella): nessun dato
    # strutturale da ripristinare, la downgrade e' un no-op intenzionale.
    pass
