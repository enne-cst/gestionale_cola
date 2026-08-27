
-- =======================================================================
-- CORREZIONE 04 - ORGANO AMMINISTRATIVO IN CARICA COME CHIAVE ESTERNA
-- =======================================================================
--
-- Il campo "Organo amministrativo in carica" di ana_amministrazione_controllo
-- (colonna di testo libero VARCHAR(255) nella migrazione 007, già applicata
-- e quindi non più modificabile per convenzione CLAUDE.md) diventa il campo
-- principale della sezione "Amministratori": il suo valore proviene ora dal
-- catalogo cat_organi_amministrativi (migrazione 011 di Cataloghi/), non da
-- testo libero.
--
-- Sostituisce la colonna di testo con una chiave esterna all'id del
-- catalogo. Nessun dato storico da preservare in ambiente di sviluppo: la
-- colonna testuale non è mai stata valorizzata al di fuori di prove locali.

ALTER TABLE ana_amministrazione_controllo
    ADD COLUMN IF NOT EXISTS organo_amministrativo_id UUID
        REFERENCES cat_organi_amministrativi(id);

ALTER TABLE ana_amministrazione_controllo
    DROP COLUMN IF EXISTS organo_amministrativo_in_carica;

COMMENT ON COLUMN ana_amministrazione_controllo.organo_amministrativo_id IS
    'Organo amministrativo in carica: riferimento a cat_organi_amministrativi, mai denominazione come testo libero.';
