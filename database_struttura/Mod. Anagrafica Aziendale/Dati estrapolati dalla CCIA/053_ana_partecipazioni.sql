/*
===============================================================================
 MIGRAZIONE 053 - PARTECIPAZIONI (CORREZIONE 24, tabella indicativa)
===============================================================================

 Scopo
 -----
 Correzione 24 §2: sorgente dell'indicatore "Partecipazioni" ("record delle
 partecipazioni aziendali") — l'unico dei 4 indicatori che NON alimenta
 anche la cronologia (§6/§7 del testo non la elencano tra gli eventi).

 Riusa `ana_persone_giuridiche` (Correzione 16) per la società partecipata,
 invece di introdurre una seconda anagrafica di soggetti giuridici (§
 "controllare prima di duplicare"). Nessun campo di dettaglio oltre la
 quota e le date di detenzione: struttura indicativa minima, segnalata come
 tale, senza anticipare un form di inserimento non richiesto da questa
 correzione.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS ana_partecipazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),

    persona_giuridica_partecipata_id UUID REFERENCES ana_persone_giuridiche(id),
    quota_percentuale NUMERIC(5, 2),
    data_inizio DATE,
    data_fine DATE,
    pratica_id UUID REFERENCES ana_pratiche_camerali(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ana_partecipazioni IS
    'Partecipazioni dell''azienda in altre società (Correzione 24 §2), struttura indicativa minima: dettaglio completo rimandato a correzione dedicata.';

CREATE INDEX IF NOT EXISTS idx_ana_partecipazioni_azienda
    ON ana_partecipazioni (azienda_id);


CREATE OR REPLACE FUNCTION fn_ana_partecipazioni_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_partecipazioni_set_updated_at
    ON ana_partecipazioni;

CREATE TRIGGER trg_ana_partecipazioni_set_updated_at
BEFORE UPDATE ON ana_partecipazioni
FOR EACH ROW
EXECUTE FUNCTION fn_ana_partecipazioni_set_updated_at();

COMMIT;
