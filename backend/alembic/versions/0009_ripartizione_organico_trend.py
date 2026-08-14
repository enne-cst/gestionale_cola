"""Integra le correzioni Rev.2 di 005_ana_ripartizione_organico.sql: sposta la
voce "Ripartizione organico" e i suoi campi dal catalogo ORGANIZZAZIONE al
catalogo TREND (aggiornamento in place, id preservati) e aggiunge vincoli
CHECK >= 0 sui conteggi di ana_ripartizione_organico e ana_variazioni_organico.

Migrazione incrementale (non CREATE TABLE IF NOT EXISTS): le due tabelle
esistono gia' dalla migrazione 0008, quindi qui si usano solo ALTER
TABLE/UPDATE, come richiesto da CLAUDE.md per gli schemi gia' applicati.

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-14
"""

from pathlib import Path

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Sezioni ISO 9001/Organizzazione/014_ana_ripartizione_organico_trend.sql"


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
        "ALTER TABLE ana_ripartizione_organico DROP CONSTRAINT IF EXISTS "
        "chk_ripartizione_organico_numero_amministrativi_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_project_manager_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_tecnici_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_preposti_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_operativi_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_dirigenti_sicurezza_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_uomini_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_donne_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_italiani_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_stranieri_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_tempo_determinato_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_tempo_indeterminato_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_laureati_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_ripartizione_organico_numero_diplomati_ge0;"
    )
    op.execute(
        "ALTER TABLE ana_variazioni_organico DROP CONSTRAINT IF EXISTS "
        "chk_variazioni_organico_numero_nuove_assunzioni_ge0, "
        "DROP CONSTRAINT IF EXISTS chk_variazioni_organico_numero_cessazioni_ge0;"
    )
    op.execute(
        "UPDATE sys_elementi SET codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.' "
        "|| split_part(codice, 'ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO.', 2) "
        "WHERE codice LIKE 'ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO.%';"
    )
    op.execute(
        "UPDATE sys_elementi SET codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO', "
        "elemento_padre_id = (SELECT id FROM sys_elementi WHERE codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE') "
        "WHERE codice = 'ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO';"
    )
