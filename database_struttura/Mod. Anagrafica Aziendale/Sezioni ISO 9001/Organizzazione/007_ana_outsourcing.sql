/*
===============================================================================
 MIGRAZIONE 007 - OUTSOURCING
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per un affidamento in outsourcing;
 - la tabella operativa che conserva le attività e i processi affidati a
   soggetti esterni da ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascuna attività o processo
 affidato. Non viene quindi applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - Pianificato;
 - Attivo;
 - Sospeso;
 - Concluso.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 L'affidamento in outsourcing può riguardare aziende appartenenti a qualunque
 attività economica. La voce è quindi valida per tutti i settori IAF e la
 migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING
     ├── ...PROCESSO_ATTIVITA_AFFIDATA
     ├── ...DATA_INIZIO
     ├── ...DATA_FINE
     ├── ...STATO
     ├── ...REFERENTE_INTERNO
     ├── ...CONTRATTO_ASSOCIATO
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati dell'affidamento in outsourcing
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_outsourcing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_outsourcing_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_outsourcing (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('PIANIFICATO', 'Pianificato', 1, TRUE),
    ('ATTIVO', 'Attivo', 2, TRUE),
    ('SOSPESO', 'Sospeso', 3, TRUE),
    ('CONCLUSO', 'Concluso', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_outsourcing
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_outsourcing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    processo_attivita_affidata TEXT NOT NULL,
    data_inizio DATE NOT NULL,
    data_fine DATE,
    stato_id UUID NOT NULL,
    referente_interno VARCHAR(250) NOT NULL,
    contratto_associato VARCHAR(250) NOT NULL,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_outsourcing_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_outsourcing_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_outsourcing(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_outsourcing IS
    'Attività e processi affidati in outsourcing da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_outsourcing_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_outsourcing_set_updated_at() IS
    'Aggiorna ana_outsourcing.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_outsourcing_set_updated_at
    ON ana_outsourcing;

CREATE TRIGGER trg_ana_outsourcing_set_updated_at
BEFORE UPDATE ON ana_outsourcing
FOR EACH ROW
EXECUTE FUNCTION fn_ana_outsourcing_set_updated_at();


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
 VOCE: OUTSOURCING
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING',
    m.id,
    p.id,
    'SEZIONE',
    'Outsourcing',
    'Sezione contenente le attività e i processi affidati dall''azienda a soggetti esterni.',
    'public',
    'ana_outsourcing',
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
 CAMPI DELL'OUTSOURCING
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
    'ana_outsourcing',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.PROCESSO_ATTIVITA_AFFIDATA',
            'Processo / attività affidata',
            'Descrivi il processo o l''attività che l''azienda ha affidato a un soggetto esterno.',
            'processo_attivita_affidata'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.DATA_INIZIO',
            'Data di inizio',
            'Indica la data dalla quale decorre l''affidamento in outsourcing.',
            'data_inizio'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.DATA_FINE',
            'Data di fine',
            'Indica la data di conclusione dell''affidamento. Lascia vuoto se l''attività è ancora affidata all''esterno.',
            'data_fine'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.STATO',
            'Stato',
            'Seleziona lo stato dell''affidamento: Pianificato, Attivo, Sospeso oppure Concluso.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.REFERENTE_INTERNO',
            'Referente interno',
            'Indica il nominativo o il ruolo della persona interna che segue e controlla l''attività affidata.',
            'referente_interno'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.CONTRATTO_ASSOCIATO',
            'Contratto associato',
            'Indica il numero, il codice o un altro riferimento che identifica il contratto collegato all''affidamento.',
            'contratto_associato'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sull''affidamento, sul fornitore o sulle modalità di controllo.',
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.OUTSOURCING.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
