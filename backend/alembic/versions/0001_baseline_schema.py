"""Baseline schema - importa lo schema iniziale scritto a mano in database_struttura/

Le tabelle sono definite come file .sql organizzati per categoria/modulo
(cfr. capitolo 4 del documento di progetto). Questa migrazione li esegue
nell'ordine di dipendenza (Sistema prima di tutto il resto, perche' quasi
ogni tabella referenzia sys_aziende).

Convenzione per il futuro: una volta che questa baseline e' stata applicata
a un ambiente, i file gia' eseguiti non vanno piu' modificati. Ogni nuova
tabella o modifica allo schema va aggiunta come nuovo file .sql numerato
nella cartella di categoria competente *e* referenziata da una nuova
revisione Alembic dedicata (mai eseguendo di nuovo l'intera cartella).

Revision ID: 0001
Revises:
Create Date: 2026-08-03
"""

from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

# Ordine di dipendenza tra categorie: Sistema definisce sys_aziende, da cui
# dipendono (tramite FK) quasi tutte le altre tabelle.
_CATEGORIES = [
    "Sistema",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA",
    "Mod. Anagrafica Aziendale/Sezioni ISO 9001",
    "Mod. Personale",
    "Documenti",
]


def _sql_root() -> Path:
    here = Path(__file__).resolve()
    # Layout container: /app/alembic/versions/<file> -> /app/database_struttura
    candidate = here.parents[2] / "database_struttura"
    if candidate.exists():
        return candidate
    # Layout locale (alembic lanciato da dentro backend/, senza Docker):
    # backend/alembic/versions/<file> -> <repo_root>/database_struttura
    candidate = here.parents[3] / "database_struttura"
    if candidate.exists():
        return candidate
    raise FileNotFoundError(
        "Impossibile trovare la cartella database_struttura con lo schema SQL"
    )


def _iter_sql_files():
    root = _sql_root()
    for category in _CATEGORIES:
        category_dir = root / category
        if not category_dir.exists():
            continue
        for sql_file in sorted(category_dir.glob("*.sql")):
            yield sql_file


def upgrade() -> None:
    for sql_file in _iter_sql_files():
        content = sql_file.read_text(encoding="utf-8").strip()
        if content:
            op.execute(content)


def downgrade() -> None:
    # Baseline: la revisione precedente e' "nessun database". Ripartire da
    # uno schema pubblico vuoto e' l'unico downgrade coerente per questa
    # migrazione iniziale.
    op.execute("DROP SCHEMA public CASCADE;")
    op.execute("CREATE SCHEMA public;")
