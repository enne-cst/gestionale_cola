"""Elimina le tabelle qual_* (soci, elenco soci, amministratori, sindaco,
revisore legale, direttore tecnico SOA, amministratore delegato, componente
CdA, responsabile FER): duplicavano l'anagrafica persona invece di
riferirla. Sostituite da per_incarichi/per_incarichi_valori (0020).

Deve essere eseguita dopo 0020 (crea la struttura sostitutiva) e prima di
0022 (rimuove per_persone, ancora referenziata da queste tabelle).

Nessun dato reale presente al momento della decisione (verificato sul
database di sviluppo): una sola riga di test in qual_amministratori_cariche,
persa con questa migrazione per esplicita decisione dell'utente
(cancellazione fisica, nessun backfill).

Revision ID: 0021
Revises: 0020
Create Date: 2026-08-26
"""

from pathlib import Path

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/024_rimozione_tabelle_qual_obsolete.sql"


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
    # Non ricostruibile automaticamente: le tabelle originali (schema e dati)
    # non sono conservate da nessuna parte dopo questa migrazione. Se serve
    # tornare indietro, ripristinare da un backup preso prima di applicarla.
    pass
