/*
===============================================================================
 MIGRAZIONE 011 - INDICATORI ECONOMICI
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che conserva l'andamento annuale
 degli indicatori economici di ciascuna azienda.

 Per ogni azienda è ammessa una sola rilevazione per anno. La tabella conserva
 fatturato, obiettivo e note; lo scostamento è un valore derivato, calcolato
 dalla vista vw_ana_indicatori_economici come fatturato meno obiettivo.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Gli indicatori economici sono applicabili a organizzazioni di qualunque
 attività. La voce è quindi valida per tutti i settori IAF e la migrazione
 imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.TREND
 └── ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI
     ├── ...ANNO_RIFERIMENTO
     ├── ...FATTURATO
     ├── ...OBIETTIVO
     ├── ...SCOSTAMENTO
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_indicatori_economici
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_indicatori_economici (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    anno_riferimento SMALLINT NOT NULL,

    fatturato NUMERIC(18,2) NOT NULL,
    obiettivo NUMERIC(18,2) NOT NULL,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_indicatori_economici_azienda_anno
        UNIQUE (azienda_id, anno_riferimento),

    CONSTRAINT fk_ana_indicatori_economici_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_indicatori_economici IS
    'Rilevazioni annuali degli indicatori economici aziendali.';


/*
-------------------------------------------------------------------------------
 VISTA CON LO SCOSTAMENTO CALCOLATO
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE VIEW vw_ana_indicatori_economici AS
SELECT
    i.id,
    i.azienda_id,
    i.anno_riferimento,
    i.fatturato,
    i.obiettivo,
    ROUND(i.fatturato - i.obiettivo, 2) AS scostamento,
    i.note,
    i.created_at,
    i.updated_at
FROM ana_indicatori_economici AS i;


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_indicatori_economici_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_indicatori_economici_set_updated_at() IS
    'Aggiorna ana_indicatori_economici.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_indicatori_economici_set_updated_at
    ON ana_indicatori_economici;

CREATE TRIGGER trg_ana_indicatori_economici_set_updated_at
BEFORE UPDATE ON ana_indicatori_economici
FOR EACH ROW
EXECUTE FUNCTION fn_ana_indicatori_economici_set_updated_at();


/*
-------------------------------------------------------------------------------
 SOTTOCATEGORIA: TREND
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
    'ANAGRAFICA_AZIENDALE.TREND',
    m.id,
    NULL,
    'SEZIONE',
    'Trend',
    'Sottocategoria contenente le serie storiche e gli indicatori di andamento dell''azienda.',
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
 VOCE: INDICATORI ECONOMICI
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
    'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI',
    m.id,
    p.id,
    'SEZIONE',
    'Indicatori economici',
    'Serie annuale del fatturato aziendale, degli obiettivi economici e dei relativi scostamenti.',
    'public',
    'ana_indicatori_economici',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.TREND'
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
 CAMPI INSERITI DEGLI INDICATORI ECONOMICI
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
    'ana_indicatori_economici',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.ANNO_RIFERIMENTO',
            'Anno',
            'Indica l''esercizio al quale si riferiscono il fatturato e l''obiettivo economico.',
            'anno_riferimento'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.FATTURATO',
            'Fatturato',
            'Inserisci il fatturato consuntivo dell''azienda relativo all''anno indicato.',
            'fatturato'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.OBIETTIVO',
            'Obiettivo',
            'Inserisci l''obiettivo di fatturato definito per l''anno indicato.',
            'obiettivo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.NOTE',
            'Note',
            'Inserisci eventuali informazioni utili a interpretare il risultato economico dell''anno.',
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
 CAMPO CALCOLATO: SCOSTAMENTO
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
    'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.SCOSTAMENTO',
    m.id,
    p.id,
    'CAMPO',
    'Scostamento',
    'Differenza calcolata tra il fatturato consuntivo e l''obiettivo dello stesso anno. Un valore positivo indica il superamento dell''obiettivo.',
    'public',
    'vw_ana_indicatori_economici',
    'scostamento',
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI'
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
        e.codice = 'ANAGRAFICA_AZIENDALE.TREND'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.')
           ) = 'ANAGRAFICA_AZIENDALE.TREND.INDICATORI_ECONOMICI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
