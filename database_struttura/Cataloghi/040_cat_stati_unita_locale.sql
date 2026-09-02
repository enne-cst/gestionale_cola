/*
===============================================================================
 MIGRAZIONE 040 - CATALOGO DEGLI STATI AMMINISTRATIVI DI UNITA' LOCALE
===============================================================================

 Scopo
 -----
 Correzione 23 (card "Sedi secondarie e unità locali"), §7: stato
 amministrativo dell'unità locale (catalogo `cat_stati_unita_locale`),
 esplicitamente distinto dalla conferma delle informazioni da parte del
 consulente — quella resta sul meccanismo generico `app.core.verifica_riga`,
 invariato, applicato per riga tramite `SEZIONE_CODICE_VERIFICA_UNITA_LOCALI`.

 Quattro valori elencati esplicitamente nel testo della correzione: seminati
 qui, stesso criterio di `cat_stati_titoli_abilitativi` (migrazione 031).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_stati_unita_locale
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_unita_locale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_stati_unita_locale_codice
        UNIQUE (codice)
);


INSERT INTO cat_stati_unita_locale (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('ATTIVA', 'Attiva', NULL, 1, TRUE),
    ('SOSPESA', 'Sospesa', NULL, 2, TRUE),
    ('CESSATA', 'Cessata', NULL, 3, TRUE),
    ('NON_INDICATA', 'Non indicata', NULL, 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_stati_unita_locale IS
    'Catalogo degli stati amministrativi di un''unità locale (Correzione 23 §7), distinto dallo stato di conferma del consulente.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_stati_unita_locale_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_stati_unita_locale_set_updated_at
    ON cat_stati_unita_locale;

CREATE TRIGGER trg_cat_stati_unita_locale_set_updated_at
BEFORE UPDATE ON cat_stati_unita_locale
FOR EACH ROW
EXECUTE FUNCTION fn_cat_stati_unita_locale_set_updated_at();


COMMIT;
