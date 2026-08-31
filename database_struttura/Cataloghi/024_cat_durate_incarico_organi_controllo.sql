/*
===============================================================================
 MIGRAZIONE 024 - CATALOGO DELLE DURATE DELL'INCARICO (ORGANI DI CONTROLLO)
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Durata dell'incarico" della configurazione "Sindaco unico" (§ Correzione
 13, sezione Organi di controllo, card "Sindaci"). Distinto da
 `cat_durate_carica` (migrazione 012, campo "Durata in carica" della sezione
 Amministratori): stesso concetto generale, catalogo separato perché le
 tipologie ammesse sono diverse (qui non esiste "A tempo indeterminato"/
 "Fino a revoca" come voci a sé, la scadenza per revoca/cessazione è una
 tipologia dedicata).

 Le denominazioni non contengono mai una data (§ vincolo esplicito): la
 tipologia "Fino all'approvazione del bilancio" ha un campo data separato
 (`durata_incarico_data_bilancio` sulla tabella di dominio), "Altra durata
 risultante dall'atto di nomina" ha un campo testuale separato
 (`durata_incarico_descrizione`) — vedi
 `042_ana_organi_controllo_sindaco_unico.sql`.

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
 TABELLA CATALOGO: cat_durate_incarico_organi_controllo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_durate_incarico_organi_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_durate_incarico_organi_controllo_codice
        UNIQUE (codice)
);


INSERT INTO cat_durate_incarico_organi_controllo (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('FINO_APPROVAZIONE_BILANCIO', 'Fino all''approvazione del bilancio', NULL, 1, TRUE),
    ('TRE_ESERCIZI', 'Tre esercizi', NULL, 2, TRUE),
    ('FINO_REVOCA_CESSAZIONE', 'Fino a revoca o cessazione', NULL, 3, TRUE),
    ('ALTRA_DURATA', 'Altra durata risultante dall''atto di nomina', NULL, 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_durate_incarico_organi_controllo IS
    'Catalogo estendibile delle tipologie di durata dell''incarico per gli organi di controllo, usato dal campo "Durata dell''incarico" (configurazione "Sindaco unico"). Nessuna data nella denominazione: "Fino all''approvazione del bilancio" e "Altra durata" hanno campi separati sulla tabella di dominio.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_durate_incarico_organi_controllo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_durate_incarico_organi_controllo_set_updated_at() IS
    'Aggiorna cat_durate_incarico_organi_controllo.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_durate_incarico_organi_controllo_set_updated_at
    ON cat_durate_incarico_organi_controllo;

CREATE TRIGGER trg_cat_durate_incarico_organi_controllo_set_updated_at
BEFORE UPDATE ON cat_durate_incarico_organi_controllo
FOR EACH ROW
EXECUTE FUNCTION fn_cat_durate_incarico_organi_controllo_set_updated_at();


COMMIT;
