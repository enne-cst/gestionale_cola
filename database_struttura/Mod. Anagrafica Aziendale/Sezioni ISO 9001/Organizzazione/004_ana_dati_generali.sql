/*
===============================================================================
 MIGRAZIONE 004 - DATI GENERALI DEL PERSONALE
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che conserva le rilevazioni
 annuali dei principali dati statistici del personale di ciascuna azienda.

 Ogni rilevazione rappresenta la situazione al 31 dicembre dell'anno indicato.
 Il vincolo UNIQUE su azienda_id e anno_riferimento consente una sola fotografia
 consolidata per azienda e anno, mantenendo però l'andamento nel tempo.

 Dati rilevati
 -------------
 - numero di addetti;
 - numero di dipendenti;
 - numero di soci lavoratori;
 - organico medio annuo;
 - età media.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Gli indicatori del personale sono trasversali al tipo di attività svolta
 dall'azienda. La voce è quindi valida per tutti i settori IAF e la migrazione
 imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI
     ├── ...ANNO_RIFERIMENTO
     ├── ...NUMERO_ADDETTI
     ├── ...NUMERO_DIPENDENTI
     ├── ...NUMERO_SOCI_LAVORATORI
     ├── ...ORGANICO_MEDIO_ANNUO
     └── ...ETA_MEDIA

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_dati_generali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_dati_generali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    anno_riferimento SMALLINT NOT NULL,

    numero_addetti INTEGER NOT NULL,
    numero_dipendenti INTEGER NOT NULL,
    numero_soci_lavoratori INTEGER NOT NULL,
    organico_medio_annuo NUMERIC(10,2) NOT NULL,
    eta_media NUMERIC(5,2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_dati_generali_azienda_anno
        UNIQUE (azienda_id, anno_riferimento),

    CONSTRAINT fk_ana_dati_generali_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_dati_generali IS
    'Rilevazioni annuali dei dati del personale al 31 dicembre.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_dati_generali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_dati_generali_set_updated_at() IS
    'Aggiorna ana_dati_generali.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_dati_generali_set_updated_at
    ON ana_dati_generali;

CREATE TRIGGER trg_ana_dati_generali_set_updated_at
BEFORE UPDATE ON ana_dati_generali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_dati_generali_set_updated_at();


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
 VOCE: DATI GENERALI
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI',
    m.id,
    p.id,
    'SEZIONE',
    'Dati generali',
    'Sezione contenente le rilevazioni annuali dei principali dati statistici del personale dell''azienda.',
    'public',
    'ana_dati_generali',
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
 CAMPI DEI DATI GENERALI
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
    'ana_dati_generali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ANNO_RIFERIMENTO',
            'Anno di riferimento',
            'Indica l''anno della rilevazione. Tutti i valori devono rappresentare la situazione dell''azienda al 31 dicembre di tale anno.',
            'anno_riferimento'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_ADDETTI',
            'Numero addetti',
            'Inserisci il numero complessivo degli addetti presenti in azienda al 31 dicembre dell''anno di riferimento.',
            'numero_addetti'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_DIPENDENTI',
            'Numero dipendenti',
            'Inserisci il numero dei lavoratori dipendenti presenti in azienda al 31 dicembre dell''anno di riferimento.',
            'numero_dipendenti'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_SOCI_LAVORATORI',
            'Numero soci lavoratori',
            'Inserisci il numero dei soci che prestano attività lavorativa nell''azienda al 31 dicembre dell''anno di riferimento.',
            'numero_soci_lavoratori'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ORGANICO_MEDIO_ANNUO',
            'Organico medio annuo',
            'Inserisci la consistenza media del personale nell''intero anno di riferimento; sono ammessi valori decimali.',
            'organico_medio_annuo'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ETA_MEDIA',
            'Età media',
            'Inserisci l''età media del personale alla data del 31 dicembre dell''anno di riferimento; sono ammessi valori decimali.',
            'eta_media'
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
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ANNO_RIFERIMENTO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_ADDETTI',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_DIPENDENTI',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.NUMERO_SOCI_LAVORATORI',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ORGANICO_MEDIO_ANNUO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.DATI_GENERALI.ETA_MEDIA'
  )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
