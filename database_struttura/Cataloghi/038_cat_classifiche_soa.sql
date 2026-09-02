/*
===============================================================================
 MIGRAZIONE 038 - CATALOGO DELLE CLASSIFICHE SOA
===============================================================================

 Scopo
 -----
 Correzione 21, punto 5.2 (sotto-form "Attestazione SOA"): campo
 "Classifica" della tabella interna ripetibile "Categorie e classifiche".
 A differenza di cat_categorie_soa (migrazione 037, nato vuoto), qui
 l'elenco è seminato subito: sono solo 11 classifiche, stabili da decenni
 (D.P.R. 207/2010, art. 61 comma 6) e note senza margine di errore
 ragionevole, a differenza delle ~40 categorie OG/OS con le rispettive
 descrizioni ufficiali.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_classifiche_soa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_classifiche_soa_codice
        UNIQUE (codice)
);


INSERT INTO cat_classifiche_soa (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('I', 'I', NULL, 1, TRUE),
    ('I_BIS', 'I-bis', NULL, 2, TRUE),
    ('II', 'II', NULL, 3, TRUE),
    ('III', 'III', NULL, 4, TRUE),
    ('III_BIS', 'III-bis', NULL, 5, TRUE),
    ('IV', 'IV', NULL, 6, TRUE),
    ('IV_BIS', 'IV-bis', NULL, 7, TRUE),
    ('V', 'V', NULL, 8, TRUE),
    ('VI', 'VI', NULL, 9, TRUE),
    ('VII', 'VII', NULL, 10, TRUE),
    ('VIII', 'VIII', NULL, 11, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_classifiche_soa IS
    'Catalogo delle classifiche SOA (Correzione 21 punto 5.2), I..VIII con le due intermedie I-bis/III-bis/IV-bis.';


CREATE OR REPLACE FUNCTION fn_cat_classifiche_soa_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_classifiche_soa_set_updated_at ON cat_classifiche_soa;

CREATE TRIGGER trg_cat_classifiche_soa_set_updated_at
BEFORE UPDATE ON cat_classifiche_soa
FOR EACH ROW
EXECUTE FUNCTION fn_cat_classifiche_soa_set_updated_at();


COMMIT;
