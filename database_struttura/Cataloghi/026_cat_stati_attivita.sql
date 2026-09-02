/*
===============================================================================
 MIGRAZIONE 026 - CATALOGO DEGLI STATI DELL'ATTIVITA' AZIENDALE
===============================================================================

 Scopo
 -----
 Crea il catalogo utilizzato dal menu a tendina del campo "Stato attività"
 della nuova sezione "Attività economica" (Correzione 19, prima parte della
 card "Attività, albi, ruoli e licenze" dell'Anagrafica Aziendale).

 Stesso pattern semplice di cat_organi_amministrativi/cat_assetti_controllo
 (migrazioni 011/020): codice stabile, denominazione mostrata in interfaccia,
 ordine di visualizzazione, flag attivo.

 A differenza degli altri cataloghi della griglia CCIAA, QUESTO catalogo
 nasce volutamente VUOTO: l'utente ha chiesto esplicitamente di definire i
 valori solo dopo aver analizzato gli stati effettivamente presenti nelle
 visure camerali reali, per non inventare un elenco a priori. Le opzioni
 verranno aggiunte con una migrazione successiva (ALTER... anzi INSERT,
 stesso schema di questa tabella, mai modificando questo file una volta
 applicato).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_stati_attivita
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_attivita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_stati_attivita_codice
        UNIQUE (codice)
);

COMMENT ON TABLE cat_stati_attivita IS
    'Catalogo estendibile degli stati selezionabili nel campo "Stato attività" (sezione Attività economica). Nasce vuoto per scelta: le opzioni si aggiungono dopo l''analisi dei valori reali presenti nelle visure.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_stati_attivita_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_stati_attivita_set_updated_at() IS
    'Aggiorna cat_stati_attivita.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_stati_attivita_set_updated_at
    ON cat_stati_attivita;

CREATE TRIGGER trg_cat_stati_attivita_set_updated_at
BEFORE UPDATE ON cat_stati_attivita
FOR EACH ROW
EXECUTE FUNCTION fn_cat_stati_attivita_set_updated_at();


COMMIT;
