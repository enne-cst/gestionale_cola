/*
===============================================================================
 MIGRAZIONE 034 - CATALOGO DELLE TIPOLOGIE DI LICENZA
===============================================================================

 Scopo
 -----
 Correzione 21, punto 4 (form "Aggiungi licenza"): campo "Tipologia di
 licenza". Nasce vuoto per lo stesso motivo di cat_tipologie_albo
 (migrazione 032): nessun elenco ufficiale verificato in questa correzione,
 popolamento rimandato.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_tipologie_licenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_licenza_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_tipologie_licenza IS
    'Catalogo estendibile delle tipologie di licenza (Correzione 21 punto 4), nato vuoto in attesa di un elenco ufficiale verificato.';


CREATE OR REPLACE FUNCTION fn_cat_tipologie_licenza_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipologie_licenza_set_updated_at ON cat_tipologie_licenza;

CREATE TRIGGER trg_cat_tipologie_licenza_set_updated_at
BEFORE UPDATE ON cat_tipologie_licenza
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_licenza_set_updated_at();


COMMIT;
