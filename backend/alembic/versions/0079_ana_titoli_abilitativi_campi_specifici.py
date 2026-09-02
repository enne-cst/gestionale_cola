"""Aggiunge i campi specifici dei 4 form Albo/Ruolo/Licenza/Certificazione
alla tabella unificata "Albi, ruoli, licenze e certificazioni" (Correzione
21), rimandati da Correzione 20 (migrazione 0070). Aggiunge anche
`stato_titolo_id` alla riga principale e le due tabelle di relazione
(settori IAF, categorie/classifiche SOA).

Revision ID: 0079
Revises: 0078
Create Date: 2026-09-02
"""

from pathlib import Path

from alembic import op

revision = "0079"
down_revision = "0078"
branch_labels = None
depends_on = None

_SQL_FILE = "Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/047_ana_titoli_abilitativi_campi_specifici.sql"


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
        "DROP TRIGGER IF EXISTS trg_rel_titoli_abilitativi_soa_categorie_set_updated_at "
        "ON rel_titoli_abilitativi_soa_categorie"
    )
    op.execute("DROP FUNCTION IF EXISTS fn_rel_titoli_abilitativi_soa_categorie_set_updated_at()")
    op.execute("DROP TABLE IF EXISTS rel_titoli_abilitativi_soa_categorie")
    op.execute("DROP TABLE IF EXISTS rel_titoli_abilitativi_settori_iaf")

    op.execute(
        "ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione "
        "ADD COLUMN IF NOT EXISTS sotto_tipo VARCHAR(30)"
    )
    op.execute(
        "UPDATE ana_titoli_abilitativi_dettaglio_certificazione d "
        "SET sotto_tipo = CASE c.codice "
        "    WHEN 'CERTIFICAZIONE_SISTEMA' THEN 'CERTIFICAZIONE' "
        "    WHEN 'ATTESTAZIONE_SOA' THEN 'ATTESTAZIONE_SOA' "
        "    ELSE 'CERTIFICAZIONE' END "
        "FROM cat_tipologie_certificazione_attestazione c "
        "WHERE d.sotto_tipo_id = c.id"
    )
    op.execute("UPDATE ana_titoli_abilitativi_dettaglio_certificazione SET sotto_tipo = 'CERTIFICAZIONE' WHERE sotto_tipo IS NULL")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione ALTER COLUMN sotto_tipo SET NOT NULL")
    op.execute(
        "ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione "
        "ADD CONSTRAINT chk_ana_titoli_abilitativi_dettaglio_certificazione_sotto_tipo "
        "CHECK (sotto_tipo IN ('CERTIFICAZIONE', 'ATTESTAZIONE_SOA'))"
    )
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS sotto_tipo_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS norma_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS edizione_anno")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS organismo_accreditamento")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS campo_applicazione")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS data_prima_emissione")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS denominazione")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione DROP COLUMN IF EXISTS schema_norma")

    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS tipologia_licenza_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS oggetto_attivita")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS persona_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS sede_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS ambito_territoriale")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS data_efficacia")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS condizioni_prescrizioni")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza DROP COLUMN IF EXISTS estremi_rinnovo")
    op.execute(
        "ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza "
        "RENAME COLUMN denominazione_licenza TO tipologia_licenza"
    )

    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo DROP COLUMN IF EXISTS tipologia_ruolo_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo DROP COLUMN IF EXISTS sezione_categoria")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo DROP COLUMN IF EXISTS persona_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo DROP COLUMN IF EXISTS provincia_ambito")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo DROP COLUMN IF EXISTS attivita_abilitate")

    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS tipologia_albo_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS denominazione_albo")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS sezione")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS persona_id")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS provincia_ambito")
    op.execute("ALTER TABLE ana_titoli_abilitativi_dettaglio_albo DROP COLUMN IF EXISTS attivita_abilitazioni")

    op.execute("ALTER TABLE ana_titoli_abilitativi_azienda DROP COLUMN IF EXISTS stato_titolo_id")
