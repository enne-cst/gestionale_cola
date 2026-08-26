"""Corregge il catalogo incarichi per le card CCIAA (Amministratori/Sindaci/
Revisori/Soci): porta a FACOLTATIVA le caratteristiche generiche non
pertinenti alla visura camerale per i 5 ruoli camerali (in particolare quelle
di tipo DOCUMENTO, che bloccavano la creazione dell'incarico dalla UI perché
non collegate a un vero upload in questo contesto), aggiunge i valori
ammessi mancanti per "Stato dell'incarico"/"Criterio di scadenza" e le
caratteristiche mancanti per il ruolo Socio (tipologia partecipazione,
numero azioni/quote, quota del diritto, titolarità, vincoli).

Revision ID: 0024
Revises: 0023
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/007_correzione_ruoli_cciaa.sql"


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
        "(SELECT id FROM cat_caratteristiche_incarico WHERE codice IN ('A57','A58','A59','A60','A61'))"
    )
    op.execute("DELETE FROM cat_caratteristiche_incarico WHERE codice IN ('A57','A58','A59','A60','A61')")
    op.execute("UPDATE cat_caratteristiche_incarico SET valori_ammessi = NULL WHERE codice IN ('A25', 'A29')")
    op.execute(
        "UPDATE rel_ruoli_caratteristiche AS rrc SET obbligatorieta = 'OBBLIGATORIA' "
        "FROM cat_ruoli AS r WHERE rrc.ruolo_id = r.id "
        "AND r.codice_documento IN ('R003','R031','R032','R033','R034')"
    )
