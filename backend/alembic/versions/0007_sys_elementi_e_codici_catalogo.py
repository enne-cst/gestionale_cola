"""Crea il catalogo sys_elementi/rel_elementi_certificazioni e aggiunge un
codice stabile a cat_moduli/cat_certificazioni.

Prerequisito delle sezioni soggette ad abbonamento (cap. 4.1 punto 013 e
4.2.2/4.2.3 del documento di progetto): senza questo catalogo le sezioni
ISO 9001 (revisione successiva) non hanno dove registrarsi.

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-07
"""

from pathlib import Path

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None

_SQL_FILES = [
    "Sistema/018_sys_elementi_certificazioni.sql",
    "Sistema/019_cat_codici.sql",
]


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
    root = _sql_root()
    for sql_file in _SQL_FILES:
        content = (root / sql_file).read_text(encoding="utf-8").strip()
        op.execute(content)


def downgrade() -> None:
    op.execute("ALTER TABLE cat_certificazioni DROP CONSTRAINT IF EXISTS uq_cat_certificazioni_codice;")
    op.execute("ALTER TABLE cat_certificazioni DROP COLUMN IF EXISTS codice;")
    op.execute("ALTER TABLE cat_moduli DROP CONSTRAINT IF EXISTS uq_cat_moduli_codice;")
    op.execute("ALTER TABLE cat_moduli DROP COLUMN IF EXISTS codice;")
    op.execute("DROP TABLE IF EXISTS rel_elementi_certificazioni_settori_iaf CASCADE;")
    op.execute("DROP TABLE IF EXISTS rel_elementi_certificazioni CASCADE;")
    op.execute("DROP TABLE IF EXISTS sys_elementi CASCADE;")
