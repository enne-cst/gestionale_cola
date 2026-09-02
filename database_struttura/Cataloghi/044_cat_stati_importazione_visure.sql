/*
===============================================================================
 MIGRAZIONE 044 - CATALOGO DEGLI STATI DI IMPORTAZIONE VISURA
===============================================================================

 Scopo
 -----
 Correzione 24 (card "Aggiornamento impresa"), §5: stato tecnico di
 `sys_importazioni_visure_cciaa.stato_importazione_id`. Non elencato tra i
 tre cataloghi nominati esplicitamente dal §4 del testo, ma necessario allo
 schema di §5 — introdotto qui con lo stesso criterio già usato in
 Correzione 23 per `cat_stati_unita_locale` quando il testo richiedeva un
 campo senza nominarne il catalogo di supporto.

 Valori dedotti dagli esempi del §6 ("Stato importazione"/"Esito"):
 "Completata", "In elaborazione", "Da verificare", "Elaborazione non
 riuscita" — esplicitamente distinto dalla conferma del consulente
 (`sys_importazioni_visure_cciaa.confermata_at`, non un valore di questo
 catalogo, § "Stato" della cronologia deve usare il sistema di conferma
 già presente, mai duplicare l'esito tecnico).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_stati_importazione_visure
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_importazione_visure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_stati_importazione_visure_codice
        UNIQUE (codice)
);


INSERT INTO cat_stati_importazione_visure (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_ELABORAZIONE', 'In elaborazione', NULL, 1, TRUE),
    ('COMPLETATA', 'Completata', NULL, 2, TRUE),
    ('DA_VERIFICARE', 'Da verificare', NULL, 3, TRUE),
    ('ELABORAZIONE_NON_RIUSCITA', 'Elaborazione non riuscita', NULL, 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_stati_importazione_visure IS
    'Catalogo degli stati tecnici di elaborazione di un''importazione visura (Correzione 24 §5), distinto dalla conferma del consulente.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_stati_importazione_visure_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_stati_importazione_visure_set_updated_at
    ON cat_stati_importazione_visure;

CREATE TRIGGER trg_cat_stati_importazione_visure_set_updated_at
BEFORE UPDATE ON cat_stati_importazione_visure
FOR EACH ROW
EXECUTE FUNCTION fn_cat_stati_importazione_visure_set_updated_at();


COMMIT;
