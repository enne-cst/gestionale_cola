/*
===============================================================================
 MIGRAZIONE 046 - TABELLA UNIFICATA "ALBI, RUOLI, LICENZE E CERTIFICAZIONI"
===============================================================================

 Scopo
 -----
 Correzione 20 (seconda parte della card "Attività, albi, ruoli e
 licenze"): tabella riepilogativa unica per albi, ruoli, licenze e
 certificazioni/attestazioni, con inserimento e modifica tramite quattro
 form differenti in base alla tipologia (§ punto 1/5/6 della correzione).

 Verificate prima di questa migrazione le strutture esistenti
 (ana_albi_ruoli_licenze, ana_soa/ana_soa_categorie, ana_certificazioni/
 ana_certificazioni_settori_iaf, migrazioni 010/011/014): nessuna è
 equivalente alla richiesta — sono tre tabelle separate, non unificate in
 lettura, e ana_albi_ruoli_licenze mescola Albo/Ruolo/Licenza in un'unica
 struttura piatta senza distinzione strutturale. Restano al loro posto,
 non più referenziate dalla nuova card (§ convenzione già in uso nel
 progetto: la rimozione di strutture divenute obsolete è rimandata a una
 decisione esplicita dell'utente, mai unilaterale).

 Struttura (§ punto 9 della correzione, richiesta esplicitamente): UNA
 tabella principale con le sole informazioni comuni
 (ana_titoli_abilitativi_azienda) + QUATTRO strutture di dettaglio separate,
 una per macro-tipologia, ciascuna in relazione 1:1 col record principale
 (chiave esterna UNIQUE, ON DELETE CASCADE) — mai un'unica tabella con tutti
 i campi delle quattro tipologie insieme. Il campo mostrato nella colonna
 "Categoria / norma" della tabella riepilogativa vive quindi nel dettaglio,
 mai duplicato come testo nella tabella principale (§ punto 9, ultimo
 comma).

 I campi specifici di ciascun dettaglio sono qui ridotti al minimo
 necessario per popolare "Categoria / norma" (§ punto 4): l'elenco
 completo dei campi per form Albo/Ruolo/Licenza/Certificazione sarà
 definito in una correzione successiva (§ punto 6, "i campi specifici
 verranno definiti separatamente") — aggiunta con ALTER TABLE quando
 arriva, mai riaprendo questo file una volta applicato.

 Il dettaglio "certificazione o attestazione" porta già `sotto_tipo`
 (CERTIFICAZIONE / ATTESTAZIONE_SOA, due sole opzioni fisse — non un
 catalogo, § convenzione CLAUDE.md sulle scelte con 2-3 valori): necessario
 fin da questa correzione per distinguere le due cose nella colonna
 "Tipologia" (§ punto 7, "la SOA non deve essere classificata
 impropriamente come certificazione"). Non introduce alcun nuovo catalogo
 delle certificazioni: cat_certificazioni (già usato da moduli/abbonamenti)
 resta l'unico, § punto 10.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA PRINCIPALE: ana_titoli_abilitativi_azienda
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_titoli_abilitativi_azienda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    macro_tipologia_id UUID NOT NULL,

    numero_attestazione VARCHAR(100),
    ente_rilascio VARCHAR(255),

    data_rilascio DATE,
    data_scadenza DATE,
    senza_scadenza BOOLEAN NOT NULL DEFAULT FALSE,

    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_titoli_abilitativi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_ana_titoli_abilitativi_macro_tipologia
        FOREIGN KEY (macro_tipologia_id)
        REFERENCES cat_macro_tipologie_titoli_abilitativi(id),

    CONSTRAINT chk_ana_titoli_abilitativi_date
        CHECK (
            data_scadenza IS NULL
            OR data_rilascio IS NULL
            OR data_scadenza >= data_rilascio
        ),

    -- § punto 10: "la data di scadenza deve rimanere vuota quando è attivo
    -- senza_scadenza".
    CONSTRAINT chk_ana_titoli_abilitativi_senza_scadenza
        CHECK (
            NOT senza_scadenza
            OR data_scadenza IS NULL
        )
);

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_azienda
    ON ana_titoli_abilitativi_azienda (azienda_id);


/*
-------------------------------------------------------------------------------
 DETTAGLIO: ALBO
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_titoli_abilitativi_dettaglio_albo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titolo_id UUID NOT NULL,

    -- "Categoria dell'albo" (§ punto 4, colonna "Categoria / norma").
    categoria VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_titoli_abilitativi_dettaglio_albo_titolo
        FOREIGN KEY (titolo_id)
        REFERENCES ana_titoli_abilitativi_azienda(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_titoli_abilitativi_dettaglio_albo_titolo
        UNIQUE (titolo_id)
);


/*
-------------------------------------------------------------------------------
 DETTAGLIO: RUOLO
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_titoli_abilitativi_dettaglio_ruolo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titolo_id UUID NOT NULL,

    -- "Denominazione del ruolo" (§ punto 4, colonna "Categoria / norma").
    denominazione_ruolo VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_titoli_abilitativi_dettaglio_ruolo_titolo
        FOREIGN KEY (titolo_id)
        REFERENCES ana_titoli_abilitativi_azienda(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_titoli_abilitativi_dettaglio_ruolo_titolo
        UNIQUE (titolo_id)
);


/*
-------------------------------------------------------------------------------
 DETTAGLIO: LICENZA
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_titoli_abilitativi_dettaglio_licenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titolo_id UUID NOT NULL,

    -- "Tipologia della licenza" (§ punto 4, colonna "Categoria / norma").
    tipologia_licenza VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_titoli_abilitativi_dettaglio_licenza_titolo
        FOREIGN KEY (titolo_id)
        REFERENCES ana_titoli_abilitativi_azienda(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_titoli_abilitativi_dettaglio_licenza_titolo
        UNIQUE (titolo_id)
);


/*
-------------------------------------------------------------------------------
 DETTAGLIO: CERTIFICAZIONE O ATTESTAZIONE (ISO / SOA / altre attestazioni)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_titoli_abilitativi_dettaglio_certificazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    titolo_id UUID NOT NULL,

    -- Distingue una certificazione (es. ISO 9001) da un'attestazione SOA:
    -- determina l'etichetta mostrata nella colonna "Tipologia" (§ punto 7).
    -- Due sole opzioni fisse, non un catalogo.
    sotto_tipo VARCHAR(30) NOT NULL,

    -- Norma ISO per una certificazione, oppure categoria/classifica SOA
    -- (es. "OG1 - Edifici civili e industriali - Classifica V") per
    -- un'attestazione: § punto 4, colonna "Categoria / norma". Campo
    -- unico testuale per ora, in attesa dei campi specifici strutturati
    -- (§ punto 6).
    categoria_norma TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_titoli_abilitativi_dettaglio_certificazione_titolo
        FOREIGN KEY (titolo_id)
        REFERENCES ana_titoli_abilitativi_azienda(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_titoli_abilitativi_dettaglio_certificazione_titolo
        UNIQUE (titolo_id),

    CONSTRAINT chk_ana_titoli_abilitativi_dettaglio_certificazione_sotto_tipo
        CHECK (sotto_tipo IN ('CERTIFICAZIONE', 'ATTESTAZIONE_SOA'))
);


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at (tabella principale + 4 dettagli)
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_titoli_abilitativi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_azienda_set_updated_at
    ON ana_titoli_abilitativi_azienda;
CREATE TRIGGER trg_ana_titoli_abilitativi_azienda_set_updated_at
BEFORE UPDATE ON ana_titoli_abilitativi_azienda
FOR EACH ROW
EXECUTE FUNCTION fn_ana_titoli_abilitativi_set_updated_at();

DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_albo_set_updated_at
    ON ana_titoli_abilitativi_dettaglio_albo;
CREATE TRIGGER trg_ana_titoli_abilitativi_dettaglio_albo_set_updated_at
BEFORE UPDATE ON ana_titoli_abilitativi_dettaglio_albo
FOR EACH ROW
EXECUTE FUNCTION fn_ana_titoli_abilitativi_set_updated_at();

DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_ruolo_set_updated_at
    ON ana_titoli_abilitativi_dettaglio_ruolo;
CREATE TRIGGER trg_ana_titoli_abilitativi_dettaglio_ruolo_set_updated_at
BEFORE UPDATE ON ana_titoli_abilitativi_dettaglio_ruolo
FOR EACH ROW
EXECUTE FUNCTION fn_ana_titoli_abilitativi_set_updated_at();

DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_licenza_set_updated_at
    ON ana_titoli_abilitativi_dettaglio_licenza;
CREATE TRIGGER trg_ana_titoli_abilitativi_dettaglio_licenza_set_updated_at
BEFORE UPDATE ON ana_titoli_abilitativi_dettaglio_licenza
FOR EACH ROW
EXECUTE FUNCTION fn_ana_titoli_abilitativi_set_updated_at();

DROP TRIGGER IF EXISTS trg_ana_titoli_abilitativi_dettaglio_certificazione_set_updated_at
    ON ana_titoli_abilitativi_dettaglio_certificazione;
CREATE TRIGGER trg_ana_titoli_abilitativi_dettaglio_certificazione_set_updated_at
BEFORE UPDATE ON ana_titoli_abilitativi_dettaglio_certificazione
FOR EACH ROW
EXECUTE FUNCTION fn_ana_titoli_abilitativi_set_updated_at();


COMMIT;
