/*
===============================================================================
 MIGRAZIONE 002 - COMPLIANCE E TRASPARENZA
 CATEGORIA: ALTRE INFORMAZIONI
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che conserva gli elementi della
 documentazione di compliance e trasparenza di ciascuna azienda.

 Ogni azienda può registrare più righe, una per ciascun documento, adempimento
 o elemento di compliance. Non viene quindi applicato un vincolo UNIQUE su
 azienda_id.

 L'adozione è rappresentata dalla relativa data. Il campo resta facoltativo
 quando l'elemento non è stato adottato o la data non è disponibile.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 La documentazione di compliance e trasparenza può riguardare organizzazioni
 appartenenti a qualunque attività economica. La voce è quindi valida per tutti
 i settori IAF e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI
 └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA
     └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE
         ├── ...ELEMENTO
         ├── ...PRESENZA
         ├── ...ADOZIONE
         ├── ...DETTAGLI_NOTE
         └── ...DOCUMENTAZIONE_ASSOCIATA

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: documentazione di compliance e trasparenza
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_compliance_trasparenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL,
    elemento VARCHAR(250) NOT NULL,
    presenza BOOLEAN NOT NULL DEFAULT FALSE,
    data_adozione DATE,
    dettagli_note TEXT,
    documentazione_associata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_compliance_trasparenza_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE ana_compliance_trasparenza IS
    'Documenti e adempimenti di compliance e trasparenza registrati per ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_compliance_trasparenza_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_compliance_trasparenza_set_updated_at() IS
    'Aggiorna ana_compliance_trasparenza.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_compliance_trasparenza_set_updated_at
    ON ana_compliance_trasparenza;

CREATE TRIGGER trg_ana_compliance_trasparenza_set_updated_at
BEFORE UPDATE ON ana_compliance_trasparenza
FOR EACH ROW
EXECUTE FUNCTION fn_ana_compliance_trasparenza_set_updated_at();


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
 SOTTOCATEGORIA: COMPLIANCE E TRASPARENZA
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA',
    m.id,
    p.id,
    'SEZIONE',
    'Compliance e trasparenza',
    'Sottocategoria dedicata alla documentazione di compliance e trasparenza dell''azienda.',
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
 VOCE: DOCUMENTAZIONE
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE',
    m.id,
    p.id,
    'SEZIONE',
    'Documentazione',
    'Sezione contenente i documenti e gli adempimenti di compliance e trasparenza dell''azienda.',
    'public',
    'ana_compliance_trasparenza',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA'
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
 CAMPI DELLA DOCUMENTAZIONE
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
    'ana_compliance_trasparenza',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.ELEMENTO',
            'Elemento',
            'Indica il documento, l''adempimento o l''elemento di compliance e trasparenza da registrare.',
            'elemento'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.PRESENZA',
            'Presenza',
            'Indica se l''elemento di compliance o trasparenza è presente presso l''azienda.',
            'presenza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.ADOZIONE',
            'Adozione',
            'Indica la data nella quale il documento o l''adempimento è stato formalmente adottato. Lascia vuoto se non adottato o se la data non è disponibile.',
            'data_adozione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.DETTAGLI_NOTE',
            'Dettagli / Note',
            'Inserisci eventuali dettagli, precisazioni o note sull''elemento registrato.',
            'dettagli_note'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento ai file o agli altri documenti associati. Lascia vuoto se non disponibili.',
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.')
           ) = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.COMPLIANCE_TRASPARENZA.DOCUMENTAZIONE.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
