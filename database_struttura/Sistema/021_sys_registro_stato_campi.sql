/*
===============================================================================
 021 - REGISTRO: STATO PER SINGOLO CAMPO (verifica + visibilita')
===============================================================================

 Scopo
 -----
 Metadati trasversali per singolo campo di un modulo "a registro" (nasce per
 Anagrafica Aziendale, sezione "Informazioni societarie", ma la chiave
 sezione_codice/campo_codice e' generica per non doverla duplicare per ogni
 futura sezione che adotti lo stesso pattern, come raccomandato dal
 documento di specifica §16.2).

 Granularita': PER CAMPO, non per record. Concettualmente distinto da
 sys_presa_visione_modifiche (020_sys_verifica_modifiche.sql), che verifica
 un intero record senza storicizzazione: qui invece ogni singolo valore di
 un modulo ha un proprio stato di verifica e una propria visibilita' verso
 l'azienda. I due meccanismi restano separati perche' hanno granularita' e
 ciclo di vita diversi; riusano pero' lo stesso catalogo di stati
 (cat_stati_verifica_modifiche, DA_VERIFICARE/APPROVATO/IN_REVISIONE) perche'
 il significato dei tre stati e' identico.

 Regole applicative garantite qui via vincolo, il resto in
 app/core/registro_campi.py:
 - un campo vuoto non ha stato di verifica (vincolo sotto);
 - nascondere un campo non tocca valore/stato/nota (nessuna colonna valore
   qui: il valore resta nella tabella di dominio, es. ana_identificazione_camerale);
 - `versione` e' l'ancora di concorrenza ottimistica per il pop-up di verifica
   (rifiuta una decisione presa su uno stato ormai superato, §15.6): viene
   incrementata ad ogni cambio di verification_status (auto-pending su
   modifica valore, oppure decisione esplicita del consulente), non dal
   toggle di visibilita'.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS sys_registro_stato_campi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),

    sezione_codice VARCHAR(150) NOT NULL,
    campo_codice VARCHAR(100) NOT NULL,

    visibile_azienda BOOLEAN NOT NULL DEFAULT TRUE,

    stato_verifica_codice VARCHAR(30) REFERENCES cat_stati_verifica_modifiche(codice),
    nota_revisione TEXT,
    versione INTEGER NOT NULL DEFAULT 1,

    verificato_da UUID REFERENCES sys_utenti(id),
    verificato_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_sys_registro_stato_campi UNIQUE (azienda_id, sezione_codice, campo_codice),
    CONSTRAINT chk_sys_registro_stato_campi_nota_se_in_revisione CHECK (
        stato_verifica_codice <> 'IN_REVISIONE'
        OR (nota_revisione IS NOT NULL AND btrim(nota_revisione) <> '')
    )
);

COMMENT ON TABLE sys_registro_stato_campi IS
    'Verifica e visibilita'' per singolo campo di un modulo a registro (vedi Anagrafica Aziendale). Un campo senza riga qui e'' visibile e senza stato di verifica.';

CREATE INDEX IF NOT EXISTS idx_sys_registro_stato_campi_azienda_sezione
    ON sys_registro_stato_campi (azienda_id, sezione_codice);


CREATE OR REPLACE FUNCTION fn_sys_registro_stato_campi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sys_registro_stato_campi_set_updated_at
    ON sys_registro_stato_campi;

CREATE TRIGGER trg_sys_registro_stato_campi_set_updated_at
BEFORE UPDATE ON sys_registro_stato_campi
FOR EACH ROW
EXECUTE FUNCTION fn_sys_registro_stato_campi_set_updated_at();

COMMIT;
