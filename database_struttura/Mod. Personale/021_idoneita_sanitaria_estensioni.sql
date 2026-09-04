-- =======================================================================
-- MODULO PERSONALE - ESTENSIONI PER "IDONEITA' SANITARIA"
-- =======================================================================
--
-- Precisazione implementativa incrementale "Struttura di 'Idoneità
-- sanitaria'": tre modifiche alle tabelle esistenti, autorizzate
-- esplicitamente dall'utente dopo audit del repository e conferma delle
-- proposte di seguito riportate.
--
-- 1) cat_tipi_visita: nuovo catalogo GLOBALE di sistema (come
--    cat_abilitazioni, non cat_corsi_formazione) perché le tipologie di
--    visita di sorveglianza sanitaria sono terminologia standard di
--    medicina del lavoro, condivisa tra tutte le aziende, non una
--    configurazione specifica dell'azienda. Sostituisce la colonna
--    per_giudizi_idoneita.tipo_visita, che restava testo libero per
--    esplicita decisione della migrazione 014 (nessun catalogo esisteva
--    ancora a quel tempo).
--
-- 2) per_giudizi_idoneita.tipo_visita -> tipo_visita_id: la tabella non è
--    mai stata popolata (nessuna riga, tab "Idoneità sanitaria" mai stato
--    altro che un placeholder in frontend), quindi la colonna testuale
--    viene sostituita direttamente con la FK al nuovo catalogo, non
--    affiancata: non c'è alcun dato storico da preservare o migrare.
--
-- 3) per_attivita.medico_competente / per_attivita.luogo: la tabella
--    "Scadenziario" (migrazione 015/0102, mai popolata né usata da
--    nessun servizio/endpoint) è il contenitore generico già pensato
--    esplicitamente per "visite da pianificare, promemoria", ma non aveva
--    colonne dedicate per il medico competente e il luogo dell'appuntamento
--    richiesti dal form "Pianifica visita". Due colonne additive, nullable,
--    nessun impatto sulle altre righe (corsi da organizzare, promemoria
--    generici) che restano senza questi due campi valorizzati.

-- -----------------------------------------------------------------------
-- 1. CATALOGO TIPI DI VISITA (globale di sistema)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_tipi_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(300) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL DEFAULT 1,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipi_visita_codice UNIQUE (codice)
);

CREATE OR REPLACE FUNCTION fn_cat_tipi_visita_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipi_visita_set_updated_at ON cat_tipi_visita;
CREATE TRIGGER trg_cat_tipi_visita_set_updated_at
BEFORE UPDATE ON cat_tipi_visita
FOR EACH ROW EXECUTE FUNCTION fn_cat_tipi_visita_set_updated_at();

COMMENT ON TABLE cat_tipi_visita IS
    'Catalogo globale di sistema delle tipologie di visita di sorveglianza sanitaria (modulo Personale, "Idoneità sanitaria"): terminologia standard di medicina del lavoro, condivisa tra tutte le aziende.';

INSERT INTO cat_tipi_visita (codice, denominazione, ordine_visualizzazione) VALUES
    ('PREVENTIVA', 'Preventiva', 1),
    ('PERIODICA', 'Periodica', 2),
    ('CAMBIO_MANSIONE', 'Cambio mansione', 3),
    ('SU_RICHIESTA', 'Su richiesta', 4),
    ('RIENTRO', 'Rientro', 5),
    ('ALTRO', 'Altro', 6)
ON CONFLICT (codice) DO NOTHING;


-- -----------------------------------------------------------------------
-- 2. per_giudizi_idoneita: tipo_visita (testo libero) -> tipo_visita_id
-- -----------------------------------------------------------------------
ALTER TABLE per_giudizi_idoneita DROP COLUMN IF EXISTS tipo_visita;

ALTER TABLE per_giudizi_idoneita
    ADD COLUMN IF NOT EXISTS tipo_visita_id UUID REFERENCES cat_tipi_visita(id);

ALTER TABLE per_giudizi_idoneita
    ALTER COLUMN tipo_visita_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_per_giudizi_idoneita_tipo_visita
    ON per_giudizi_idoneita (tipo_visita_id);


-- -----------------------------------------------------------------------
-- 3. per_attivita: medico_competente / luogo (additive, nullable)
-- -----------------------------------------------------------------------
ALTER TABLE per_attivita ADD COLUMN IF NOT EXISTS medico_competente VARCHAR(300);
ALTER TABLE per_attivita ADD COLUMN IF NOT EXISTS luogo VARCHAR(300);

COMMENT ON COLUMN per_attivita.medico_competente IS
    'Medico competente dell''appuntamento pianificato (es. visita di sorveglianza sanitaria). Testo libero, come per_giudizi_idoneita.medico_competente: nessuna anagrafica medici in piattaforma.';
COMMENT ON COLUMN per_attivita.luogo IS
    'Luogo dell''appuntamento pianificato (es. ambulatorio, sede). Facoltativo.';
