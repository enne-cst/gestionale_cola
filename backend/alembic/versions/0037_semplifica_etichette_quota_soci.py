"""Semplifica le etichette delle caratteristiche Socio A53/A54/A56
("Valore nominale"/"Quota"/"Versamento", per coerenza con Correzione 02 nel
frontend) e rimuove definitivamente A59 "Quota del diritto" (facoltativa,
non compilata in nessun incarico esistente, giudicata superflua e
ambigua rispetto alla nuova etichetta "Quota").

Revision ID: 0037
Revises: 0036
Create Date: 2026-08-27
"""

from pathlib import Path

from alembic import op

revision = "0037"
down_revision = "0036"
branch_labels = None
depends_on = None

_SQL_FILE = "Cataloghi/010_semplifica_etichette_quota_soci.sql"


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
    op.execute("UPDATE cat_caratteristiche_incarico SET denominazione = 'Percentuale di partecipazione' WHERE codice = 'A54'")
    op.execute("UPDATE cat_caratteristiche_incarico SET denominazione = 'Quota nominale' WHERE codice = 'A53'")
    op.execute("UPDATE cat_caratteristiche_incarico SET denominazione = 'Valore versato' WHERE codice = 'A56'")
    op.execute(
        "INSERT INTO cat_caratteristiche_incarico "
        "(codice, denominazione, descrizione, tipo_dato, unita_misura, valori_ammessi, regola_validazione, sensibile, ordine_visualizzazione, attivo) "
        "VALUES ('A59', 'Quota del diritto', "
        "'Frazione o percentuale del diritto spettante al titolare quando vi e'' contitolarita''. Non va confusa con la percentuale di partecipazione sul capitale.', "
        "'NUMERO', '%', NULL, NULL, FALSE, 59, TRUE) "
        "ON CONFLICT (codice) DO NOTHING"
    )
    op.execute(
        "INSERT INTO rel_ruoli_caratteristiche (ruolo_id, caratteristica_id, obbligatorieta, condizione, ordine_visualizzazione, attivo) "
        "SELECT r.id, c.id, 'FACOLTATIVA', NULL, 59, TRUE "
        "FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c "
        "WHERE r.codice = 'SOCIO' AND c.codice = 'A59' "
        "ON CONFLICT (ruolo_id, caratteristica_id) DO NOTHING"
    )
