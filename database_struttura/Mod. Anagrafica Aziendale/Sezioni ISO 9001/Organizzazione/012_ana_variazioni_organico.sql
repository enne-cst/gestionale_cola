/*
===============================================================================
 MIGRAZIONE 012 - VARIAZIONI DELL'ORGANICO
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che integra le rilevazioni annuali
 del personale con assunzioni, cessazioni, obiettivi e note.

 L'organico medio annuo è già conservato in ana_dati_generali e non viene
 duplicato. La vista vw_ana_variazioni_organico lo recupera dalla rilevazione
 dello stesso anno e calcola l'incremento o decremento percentuale rispetto
 all'anno precedente. Lo scostamento è la differenza tra la variazione
 percentuale effettiva e l'obiettivo percentuale.

 Per il primo anno disponibile, oppure quando l'organico medio dell'anno
 precedente è zero, la variazione percentuale e lo scostamento sono NULL.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Gli indicatori dell'organico sono trasversali al tipo di attività svolta
 dall'azienda. La voce è quindi valida per tutti i settori IAF e la migrazione
 imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.TREND
 └── ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO
     ├── ...ANNO_RIFERIMENTO
     ├── ...ORGANICO_MEDIO_ANNUO
     ├── ...INCREMENTO_DECREMENTO_PERSONALE_PERCENTUALE
     ├── ...NUMERO_NUOVE_ASSUNZIONI
     ├── ...NUMERO_CESSAZIONI
     ├── ...OBIETTIVO_VARIAZIONE_PERCENTUALE
     ├── ...SCOSTAMENTO
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_variazioni_organico
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_variazioni_organico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    anno_riferimento SMALLINT NOT NULL,

    numero_nuove_assunzioni INTEGER NOT NULL,
    numero_cessazioni INTEGER NOT NULL,
    obiettivo_variazione_percentuale NUMERIC(7,2) NOT NULL,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_variazioni_organico_azienda_anno
        UNIQUE (azienda_id, anno_riferimento),

    CONSTRAINT fk_ana_variazioni_organico_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_variazioni_organico_dati_generali
        FOREIGN KEY (azienda_id, anno_riferimento)
        REFERENCES ana_dati_generali(azienda_id, anno_riferimento)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_variazioni_organico IS
    'Indicatori annuali relativi alle variazioni dell''organico aziendale.';


/*
-------------------------------------------------------------------------------
 VISTA CON ORGANICO E VARIAZIONI CALCOLATE
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE VIEW vw_ana_variazioni_organico AS
SELECT
    v.id,
    v.azienda_id,
    v.anno_riferimento,
    v.organico_medio_annuo,
    v.incremento_decremento_personale_percentuale,
    v.numero_nuove_assunzioni,
    v.numero_cessazioni,
    v.obiettivo_variazione_percentuale,
    ROUND(
        v.incremento_decremento_personale_percentuale
        - v.obiettivo_variazione_percentuale,
        2
    ) AS scostamento,
    v.note,
    v.created_at,
    v.updated_at
FROM (
    SELECT
        o.id,
        o.azienda_id,
        o.anno_riferimento,
        d.organico_medio_annuo,
        ROUND(
            (d.organico_medio_annuo - p.organico_medio_annuo)
            * 100.0
            / NULLIF(p.organico_medio_annuo, 0),
            2
        ) AS incremento_decremento_personale_percentuale,
        o.numero_nuove_assunzioni,
        o.numero_cessazioni,
        o.obiettivo_variazione_percentuale,
        o.note,
        o.created_at,
        o.updated_at
    FROM ana_variazioni_organico AS o
    JOIN ana_dati_generali AS d
      ON d.azienda_id = o.azienda_id
     AND d.anno_riferimento = o.anno_riferimento
    LEFT JOIN ana_dati_generali AS p
      ON p.azienda_id = o.azienda_id
     AND p.anno_riferimento = o.anno_riferimento - 1
) AS v;


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_variazioni_organico_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_variazioni_organico_set_updated_at() IS
    'Aggiorna ana_variazioni_organico.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_variazioni_organico_set_updated_at
    ON ana_variazioni_organico;

CREATE TRIGGER trg_ana_variazioni_organico_set_updated_at
BEFORE UPDATE ON ana_variazioni_organico
FOR EACH ROW
EXECUTE FUNCTION fn_ana_variazioni_organico_set_updated_at();


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
 VOCE: VARIAZIONI DELL'ORGANICO
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
    'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO',
    m.id,
    p.id,
    'SEZIONE',
    'Variazioni dell''organico',
    'Serie annuale delle variazioni dell''organico, delle assunzioni, delle cessazioni e dei relativi obiettivi.',
    'public',
    'ana_variazioni_organico',
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
 CAMPI INSERITI DELLE VARIAZIONI DELL'ORGANICO
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
    'ana_variazioni_organico',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.ANNO_RIFERIMENTO',
            'Anno',
            'Indica l''anno al quale si riferiscono i dati sulle variazioni dell''organico.',
            'anno_riferimento'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.NUMERO_NUOVE_ASSUNZIONI',
            'Numero di nuove assunzioni',
            'Inserisci il numero complessivo delle nuove assunzioni effettuate durante l''anno.',
            'numero_nuove_assunzioni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.NUMERO_CESSAZIONI',
            'Numero di cessazioni',
            'Inserisci il numero complessivo dei rapporti di lavoro cessati durante l''anno.',
            'numero_cessazioni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.OBIETTIVO_VARIAZIONE_PERCENTUALE',
            'Obiettivo',
            'Inserisci l''obiettivo percentuale di incremento o decremento dell''organico previsto per l''anno.',
            'obiettivo_variazione_percentuale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.NOTE',
            'Note',
            'Inserisci eventuali informazioni utili a interpretare le variazioni dell''organico dell''anno.',
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
 CAMPI CALCOLATI DELLE VARIAZIONI DELL'ORGANICO
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
    'vw_ana_variazioni_organico',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.ORGANICO_MEDIO_ANNUO',
            'Organico medio annuo',
            'Valore recuperato dalla rilevazione annuale corrispondente presente nei dati generali del personale.',
            'organico_medio_annuo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.INCREMENTO_DECREMENTO_PERSONALE_PERCENTUALE',
            'Incremento / decremento del personale (%)',
            'Variazione percentuale calcolata confrontando l''organico medio annuo con quello dell''anno precedente. Il valore non è disponibile se manca il dato precedente o se questo è zero.',
            'incremento_decremento_personale_percentuale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.SCOSTAMENTO',
            'Scostamento',
            'Differenza calcolata tra la variazione percentuale effettiva dell''organico e l''obiettivo percentuale dello stesso anno.',
            'scostamento'
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
        e.codice = 'ANAGRAFICA_AZIENDALE.TREND'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.')
           ) = 'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
