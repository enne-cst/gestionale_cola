/*
===============================================================================
 MIGRAZIONE 019 - CATALOGO DELLA GESTIONE DELL'OPPOSIZIONE
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Gestione dell'opposizione" della configurazione "Amministrazione
 pluripersonale disgiuntiva" (Correzione 08, sezione Amministratori
 dell'Anagrafica Aziendale).

 Contiene oggi solo due opzioni, ma per esplicita richiesta dell'utente
 (§ Correzione 08, "regola generale sui cataloghi": anche un menu con due o
 tre opzioni deve usare una tabella di catalogo quando rappresenta una
 classificazione aziendale destinata a evolversi) non è scritto direttamente
 nel frontend — stesso pattern di cat_modalita_decisioni_consiglio/
 cat_deleghe_consiglio (migrazioni 015/016), anch'essi a sole tre opzioni.

 Prerequisiti
 ------------
 Nessuno: stesso pattern semplice di cat_modalita_esercizio_poteri
 (migrazione 018).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_gestione_opposizione
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_gestione_opposizione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_gestione_opposizione_codice
        UNIQUE (codice)
);


INSERT INTO cat_gestione_opposizione (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('DECISIONE_RIMESSA_SOCI', 'Decisione rimessa ai soci', NULL, 1, TRUE),
    ('REGOLA_SPECIFICA_STATUTO', 'Regola specifica prevista dallo statuto', NULL, 2, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_gestione_opposizione IS
    'Catalogo estendibile delle modalità di gestione dell''opposizione tra amministratori, usato dal campo "Gestione dell''opposizione" (amministrazione pluripersonale disgiuntiva).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_gestione_opposizione_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_gestione_opposizione_set_updated_at() IS
    'Aggiorna cat_gestione_opposizione.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_gestione_opposizione_set_updated_at
    ON cat_gestione_opposizione;

CREATE TRIGGER trg_cat_gestione_opposizione_set_updated_at
BEFORE UPDATE ON cat_gestione_opposizione
FOR EACH ROW
EXECUTE FUNCTION fn_cat_gestione_opposizione_set_updated_at();


COMMIT;
