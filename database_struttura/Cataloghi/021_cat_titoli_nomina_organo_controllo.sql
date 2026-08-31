/*
===============================================================================
 MIGRAZIONE 021 - CATALOGO DEI TITOLI DELLA NOMINA (ORGANO DI CONTROLLO)
===============================================================================

 Scopo
 -----
 Questa migrazione crea (vuoto) il catalogo che alimenterà il menu a tendina
 del campo "Titolo della nomina" della sezione Organi di controllo
 (Correzione 11, card "Sindaci" dell'Anagrafica Aziendale).

 Il campo è tra le "Impostazioni generali" richieste dalla Correzione 11, ma
 le sue opzioni sono esplicitamente rimandate a una correzione successiva
 ("Le opzioni del campo Titolo della nomina verranno definite
 separatamente"): questa migrazione crea solo la struttura del catalogo (§
 CLAUDE.md, "Configurazione prima della programmazione"), senza riga alcuna.
 Finché resta vuoto, il campo in `registro_campi.py` non ha opzioni da
 mostrare: nessun comportamento errato, solo non ancora popolato.

 Prerequisiti
 ------------
 Nessuno: stesso pattern semplice di cat_assetti_controllo (migrazione 020).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_titoli_nomina_organo_controllo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_titoli_nomina_organo_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_titoli_nomina_organo_controllo_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_titoli_nomina_organo_controllo IS
    'Catalogo estendibile (ancora vuoto, § Correzione 11: opzioni definite separatamente) dei titoli della nomina selezionabili nel campo "Titolo della nomina" (sezione Organi di controllo).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_titoli_nomina_organo_controllo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_titoli_nomina_organo_controllo_set_updated_at() IS
    'Aggiorna cat_titoli_nomina_organo_controllo.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_titoli_nomina_organo_controllo_set_updated_at
    ON cat_titoli_nomina_organo_controllo;

CREATE TRIGGER trg_cat_titoli_nomina_organo_controllo_set_updated_at
BEFORE UPDATE ON cat_titoli_nomina_organo_controllo
FOR EACH ROW
EXECUTE FUNCTION fn_cat_titoli_nomina_organo_controllo_set_updated_at();


COMMIT;
