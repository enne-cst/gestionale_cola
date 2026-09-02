/*
===============================================================================
 MIGRAZIONE 029 - CATALOGO DEI CODICI NACE 2.1
===============================================================================

 Scopo
 -----
 Crea il catalogo ufficiale e versionato dei codici di classificazione
 NACE 2.1, usato dal campo "Codice NACE 2.1" della sezione "Attività
 economica" (Correzione 19, prima parte della card "Attività, albi, ruoli e
 licenze"). Stessa motivazione e stesse convenzioni di cat_codici_ateco_2025
 e cat_codici_atecori (migrazioni 027/028).

 Nasce vuoto, stesso motivo delle due precedenti: import dedicato fuori
 scopo per questa correzione.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_codici_nace
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_codici_nace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(20) NOT NULL,
    denominazione TEXT NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    data_inizio_validita DATE,
    data_fine_validita DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_codici_nace_codice
        UNIQUE (codice),

    CONSTRAINT chk_cat_codici_nace_date
        CHECK (
            data_fine_validita IS NULL
            OR data_inizio_validita IS NULL
            OR data_fine_validita >= data_inizio_validita
        )
);

COMMENT ON TABLE cat_codici_nace IS
    'Catalogo ufficiale e versionato dei codici di classificazione NACE 2.1 (codice, denominazione ufficiale, validità, stato attivo). Nasce vuoto: da popolare con un import dedicato, fuori dallo scopo della Correzione 19.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_codici_nace_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_codici_nace_set_updated_at() IS
    'Aggiorna cat_codici_nace.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_codici_nace_set_updated_at
    ON cat_codici_nace;

CREATE TRIGGER trg_cat_codici_nace_set_updated_at
BEFORE UPDATE ON cat_codici_nace
FOR EACH ROW
EXECUTE FUNCTION fn_cat_codici_nace_set_updated_at();


COMMIT;
