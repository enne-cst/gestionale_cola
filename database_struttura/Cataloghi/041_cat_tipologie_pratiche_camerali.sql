/*
===============================================================================
 MIGRAZIONE 041 - CATALOGO DELLE TIPOLOGIE DI PRATICA CAMERALE
===============================================================================

 Scopo
 -----
 Correzione 24 (card "Aggiornamento impresa"), §4: tipologia di
 `ana_pratiche_camerali.tipo_pratica_id`.

 Il testo della correzione non elenca valori espliciti per questo catalogo
 (a differenza, ad esempio, di `cat_stati_unita_locale` in Correzione 23):
 nato vuoto per scelta, stesso criterio già applicato ai cataloghi ATECO/
 ATECORI/NACE in Correzione 19 quando nessun elenco esplicito era stato
 fornito — popolamento rimandato a una correzione dedicata.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_tipologie_pratiche_camerali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_tipologie_pratiche_camerali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_pratiche_camerali_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_tipologie_pratiche_camerali IS
    'Catalogo delle tipologie di pratica camerale (Correzione 24 §4), nato vuoto: nessun elenco esplicito fornito dal testo della correzione.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_tipologie_pratiche_camerali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipologie_pratiche_camerali_set_updated_at
    ON cat_tipologie_pratiche_camerali;

CREATE TRIGGER trg_cat_tipologie_pratiche_camerali_set_updated_at
BEFORE UPDATE ON cat_tipologie_pratiche_camerali
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_pratiche_camerali_set_updated_at();


COMMIT;
