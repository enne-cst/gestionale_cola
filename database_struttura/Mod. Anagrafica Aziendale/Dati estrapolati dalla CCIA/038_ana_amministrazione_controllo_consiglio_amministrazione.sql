
-- =======================================================================
-- CORREZIONE 06 - CAMPI DELLA CONFIGURAZIONE "CONSIGLIO DI AMMINISTRAZIONE"
-- =======================================================================
--
-- Aggiunge a ana_amministrazione_controllo (migrazione 007, già applicata,
-- non più modificabile per convenzione CLAUDE.md) le colonne necessarie
-- alla configurazione "Consiglio di amministrazione" (§ Correzione 06):
--
-- - modalita_decisioni_consiglio_id: chiave esterna a
--   cat_modalita_decisioni_consiglio (migrazione 015), mai testo libero;
-- - deleghe_consiglio_id: chiave esterna a cat_deleghe_consiglio
--   (migrazione 016), mai testo libero.
--
-- "Numero componenti" e "Durata in carica"/"Regime di rappresentanza" non
-- hanno colonne proprie qui: riusano rispettivamente
-- numero_amministratori_in_carica (già esistente dalla migrazione 007,
-- solo riassegnato/rietichettato in questa configurazione — nessuna nuova
-- colonna, § punto 15 "non duplicare") e durata_carica_tipo_id/
-- durata_carica_numero_esercizi/durata_carica_data_scadenza/
-- regime_rappresentanza_id (già aggiunti dalla migrazione 037 per
-- "Amministratore unico", ora resi applicabili anche a questo organo).
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_amministrazione_controllo
    ADD COLUMN IF NOT EXISTS modalita_decisioni_consiglio_id UUID
        REFERENCES cat_modalita_decisioni_consiglio(id),
    ADD COLUMN IF NOT EXISTS deleghe_consiglio_id UUID
        REFERENCES cat_deleghe_consiglio(id);

COMMENT ON COLUMN ana_amministrazione_controllo.modalita_decisioni_consiglio_id IS
    'Modalità delle decisioni del consiglio (configurazione "Consiglio di amministrazione"): riferimento a cat_modalita_decisioni_consiglio, mai testo libero.';

COMMENT ON COLUMN ana_amministrazione_controllo.deleghe_consiglio_id IS
    'Deleghe del consiglio (configurazione "Consiglio di amministrazione"): riferimento a cat_deleghe_consiglio, mai testo libero.';
