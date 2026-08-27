/*
===============================================================================
 MIGRAZIONE 016 - CATALOGO DELLE DELEGHE DEL CONSIGLIO
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Deleghe del consiglio" della configurazione "Consiglio di amministrazione"
 (Correzione 06, sezione Amministratori dell'Anagrafica Aziendale).

 Verificato prima di crearla (§ Correzione 06 punto 9) che non esistesse già
 una struttura equivalente: `ana_sistemi_amministrazione.deleghe_previste`
 (migrazione 025) è testo libero, non un catalogo — non riusabile, il campo
 qui deve salvare una chiave esterna, mai la denominazione come testo.

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
 TABELLA CATALOGO: cat_deleghe_consiglio
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_deleghe_consiglio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_deleghe_consiglio_codice
        UNIQUE (codice)
);


INSERT INTO cat_deleghe_consiglio (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('DELEGHE_LIMITI_LEGGE_STATUTO', 'Deleghe ammesse nei limiti di legge e statuto', NULL, 1, TRUE),
    ('NESSUNA_DELEGA', 'Nessuna delega', NULL, 2, TRUE),
    ('DELEGHE_UNO_O_PIU_CONSIGLIERI', 'Deleghe attribuite a uno o più consiglieri', NULL, 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_deleghe_consiglio IS
    'Catalogo estendibile delle deleghe attribuibili dal consiglio di amministrazione, usato dal campo "Deleghe del consiglio".';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_deleghe_consiglio_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_deleghe_consiglio_set_updated_at() IS
    'Aggiorna cat_deleghe_consiglio.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_deleghe_consiglio_set_updated_at
    ON cat_deleghe_consiglio;

CREATE TRIGGER trg_cat_deleghe_consiglio_set_updated_at
BEFORE UPDATE ON cat_deleghe_consiglio
FOR EACH ROW
EXECUTE FUNCTION fn_cat_deleghe_consiglio_set_updated_at();


COMMIT;
