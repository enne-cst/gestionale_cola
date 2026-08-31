/*
===============================================================================
 MIGRAZIONE 020 - CATALOGO DEGLI ASSETTI DI CONTROLLO
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Assetto di controllo in carica" della sezione Organi di controllo
 (Correzione 11, card "Sindaci" dell'Anagrafica Aziendale).

 Il campo è il campo principale della sezione (stesso ruolo di "Organo
 amministrativo in carica" per la card "Amministratori", § Correzione 04):
 la scelta effettuata determina quali campi/blocchi vengono mostrati
 successivamente, il dettaglio per singolo assetto sarà definito nelle
 correzioni successive.

 Contiene più di tre valori, quindi per convenzione (§ CLAUDE.md,
 "Configurazione prima della programmazione") non è scritto direttamente nel
 frontend ma proviene da questo catalogo estendibile.

 Prerequisiti
 ------------
 Nessuno: catalogo autonomo, stesso pattern semplice di
 cat_organi_amministrativi (migrazione 011).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_assetti_controllo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_assetti_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_assetti_controllo_codice
        UNIQUE (codice)
);


INSERT INTO cat_assetti_controllo (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('NESSUN_ORGANO_CONTROLLO', 'Nessun organo di controllo o revisore', NULL, 1, TRUE),
    ('SINDACO_UNICO', 'Sindaco unico', NULL, 2, TRUE),
    ('COLLEGIO_SINDACALE', 'Collegio sindacale', NULL, 3, TRUE),
    ('REVISORE_LEGALE_PERSONA_FISICA', 'Revisore legale persona fisica', NULL, 4, TRUE),
    ('SOCIETA_REVISIONE_LEGALE', 'Società di revisione legale', NULL, 5, TRUE),
    ('SINDACO_UNICO_REVISORE_ESTERNO', 'Sindaco unico + revisore esterno', NULL, 6, TRUE),
    ('COLLEGIO_SINDACALE_REVISORE_ESTERNO', 'Collegio sindacale + revisore esterno', NULL, 7, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_assetti_controllo IS
    'Catalogo estendibile degli assetti di controllo selezionabili nel campo "Assetto di controllo in carica" (sezione Organi di controllo).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_assetti_controllo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_assetti_controllo_set_updated_at() IS
    'Aggiorna cat_assetti_controllo.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_assetti_controllo_set_updated_at
    ON cat_assetti_controllo;

CREATE TRIGGER trg_cat_assetti_controllo_set_updated_at
BEFORE UPDATE ON cat_assetti_controllo
FOR EACH ROW
EXECUTE FUNCTION fn_cat_assetti_controllo_set_updated_at();


COMMIT;
