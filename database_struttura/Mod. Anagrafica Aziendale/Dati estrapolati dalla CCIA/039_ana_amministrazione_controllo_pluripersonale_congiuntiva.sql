
-- =======================================================================
-- CORREZIONE 07 - CAMPO DELLA CONFIGURAZIONE
-- "AMMINISTRAZIONE PLURIPERSONALE CONGIUNTIVA"
-- =======================================================================
--
-- Aggiunge a ana_amministrazione_controllo (migrazione 007, già applicata,
-- non più modificabile per convenzione CLAUDE.md) la colonna necessaria
-- alla configurazione "Amministrazione pluripersonale congiuntiva"
-- (§ Correzione 07):
--
-- - modalita_esercizio_poteri_id: chiave esterna a
--   cat_modalita_esercizio_poteri (migrazione 018), mai testo libero.
--
-- "Numero componenti" e "Durata in carica"/"Regime di rappresentanza" non
-- hanno colonne proprie qui: riusano rispettivamente
-- numero_amministratori_in_carica e durata_carica_tipo_id/
-- durata_carica_numero_esercizi/durata_carica_data_scadenza/
-- regime_rappresentanza_id, già aggiunti dalle migrazioni 037/038 per
-- "Amministratore unico"/"Consiglio di amministrazione", ora resi
-- applicabili anche a questo organo (§ punto "non duplicare colonne").
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_amministrazione_controllo
    ADD COLUMN IF NOT EXISTS modalita_esercizio_poteri_id UUID
        REFERENCES cat_modalita_esercizio_poteri(id);

COMMENT ON COLUMN ana_amministrazione_controllo.modalita_esercizio_poteri_id IS
    'Modalità di esercizio dei poteri (configurazione "Amministrazione pluripersonale congiuntiva"/"disgiuntiva"): riferimento a cat_modalita_esercizio_poteri, mai testo libero.';
