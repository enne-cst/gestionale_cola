/*
===============================================================================
 MIGRAZIONE 013 - CATALOGO DEI REGIMI DI RAPPRESENTANZA
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Regime di rappresentanza" della configurazione "Amministratore unico"
 (Correzione 05, sezione Amministratori dell'Anagrafica Aziendale).

 La compatibilità tra ogni regime e le diverse forme di organo amministrativo
 è modellata dalla migrazione successiva (014,
 rel_organi_amministrativi_regimi_rappresentanza): qui c'è solo il catalogo,
 senza alcun riferimento agli organi.

 Prerequisiti
 ------------
 Nessuno: stesso pattern semplice di cat_organi_amministrativi (migrazione
 011).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_regimi_rappresentanza
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_regimi_rappresentanza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_regimi_rappresentanza_codice
        UNIQUE (codice)
);


INSERT INTO cat_regimi_rappresentanza (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('RAPPRESENTANZA_GENERALE_AMMINISTRATORE_UNICO', 'Rappresentanza generale attribuita all''amministratore unico', 1, TRUE),
    ('RAPPRESENTANZA_PRESIDENTE_CONSIGLIERI_DELEGATI', 'Rappresentanza attribuita al presidente e ai consiglieri delegati', 2, TRUE),
    ('RAPPRESENTANZA_CONGIUNTIVA_ATTO_NOMINA', 'Rappresentanza congiuntiva secondo atto di nomina', 3, TRUE),
    ('RAPPRESENTANZA_DISGIUNTIVA_ATTO_NOMINA', 'Rappresentanza disgiuntiva secondo atto di nomina', 4, TRUE),
    ('RAPPRESENTANZA_MISTA_PER_CATEGORIE', 'Rappresentanza mista per categorie di atti', 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_regimi_rappresentanza IS
    'Catalogo estendibile dei regimi di rappresentanza, usato dal campo "Regime di rappresentanza" delle configurazioni per organo amministrativo.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_regimi_rappresentanza_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_regimi_rappresentanza_set_updated_at() IS
    'Aggiorna cat_regimi_rappresentanza.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_regimi_rappresentanza_set_updated_at
    ON cat_regimi_rappresentanza;

CREATE TRIGGER trg_cat_regimi_rappresentanza_set_updated_at
BEFORE UPDATE ON cat_regimi_rappresentanza
FOR EACH ROW
EXECUTE FUNCTION fn_cat_regimi_rappresentanza_set_updated_at();


COMMIT;
