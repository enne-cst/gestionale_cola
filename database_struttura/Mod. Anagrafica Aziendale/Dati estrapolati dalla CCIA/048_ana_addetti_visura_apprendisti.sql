-- =======================================================
-- ANAGRAFICA AZIENDALE - PERSONALE E OCCUPAZIONE (Correzione 22)
-- Aggiunge la percentuale "Apprendisti" al gruppo Distribuzione per
-- inquadramento (Apprendisti/Operai/Impiegati), mancante nello schema
-- originario che copriva solo Operai/Impiegati.
-- =======================================================

ALTER TABLE ana_addetti_visura_periodi
    ADD COLUMN IF NOT EXISTS percentuale_apprendisti NUMERIC(5,2);

ALTER TABLE ana_addetti_visura_periodi
    ADD CONSTRAINT chk_ana_addetti_percentuale_apprendisti
        CHECK (
            percentuale_apprendisti IS NULL
            OR percentuale_apprendisti BETWEEN 0 AND 100
        );
