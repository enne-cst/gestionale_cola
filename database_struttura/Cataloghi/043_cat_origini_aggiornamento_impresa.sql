/*
===============================================================================
 MIGRAZIONE 043 - CATALOGO DELLE ORIGINI DI AGGIORNAMENTO IMPRESA
===============================================================================

 Scopo
 -----
 Correzione 24 (card "Aggiornamento impresa"), §4: origine di
 `ana_pratiche_camerali.origine_id`, riusato da `ana_trasferimenti_quote`/
 `ana_variazioni_sede_legale` (stesso motivo di `cat_esiti_pratiche_camerali`,
 vedi migrazione 042).

 Tre dei quattro esempi del §6 ("Origine") sono valori statici, seminati
 qui: "Registro Imprese", "Importazione manuale", "Aggiornamento del
 consulente". Il quarto esempio, "Visura estratta il 01/07/2026", non è un
 valore di catalogo (contiene una data variabile) — viene composto in
 lettura da `sys_importazioni_visure_cciaa.data_estrazione_visura` nella
 vista `vw_ana_cronologia_aggiornamenti_impresa` (migrazione successiva).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_origini_aggiornamento_impresa
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_origini_aggiornamento_impresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_origini_aggiornamento_impresa_codice
        UNIQUE (codice)
);


INSERT INTO cat_origini_aggiornamento_impresa (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('REGISTRO_IMPRESE', 'Registro Imprese', NULL, 1, TRUE),
    ('IMPORTAZIONE_MANUALE', 'Importazione manuale', NULL, 2, TRUE),
    ('AGGIORNAMENTO_CONSULENTE', 'Aggiornamento del consulente', NULL, 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_origini_aggiornamento_impresa IS
    'Catalogo delle origini di un evento della cronologia "Aggiornamento impresa" (Correzione 24 §4/§6).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_origini_aggiornamento_impresa_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_origini_aggiornamento_impresa_set_updated_at
    ON cat_origini_aggiornamento_impresa;

CREATE TRIGGER trg_cat_origini_aggiornamento_impresa_set_updated_at
BEFORE UPDATE ON cat_origini_aggiornamento_impresa
FOR EACH ROW
EXECUTE FUNCTION fn_cat_origini_aggiornamento_impresa_set_updated_at();


COMMIT;
