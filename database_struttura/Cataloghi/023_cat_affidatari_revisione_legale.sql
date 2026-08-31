/*
===============================================================================
 MIGRAZIONE 023 - CATALOGO DEGLI AFFIDATARI DELLA REVISIONE LEGALE
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Revisione legale affidata a" (§ Correzione 13, sezione Organi di
 controllo, card "Sindaci"). Nasce con la configurazione "Sindaco unico" ma
 è pensato per essere condiviso, senza modifiche, dalle altre configurazioni
 della sezione quando verranno definite (§ richiesta esplicita "Il catalogo
 deve essere condiviso con le altre configurazioni della sezione") — stesso
 pattern già seguito da `cat_modalita_esercizio_poteri` per Amministratori
 (Correzione 07, poi riusato tal quale dalla Correzione 08).

 Prerequisiti
 ------------
 Nessuno: catalogo autonomo, stesso pattern semplice di
 cat_assetti_controllo (migrazione 020).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_affidatari_revisione_legale
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_affidatari_revisione_legale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_affidatari_revisione_legale_codice
        UNIQUE (codice)
);


INSERT INTO cat_affidatari_revisione_legale (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('NON_ATTRIBUITA', 'Non attribuita', NULL, 1, TRUE),
    ('SINDACO_UNICO', 'Sindaco unico', NULL, 2, TRUE),
    ('COLLEGIO_SINDACALE', 'Collegio sindacale', NULL, 3, TRUE),
    ('REVISORE_LEGALE_PERSONA_FISICA', 'Revisore legale persona fisica', NULL, 4, TRUE),
    ('SOCIETA_REVISIONE_LEGALE', 'Società di revisione legale', NULL, 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_affidatari_revisione_legale IS
    'Catalogo estendibile, condiviso da tutte le configurazioni della sezione Organi di controllo, degli affidatari della revisione legale — usato dal campo "Revisione legale affidata a".';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_affidatari_revisione_legale_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_affidatari_revisione_legale_set_updated_at() IS
    'Aggiorna cat_affidatari_revisione_legale.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_affidatari_revisione_legale_set_updated_at
    ON cat_affidatari_revisione_legale;

CREATE TRIGGER trg_cat_affidatari_revisione_legale_set_updated_at
BEFORE UPDATE ON cat_affidatari_revisione_legale
FOR EACH ROW
EXECUTE FUNCTION fn_cat_affidatari_revisione_legale_set_updated_at();


COMMIT;
