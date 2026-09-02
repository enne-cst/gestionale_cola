/*
===============================================================================
 MIGRAZIONE 039 - CATALOGO DELLE TIPOLOGIE DI UNITA' LOCALE
===============================================================================

 Scopo
 -----
 Correzione 23 (card "Sedi secondarie e unità locali"), §4: catalogo usato
 dalla relazione molti-a-molti `rel_unita_locali_tipologie` (migrazione 049)
 — una stessa unità locale può avere più qualificazioni contemporaneamente
 (es. "Deposito, magazzino"), quindi le tipologie non vivono in una colonna
 di testo ma in questo catalogo più la relazione.

 Undici valori elencati esplicitamente nel testo della correzione: seminati
 qui (non nati vuoti) per lo stesso motivo di `cat_stati_titoli_abilitativi`
 (migrazione 031) — un elenco enumerato dall'utente, non un catalogo ufficiale
 da importare.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_tipologie_unita_locale
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_tipologie_unita_locale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_unita_locale_codice
        UNIQUE (codice)
);


INSERT INTO cat_tipologie_unita_locale (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('SEDE_SECONDARIA', 'Sede secondaria', NULL, 1, TRUE),
    ('SEDE_OPERATIVA', 'Sede operativa', NULL, 2, TRUE),
    ('FILIALE', 'Filiale', NULL, 3, TRUE),
    ('SUCCURSALE', 'Succursale', NULL, 4, TRUE),
    ('UFFICIO', 'Ufficio', NULL, 5, TRUE),
    ('STABILIMENTO', 'Stabilimento', NULL, 6, TRUE),
    ('LABORATORIO', 'Laboratorio', NULL, 7, TRUE),
    ('DEPOSITO', 'Deposito', NULL, 8, TRUE),
    ('MAGAZZINO', 'Magazzino', NULL, 9, TRUE),
    ('NEGOZIO', 'Negozio', NULL, 10, TRUE),
    ('ALTRA_UNITA_LOCALE', 'Altra unità locale', NULL, 11, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_tipologie_unita_locale IS
    'Catalogo delle tipologie di unità locale (Correzione 23 §4), collegate tramite rel_unita_locali_tipologie: una stessa unità può avere più tipologie.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_tipologie_unita_locale_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipologie_unita_locale_set_updated_at
    ON cat_tipologie_unita_locale;

CREATE TRIGGER trg_cat_tipologie_unita_locale_set_updated_at
BEFORE UPDATE ON cat_tipologie_unita_locale
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_unita_locale_set_updated_at();


COMMIT;
