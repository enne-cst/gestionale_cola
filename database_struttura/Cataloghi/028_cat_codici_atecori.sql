/*
===============================================================================
 MIGRAZIONE 028 - CATALOGO DEI CODICI ATECORI 2007-2022
===============================================================================

 Scopo
 -----
 Crea il catalogo ufficiale e versionato dei codici di classificazione
 ATECORI 2007-2022, usato dal campo "ATECORI 2007-2022" della sezione
 "Attività economica" (Correzione 19, prima parte della card "Attività,
 albi, ruoli e licenze"). Stessa motivazione e stesse convenzioni di
 cat_codici_ateco_2025 (migrazione 027): tabella dedicata invece di una
 colonna "sistema" condivisa, per restare compatibile con il meccanismo
 generico a catalogo (`CampoCatalogo`) che risolve le opzioni da un solo
 model senza filtro.

 Nasce vuoto, stesso motivo di cat_codici_ateco_2025: import dedicato fuori
 scopo per questa correzione.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_codici_atecori
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_codici_atecori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(20) NOT NULL,
    denominazione TEXT NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    data_inizio_validita DATE,
    data_fine_validita DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_codici_atecori_codice
        UNIQUE (codice),

    CONSTRAINT chk_cat_codici_atecori_date
        CHECK (
            data_fine_validita IS NULL
            OR data_inizio_validita IS NULL
            OR data_fine_validita >= data_inizio_validita
        )
);

COMMENT ON TABLE cat_codici_atecori IS
    'Catalogo ufficiale e versionato dei codici di classificazione ATECORI 2007-2022 (codice, denominazione ufficiale, validità, stato attivo). Nasce vuoto: da popolare con un import dedicato, fuori dallo scopo della Correzione 19.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_codici_atecori_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_codici_atecori_set_updated_at() IS
    'Aggiorna cat_codici_atecori.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_codici_atecori_set_updated_at
    ON cat_codici_atecori;

CREATE TRIGGER trg_cat_codici_atecori_set_updated_at
BEFORE UPDATE ON cat_codici_atecori
FOR EACH ROW
EXECUTE FUNCTION fn_cat_codici_atecori_set_updated_at();


COMMIT;
