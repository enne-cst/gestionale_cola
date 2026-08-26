"""A32 "Stato verifica consulente" diventa FACOLTATIVA per i 6 ruoli CCIAA
(Socio, Amministratore, Amministratore Delegato, Componente CdA, Sindaco,
Revisore Legale): non è più mostrata nel form di compilazione (la verifica
della riga-incarico usa ora il popup dedicato, vedi
app/core/incarichi.py::applica_decisione_verifica_incarico), quindi non può
restare obbligatoria o la creazione di un nuovo incarico fallirebbe.

Revision ID: 0036
Revises: 0035
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0036"
down_revision = "0035"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/009_a32_facoltativa_ruoli_cciaa.sql"


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
        "UPDATE rel_ruoli_caratteristiche AS rrc "
        "SET obbligatorieta = 'OBBLIGATORIA' "
        "FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c "
        "WHERE rrc.ruolo_id = r.id AND rrc.caratteristica_id = c.id "
        "AND r.codice IN ('SOCIO', 'AMMINISTRATORE', 'AMMINISTRATORE_DELEGATO', 'COMPONENTE_CDA', 'SINDACO', 'REVISORE_LEGALE') "
        "AND c.codice = 'A32'"
    )
