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

Elenco esplicito, non piu' scansione dinamica delle cartelle
--------------------------------------------------------------
Fino al 2026-08-14 questa migrazione elencava i file con
`sorted(category_dir.glob("*.sql"))`, rivalutato ad ogni esecuzione: su un
database vuoto creato oggi, questo faceva rieseguire anche i file aggiunti
*dopo* il primo bootstrap (013-020 di Sistema, l'intera cartella "Sezioni
ISO 9001"), gia' coperti dalle rispettive revisioni dedicate (0002-0011).
Per gli script idempotenti (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT`) la
doppia esecuzione passava inosservata; per `017_sys_aziende_stato_approvazione.sql`
(`ALTER TABLE ... ADD COLUMN`, non idempotente) falliva con
"column already exists" - scoperto integrando la Revisione 2 del 2026-08-14
testando la catena di migrazioni su un database vuoto.

Corretto congelando l'elenco a quanto la baseline doveva coprire davvero: i
soli file di "Sistema" senza una revisione dedicata (001-012) e le tre
categorie senza ancora nessuna migrazione successiva (Documenti, Mod.
Personale, Dati estrapolati dalla CCIA). "Mod. Anagrafica Aziendale/Sezioni
ISO 9001" e' rimossa del tutto: la esegue per intero, in modo esplicito,
solo la migrazione 0008.

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

# Ordine di dipendenza: Sistema definisce sys_aziende, da cui dipendono
# (tramite FK) quasi tutte le altre tabelle, quindi va eseguita per prima.
_SQL_FILES = [
    # --- Sistema (solo i file senza una revisione Alembic dedicata) ---
    "Sistema/001_sys_profili_utente.sql",
    "Sistema/002_sys_aziende_registrate_alla_piattaforma.sql",
    "Sistema/003_sys_utenti_della_piattaforma.sql",
    "Sistema/004_rel_utenti_aziende.sql",
    "Sistema/005_cat_settori_IAF.sql",
    "Sistema/006_rel_aziende_settori_IAF.sql",
    "Sistema/007_cat_certificazioni.sql",
    "Sistema/008_cat_stati_certificazione_aziendale.sql",
    "Sistema/009_sys_certificazioni_attive_per_azienda.sql",
    "Sistema/010_cat_moduli.sql",
    "Sistema/011_cfg_moduli.sql",
    "Sistema/012_sys_presa_visione_modifiche.sql",
    # --- Documenti ---
    "Documenti/001_doc_documenti.sql",
    # --- Mod. Personale ---
    "Mod. Personale/001_per_persone.sql",
    "Mod. Personale/002_per_titoli_studio.sql",
    # --- Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA ---
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/001_ana_identificazione_camerale.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/002_ana_iscrizioni_registro_imprese.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/003_ana_durata_societa_esercizi.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/004_ana_attivita_esercitata.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/005_ana_codici_ateco.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/006_ana_capitale_sociale.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/007_ana_amministrazione_controllo.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/008_qual_soci.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/009_qual_amministratori_cariche.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/010_ana_soa.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/011_ana_certificazioni.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/012_ana_addetti_visura.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/013_ana_addetti_comune.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/014_ana_albi_ruoli_licenze.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/015_ana_sedi.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/016_ana_contatti.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/017_qual_responsabile_fer.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/018_qual_sindaco.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/019_qual_revisore_legale.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/020_qual_direttore_tecnico_soa.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/021_qual_amministratore_delegato.sql",
    "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/022_qual_componente_consiglio_amministrazione.sql",
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


def upgrade() -> None:
    root = _sql_root()
    for sql_file in _SQL_FILES:
        content = (root / sql_file).read_text(encoding="utf-8").strip()
        if content:
            op.execute(content)


def downgrade() -> None:
    # Baseline: la revisione precedente e' "nessun database". Ripartire da
    # uno schema pubblico vuoto e' l'unico downgrade coerente per questa
    # migrazione iniziale.
    op.execute("DROP SCHEMA public CASCADE;")
    op.execute("CREATE SCHEMA public;")
