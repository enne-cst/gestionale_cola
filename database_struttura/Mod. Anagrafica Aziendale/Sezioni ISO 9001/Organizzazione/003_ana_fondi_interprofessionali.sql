/*
===============================================================================
 MIGRAZIONE 003 - FONDI INTERPROFESSIONALI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per l'iscrizione;
 - la tabella operativa che conserva lo storico dei fondi interprofessionali
   di ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascuna iscrizione storica. Non
 viene quindi applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - In attesa;
 - Attiva;
 - Sospesa;
 - Cessata.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001 e sono validi per tutti i settori IAF.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE
     ├── ...FONDO_INTERPROFESSIONALE
     ├── ...STATO_ISCRIZIONE
     ├── ...DATA_ADESIONE
     ├── ...CODICE_FONDO
     ├── ...DATA_RECESSO
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati dell'iscrizione al fondo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_iscrizione_fondo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_iscrizione_fondo_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_iscrizione_fondo (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_ATTESA', 'In attesa', 1, TRUE),
    ('ATTIVA', 'Attiva', 2, TRUE),
    ('SOSPESA', 'Sospesa', 3, TRUE),
    ('CESSATA', 'Cessata', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_fondi_interprofessionali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_fondi_interprofessionali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    fondo_interprofessionale VARCHAR(250) NOT NULL,
    stato_iscrizione_id UUID NOT NULL,
    data_adesione DATE NOT NULL,
    codice_fondo VARCHAR(100),
    data_recesso DATE,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_fondi_interprofessionali_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_fondi_interprofessionali_stato
        FOREIGN KEY (stato_iscrizione_id)
        REFERENCES cat_stati_iscrizione_fondo(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_fondi_interprofessionali IS
    'Storico delle iscrizioni ai fondi interprofessionali di ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_fondi_interprofessionali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_fondi_interprofessionali_set_updated_at() IS
    'Aggiorna ana_fondi_interprofessionali.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_fondi_interprofessionali_set_updated_at
    ON ana_fondi_interprofessionali;

CREATE TRIGGER trg_ana_fondi_interprofessionali_set_updated_at
BEFORE UPDATE ON ana_fondi_interprofessionali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_fondi_interprofessionali_set_updated_at();


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
 VOCE: FONDO INTERPROFESSIONALE
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE',
    m.id,
    p.id,
    'SEZIONE',
    'Fondo interprofessionale',
    'Sezione contenente lo storico delle iscrizioni dell''azienda ai fondi interprofessionali.',
    'public',
    'ana_fondi_interprofessionali',
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
 CAMPI DEL FONDO INTERPROFESSIONALE
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
    'ana_fondi_interprofessionali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.FONDO_INTERPROFESSIONALE',
            'Fondo interprofessionale',
            'Inserisci la denominazione completa del fondo interprofessionale al quale l''azienda aderisce o ha aderito.',
            'fondo_interprofessionale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.STATO_ISCRIZIONE',
            'Stato dell''iscrizione',
            'Seleziona lo stato dell''iscrizione: In attesa, Attiva, Sospesa oppure Cessata.',
            'stato_iscrizione_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.DATA_ADESIONE',
            'Data di adesione',
            'Indica la data dalla quale decorre l''adesione dell''azienda al fondo.',
            'data_adesione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.CODICE_FONDO',
            'Codice fondo',
            'Inserisci l''eventuale codice identificativo attribuito dal fondo all''iscrizione dell''azienda.',
            'codice_fondo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.DATA_RECESSO',
            'Eventuale data di recesso',
            'Indica la data di recesso dal fondo. Lascia vuoto se l''iscrizione non è cessata.',
            'data_recesso'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive utili sull''iscrizione al fondo. Il campo è facoltativo.',
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
WHERE e.codice IN (
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.FONDO_INTERPROFESSIONALE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.STATO_ISCRIZIONE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.DATA_ADESIONE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.CODICE_FONDO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.DATA_RECESSO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FONDO_INTERPROFESSIONALE.NOTE'
  )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
