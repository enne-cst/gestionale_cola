"""Integra le correzioni Rev.2 di 012_sys_presa_visione_modifiche.sql: nuovo
catalogo cat_stati_verifica_modifiche, nuove colonne di stato/nota/timestamp
su sys_presa_visione_modifiche, correzione nullabilita' dei timestamp,
trigger updated_at e indici (vedi 020_sys_verifica_modifiche.sql per i
dettagli e le decisioni prese).

Migrazione incrementale (non CREATE TABLE IF NOT EXISTS): la tabella esiste
gia' dalla migrazione 0001 (baseline), quindi qui si usano solo ALTER
TABLE/CREATE TABLE IF NOT EXISTS per gli oggetti nuovi.

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-14
"""

from pathlib import Path

from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

_SQL_FILE = "Sistema/020_sys_verifica_modifiche.sql"


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
    op.execute("DROP TRIGGER IF EXISTS trg_sys_presa_visione_modifiche_set_updated_at ON sys_presa_visione_modifiche;")
    op.execute("DROP FUNCTION IF EXISTS fn_sys_presa_visione_modifiche_set_updated_at();")
    op.execute("DROP INDEX IF EXISTS idx_sys_presa_visione_aperte;")
    op.execute("DROP INDEX IF EXISTS idx_sys_presa_visione_stato;")
    op.execute("DROP INDEX IF EXISTS idx_sys_presa_visione_entita_record;")
    op.execute("DROP INDEX IF EXISTS idx_sys_presa_visione_rilevata;")
    op.execute(
        "ALTER TABLE sys_presa_visione_modifiche "
        "DROP CONSTRAINT IF EXISTS chk_sys_presa_visione_nota_se_in_revisione, "
        "DROP CONSTRAINT IF EXISTS fk_sys_presa_visione_stato_verifica;"
    )
    op.execute(
        "ALTER TABLE sys_presa_visione_modifiche "
        "ALTER COLUMN presa_visione_at SET DEFAULT CURRENT_TIMESTAMP;"
    )
    op.execute(
        "UPDATE sys_presa_visione_modifiche SET presa_visione_at = CURRENT_TIMESTAMP WHERE presa_visione_at IS NULL;"
    )
    op.execute(
        "UPDATE sys_presa_visione_modifiche SET modifica_vista_at = modifica_rilevata_at WHERE modifica_vista_at IS NULL;"
    )
    op.execute(
        "ALTER TABLE sys_presa_visione_modifiche "
        "ALTER COLUMN presa_visione_at SET NOT NULL, "
        "ALTER COLUMN modifica_vista_at SET NOT NULL, "
        "DROP COLUMN IF EXISTS modifica_rilevata_at, "
        "DROP COLUMN IF EXISTS stato_verifica_codice, "
        "DROP COLUMN IF EXISTS nota_verifica, "
        "DROP COLUMN IF EXISTS stato_verifica_at;"
    )
    op.execute("DROP TABLE IF EXISTS cat_stati_verifica_modifiche CASCADE;")
