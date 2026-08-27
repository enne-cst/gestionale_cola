/*
===============================================================================
 MIGRAZIONE 012 - CATALOGO DELLE DURATE DI CARICA
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Durata in carica" della configurazione "Amministratore unico" (Correzione
 05, sezione Amministratori dell'Anagrafica Aziendale).

 In base alla voce scelta, il frontend mostra un campo aggiuntivo diverso
 (nessuno per "a tempo indeterminato"/"fino a revoca", il numero di esercizi
 per "per un numero determinato di esercizi", la data di scadenza per "fino a
 una data stabilita"): il frontend instrada su questo `codice`, mai sul testo
 della denominazione.

 Prerequisiti
 ------------
 Nessuno: stesso pattern semplice di cat_organi_amministrativi (migrazione
 011), non legato a un modulo/certificazione specifica.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_durate_carica
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_durate_carica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_durate_carica_codice
        UNIQUE (codice)
);


INSERT INTO cat_durate_carica (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('A_TEMPO_INDETERMINATO', 'A tempo indeterminato', 1, TRUE),
    ('FINO_A_REVOCA', 'Fino a revoca', 2, TRUE),
    ('PER_NUMERO_ESERCIZI', 'Per un numero determinato di esercizi', 3, TRUE),
    ('FINO_A_DATA', 'Fino a una data stabilita', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_durate_carica IS
    'Catalogo estendibile delle modalità di durata della carica, usato dal campo "Durata in carica" delle configurazioni per organo amministrativo.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_durate_carica_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_durate_carica_set_updated_at() IS
    'Aggiorna cat_durate_carica.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_durate_carica_set_updated_at
    ON cat_durate_carica;

CREATE TRIGGER trg_cat_durate_carica_set_updated_at
BEFORE UPDATE ON cat_durate_carica
FOR EACH ROW
EXECUTE FUNCTION fn_cat_durate_carica_set_updated_at();


COMMIT;
