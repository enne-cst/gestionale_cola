/*
===============================================================================
 MIGRAZIONE 050 - PRATICHE CAMERALI (CORREZIONE 24, §3)
===============================================================================

 Scopo
 -----
 Sorgente dell'indicatore "Pratiche inviate negli ultimi 12 mesi" e della
 maggior parte delle righe della cronologia "Aggiornamento impresa" (§2/§6).
 Campi come da testo della correzione, invariati.

 Deduplicazione (§ "quando disponibile, la combinazione di azienda, numero
 di protocollo e data deve impedire la duplicazione della stessa pratica"):
 indice UNICO parziale su (azienda_id, numero_protocollo, data_presentazione),
 attivo solo quando numero_protocollo non è nullo — una pratica non ancora
 protocollata non collide mai con un'altra.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS ana_pratiche_camerali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),

    tipo_pratica_id UUID REFERENCES cat_tipologie_pratiche_camerali(id),
    numero_protocollo VARCHAR(60),
    data_presentazione DATE,
    data_protocollo DATE,
    oggetto TEXT,
    origine_id UUID REFERENCES cat_origini_aggiornamento_impresa(id),
    esito_id UUID REFERENCES cat_esiti_pratiche_camerali(id),
    importazione_visura_id UUID REFERENCES sys_importazioni_visure_cciaa(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ana_pratiche_camerali IS
    'Pratiche camerali dell''azienda (Correzione 24 §3): sorgente dell''indicatore "Pratiche inviate negli ultimi 12 mesi" e di righe della cronologia "Aggiornamento impresa".';

CREATE INDEX IF NOT EXISTS idx_ana_pratiche_camerali_azienda
    ON ana_pratiche_camerali (azienda_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ana_pratiche_camerali_protocollo
    ON ana_pratiche_camerali (azienda_id, numero_protocollo, data_presentazione)
    WHERE numero_protocollo IS NOT NULL;


CREATE OR REPLACE FUNCTION fn_ana_pratiche_camerali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_pratiche_camerali_set_updated_at
    ON ana_pratiche_camerali;

CREATE TRIGGER trg_ana_pratiche_camerali_set_updated_at
BEFORE UPDATE ON ana_pratiche_camerali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_pratiche_camerali_set_updated_at();

COMMIT;
