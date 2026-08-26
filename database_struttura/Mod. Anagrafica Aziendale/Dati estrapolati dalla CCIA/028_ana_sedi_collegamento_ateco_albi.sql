/*
===============================================================================
 028 - COLLEGAMENTO OPZIONALE DI CODICI ATECO E ALBI/LICENZE A UNA SEDE
===============================================================================

 Scopo
 -----
 Aggiunge un riferimento opzionale a ana_sedi su ana_codici_ateco (005) e
 ana_albi_ruoli_licenze (014), richiesto dalla mappatura CCIAA §10.2 per
 "Classificazioni dell'attività dell'unità" e "Albi, ruoli, licenze e
 autorizzazioni dell'unità".

 sede_id NULL (comportamento invariato) = il record resta riferito
 all'intera azienda, come oggi. sede_id valorizzato = il record è
 specifico di quella unità locale. Nessun record esistente viene toccato:
 la colonna nasce NULL per tutte le righe già presenti.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_codici_ateco
    ADD COLUMN IF NOT EXISTS sede_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_codici_ateco_sede'
    ) THEN
        ALTER TABLE ana_codici_ateco
            ADD CONSTRAINT fk_ana_codici_ateco_sede
            FOREIGN KEY (sede_id)
            REFERENCES ana_sedi(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ana_codici_ateco_sede
    ON ana_codici_ateco (sede_id);


ALTER TABLE ana_albi_ruoli_licenze
    ADD COLUMN IF NOT EXISTS sede_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_albi_ruoli_licenze_sede'
    ) THEN
        ALTER TABLE ana_albi_ruoli_licenze
            ADD CONSTRAINT fk_ana_albi_ruoli_licenze_sede
            FOREIGN KEY (sede_id)
            REFERENCES ana_sedi(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ana_albi_ruoli_licenze_sede
    ON ana_albi_ruoli_licenze (sede_id);

COMMIT;
