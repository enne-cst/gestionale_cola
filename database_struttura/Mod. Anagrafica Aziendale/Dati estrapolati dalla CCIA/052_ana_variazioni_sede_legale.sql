/*
===============================================================================
 MIGRAZIONE 052 - VARIAZIONI DI SEDE LEGALE (CORREZIONE 24, tabella indicativa)
===============================================================================

 Scopo
 -----
 Correzione 24 §2: sorgente dell'indicatore "Trasferimenti di sede" e di
 righe della cronologia "Aggiornamento impresa" ("storico delle variazioni
 della sede legale"). Nessuna storicizzazione della sede legale esiste oggi
 nel progetto (`ana_sede_rev2`/`ana_sedi` rappresentano solo lo stato
 attuale) — stessa situazione di `ana_trasferimenti_quote` (migrazione 051):
 struttura indicativa minima, segnalata come tale, senza anticipare un form
 di inserimento non richiesto da questa correzione.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS ana_variazioni_sede_legale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),

    data_variazione DATE,
    descrizione TEXT,
    pratica_id UUID REFERENCES ana_pratiche_camerali(id),
    origine_id UUID REFERENCES cat_origini_aggiornamento_impresa(id),
    esito_id UUID REFERENCES cat_esiti_pratiche_camerali(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ana_variazioni_sede_legale IS
    'Storico delle variazioni di sede legale dell''azienda (Correzione 24 §2), struttura indicativa minima: dettaglio completo rimandato a correzione dedicata.';

CREATE INDEX IF NOT EXISTS idx_ana_variazioni_sede_legale_azienda
    ON ana_variazioni_sede_legale (azienda_id);


CREATE OR REPLACE FUNCTION fn_ana_variazioni_sede_legale_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_variazioni_sede_legale_set_updated_at
    ON ana_variazioni_sede_legale;

CREATE TRIGGER trg_ana_variazioni_sede_legale_set_updated_at
BEFORE UPDATE ON ana_variazioni_sede_legale
FOR EACH ROW
EXECUTE FUNCTION fn_ana_variazioni_sede_legale_set_updated_at();

COMMIT;
