/*
===============================================================================
 MIGRAZIONE 006 - TURNI DI LAVORO
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che descrive l'organizzazione
 corrente dei turni di lavoro di ciascuna azienda.

 Una sola riga per azienda conserva:
 - la presenza o meno di turnazioni;
 - la tipologia e il numero dei turni;
 - le fasce orarie e le modalità di rotazione;
 - la presenza di lavoro notturno, festivo o a ciclo continuo;
 - eventuali note.

 I dettagli dei turni possono rimanere NULL quando l'azienda non adotta
 turnazioni. I valori Sì/No sono invece memorizzati come BOOLEAN.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 L'organizzazione dei turni può riguardare aziende appartenenti a qualunque
 attività economica. La voce è quindi valida per tutti i settori IAF e la
 migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO
     ├── ...PRESENZA_TURNAZIONI
     ├── ...TIPOLOGIA_TURNO
     ├── ...NUMERO_TURNI
     ├── ...FASCE_ORARIE
     ├── ...ROTAZIONE_TURNI
     ├── ...LAVORO_NOTTURNO
     ├── ...LAVORO_FESTIVO
     ├── ...LAVORO_CICLO_CONTINUO
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_turni_lavoro
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_turni_lavoro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    presenza_turnazioni BOOLEAN NOT NULL,
    tipologia_turno VARCHAR(200),
    numero_turni SMALLINT,
    fasce_orarie TEXT,
    rotazione_turni TEXT,
    lavoro_notturno BOOLEAN NOT NULL,
    lavoro_festivo BOOLEAN NOT NULL,
    lavoro_ciclo_continuo BOOLEAN NOT NULL,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_turni_lavoro_azienda
        UNIQUE (azienda_id),

    CONSTRAINT fk_ana_turni_lavoro_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_turni_lavoro IS
    'Organizzazione corrente dei turni di lavoro di ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_turni_lavoro_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_turni_lavoro_set_updated_at() IS
    'Aggiorna ana_turni_lavoro.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_turni_lavoro_set_updated_at
    ON ana_turni_lavoro;

CREATE TRIGGER trg_ana_turni_lavoro_set_updated_at
BEFORE UPDATE ON ana_turni_lavoro
FOR EACH ROW
EXECUTE FUNCTION fn_ana_turni_lavoro_set_updated_at();


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
 VOCE: TURNI DI LAVORO
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO',
    m.id,
    p.id,
    'SEZIONE',
    'Turni di lavoro',
    'Sezione contenente la configurazione corrente dei turni di lavoro dell''azienda.',
    'public',
    'ana_turni_lavoro',
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
 CAMPI DEI TURNI DI LAVORO
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
    'ana_turni_lavoro',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.PRESENZA_TURNAZIONI',
            'Presenza turnazioni (Sì/No)',
            'Indica se l''azienda organizza il lavoro attraverso una successione programmata di turni.',
            'presenza_turnazioni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.TIPOLOGIA_TURNO',
            'Tipologia di turno',
            'Descrivi la tipologia di turno adottata, ad esempio fisso, alternato, spezzato oppure a rotazione.',
            'tipologia_turno'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.NUMERO_TURNI',
            'Numero di turni',
            'Inserisci il numero complessivo dei turni previsti nell''organizzazione ordinaria del lavoro.',
            'numero_turni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.FASCE_ORARIE',
            'Fasce orarie',
            'Indica gli orari di inizio e fine delle diverse fasce di turno adottate dall''azienda.',
            'fasce_orarie'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.ROTAZIONE_TURNI',
            'Rotazione dei turni',
            'Descrivi con quale criterio e frequenza i lavoratori ruotano tra i diversi turni.',
            'rotazione_turni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.LAVORO_NOTTURNO',
            'Lavoro notturno (Sì/No)',
            'Indica se l''organizzazione dei turni prevede lo svolgimento di lavoro notturno.',
            'lavoro_notturno'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.LAVORO_FESTIVO',
            'Lavoro festivo (Sì/No)',
            'Indica se l''organizzazione dei turni prevede attività lavorativa nei giorni festivi.',
            'lavoro_festivo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.LAVORO_CICLO_CONTINUO',
            'Lavoro a ciclo continuo (Sì/No)',
            'Indica se l''attività viene svolta senza interruzioni attraverso turni che coprono continuativamente l''intero ciclo operativo.',
            'lavoro_ciclo_continuo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.NOTE',
            'Note',
            'Inserisci eventuali precisazioni sull''organizzazione, sulle eccezioni o sulle particolarità dei turni di lavoro.',
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.TURNI_LAVORO.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
