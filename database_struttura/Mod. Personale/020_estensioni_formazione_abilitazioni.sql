-- =======================================================================
-- MODULO PERSONALE - ESTENSIONI PER "FORMAZIONE E ABILITAZIONI"
-- =======================================================================
--
-- Correzione "Struttura di 'Formazione e abilitazioni'": tre aggiunte
-- additive alle tabelle create dalla migrazione 014, autorizzate
-- esplicitamente dall'utente dopo aver segnalato i vincoli trovati.
--
-- 1) per_abilitazioni.durata_ore: la tabella non aveva alcuna colonna per
--    la durata del corso legato all'abilitazione, ma la nuova specifica la
--    richiede obbligatoria quanto per la Formazione (che la ha già in
--    per_formazione.ore_riconosciute). Stesso tipo NUMERIC(6,2) per
--    coerenza; NOT NULL con lo stesso vincolo di positività già usato per
--    ore_riconosciute (nessuna riga esistente da migrare: la tabella non è
--    mai stata popolata).
--
-- 2) cat_corsi_formazione.obbligatorio / cat_abilitazioni.obbligatorio:
--    nessuno dei due cataloghi aveva un modo per marcare una voce come
--    obbligatoria, necessario per il filtro "Solo obbligatori" già
--    previsto dal prototipo. BOOLEAN DEFAULT FALSE, non retroattivo.
--
-- 3) cat_abilitazioni.soglia_preavviso_giorni: cat_corsi_formazione aveva
--    già questa colonna (migrazione 014); mancava sul catalogo
--    abilitazioni, necessaria per calcolare lo stato "In scadenza" con la
--    stessa logica per entrambe le tipologie.

ALTER TABLE per_abilitazioni
    ADD COLUMN IF NOT EXISTS durata_ore NUMERIC(6, 2) NOT NULL DEFAULT 0;

ALTER TABLE per_abilitazioni
    ALTER COLUMN durata_ore DROP DEFAULT;

ALTER TABLE per_abilitazioni
    DROP CONSTRAINT IF EXISTS chk_per_abilitazioni_durata_positiva;

ALTER TABLE per_abilitazioni
    ADD CONSTRAINT chk_per_abilitazioni_durata_positiva CHECK (durata_ore > 0);

ALTER TABLE cat_corsi_formazione
    ADD COLUMN IF NOT EXISTS obbligatorio BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE cat_abilitazioni
    ADD COLUMN IF NOT EXISTS obbligatorio BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE cat_abilitazioni
    ADD COLUMN IF NOT EXISTS soglia_preavviso_giorni INTEGER;
