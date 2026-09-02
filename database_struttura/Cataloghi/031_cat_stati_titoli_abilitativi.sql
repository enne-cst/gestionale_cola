/*
===============================================================================
 MIGRAZIONE 031 - CATALOGO DEGLI STATI DEL TITOLO ABILITATIVO
===============================================================================

 Scopo
 -----
 Correzione 21, punto 1: "Stato del titolo" — campo comune ai quattro form
 (Albo/Ruolo/Licenza/Certificazione o attestazione), esplicitamente distinto
 dallo stato di conferma del consulente (quello continua a usare
 `app.core.verifica_riga`, invariato). Cinque stati amministrativi, elencati
 testualmente nella correzione ("attivo, sospeso, scaduto, revocato o
 cessato"): seminati qui perché il testo li enumera in modo esplicito, a
 differenza dei cataloghi aperti della stessa correzione (tipologie di
 albo/ruolo/licenza, norme di certificazione, categorie/classifiche SOA)
 lasciati nati vuoti in attesa di un elenco ufficiale verificato (stesso
 criterio già adottato in Correzione 19 per i cataloghi ATECO/ATECORI/NACE).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_stati_titoli_abilitativi
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_titoli_abilitativi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_stati_titoli_abilitativi_codice
        UNIQUE (codice)
);


INSERT INTO cat_stati_titoli_abilitativi (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('ATTIVO', 'Attivo', NULL, 1, TRUE),
    ('SOSPESO', 'Sospeso', NULL, 2, TRUE),
    ('SCADUTO', 'Scaduto', NULL, 3, TRUE),
    ('REVOCATO', 'Revocato', NULL, 4, TRUE),
    ('CESSATO', 'Cessato', NULL, 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_stati_titoli_abilitativi IS
    'Catalogo degli stati amministrativi di un titolo abilitativo (Correzione 21 punto 1), distinto dallo stato di conferma del consulente.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_stati_titoli_abilitativi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_stati_titoli_abilitativi_set_updated_at
    ON cat_stati_titoli_abilitativi;

CREATE TRIGGER trg_cat_stati_titoli_abilitativi_set_updated_at
BEFORE UPDATE ON cat_stati_titoli_abilitativi
FOR EACH ROW
EXECUTE FUNCTION fn_cat_stati_titoli_abilitativi_set_updated_at();


COMMIT;
