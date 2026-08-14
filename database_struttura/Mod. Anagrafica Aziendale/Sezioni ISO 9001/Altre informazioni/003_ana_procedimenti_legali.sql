/*
===============================================================================
 MIGRAZIONE 003 - PROCEDIMENTI LEGALI
 CATEGORIA: ALTRE INFORMAZIONI
 SOTTOCATEGORIA: REGISTRO ATTIVITA LEGALI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per un procedimento legale;
 - la tabella operativa che conserva i procedimenti legali di ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascun procedimento. Non viene
 quindi applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - In corso;
 - Sospeso;
 - Concluso;
 - Archiviato.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 I procedimenti legali possono riguardare organizzazioni appartenenti a
 qualunque attività economica. La voce è quindi valida per tutti i settori IAF
 e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI
 └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI
     └── ...PROCEDIMENTI_LEGALI
         ├── ...TIPOLOGIA_PROCEDIMENTO
         ├── ...CONTROPARTE
         ├── ...DATA_INIZIO
         ├── ...DATA_CONCLUSIONE
         ├── ...STATO
         ├── ...ESITO
         ├── ...NOTE
         └── ...DOCUMENTAZIONE_ASSOCIATA

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati dei procedimenti legali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_procedimenti_legali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_procedimenti_legali_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_procedimenti_legali (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_CORSO', 'In corso', 1, TRUE),
    ('SOSPESO', 'Sospeso', 2, TRUE),
    ('CONCLUSO', 'Concluso', 3, TRUE),
    ('ARCHIVIATO', 'Archiviato', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: procedimenti legali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_procedimenti_legali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL,
    tipologia_procedimento VARCHAR(250) NOT NULL,
    controparte VARCHAR(250) NOT NULL,
    data_inizio DATE NOT NULL,
    data_conclusione DATE,
    stato_id UUID NOT NULL,
    esito TEXT,
    note TEXT,
    documentazione_associata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_procedimenti_legali_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_procedimenti_legali_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_procedimenti_legali(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

COMMENT ON TABLE ana_procedimenti_legali IS
    'Procedimenti legali registrati per ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_procedimenti_legali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_procedimenti_legali_set_updated_at() IS
    'Aggiorna ana_procedimenti_legali.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_procedimenti_legali_set_updated_at
    ON ana_procedimenti_legali;

CREATE TRIGGER trg_ana_procedimenti_legali_set_updated_at
BEFORE UPDATE ON ana_procedimenti_legali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_procedimenti_legali_set_updated_at();


/*
-------------------------------------------------------------------------------
 CATEGORIA: ALTRE INFORMAZIONI
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI',
    m.id,
    NULL,
    'SEZIONE',
    'Altre informazioni',
    'Categoria contenente ulteriori informazioni organizzative e societarie dell''azienda.',
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
 SOTTOCATEGORIA: REGISTRO ATTIVITA LEGALI
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI',
    m.id,
    p.id,
    'SEZIONE',
    'Registro attività legali',
    'Sottocategoria dedicata ai procedimenti legali e alle visite degli enti di controllo.',
    'public',
    NULL,
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI'
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
 VOCE: PROCEDIMENTI LEGALI
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI',
    m.id,
    p.id,
    'SEZIONE',
    'Procedimenti legali',
    'Sezione contenente i procedimenti legali che coinvolgono l''azienda.',
    'public',
    'ana_procedimenti_legali',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI'
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
 CAMPI DEI PROCEDIMENTI LEGALI
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
    'ana_procedimenti_legali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.TIPOLOGIA_PROCEDIMENTO',
            'Tipologia di procedimento',
            'Indica la tipologia del procedimento legale, ad esempio civile, penale, amministrativo o tributario.',
            'tipologia_procedimento'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.CONTROPARTE',
            'Controparte',
            'Indica il soggetto o l''ente che costituisce la controparte nel procedimento.',
            'controparte'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.DATA_INIZIO',
            'Data di inizio',
            'Indica la data di avvio del procedimento legale.',
            'data_inizio'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.DATA_CONCLUSIONE',
            'Data di conclusione',
            'Indica la data di conclusione del procedimento. Lascia vuoto se il procedimento è ancora aperto.',
            'data_conclusione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.STATO',
            'Stato',
            'Seleziona lo stato del procedimento: In corso, Sospeso, Concluso oppure Archiviato.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.ESITO',
            'Esito',
            'Descrivi l''esito del procedimento. Lascia vuoto finché non è disponibile.',
            'esito'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sul procedimento legale.',
            'note'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento agli atti, ai provvedimenti o agli altri documenti associati. Lascia vuoto se non disponibili.',
            'documentazione_associata'
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
        e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.')
           ) = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.PROCEDIMENTI_LEGALI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
