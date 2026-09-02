"""Correzione 19 (prima parte, card "Attività, albi, ruoli e licenze"):
estende ana_attivita_esercitata (migrazione 004, già applicata, non più
modificabile per convenzione CLAUDE.md) con i campi della sezione "Attività
economica" invece di creare una tabella duplicata — la tabella esistente
copre già "Attività prevalente"/"Data inizio attività"/"Attività
import-export" con semantica equivalente.

Revision ID: 0068
Revises: 0067
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0068"
down_revision = "0067"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/045_ana_attivita_esercitata_estensione.sql"


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
        """
        ALTER TABLE ana_attivita_esercitata
            DROP CONSTRAINT IF EXISTS fk_ana_attivita_esercitata_stato_attivita,
            DROP CONSTRAINT IF EXISTS fk_ana_attivita_esercitata_codice_ateco_2025,
            DROP CONSTRAINT IF EXISTS fk_ana_attivita_esercitata_codice_atecori,
            DROP CONSTRAINT IF EXISTS fk_ana_attivita_esercitata_codice_nace,
            DROP COLUMN IF EXISTS stato_attivita_id,
            DROP COLUMN IF EXISTS attivita_sede_legale,
            DROP COLUMN IF EXISTS data_inizio_attivita_sede,
            DROP COLUMN IF EXISTS codice_ateco_2025_id,
            DROP COLUMN IF EXISTS codice_atecori_id,
            DROP COLUMN IF EXISTS codice_nace_2_1_id,
            DROP COLUMN IF EXISTS contratto_rete,
            DROP COLUMN IF EXISTS albi_ruoli_licenze_presenti,
            DROP COLUMN IF EXISTS registri_ambientali_presenti
        """
    )
