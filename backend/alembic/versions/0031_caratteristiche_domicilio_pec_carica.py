"""Aggiunge le caratteristiche A62 "Domicilio della carica" e A63 "PEC
personale/professionale" al catalogo condiviso, associate come FACOLTATIVA
ai ruoli camerali (Amministratore, Amministratore Delegato, Componente CdA,
Sindaco, Revisore Legale, Socio) — mappatura CCIAA §4.3/§5.2/§6.2.

Revision ID: 0031
Revises: 0030
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0031"
down_revision = "0030"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/008_caratteristiche_domicilio_pec_carica.sql"


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
        "DELETE FROM rel_ruoli_caratteristiche WHERE caratteristica_id IN "
        "(SELECT id FROM cat_caratteristiche_incarico WHERE codice IN ('A62','A63'))"
    )
    op.execute("DELETE FROM cat_caratteristiche_incarico WHERE codice IN ('A62','A63')")
