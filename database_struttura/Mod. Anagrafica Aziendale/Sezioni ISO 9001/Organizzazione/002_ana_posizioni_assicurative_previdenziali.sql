/*
===============================================================================
 MIGRAZIONE 002 - POSIZIONI ASSICURATIVE E PREVIDENZIALI
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa delle posizioni INPS e INAIL
 dell'azienda, nella sezione Organizzazione del modulo Anagrafica aziendale.

 Ogni azienda può registrare:
 - una posizione INPS, con numero e sede territoriale;
 - una posizione INAIL, con numero e sede territoriale.

 Una sola riga rappresenta quindi l'intera configurazione assicurativa e
 previdenziale di una singola azienda.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi elementi sono accessibili esclusivamente con la
 certificazione ISO 9001 e sono validi per tutti i settori IAF.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI
     ├── ...POSIZIONE_INPS
     │   ├── ...NUMERO_POSIZIONE_INPS
     │   └── ...SEDE_TERRITORIALE_INPS
     └── ...POSIZIONE_INAIL
         ├── ...NUMERO_POSIZIONE_INAIL
         └── ...SEDE_TERRITORIALE_INAIL

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_posizioni_assicurative_previdenziali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_posizioni_assicurative_previdenziali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    numero_posizione_inps VARCHAR(50) NOT NULL,
    sede_territoriale_inps VARCHAR(200) NOT NULL,

    numero_posizione_inail VARCHAR(50) NOT NULL,
    sede_territoriale_inail VARCHAR(200) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_posizioni_ass_prev_azienda
        UNIQUE (azienda_id),

    CONSTRAINT fk_ana_posizioni_ass_prev_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_posizioni_assicurative_previdenziali IS
    'Posizioni INPS e INAIL registrate da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_posizioni_ass_prev_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_posizioni_ass_prev_set_updated_at() IS
    'Aggiorna ana_posizioni_assicurative_previdenziali.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_posizioni_ass_prev_set_updated_at
    ON ana_posizioni_assicurative_previdenziali;

CREATE TRIGGER trg_ana_posizioni_ass_prev_set_updated_at
BEFORE UPDATE ON ana_posizioni_assicurative_previdenziali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_posizioni_ass_prev_set_updated_at();


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
 VOCE: POSIZIONI ASSICURATIVE E PREVIDENZIALI
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI',
    m.id,
    p.id,
    'SEZIONE',
    'Posizioni assicurative e previdenziali',
    'Sezione contenente i dati delle posizioni INPS e INAIL dell''azienda.',
    'public',
    'ana_posizioni_assicurative_previdenziali',
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
 SOTTOSEZIONI: POSIZIONE INPS E POSIZIONE INAIL
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
    'SEZIONE',
    v.denominazione,
    v.descrizione,
    'public',
    'ana_posizioni_assicurative_previdenziali',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS',
            'Posizione INPS',
            'Dati della posizione previdenziale INPS associata all''azienda.'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL',
            'Posizione INAIL',
            'Dati della posizione assicurativa INAIL associata all''azienda.'
        )
) AS v(codice, denominazione, descrizione)
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
 CAMPI DELLA POSIZIONE INPS
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
    'ana_posizioni_assicurative_previdenziali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS.NUMERO_POSIZIONE_INPS',
            'INPS numero posizione',
            'Inserisci il numero della posizione previdenziale INPS assegnata all''azienda.',
            'numero_posizione_inps'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS.SEDE_TERRITORIALE_INPS',
            'INPS sede territoriale',
            'Inserisci la sede territoriale INPS presso la quale è registrata la posizione.',
            'sede_territoriale_inps'
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
 CAMPI DELLA POSIZIONE INAIL
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
    'ana_posizioni_assicurative_previdenziali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL.NUMERO_POSIZIONE_INAIL',
            'INAIL numero posizione',
            'Inserisci il numero della posizione assicurativa INAIL assegnata all''azienda.',
            'numero_posizione_inail'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL.SEDE_TERRITORIALE_INAIL',
            'INAIL sede territoriale',
            'Inserisci la sede territoriale INAIL presso la quale è registrata la posizione.',
            'sede_territoriale_inail'
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
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS.NUMERO_POSIZIONE_INPS',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INPS.SEDE_TERRITORIALE_INPS',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL.NUMERO_POSIZIONE_INAIL',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.POSIZIONI_ASSICURATIVE_PREVIDENZIALI.POSIZIONE_INAIL.SEDE_TERRITORIALE_INAIL'
  )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
