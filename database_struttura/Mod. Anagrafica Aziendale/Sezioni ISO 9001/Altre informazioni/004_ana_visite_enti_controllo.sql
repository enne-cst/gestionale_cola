/*
===============================================================================
 MIGRAZIONE 004 - VISITE DEGLI ENTI DI CONTROLLO
 CATEGORIA: ALTRE INFORMAZIONI
 SOTTOCATEGORIA: REGISTRO ATTIVITA LEGALI
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che conserva le visite effettuate
 dagli enti di controllo presso ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascuna visita. Non viene quindi
 applicato un vincolo UNIQUE su azienda_id.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Le visite degli enti di controllo possono riguardare organizzazioni
 appartenenti a qualunque attività economica. La voce è quindi valida per tutti
 i settori IAF e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI
 └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI
     └── ...VISITE_ENTI_CONTROLLO
         ├── ...ENTE
         ├── ...TIPOLOGIA_VISITA
         ├── ...DATA_VISITA
         ├── ...ESITO
         ├── ...PRESCRIZIONI
         ├── ...VERBALE_DOCUMENTAZIONE
         └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: visite degli enti di controllo
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_visite_enti_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL,
    ente VARCHAR(250) NOT NULL,
    tipologia_visita VARCHAR(250) NOT NULL,
    data_visita DATE NOT NULL,
    esito TEXT NOT NULL,
    prescrizioni TEXT,
    verbale_documentazione TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_visite_enti_controllo_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE ana_visite_enti_controllo IS
    'Visite effettuate dagli enti di controllo presso ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_visite_enti_controllo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_visite_enti_controllo_set_updated_at() IS
    'Aggiorna ana_visite_enti_controllo.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_visite_enti_controllo_set_updated_at
    ON ana_visite_enti_controllo;

CREATE TRIGGER trg_ana_visite_enti_controllo_set_updated_at
BEFORE UPDATE ON ana_visite_enti_controllo
FOR EACH ROW
EXECUTE FUNCTION fn_ana_visite_enti_controllo_set_updated_at();


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
 VOCE: VISITE DEGLI ENTI DI CONTROLLO
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO',
    m.id,
    p.id,
    'SEZIONE',
    'Visite degli enti di controllo',
    'Sezione contenente le visite effettuate dagli enti di controllo presso l''azienda.',
    'public',
    'ana_visite_enti_controllo',
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
 CAMPI DELLE VISITE DEGLI ENTI DI CONTROLLO
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
    'ana_visite_enti_controllo',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.ENTE',
            'Ente',
            'Indica la denominazione dell''ente di controllo che ha effettuato la visita.',
            'ente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.TIPOLOGIA_VISITA',
            'Tipologia di visita',
            'Indica la tipologia della visita o del controllo effettuato.',
            'tipologia_visita'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.DATA_VISITA',
            'Data della visita',
            'Indica la data nella quale è stata effettuata la visita dell''ente di controllo.',
            'data_visita'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.ESITO',
            'Esito',
            'Descrivi l''esito della visita o del controllo effettuato.',
            'esito'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.PRESCRIZIONI',
            'Prescrizioni',
            'Riporta le eventuali prescrizioni impartite dall''ente di controllo. Lascia vuoto se non presenti.',
            'prescrizioni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.VERBALE_DOCUMENTAZIONE',
            'Verbale / Documentazione',
            'Indica il riferimento al verbale o agli altri documenti associati alla visita. Lascia vuoto se non disponibili.',
            'verbale_documentazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sulla visita o sulle azioni conseguenti.',
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
        e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.')
           ) = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.REGISTRO_ATTIVITA_LEGALI.VISITE_ENTI_CONTROLLO.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
