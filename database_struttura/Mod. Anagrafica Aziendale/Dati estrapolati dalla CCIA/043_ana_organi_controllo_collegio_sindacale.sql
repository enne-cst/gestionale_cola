-- =======================================================================
-- CORREZIONE 14 - CAMPO DELLA CONFIGURAZIONE "COLLEGIO SINDACALE"
-- =======================================================================
--
-- Aggiunge a ana_organi_controllo (migrazione 041, già applicata, non più
-- modificabile per convenzione CLAUDE.md) la colonna "Sindaci effettivi"
-- (§ Correzione 14): solo 3 o 5, un vincolo di struttura del collegio, non
-- una classificazione estendibile — nessun catalogo per esplicita richiesta
-- dell'utente ("Non è necessaria una tabella di catalogo... Il database
-- deve comunque accettare esclusivamente 3 oppure 5").
--
-- "Sindaci supplenti" (sempre 2) e "Numero componenti" (sindaci effettivi +
-- 2) non hanno colonna propria: calcolati lato backend
-- (registro_campi.py), come "Numero componenti" della configurazione
-- "Amministratore unico" (Correzione 05) e "Sindaco unico" (Correzione 13).
--
-- Nessun dato esistente viene toccato o rimosso.

ALTER TABLE ana_organi_controllo
    ADD COLUMN IF NOT EXISTS sindaci_effettivi INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_organi_controllo_sindaci_effettivi'
    ) THEN
        ALTER TABLE ana_organi_controllo
            ADD CONSTRAINT chk_ana_organi_controllo_sindaci_effettivi
                CHECK (sindaci_effettivi IS NULL OR sindaci_effettivi IN (3, 5));
    END IF;
END;
$$;

COMMENT ON COLUMN ana_organi_controllo.sindaci_effettivi IS
    'Numero di sindaci effettivi (configurazione "Collegio sindacale"): solo 3 o 5, vincolo di dominio del modello collegiale, non una classificazione estendibile — mai un catalogo.';
