/*
===============================================================================
 MIGRAZIONE 001 - CONTRATTI DI RETE
 CATEGORIA: ALTRE INFORMAZIONI
===============================================================================

 Scopo
 -----
 Questa migrazione apre la numerazione autonoma della categoria
 "Altre informazioni" e crea:
 - la configurazione che indica la presenza di contratti di rete per azienda;
 - la tabella operativa contenente i singoli contratti di rete.

 La configurazione contiene una sola riga per azienda. La tabella operativa
 ammette invece più righe per azienda, perché la stessa organizzazione può
 aderire a più contratti di rete.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 I contratti di rete possono riguardare imprese appartenenti a qualunque
 attività economica. La voce è quindi valida per tutti i settori IAF e la
 migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI
 └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE
     └── ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI
         ├── ...PRESENZA
         ├── ...NUMERO_REGISTRAZIONE
         ├── ...NUMERO_REPERTORIO
         ├── ...NOME_CONTRATTO
         ├── ...DATA_ADESIONE
         ├── ...DATA_CESSAZIONE
         ├── ...NOTE
         └── ...DOCUMENTAZIONE_ASSOCIATA

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CONFIGURAZIONE: presenza di contratti di rete
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_contratti_rete_presenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL,
    presenza BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_contratti_rete_presenza_azienda
        UNIQUE (azienda_id),

    CONSTRAINT fk_ana_contratti_rete_presenza_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE ana_contratti_rete_presenza IS
    'Indicazione della presenza di contratti di rete per ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: contratti di rete
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_contratti_rete (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL,
    numero_registrazione VARCHAR(100) NOT NULL,
    numero_repertorio VARCHAR(100) NOT NULL,
    nome_contratto VARCHAR(250) NOT NULL,
    data_adesione DATE NOT NULL,
    data_cessazione DATE,
    note TEXT,
    documentazione_associata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_contratti_rete_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

COMMENT ON TABLE ana_contratti_rete IS
    'Contratti di rete ai quali aderisce ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_contratti_rete_presenza_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_contratti_rete_presenza_set_updated_at() IS
    'Aggiorna ana_contratti_rete_presenza.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_contratti_rete_presenza_set_updated_at
    ON ana_contratti_rete_presenza;

CREATE TRIGGER trg_ana_contratti_rete_presenza_set_updated_at
BEFORE UPDATE ON ana_contratti_rete_presenza
FOR EACH ROW
EXECUTE FUNCTION fn_ana_contratti_rete_presenza_set_updated_at();


CREATE OR REPLACE FUNCTION fn_ana_contratti_rete_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_contratti_rete_set_updated_at() IS
    'Aggiorna ana_contratti_rete.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_contratti_rete_set_updated_at
    ON ana_contratti_rete;

CREATE TRIGGER trg_ana_contratti_rete_set_updated_at
BEFORE UPDATE ON ana_contratti_rete
FOR EACH ROW
EXECUTE FUNCTION fn_ana_contratti_rete_set_updated_at();


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
 SOTTOCATEGORIA: CONTRATTI DI RETE
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE',
    m.id,
    p.id,
    'SEZIONE',
    'Contratti di rete',
    'Sottocategoria dedicata ai contratti di rete ai quali aderisce l''azienda.',
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
 VOCE: CONTRATTI DI RETE
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
    'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI',
    m.id,
    p.id,
    'SEZIONE',
    'Contratti di rete',
    'Sezione contenente la presenza e i dati dei contratti di rete dell''azienda.',
    'public',
    'ana_contratti_rete',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE'
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
 CAMPI DEI CONTRATTI DI RETE
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
    v.nome_tabella,
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.PRESENZA',
            'Presenza',
            'Indica se l''azienda aderisce ad almeno un contratto di rete.',
            'ana_contratti_rete_presenza',
            'presenza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.NUMERO_REGISTRAZIONE',
            'Numero di registrazione',
            'Inserisci il numero con il quale il contratto di rete è stato registrato.',
            'ana_contratti_rete',
            'numero_registrazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.NUMERO_REPERTORIO',
            'Numero di repertorio',
            'Inserisci il numero di repertorio attribuito al contratto di rete.',
            'ana_contratti_rete',
            'numero_repertorio'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.NOME_CONTRATTO',
            'Nome del contratto',
            'Inserisci la denominazione con la quale è identificato il contratto di rete.',
            'ana_contratti_rete',
            'nome_contratto'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.DATA_ADESIONE',
            'Data di adesione',
            'Indica la data dalla quale l''azienda aderisce al contratto di rete.',
            'ana_contratti_rete',
            'data_adesione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.DATA_CESSAZIONE',
            'Data di cessazione',
            'Indica l''eventuale data nella quale è terminata l''adesione dell''azienda al contratto di rete.',
            'ana_contratti_rete',
            'data_cessazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sul contratto di rete.',
            'ana_contratti_rete',
            'note'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento al contratto o agli altri documenti associati. Lascia vuoto se non disponibili.',
            'ana_contratti_rete',
            'documentazione_associata'
        )
) AS v(codice, denominazione, descrizione, nome_tabella, nome_colonna)
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.')
           ) = 'ANAGRAFICA_AZIENDALE.ALTRE_INFORMAZIONI.CONTRATTI_RETE.CONTRATTI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
