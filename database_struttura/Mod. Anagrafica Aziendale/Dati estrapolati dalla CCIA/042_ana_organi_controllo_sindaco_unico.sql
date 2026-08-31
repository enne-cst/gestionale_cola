-- =======================================================================
-- CORREZIONE 13 - CAMPI DELLA CONFIGURAZIONE "SINDACO UNICO"
-- =======================================================================
--
-- Aggiunge a ana_organi_controllo (migrazione 041, già applicata, non più
-- modificabile per convenzione CLAUDE.md) le colonne necessarie alla
-- configurazione "Sindaco unico" (§ Correzione 13):
--
-- - funzioni_organo_interno_id: chiave esterna a cat_funzioni_organo_interno
--   (Cataloghi/022), mai testo libero;
-- - revisione_legale_affidata_a_id: chiave esterna a
--   cat_affidatari_revisione_legale (Cataloghi/023) — catalogo condiviso,
--   pensato fin da ora per essere riusato dalle altre configurazioni della
--   sezione quando verranno definite (stesso pattern di
--   modalita_esercizio_poteri_id per Amministratori, Correzione 07/08);
-- - durata_incarico_tipo_id: chiave esterna a
--   cat_durate_incarico_organi_controllo (Cataloghi/024);
-- - durata_incarico_data_bilancio / durata_incarico_descrizione: campi
--   condizionali mostrati solo per le rispettive scelte di durata ("Fino
--   all'approvazione del bilancio" / "Altra durata risultante dall'atto di
--   nomina") — mai una data dentro la denominazione del catalogo (§
--   vincolo esplicito).
--
-- "Numero componenti" non ha una colonna propria per questa configurazione:
-- per "Sindaco unico" è sincronizzato con l'unica riga della tabella
-- (calcolato lato backend, mai un inserimento manuale) — riusa la stessa
-- colonna `numero_componenti` già esistente (migrazione 041) solo per le
-- configurazioni ancora modificabili, non per questa.
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_organi_controllo
    ADD COLUMN IF NOT EXISTS funzioni_organo_interno_id UUID
        REFERENCES cat_funzioni_organo_interno(id),
    ADD COLUMN IF NOT EXISTS revisione_legale_affidata_a_id UUID
        REFERENCES cat_affidatari_revisione_legale(id),
    ADD COLUMN IF NOT EXISTS durata_incarico_tipo_id UUID
        REFERENCES cat_durate_incarico_organi_controllo(id),
    ADD COLUMN IF NOT EXISTS durata_incarico_data_bilancio DATE,
    ADD COLUMN IF NOT EXISTS durata_incarico_descrizione TEXT;

COMMENT ON COLUMN ana_organi_controllo.funzioni_organo_interno_id IS
    'Funzioni dell''organo interno (configurazione "Sindaco unico"): riferimento a cat_funzioni_organo_interno, mai testo libero.';

COMMENT ON COLUMN ana_organi_controllo.revisione_legale_affidata_a_id IS
    'Revisione legale affidata a (catalogo condiviso da tutte le configurazioni della sezione): riferimento a cat_affidatari_revisione_legale, mai testo libero.';

COMMENT ON COLUMN ana_organi_controllo.durata_incarico_tipo_id IS
    'Durata dell''incarico (configurazione "Sindaco unico"): riferimento a cat_durate_incarico_organi_controllo, mai testo libero.';

COMMENT ON COLUMN ana_organi_controllo.durata_incarico_data_bilancio IS
    'Data di approvazione del bilancio: valorizzata solo quando durata_incarico_tipo_id punta a "Fino all''approvazione del bilancio".';

COMMENT ON COLUMN ana_organi_controllo.durata_incarico_descrizione IS
    'Descrizione libera della durata: valorizzata solo quando durata_incarico_tipo_id punta a "Altra durata risultante dall''atto di nomina".';
