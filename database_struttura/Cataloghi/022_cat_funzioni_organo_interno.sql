/*
===============================================================================
 MIGRAZIONE 022 - CATALOGO DELLE FUNZIONI DELL'ORGANO INTERNO
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Funzioni dell'organo interno" della configurazione "Sindaco unico" (§
 Correzione 13, sezione Organi di controllo, card "Sindaci").

 Prerequisiti
 ------------
 Nessuno: catalogo autonomo, stesso pattern semplice di
 cat_assetti_controllo (migrazione 020).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_funzioni_organo_interno
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_funzioni_organo_interno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_funzioni_organo_interno_codice
        UNIQUE (codice)
);


INSERT INTO cat_funzioni_organo_interno (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('VIGILANZA_GESTIONE', 'Vigilanza sulla gestione', NULL, 1, TRUE),
    (
        'VIGILANZA_GESTIONE_E_REVISIONE_LEGALE',
        'Vigilanza sulla gestione e revisione legale, se consentita e prevista dall''atto costitutivo',
        NULL, 2, TRUE
    ),
    ('COMPETENZE_ATTO_COSTITUTIVO', 'Competenze definite dall''atto costitutivo', NULL, 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_funzioni_organo_interno IS
    'Catalogo estendibile delle funzioni dell''organo interno di controllo, usato dal campo "Funzioni dell''organo interno" (configurazione "Sindaco unico").';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_funzioni_organo_interno_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_funzioni_organo_interno_set_updated_at() IS
    'Aggiorna cat_funzioni_organo_interno.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_funzioni_organo_interno_set_updated_at
    ON cat_funzioni_organo_interno;

CREATE TRIGGER trg_cat_funzioni_organo_interno_set_updated_at
BEFORE UPDATE ON cat_funzioni_organo_interno
FOR EACH ROW
EXECUTE FUNCTION fn_cat_funzioni_organo_interno_set_updated_at();


COMMIT;
