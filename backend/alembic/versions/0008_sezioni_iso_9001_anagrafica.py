"""Crea le 17 sezioni dell'Anagrafica Aziendale soggette all'abbonamento
ISO 9001 (cap. 4.2.2 "Organizzazione, Trend e Assicurazioni" e 4.2.3 "Altre
informazioni" del documento di progetto).

I file eseguono anche l'inserimento delle relative righe in sys_elementi e
rel_elementi_certificazioni (vedi revisione 0007), quindi l'ordine di
esecuzione qui sotto è quello numerico delle cartelle sorgente, che rispetta
già l'unica dipendenza reale: 004_ana_dati_generali.sql prima di
005_ana_ripartizione_organico.sql e 012_ana_variazioni_organico.sql, che vi
si legano con una FK composita (azienda_id, anno_riferimento).

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-07
"""

from pathlib import Path

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

_CARTELLA = "Mod. Anagrafica Aziendale/Sezioni ISO 9001"

_SQL_FILES = [
    f"{_CARTELLA}/Organizzazione/001_ana_contratti_lavoro.sql",
    f"{_CARTELLA}/Organizzazione/002_ana_posizioni_assicurative_previdenziali.sql",
    f"{_CARTELLA}/Organizzazione/003_ana_fondi_interprofessionali.sql",
    f"{_CARTELLA}/Organizzazione/004_ana_dati_generali.sql",
    f"{_CARTELLA}/Organizzazione/005_ana_ripartizione_organico.sql",
    f"{_CARTELLA}/Organizzazione/006_ana_turni_lavoro.sql",
    f"{_CARTELLA}/Organizzazione/007_ana_outsourcing.sql",
    f"{_CARTELLA}/Organizzazione/008_ana_subappaltatori.sql",
    f"{_CARTELLA}/Organizzazione/009_ana_fornitori_materiali.sql",
    f"{_CARTELLA}/Organizzazione/010_ana_lavoratori_autonomi.sql",
    f"{_CARTELLA}/Organizzazione/011_ana_indicatori_economici.sql",
    f"{_CARTELLA}/Organizzazione/012_ana_variazioni_organico.sql",
    f"{_CARTELLA}/Organizzazione/013_ana_assicurazioni.sql",
    f"{_CARTELLA}/Altre informazioni/001_ana_contratti_rete.sql",
    f"{_CARTELLA}/Altre informazioni/002_ana_compliance_trasparenza.sql",
    f"{_CARTELLA}/Altre informazioni/003_ana_procedimenti_legali.sql",
    f"{_CARTELLA}/Altre informazioni/004_ana_visite_enti_controllo.sql",
]

_VIEWS = [
    "vw_ana_ripartizione_organico",
    "vw_ana_indicatori_economici",
    "vw_ana_variazioni_organico",
]

_TABELLE_OPERATIVE = [
    "ana_contratti_lavoro",
    "ana_posizioni_assicurative_previdenziali",
    "ana_fondi_interprofessionali",
    "ana_variazioni_organico",
    "ana_ripartizione_organico",
    "ana_dati_generali",
    "ana_turni_lavoro",
    "ana_outsourcing",
    "ana_subappaltatori",
    "ana_fornitori_materiali",
    "ana_lavoratori_autonomi",
    "ana_indicatori_economici",
    "ana_assicurazioni",
    "ana_contratti_rete",
    "ana_contratti_rete_presenza",
    "ana_compliance_trasparenza",
    "ana_procedimenti_legali",
    "ana_visite_enti_controllo",
]

_CATALOGHI = [
    "cat_stati_iscrizione_fondo",
    "cat_stati_outsourcing",
    "cat_stati_subappaltatori",
    "cat_stati_fornitori_materiali",
    "cat_stati_lavoratori_autonomi",
    "cat_stati_assicurazioni",
    "cat_frequenze_rinnovo_assicurazioni",
    "cat_stati_procedimenti_legali",
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
    for view in _VIEWS:
        op.execute(f"DROP VIEW IF EXISTS {view} CASCADE;")
    for tabella in _TABELLE_OPERATIVE:
        op.execute(f"DROP TABLE IF EXISTS {tabella} CASCADE;")
    for catalogo in _CATALOGHI:
        op.execute(f"DROP TABLE IF EXISTS {catalogo} CASCADE;")
    op.execute("DELETE FROM rel_elementi_certificazioni WHERE elemento_id IN (SELECT id FROM sys_elementi WHERE codice LIKE 'ANAGRAFICA_AZIENDALE.%');")
    op.execute("DELETE FROM sys_elementi WHERE codice LIKE 'ANAGRAFICA_AZIENDALE.%';")
