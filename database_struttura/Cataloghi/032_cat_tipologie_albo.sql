/*
===============================================================================
 MIGRAZIONE 032 - CATALOGO DELLE TIPOLOGIE DI ALBO
===============================================================================

 Scopo
 -----
 Correzione 21, punto 2 (form "Aggiungi albo"): campo "Tipologia di albo",
 da cui si compila (o si corregge manualmente, se non disponibile) la
 "Denominazione dell'albo". Nasce vuoto: nessun elenco ufficiale univoco di
 tipologie di albo è stato fornito o verificato in questa correzione, e §
 CLAUDE.md/§ punto 6 della correzione vietano di aggiungere voci ai
 cataloghi senza una fonte verificata — stesso criterio già adottato in
 Correzione 19 per i cataloghi ATECO/ATECORI/NACE (nati vuoti "in attesa di
 analisi/import dedicati"). Popolamento reale rimandato a una correzione
 successiva o a un import dedicato.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_tipologie_albo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_albo_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_tipologie_albo IS
    'Catalogo estendibile delle tipologie di albo (Correzione 21 punto 2), nato vuoto in attesa di un elenco ufficiale verificato.';


CREATE OR REPLACE FUNCTION fn_cat_tipologie_albo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipologie_albo_set_updated_at ON cat_tipologie_albo;

CREATE TRIGGER trg_cat_tipologie_albo_set_updated_at
BEFORE UPDATE ON cat_tipologie_albo
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_albo_set_updated_at();


COMMIT;
