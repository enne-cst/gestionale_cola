/*
===============================================================================
 MIGRAZIONE 011 - CATALOGO DEGLI ORGANI AMMINISTRATIVI
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Organo amministrativo in carica" della sezione Amministrazione e controllo
 (Correzione 04, card "Amministratori" dell'Anagrafica Aziendale).

 Il campo diventa il campo principale della sezione: la scelta effettuata
 determina quali campi/blocchi vengono mostrati successivamente (regola
 generale introdotta da questa correzione, il dettaglio per singola scelta
 sarà definito nelle correzioni successive).

 Contiene più di tre valori, quindi per convenzione (§ CLAUDE.md,
 "Configurazione prima della programmazione") non è scritto direttamente nel
 frontend ma proviene da questo catalogo estendibile.

 Prerequisiti
 ------------
 Nessuno: catalogo autonomo, non legato a un modulo/certificazione specifica
 (stesso pattern semplice di cat_stati_certificazione, non di cat_ruoli: il
 campo che lo usa appartiene già a una sezione abilitata, non serve una
 propria voce in sys_elementi).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_organi_amministrativi
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_organi_amministrativi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_organi_amministrativi_codice
        UNIQUE (codice)
);


INSERT INTO cat_organi_amministrativi (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('AMMINISTRATORE_UNICO', 'Amministratore unico', 1, TRUE),
    ('CONSIGLIO_AMMINISTRAZIONE', 'Consiglio di amministrazione', 2, TRUE),
    ('AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA', 'Amministrazione pluripersonale congiuntiva', 3, TRUE),
    ('AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA', 'Amministrazione pluripersonale disgiuntiva', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_organi_amministrativi IS
    'Catalogo estendibile degli organi amministrativi selezionabili nel campo "Organo amministrativo in carica" (sezione Amministrazione e controllo).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_organi_amministrativi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_organi_amministrativi_set_updated_at() IS
    'Aggiorna cat_organi_amministrativi.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_organi_amministrativi_set_updated_at
    ON cat_organi_amministrativi;

CREATE TRIGGER trg_cat_organi_amministrativi_set_updated_at
BEFORE UPDATE ON cat_organi_amministrativi
FOR EACH ROW
EXECUTE FUNCTION fn_cat_organi_amministrativi_set_updated_at();


COMMIT;
