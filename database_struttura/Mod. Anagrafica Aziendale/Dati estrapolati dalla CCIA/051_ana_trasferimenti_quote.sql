/*
===============================================================================
 MIGRAZIONE 051 - TRASFERIMENTI DI QUOTE (CORREZIONE 24, tabella indicativa)
===============================================================================

 Scopo
 -----
 Correzione 24 §2: sorgente dell'indicatore "Trasferimenti di quote" e di
 righe della cronologia "Aggiornamento impresa". Il testo della correzione
 richiede "la struttura dedicata ai trasferimenti di quote" senza
 specificarne i campi (a differenza di `ana_pratiche_camerali`, §3,
 interamente specificata) — struttura indicativa minima, segnalata come
 tale (§ testo esplicito, "se una struttura di origine non esiste, Claude
 deve segnalarlo e proporre la tabella mancante"): sufficiente a contare le
 righe e ad alimentare la cronologia, senza anticipare un form di
 inserimento non richiesto da questa correzione (nessuna pipeline di
 acquisizione dati esiste ancora, stesso limite di
 `sys_importazioni_visure_cciaa`). Dettaglio completo (cedente/cessionario,
 quota ceduta, ...) rimandato a una correzione dedicata.

 `pratica_id`/`origine_id`/`esito_id` riusano rispettivamente
 `ana_pratiche_camerali` e i due cataloghi di Correzione 24 §4, mai
 duplicati per questa tabella.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS ana_trasferimenti_quote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),

    data_trasferimento DATE,
    descrizione TEXT,
    pratica_id UUID REFERENCES ana_pratiche_camerali(id),
    origine_id UUID REFERENCES cat_origini_aggiornamento_impresa(id),
    esito_id UUID REFERENCES cat_esiti_pratiche_camerali(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ana_trasferimenti_quote IS
    'Trasferimenti di quote dell''azienda (Correzione 24 §2), struttura indicativa minima: dettaglio completo rimandato a correzione dedicata.';

CREATE INDEX IF NOT EXISTS idx_ana_trasferimenti_quote_azienda
    ON ana_trasferimenti_quote (azienda_id);


CREATE OR REPLACE FUNCTION fn_ana_trasferimenti_quote_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_trasferimenti_quote_set_updated_at
    ON ana_trasferimenti_quote;

CREATE TRIGGER trg_ana_trasferimenti_quote_set_updated_at
BEFORE UPDATE ON ana_trasferimenti_quote
FOR EACH ROW
EXECUTE FUNCTION fn_ana_trasferimenti_quote_set_updated_at();

COMMIT;
