/*
===============================================================================
 MIGRAZIONE 036 - CATALOGO DELLE NORME DI CERTIFICAZIONE
===============================================================================

 Scopo
 -----
 Correzione 21, punto 5.1 (sotto-form "Certificazione di sistema"): campo
 "Norma" (es. ISO 9001, ISO 14001, ISO 45001...). Nasce vuoto per lo stesso
 motivo di cat_tipologie_albo (migrazione 032): nessun elenco ufficiale
 verificato in questa correzione, popolamento rimandato.

 Esplicitamente NON duplica cat_certificazioni (già usato dalla piattaforma
 per moduli e abbonamenti, § punto 5.1 ultimo comma): quel catalogo
 individua le certificazioni abilitate per l'azienda a livello di sistema,
 questo la norma specifica di un singolo titolo abilitativo registrato in
 questa card — restano due cataloghi distinti con scopi diversi.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


CREATE TABLE IF NOT EXISTS cat_norme_certificazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_norme_certificazione_codice
        UNIQUE (codice)
);


COMMENT ON TABLE cat_norme_certificazione IS
    'Catalogo estendibile delle norme di certificazione di sistema (Correzione 21 punto 5.1), nato vuoto in attesa di un elenco ufficiale verificato. Non duplica cat_certificazioni.';


CREATE OR REPLACE FUNCTION fn_cat_norme_certificazione_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_norme_certificazione_set_updated_at ON cat_norme_certificazione;

CREATE TRIGGER trg_cat_norme_certificazione_set_updated_at
BEFORE UPDATE ON cat_norme_certificazione
FOR EACH ROW
EXECUTE FUNCTION fn_cat_norme_certificazione_set_updated_at();


COMMIT;
