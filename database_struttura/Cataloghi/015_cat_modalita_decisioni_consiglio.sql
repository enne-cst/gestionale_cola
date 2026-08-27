/*
===============================================================================
 MIGRAZIONE 015 - CATALOGO DELLE MODALITÀ DI DECISIONE DEL CONSIGLIO
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Modalità delle decisioni del consiglio" della configurazione "Consiglio di
 amministrazione" (Correzione 06, sezione Amministratori dell'Anagrafica
 Aziendale).

 Verificato prima di crearla (§ Correzione 06 punto 9) che non esistesse già
 una struttura equivalente: `ana_sistemi_amministrazione.regole_decisionali`
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
 TABELLA CATALOGO: cat_modalita_decisioni_consiglio
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_modalita_decisioni_consiglio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_modalita_decisioni_consiglio_codice
        UNIQUE (codice)
);


INSERT INTO cat_modalita_decisioni_consiglio (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('RIUNIONE_COLLEGIALE', 'Riunione collegiale', NULL, 1, TRUE),
    ('CONSULTAZIONE_SCRITTA_STATUTO', 'Consultazione scritta prevista dallo statuto', NULL, 2, TRUE),
    ('CONSENSO_SCRITTO_STATUTO', 'Consenso espresso per iscritto previsto dallo statuto', NULL, 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_modalita_decisioni_consiglio IS
    'Catalogo estendibile delle modalità con cui il consiglio di amministrazione assume le proprie decisioni, usato dal campo "Modalità delle decisioni del consiglio".';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_modalita_decisioni_consiglio_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_modalita_decisioni_consiglio_set_updated_at() IS
    'Aggiorna cat_modalita_decisioni_consiglio.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_modalita_decisioni_consiglio_set_updated_at
    ON cat_modalita_decisioni_consiglio;

CREATE TRIGGER trg_cat_modalita_decisioni_consiglio_set_updated_at
BEFORE UPDATE ON cat_modalita_decisioni_consiglio
FOR EACH ROW
EXECUTE FUNCTION fn_cat_modalita_decisioni_consiglio_set_updated_at();


COMMIT;
