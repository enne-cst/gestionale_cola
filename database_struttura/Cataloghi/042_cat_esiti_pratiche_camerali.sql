/*
===============================================================================
 MIGRAZIONE 042 - CATALOGO DEGLI ESITI DI PRATICA CAMERALE
===============================================================================

 Scopo
 -----
 Correzione 24 (card "Aggiornamento impresa"), §4: esito di
 `ana_pratiche_camerali.esito_id`. Riusato anche come esito di
 `ana_trasferimenti_quote`/`ana_variazioni_sede_legale` (§2: entrambe
 "variazioni societarie rilevanti" della stessa cronologia) invece di un
 catalogo duplicato per ciascuna.

 Nessun elenco esplicito fornito dal testo della correzione (gli esempi del
 §6 — "Acquisito"/"Completato"/... — descrivono la colonna "Esito" della
 cronologia in generale, non un elenco chiuso per questo catalogo): nato
 vuoto, stesso criterio di `cat_tipologie_pratiche_camerali`.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_esiti_pratiche_camerali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_esiti_pratiche_camerali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_esiti_pratiche_camerali_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_esiti_pratiche_camerali IS
    'Catalogo degli esiti di pratica camerale (Correzione 24 §4), riusato anche da trasferimenti di quote e variazioni di sede legale; nato vuoto: nessun elenco esplicito fornito.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_esiti_pratiche_camerali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_esiti_pratiche_camerali_set_updated_at
    ON cat_esiti_pratiche_camerali;

CREATE TRIGGER trg_cat_esiti_pratiche_camerali_set_updated_at
BEFORE UPDATE ON cat_esiti_pratiche_camerali
FOR EACH ROW
EXECUTE FUNCTION fn_cat_esiti_pratiche_camerali_set_updated_at();


COMMIT;
