/*
===============================================================================
 MIGRAZIONE 010 - LAVORATORI AUTONOMI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per un rapporto con un lavoratore
   autonomo;
 - la tabella operativa che conserva i lavoratori autonomi e i relativi
   rapporti di collaborazione di ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascun lavoratore autonomo o
 rapporto di collaborazione. Non viene quindi applicato un vincolo UNIQUE su
 azienda_id.

 Stati disponibili
 -----------------
 - In valutazione;
 - Attivo;
 - Sospeso;
 - Cessato.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Il ricorso a lavoratori autonomi può riguardare aziende appartenenti a
 qualunque attività economica. La voce è quindi valida per tutti i settori IAF
 e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI
     ├── ...NOMINATIVO_RAGIONE_SOCIALE
     ├── ...CODICE_FISCALE_PARTITA_IVA
     ├── ...MANSIONE
     ├── ...ATTIVITA_SVOLTA
     ├── ...DATA_INIZIO_COLLABORAZIONE
     ├── ...DATA_FINE_COLLABORAZIONE
     ├── ...STATO
     ├── ...DOCUMENTAZIONE_ASSOCIATA
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati del rapporto con il lavoratore autonomo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_lavoratori_autonomi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_lavoratori_autonomi_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_lavoratori_autonomi (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_VALUTAZIONE', 'In valutazione', 1, TRUE),
    ('ATTIVO', 'Attivo', 2, TRUE),
    ('SOSPESO', 'Sospeso', 3, TRUE),
    ('CESSATO', 'Cessato', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_lavoratori_autonomi
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_lavoratori_autonomi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    nominativo_ragione_sociale VARCHAR(250) NOT NULL,
    codice_fiscale_partita_iva VARCHAR(30) NOT NULL,
    mansione VARCHAR(250) NOT NULL,
    attivita_svolta TEXT NOT NULL,
    data_inizio_collaborazione DATE NOT NULL,
    data_fine_collaborazione DATE,
    stato_id UUID NOT NULL,
    documentazione_associata TEXT,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_lavoratori_autonomi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_lavoratori_autonomi_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_lavoratori_autonomi(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_lavoratori_autonomi IS
    'Lavoratori autonomi e relativi rapporti di collaborazione di ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_lavoratori_autonomi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_lavoratori_autonomi_set_updated_at() IS
    'Aggiorna ana_lavoratori_autonomi.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_lavoratori_autonomi_set_updated_at
    ON ana_lavoratori_autonomi;

CREATE TRIGGER trg_ana_lavoratori_autonomi_set_updated_at
BEFORE UPDATE ON ana_lavoratori_autonomi
FOR EACH ROW
EXECUTE FUNCTION fn_ana_lavoratori_autonomi_set_updated_at();


/*
-------------------------------------------------------------------------------
 SEZIONE PADRE: ORGANIZZAZIONE
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice,
    modulo_id,
    elemento_padre_id,
    tipo_elemento,
    denominazione,
    descrizione,
    schema_database,
    nome_tabella,
    nome_colonna,
    attivo
)
SELECT
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE',
    m.id,
    NULL,
    'SEZIONE',
    'Organizzazione',
    'Sezione organizzativa interna al modulo Anagrafica aziendale.',
    'public',
    NULL,
    NULL,
    TRUE
FROM cat_moduli AS m
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id         = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento     = EXCLUDED.tipo_elemento,
    denominazione     = EXCLUDED.denominazione,
    descrizione       = EXCLUDED.descrizione,
    schema_database   = EXCLUDED.schema_database,
    nome_tabella      = EXCLUDED.nome_tabella,
    nome_colonna      = EXCLUDED.nome_colonna,
    attivo            = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 VOCE: LAVORATORI AUTONOMI
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice,
    modulo_id,
    elemento_padre_id,
    tipo_elemento,
    denominazione,
    descrizione,
    schema_database,
    nome_tabella,
    nome_colonna,
    attivo
)
SELECT
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI',
    m.id,
    p.id,
    'SEZIONE',
    'Lavoratori autonomi',
    'Sezione contenente i lavoratori autonomi dell''azienda e i relativi rapporti di collaborazione.',
    'public',
    'ana_lavoratori_autonomi',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE'
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id         = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento     = EXCLUDED.tipo_elemento,
    denominazione     = EXCLUDED.denominazione,
    descrizione       = EXCLUDED.descrizione,
    schema_database   = EXCLUDED.schema_database,
    nome_tabella      = EXCLUDED.nome_tabella,
    nome_colonna      = EXCLUDED.nome_colonna,
    attivo            = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 CAMPI DEI LAVORATORI AUTONOMI
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice,
    modulo_id,
    elemento_padre_id,
    tipo_elemento,
    denominazione,
    descrizione,
    schema_database,
    nome_tabella,
    nome_colonna,
    attivo
)
SELECT
    v.codice,
    m.id,
    p.id,
    'CAMPO',
    v.denominazione,
    v.descrizione,
    'public',
    'ana_lavoratori_autonomi',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.NOMINATIVO_RAGIONE_SOCIALE',
            'Nominativo / Ragione sociale',
            'Inserisci il nome e cognome del lavoratore autonomo oppure la sua ragione sociale.',
            'nominativo_ragione_sociale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.CODICE_FISCALE_PARTITA_IVA',
            'Codice fiscale / Partita IVA',
            'Inserisci il codice fiscale o la partita IVA del lavoratore autonomo.',
            'codice_fiscale_partita_iva'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.MANSIONE',
            'Mansione',
            'Indica la mansione o il ruolo ricoperto dal lavoratore autonomo.',
            'mansione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.ATTIVITA_SVOLTA',
            'Attività svolta',
            'Descrivi le attività concretamente svolte dal lavoratore autonomo per l''azienda.',
            'attivita_svolta'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.DATA_INIZIO_COLLABORAZIONE',
            'Data di inizio collaborazione',
            'Indica la data dalla quale è iniziata la collaborazione con il lavoratore autonomo.',
            'data_inizio_collaborazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.DATA_FINE_COLLABORAZIONE',
            'Data di fine collaborazione',
            'Indica la data di conclusione della collaborazione. Lascia vuoto se il rapporto è ancora in corso.',
            'data_fine_collaborazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.STATO',
            'Stato',
            'Seleziona lo stato della collaborazione: In valutazione, Attivo, Sospeso oppure Cessato.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento al contratto, all''incarico o ad altri documenti associati. Lascia vuoto se non disponibili.',
            'documentazione_associata'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sul lavoratore autonomo o sulla collaborazione.',
            'note'
        )
) AS v(codice, denominazione, descrizione, nome_colonna)
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id         = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento     = EXCLUDED.tipo_elemento,
    denominazione     = EXCLUDED.denominazione,
    descrizione       = EXCLUDED.descrizione,
    schema_database   = EXCLUDED.schema_database,
    nome_tabella      = EXCLUDED.nome_tabella,
    nome_colonna      = EXCLUDED.nome_colonna,
    attivo            = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 ASSOCIAZIONE A ISO 9001 E A TUTTI I SETTORI IAF
-------------------------------------------------------------------------------
*/
INSERT INTO rel_elementi_certificazioni (
    elemento_id,
    certificazione_id,
    tutti_settori_iaf
)
SELECT
    e.id,
    c.id,
    TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE (
        e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.LAVORATORI_AUTONOMI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
