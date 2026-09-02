/*
===============================================================================
 MIGRAZIONE 035 - CATALOGO DELLE TIPOLOGIE DI CERTIFICAZIONE O ATTESTAZIONE
===============================================================================

 Scopo
 -----
 Correzione 21, punto 5 (form "Aggiungi certificazione o attestazione"):
 primo campo da compilare, determina dinamicamente il resto del form.
 A differenza delle tipologie di albo/ruolo/licenza (cataloghi nati vuoti,
 migrazioni 032-034), qui la correzione elenca esplicitamente le tre
 configurazioni iniziali richieste — seminate di conseguenza, come già
 fatto per cat_stati_titoli_abilitativi (migrazione 031).

 Sostituisce il campo `sotto_tipo` (2 sole opzioni fisse CERTIFICAZIONE/
 ATTESTAZIONE_SOA) introdotto da Correzione 20: qui la correzione chiede
 esplicitamente un catalogo, non più opzioni fisse — la migrazione 047
 aggiunge `sotto_tipo_id` a ana_titoli_abilitativi_dettaglio_certificazione
 e riporta i dati esistenti, poi rimuove la vecchia colonna.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_tipologie_certificazione_attestazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_certificazione_attestazione_codice
        UNIQUE (codice)
);


INSERT INTO cat_tipologie_certificazione_attestazione (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    (
        'CERTIFICAZIONE_SISTEMA', 'Certificazione di sistema',
        'Certificazione di un sistema di gestione secondo una norma (es. ISO 9001, ISO 14001, ISO 45001).',
        1, TRUE
    ),
    (
        'ATTESTAZIONE_SOA', 'Attestazione SOA',
        'Attestazione di qualificazione per l''esecuzione di lavori pubblici, rilasciata da un organismo SOA.',
        2, TRUE
    ),
    (
        'ALTRA', 'Altra certificazione o attestazione',
        'Certificazione o attestazione non riconducibile alle due configurazioni precedenti.',
        3, TRUE
    )
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_tipologie_certificazione_attestazione IS
    'Catalogo delle tipologie di certificazione o attestazione (Correzione 21 punto 5): determina il sotto-form mostrato.';


CREATE OR REPLACE FUNCTION fn_cat_tipologie_certificazione_attestazione_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipologie_certificazione_attestazione_set_updated_at
    ON cat_tipologie_certificazione_attestazione;

CREATE TRIGGER trg_cat_tipologie_certificazione_attestazione_set_updated_at
BEFORE UPDATE ON cat_tipologie_certificazione_attestazione
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_certificazione_attestazione_set_updated_at();


COMMIT;
