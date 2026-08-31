-- =======================================================================
-- CORREZIONE 08 - CAMPO DELLA CONFIGURAZIONE
-- "AMMINISTRAZIONE PLURIPERSONALE DISGIUNTIVA"
-- =======================================================================
--
-- Aggiunge a ana_amministrazione_controllo (migrazione 007, già applicata,
-- non più modificabile per convenzione CLAUDE.md) la colonna necessaria
-- alla configurazione "Amministrazione pluripersonale disgiuntiva"
-- (§ Correzione 08):
--
-- - gestione_opposizione_id: chiave esterna a cat_gestione_opposizione
--   (migrazione 019), mai testo libero.
--
-- "Numero componenti", "Durata in carica"/"Regime di rappresentanza" e
-- "Modalità di esercizio dei poteri" non hanno colonne proprie qui: riusano
-- rispettivamente numero_amministratori_in_carica, durata_carica_tipo_id/
-- durata_carica_numero_esercizi/durata_carica_data_scadenza/
-- regime_rappresentanza_id (migrazione 037) e modalita_esercizio_poteri_id
-- (migrazione 039, già pensata per questo riuso), ora resi applicabili
-- anche a questo organo (§ punto "non duplicare colonne").
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_amministrazione_controllo
    ADD COLUMN IF NOT EXISTS gestione_opposizione_id UUID
        REFERENCES cat_gestione_opposizione(id);

COMMENT ON COLUMN ana_amministrazione_controllo.gestione_opposizione_id IS
    'Gestione dell''opposizione (configurazione "Amministrazione pluripersonale disgiuntiva"): riferimento a cat_gestione_opposizione, mai testo libero.';
