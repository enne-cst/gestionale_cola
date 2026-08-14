/*
===============================================================================
 MIGRAZIONE 013 - ASSICURAZIONI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per una polizza assicurativa;
 - il catalogo delle frequenze di rinnovo;
 - la tabella operativa che conserva le polizze assicurative di ciascuna
   azienda.

 Ogni azienda può avere più righe, una per ciascuna polizza. Non viene quindi
 applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - In scadenza;
 - Attiva;
 - Scaduta;
 - Sospesa;
 - Disdetta.

 Frequenze di rinnovo disponibili
 --------------------------------
 - Mensile;
 - Trimestrale;
 - Semestrale;
 - Annuale;
 - Pluriennale;
 - Nessun rinnovo.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 La gestione delle polizze assicurative può riguardare aziende appartenenti a
 qualunque attività economica. La voce è quindi valida per tutti i settori IAF
 e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ASSICURAZIONI
 └── ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE
     ├── ...TIPOLOGIA_POLIZZA
     ├── ...COMPAGNIA_ASSICURATIVA
     ├── ...NUMERO_POLIZZA
     ├── ...DATA_EMISSIONE
     ├── ...DATA_DECORRENZA
     ├── ...DATA_SCADENZA
     ├── ...MASSIMALE
     ├── ...STATO
     ├── ...CONTRAENTE
     ├── ...REFERENTE
     ├── ...PREMIO_ASSICURATIVO
     ├── ...FREQUENZA_RINNOVO
     ├── ...DOCUMENTAZIONE_ASSOCIATA
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati della polizza assicurativa
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_assicurazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_assicurazioni_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_assicurazioni (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_SCADENZA', 'In scadenza', 1, TRUE),
    ('ATTIVA', 'Attiva', 2, TRUE),
    ('SCADUTA', 'Scaduta', 3, TRUE),
    ('SOSPESA', 'Sospesa', 4, TRUE),
    ('DISDETTA', 'Disdetta', 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 CATALOGO: frequenze di rinnovo della polizza
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_frequenze_rinnovo_assicurazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_frequenze_rinnovo_assicurazioni_codice
        UNIQUE (codice)
);

INSERT INTO cat_frequenze_rinnovo_assicurazioni (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('MENSILE', 'Mensile', 1, TRUE),
    ('TRIMESTRALE', 'Trimestrale', 2, TRUE),
    ('SEMESTRALE', 'Semestrale', 3, TRUE),
    ('ANNUALE', 'Annuale', 4, TRUE),
    ('PLURIENNALE', 'Pluriennale', 5, TRUE),
    ('NESSUN_RINNOVO', 'Nessun rinnovo', 6, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_assicurazioni
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_assicurazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    tipologia_polizza VARCHAR(250) NOT NULL,
    compagnia_assicurativa VARCHAR(250) NOT NULL,
    numero_polizza VARCHAR(100) NOT NULL,
    data_emissione DATE NOT NULL,
    data_decorrenza DATE NOT NULL,
    data_scadenza DATE NOT NULL,
    massimale NUMERIC(18,2) NOT NULL,
    stato_id UUID NOT NULL,
    contraente VARCHAR(250) NOT NULL,
    referente VARCHAR(250) NOT NULL,
    premio_assicurativo NUMERIC(18,2) NOT NULL,
    frequenza_rinnovo_id UUID NOT NULL,
    documentazione_associata TEXT,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_assicurazioni_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_assicurazioni_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_assicurazioni(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ana_assicurazioni_frequenza_rinnovo
        FOREIGN KEY (frequenza_rinnovo_id)
        REFERENCES cat_frequenze_rinnovo_assicurazioni(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_assicurazioni IS
    'Polizze assicurative stipulate da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_assicurazioni_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_assicurazioni_set_updated_at() IS
    'Aggiorna ana_assicurazioni.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_assicurazioni_set_updated_at
    ON ana_assicurazioni;

CREATE TRIGGER trg_ana_assicurazioni_set_updated_at
BEFORE UPDATE ON ana_assicurazioni
FOR EACH ROW
EXECUTE FUNCTION fn_ana_assicurazioni_set_updated_at();


/*
-------------------------------------------------------------------------------
 SOTTOCATEGORIA: ASSICURAZIONI
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
    'ANAGRAFICA_AZIENDALE.ASSICURAZIONI',
    m.id,
    NULL,
    'SEZIONE',
    'Assicurazioni',
    'Sottocategoria dedicata alle coperture assicurative dell''azienda.',
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
 VOCE: ASSICURAZIONI
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
    'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE',
    m.id,
    p.id,
    'SEZIONE',
    'Assicurazioni',
    'Sezione contenente le polizze assicurative stipulate dall''azienda.',
    'public',
    'ana_assicurazioni',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ASSICURAZIONI'
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
 CAMPI DELLE ASSICURAZIONI
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
    'ana_assicurazioni',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.TIPOLOGIA_POLIZZA',
            'Tipologia di polizza',
            'Indica la tipologia della polizza, ad esempio responsabilità civile, incendio, furto oppure infortuni.',
            'tipologia_polizza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.COMPAGNIA_ASSICURATIVA',
            'Compagnia assicurativa',
            'Inserisci la denominazione della compagnia che ha emesso la polizza.',
            'compagnia_assicurativa'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.NUMERO_POLIZZA',
            'Numero di polizza',
            'Inserisci il numero identificativo attribuito alla polizza dalla compagnia assicurativa.',
            'numero_polizza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.DATA_EMISSIONE',
            'Data di emissione',
            'Indica la data nella quale la compagnia assicurativa ha emesso la polizza.',
            'data_emissione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.DATA_DECORRENZA',
            'Data di decorrenza',
            'Indica la data dalla quale la copertura assicurativa produce effetto.',
            'data_decorrenza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.DATA_SCADENZA',
            'Data di scadenza',
            'Indica la data entro la quale termina la copertura assicurativa prevista dalla polizza.',
            'data_scadenza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.MASSIMALE',
            'Massimale',
            'Inserisci l''importo massimo indennizzabile previsto dalla polizza.',
            'massimale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.STATO',
            'Stato',
            'Seleziona lo stato della polizza: In scadenza, Attiva, Scaduta, Sospesa oppure Disdetta.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.CONTRAENTE',
            'Contraente',
            'Indica il soggetto che ha stipulato la polizza e assume gli obblighi contrattuali.',
            'contraente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.REFERENTE',
            'Referente',
            'Indica il nominativo o il ruolo del referente per la gestione della polizza.',
            'referente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.PREMIO_ASSICURATIVO',
            'Premio assicurativo',
            'Inserisci l''importo del premio dovuto per la copertura assicurativa.',
            'premio_assicurativo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.FREQUENZA_RINNOVO',
            'Frequenza di rinnovo',
            'Seleziona la frequenza prevista per il rinnovo: Mensile, Trimestrale, Semestrale, Annuale, Pluriennale oppure Nessun rinnovo.',
            'frequenza_rinnovo_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento alla polizza, alle quietanze o ad altri documenti associati. Lascia vuoto se non disponibili.',
            'documentazione_associata'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sulla polizza assicurativa.',
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
        e.codice = 'ANAGRAFICA_AZIENDALE.ASSICURAZIONI'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.')
           ) = 'ANAGRAFICA_AZIENDALE.ASSICURAZIONI.POLIZZE.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
