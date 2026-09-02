/*
===============================================================================
 MIGRAZIONE 037 - CATALOGO DELLE CATEGORIE SOA
===============================================================================

 Scopo
 -----
 Correzione 21, punto 5.2 (sotto-form "Attestazione SOA"): campo "Categoria
 SOA" della tabella interna ripetibile "Categorie e classifiche" (es. OG1,
 OS7...). Nasce vuoto: l'elenco ufficiale delle categorie OG/OS (D.P.R.
 207/2010, Allegato A) è lungo (oltre 40 voci) e le sue denominazioni
 esatte non sono state verificate contro una fonte affidabile in questa
 correzione — stesso criterio dei cataloghi ATECO/ATECORI/NACE (Correzione
 19): meglio nascere vuoto che introdurre descrizioni non verificate.
 Popolamento rimandato a un import dedicato. A differenza di questo
 catalogo, cat_classifiche_soa (migrazione 038) è seminato subito: sono
 solo 11 valori, stabili da decenni, a rischio di errore trascurabile.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_categorie_soa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_categorie_soa_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_categorie_soa IS
    'Catalogo estendibile delle categorie SOA (Correzione 21 punto 5.2), nato vuoto in attesa di un import verificato dell''elenco ufficiale OG/OS.';


CREATE OR REPLACE FUNCTION fn_cat_categorie_soa_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_categorie_soa_set_updated_at ON cat_categorie_soa;

CREATE TRIGGER trg_cat_categorie_soa_set_updated_at
BEFORE UPDATE ON cat_categorie_soa
FOR EACH ROW
EXECUTE FUNCTION fn_cat_categorie_soa_set_updated_at();


COMMIT;
