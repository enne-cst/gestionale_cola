/*
===============================================================================
 023 - SISTEMA: IMPORTAZIONI DI VISURE CCIAA (tabella indicativa)
===============================================================================

 Scopo
 -----
 Correzione 24 (card "Aggiornamento impresa" dell'Anagrafica Aziendale), §5:
 eventi di importazione di una visura camerale (PDF), fonte di due dei
 possibili eventi della cronologia "Aggiornamento impresa"
 ("Importazione visura PDF" e, quando confermata dal consulente, "Conferma
 visura" — due righe distinte della stessa importazione, mai una sola data
 accorpata: `data_importazione` != `data_estrazione_visura` != `confermata_at`,
 § testo esplicito "non devono essere accorpate in un'unica data").

 Tabella indicativa (§ testo esplicito, "se non esiste una struttura
 completa deve essere prevista una tabella indicativa"): nessuna pipeline
 di riconoscimento/estrazione da PDF esiste nel progetto per nessuna card
 (stesso limite già accettato per l'import visure di Sedi secondarie,
 Correzione 23 §10-11) — questa tabella prepara lo schema per quando quella
 pipeline sarà costruita, senza introdurne una qui. `documento_id` collega
 al modulo Documenti, oggi solo un segnaposto minimo
 (`database_struttura/Documenti/001_doc_documenti.sql`).

 Deduplicazione (§11, "la stessa visura non deve produrre più eventi
 identici quando viene rielaborata"): vincolo UNIQUE su (azienda_id,
 hash_file) — rielaborare lo stesso file deve aggiornare la riga esistente,
 mai inserirne una seconda.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS sys_importazioni_visure_cciaa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),
    documento_id UUID REFERENCES doc_documenti(id),

    hash_file VARCHAR(64) NOT NULL,

    data_importazione TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_estrazione_visura DATE,

    stato_importazione_id UUID REFERENCES cat_stati_importazione_visure(id),

    confermata_at TIMESTAMPTZ,
    confermata_da UUID REFERENCES sys_utenti(id),

    versione_parser VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_sys_importazioni_visure_cciaa_hash
        UNIQUE (azienda_id, hash_file)
);

COMMENT ON TABLE sys_importazioni_visure_cciaa IS
    'Eventi di importazione di una visura camerale (Correzione 24 §5), tabella indicativa: nessuna pipeline di riconoscimento PDF esiste ancora nel progetto.';

CREATE INDEX IF NOT EXISTS idx_sys_importazioni_visure_cciaa_azienda
    ON sys_importazioni_visure_cciaa (azienda_id);


CREATE OR REPLACE FUNCTION fn_sys_importazioni_visure_cciaa_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sys_importazioni_visure_cciaa_set_updated_at
    ON sys_importazioni_visure_cciaa;

CREATE TRIGGER trg_sys_importazioni_visure_cciaa_set_updated_at
BEFORE UPDATE ON sys_importazioni_visure_cciaa
FOR EACH ROW
EXECUTE FUNCTION fn_sys_importazioni_visure_cciaa_set_updated_at();

COMMIT;
