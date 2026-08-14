/*
===============================================================================
 MIGRAZIONE 008 - SUBAPPALTATORI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per un subappaltatore;
 - la tabella operativa che conserva i subappaltatori utilizzati da ciascuna
   azienda.

 Ogni azienda può avere più righe, una per ciascun subappaltatore o rapporto
 di subappalto. Non viene quindi applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - In valutazione;
 - Attivo;
 - Sospeso;
 - Cessato.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Il ricorso a subappaltatori può riguardare aziende appartenenti a qualunque
 attività economica. La voce è quindi valida per tutti i settori IAF e la
 migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI
     ├── ...RAGIONE_SOCIALE
     ├── ...CODICE_FISCALE_PARTITA_IVA
     ├── ...CATEGORIA_LAVORI
     ├── ...DATA_INIZIO
     ├── ...DATA_FINE
     ├── ...STATO
     ├── ...REFERENTE
     ├── ...DOCUMENTAZIONE_ASSOCIATA
     └── ...NOTE

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati del subappaltatore
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_subappaltatori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_subappaltatori_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_subappaltatori (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('IN_VALUTAZIONE', 'In valutazione', 1, TRUE),
    ('ATTIVO', 'Attivo', 2, TRUE),
    ('SOSPESO', 'Sospeso', 3, TRUE),
    ('CESSATO', 'Cessato', 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_subappaltatori
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_subappaltatori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    ragione_sociale VARCHAR(250) NOT NULL,
    codice_fiscale_partita_iva VARCHAR(30) NOT NULL,
    categoria_lavori VARCHAR(250) NOT NULL,
    data_inizio DATE NOT NULL,
    data_fine DATE,
    stato_id UUID NOT NULL,
    referente VARCHAR(250) NOT NULL,
    documentazione_associata TEXT,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_subappaltatori_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_subappaltatori_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_subappaltatori(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_subappaltatori IS
    'Subappaltatori utilizzati da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_subappaltatori_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_subappaltatori_set_updated_at() IS
    'Aggiorna ana_subappaltatori.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_subappaltatori_set_updated_at
    ON ana_subappaltatori;

CREATE TRIGGER trg_ana_subappaltatori_set_updated_at
BEFORE UPDATE ON ana_subappaltatori
FOR EACH ROW
EXECUTE FUNCTION fn_ana_subappaltatori_set_updated_at();


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
 VOCE: SUBAPPALTATORI
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI',
    m.id,
    p.id,
    'SEZIONE',
    'Subappaltatori',
    'Sezione contenente i subappaltatori utilizzati dall''azienda e i relativi rapporti di subappalto.',
    'public',
    'ana_subappaltatori',
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
 CAMPI DEI SUBAPPALTATORI
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
    'ana_subappaltatori',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.RAGIONE_SOCIALE',
            'Ragione sociale',
            'Inserisci la denominazione completa del subappaltatore.',
            'ragione_sociale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.CODICE_FISCALE_PARTITA_IVA',
            'Codice fiscale / Partita IVA',
            'Inserisci il codice fiscale o la partita IVA che identifica il subappaltatore.',
            'codice_fiscale_partita_iva'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.CATEGORIA_LAVORI',
            'Categoria lavori',
            'Indica la categoria dei lavori o delle attività affidate al subappaltatore.',
            'categoria_lavori'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.DATA_INIZIO',
            'Data di inizio',
            'Indica la data dalla quale decorre il rapporto di subappalto.',
            'data_inizio'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.DATA_FINE',
            'Data di fine',
            'Indica la data di conclusione del rapporto. Lascia vuoto se il subappalto è ancora attivo.',
            'data_fine'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.STATO',
            'Stato',
            'Seleziona lo stato del subappaltatore: In valutazione, Attivo, Sospeso oppure Cessato.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.REFERENTE',
            'Referente',
            'Indica il nominativo o il ruolo del referente del subappaltatore.',
            'referente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.DOCUMENTAZIONE_ASSOCIATA',
            'Documentazione associata',
            'Indica il riferimento alla documentazione collegata al subappaltatore, ad esempio contratto, attestazioni o qualifiche. Lascia vuoto se non disponibile.',
            'documentazione_associata'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive sul subappaltatore o sul rapporto di subappalto.',
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.SUBAPPALTATORI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
