
-- =======================================================================
-- CORREZIONE 05 - CAMPI DELLA CONFIGURAZIONE "AMMINISTRATORE UNICO"
-- =======================================================================
--
-- Aggiunge a ana_amministrazione_controllo (migrazione 007, già applicata,
-- non più modificabile per convenzione CLAUDE.md) le colonne necessarie
-- alla configurazione "Amministratore unico" (§ Correzione 05):
--
-- - durata_carica_tipo_id: chiave esterna a cat_durate_carica (migrazione
--   012), mai il testo della denominazione;
-- - durata_carica_numero_esercizi / durata_carica_data_scadenza: campi
--   condizionali mostrati solo per le rispettive scelte di durata
--   ("Per un numero determinato di esercizi" / "Fino a una data stabilita");
-- - regime_rappresentanza_id: chiave esterna a cat_regimi_rappresentanza
--   (migrazione 013).
--
-- "Numero componenti" non ha una colonna propria: per "Amministratore
-- unico" vale sempre 1 per definizione, quindi è un valore calcolato
-- lato backend (mai un inserimento manuale), non un dato da memorizzare.
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_amministrazione_controllo
    ADD COLUMN IF NOT EXISTS durata_carica_tipo_id UUID
        REFERENCES cat_durate_carica(id),
    ADD COLUMN IF NOT EXISTS durata_carica_numero_esercizi INTEGER,
    ADD COLUMN IF NOT EXISTS durata_carica_data_scadenza DATE,
    ADD COLUMN IF NOT EXISTS regime_rappresentanza_id UUID
        REFERENCES cat_regimi_rappresentanza(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_amministrazione_controllo_durata_esercizi'
    ) THEN
        ALTER TABLE ana_amministrazione_controllo
            ADD CONSTRAINT chk_ana_amministrazione_controllo_durata_esercizi
                CHECK (
                    durata_carica_numero_esercizi IS NULL
                    OR durata_carica_numero_esercizi >= 0
                );
    END IF;
END;
$$;

COMMENT ON COLUMN ana_amministrazione_controllo.durata_carica_tipo_id IS
    'Durata in carica (configurazione "Amministratore unico"): riferimento a cat_durate_carica, mai testo libero.';

COMMENT ON COLUMN ana_amministrazione_controllo.durata_carica_numero_esercizi IS
    'Numero di esercizi: valorizzato solo quando durata_carica_tipo_id punta a "Per un numero determinato di esercizi".';

COMMENT ON COLUMN ana_amministrazione_controllo.durata_carica_data_scadenza IS
    'Data di scadenza della carica: valorizzata solo quando durata_carica_tipo_id punta a "Fino a una data stabilita".';

COMMENT ON COLUMN ana_amministrazione_controllo.regime_rappresentanza_id IS
    'Regime di rappresentanza (configurazione "Amministratore unico"): riferimento a cat_regimi_rappresentanza, mai testo libero.';
