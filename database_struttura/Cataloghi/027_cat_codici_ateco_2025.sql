/*
===============================================================================
 MIGRAZIONE 027 - CATALOGO DEI CODICI ATECO 2025
===============================================================================

 Scopo
 -----
 Crea il catalogo ufficiale e versionato dei codici di classificazione
 ATECO 2025, usato dal campo "ATECO 2025" della sezione "Attività economica"
 (Correzione 19, prima parte della card "Attività, albi, ruoli e licenze").

 Richiesto esplicitamente dall'utente: ATECO non va salvato come semplice
 descrizione testuale sul record azienda, ma collegato a un catalogo che
 conserva codice, descrizione, stato attivo e date di validità. La versione
 della classificazione (2025) è fissata dal nome di questa tabella, non da
 una colonna per riga: ATECORI 2007-2022 e NACE 2.1 sono cataloghi distinti
 (migrazioni 028/029), stesso motivo per cui non esiste un'unica tabella con
 colonna "sistema" — il meccanismo generico a catalogo del registro campi
 (`CampoCatalogo`, app/core/registro_campi.py) risolve le opzioni di un
 campo da UN SOLO model, senza filtro: tre tabelle separate evitano di
 mescolare codici di sistemi diversi nello stesso menu a tendina.

 Stesso vincolo di cat_stati_attivita (migrazione 026): il catalogo nasce
 VUOTO. L'elenco ufficiale dei codici ATECO 2025 è un'importazione di dati
 esterna (migliaia di codici), fuori dallo scopo di questa correzione — sarà
 oggetto di una migrazione/procedura di import dedicata.

 La colonna `ordine_visualizzazione`, richiesta dal meccanismo generico a
 catalogo per ordinare le opzioni, andrà valorizzata in fase di import
 (tipicamente nell'ordine del codice stesso).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_codici_ateco_2025
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_codici_ateco_2025 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(20) NOT NULL,
    denominazione TEXT NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    data_inizio_validita DATE,
    data_fine_validita DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_codici_ateco_2025_codice
        UNIQUE (codice),

    CONSTRAINT chk_cat_codici_ateco_2025_date
        CHECK (
            data_fine_validita IS NULL
            OR data_inizio_validita IS NULL
            OR data_fine_validita >= data_inizio_validita
        )
);

COMMENT ON TABLE cat_codici_ateco_2025 IS
    'Catalogo ufficiale e versionato dei codici di classificazione ATECO 2025 (codice, denominazione ufficiale, validità, stato attivo). Nasce vuoto: da popolare con un import dedicato, fuori dallo scopo della Correzione 19.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_codici_ateco_2025_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_codici_ateco_2025_set_updated_at() IS
    'Aggiorna cat_codici_ateco_2025.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_codici_ateco_2025_set_updated_at
    ON cat_codici_ateco_2025;

CREATE TRIGGER trg_cat_codici_ateco_2025_set_updated_at
BEFORE UPDATE ON cat_codici_ateco_2025
FOR EACH ROW
EXECUTE FUNCTION fn_cat_codici_ateco_2025_set_updated_at();


COMMIT;
