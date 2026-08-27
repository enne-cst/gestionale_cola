/*
===============================================================================
 MIGRAZIONE 018 - CATALOGO DELLE MODALITÀ DI ESERCIZIO DEI POTERI
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Modalità di esercizio dei poteri" della configurazione "Amministrazione
 pluripersonale congiuntiva" (Correzione 07, sezione Amministratori
 dell'Anagrafica Aziendale).

 Verificato prima di crearlo (§ Correzione 07, come già per la 06) che non
 esistesse già un catalogo equivalente: le caratteristiche A21 "Poteri
 attribuiti"/A22 "Limitazioni dei poteri" (migrazione Cataloghi/003) sono
 testo libero a livello di singolo incarico/persona, non un catalogo a
 livello di organo — non riusabili, il campo qui deve salvare una chiave
 esterna.

 Il catalogo è pensato per essere riutilizzato anche dalla successiva
 configurazione "Amministrazione pluripersonale disgiuntiva" (stesse
 quattro opzioni sono pertinenti a entrambe le forme pluripersonali):
 quando quella configurazione verrà definita, il campo relativo estenderà
 semplicemente `valori_dipendenza` a questo stesso catalogo, senza crearne
 uno duplicato.

 Prerequisiti
 ------------
 Nessuno: stesso pattern semplice di cat_organi_amministrativi (migrazione
 011).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_modalita_esercizio_poteri
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_modalita_esercizio_poteri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_modalita_esercizio_poteri_codice
        UNIQUE (codice)
);


INSERT INTO cat_modalita_esercizio_poteri (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('CONGIUNTIVA_ATTO_NOMINA', 'Congiuntiva secondo atto di nomina', NULL, 1, TRUE),
    ('DISGIUNTIVA_ATTO_NOMINA', 'Disgiuntiva secondo atto di nomina', NULL, 2, TRUE),
    ('MISTA_POTERI_CONGIUNTI_DISGIUNTI', 'Mista: alcuni poteri congiunti e altri disgiunti', NULL, 3, TRUE),
    ('MAGGIORANZA_ATTO_NOMINA', 'A maggioranza secondo atto di nomina', NULL, 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_modalita_esercizio_poteri IS
    'Catalogo estendibile delle modalità di esercizio dei poteri tra più amministratori, usato dal campo "Modalità di esercizio dei poteri" (amministrazione pluripersonale congiuntiva/disgiuntiva).';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_modalita_esercizio_poteri_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_modalita_esercizio_poteri_set_updated_at() IS
    'Aggiorna cat_modalita_esercizio_poteri.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_modalita_esercizio_poteri_set_updated_at
    ON cat_modalita_esercizio_poteri;

CREATE TRIGGER trg_cat_modalita_esercizio_poteri_set_updated_at
BEFORE UPDATE ON cat_modalita_esercizio_poteri
FOR EACH ROW
EXECUTE FUNCTION fn_cat_modalita_esercizio_poteri_set_updated_at();


COMMIT;
