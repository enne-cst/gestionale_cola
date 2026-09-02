"""Sedi secondarie e unità locali (Correzione 23): estende ana_sedi/
ana_sedi_attivita/ana_contatti (stato da catalogo, tipologie multiple,
attività principale, contatti per sede) e aggiunge la relazione verso il
catalogo versionato dei codici ATECO e il riepilogo del numero di unità
locali dichiarato in visura.

Revision ID: 0083
Revises: 0082
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0083"
down_revision = "0082"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/049_ana_unita_locali.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_ana_unita_locali_riepilogo_set_updated_at ON ana_unita_locali_riepilogo")
    op.execute("DROP FUNCTION IF EXISTS fn_ana_unita_locali_riepilogo_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS ana_unita_locali_riepilogo")

    op.execute("DROP TRIGGER IF EXISTS trg_rel_unita_locali_codici_ateco_set_updated_at ON rel_unita_locali_codici_ateco")
    op.execute("DROP FUNCTION IF EXISTS fn_rel_unita_locali_codici_ateco_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS rel_unita_locali_codici_ateco")

    op.execute("DROP TRIGGER IF EXISTS trg_rel_unita_locali_tipologie_set_updated_at ON rel_unita_locali_tipologie")
    op.execute("DROP FUNCTION IF EXISTS fn_rel_unita_locali_tipologie_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS rel_unita_locali_tipologie")

    op.execute("ALTER TABLE ana_contatti DROP COLUMN IF EXISTS sede_id")

    op.execute("DROP INDEX IF EXISTS uq_ana_sedi_attivita_principale_per_sede")
    op.execute("ALTER TABLE ana_sedi_attivita DROP COLUMN IF EXISTS attivita_principale")

    op.execute("ALTER TABLE ana_sedi DROP CONSTRAINT IF EXISTS fk_ana_sedi_stato_unita")
    op.execute("ALTER TABLE ana_sedi DROP COLUMN IF EXISTS stato_unita_id")
    op.execute("ALTER TABLE ana_sedi DROP COLUMN IF EXISTS note")
