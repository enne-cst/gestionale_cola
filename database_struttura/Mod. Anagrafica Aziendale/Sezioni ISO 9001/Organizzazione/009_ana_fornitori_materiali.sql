/*
===============================================================================
 MIGRAZIONE 009 - FORNITORI DI MATERIALI
===============================================================================

 Scopo
 -----
 Questa migrazione crea:
 - il catalogo degli stati selezionabili per un fornitore di materiali;
 - la tabella operativa che conserva i fornitori di materiali utilizzati da
   ciascuna azienda.

 Ogni azienda può avere più righe, una per ciascun fornitore o rapporto di
 fornitura. Non viene quindi applicato un vincolo UNIQUE su azienda_id.

 Stati disponibili
 -----------------
 - Attivo;
 - Sospeso;
 - Terminato.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 L'approvvigionamento di materiali può riguardare aziende appartenenti a
 qualunque attività economica. La voce è quindi valida per tutti i settori IAF
 e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI
     ├── ...RAGIONE_SOCIALE
     ├── ...REFERENTE
     ├── ...TELEFONO
     ├── ...EMAIL
     ├── ...CATEGORIA_MERCEOLOGICA
     ├── ...MATERIALI_FORNITI
     ├── ...DATA_INIZIO_COLLABORAZIONE
     ├── ...STATO
     ├── ...CONTRATTO
     ├── ...CERTIFICAZIONI
     ├── ...SCHEDE_TECNICHE_SICUREZZA
     └── ...ALTRI_DOCUMENTI

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: stati del fornitore di materiali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_fornitori_materiali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_stati_fornitori_materiali_codice
        UNIQUE (codice)
);

INSERT INTO cat_stati_fornitori_materiali (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('ATTIVO', 'Attivo', 1, TRUE),
    ('SOSPESO', 'Sospeso', 2, TRUE),
    ('TERMINATO', 'Terminato', 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_fornitori_materiali
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_fornitori_materiali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    ragione_sociale VARCHAR(250) NOT NULL,
    referente VARCHAR(250) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(254) NOT NULL,
    categoria_merceologica VARCHAR(250) NOT NULL,
    materiali_forniti TEXT NOT NULL,
    data_inizio_collaborazione DATE NOT NULL,
    stato_id UUID NOT NULL,
    contratto TEXT,
    certificazioni TEXT,
    schede_tecniche_sicurezza TEXT,
    altri_documenti TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_fornitori_materiali_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_fornitori_materiali_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_fornitori_materiali(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


COMMENT ON TABLE ana_fornitori_materiali IS
    'Fornitori di materiali utilizzati da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_fornitori_materiali_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_fornitori_materiali_set_updated_at() IS
    'Aggiorna ana_fornitori_materiali.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_fornitori_materiali_set_updated_at
    ON ana_fornitori_materiali;

CREATE TRIGGER trg_ana_fornitori_materiali_set_updated_at
BEFORE UPDATE ON ana_fornitori_materiali
FOR EACH ROW
EXECUTE FUNCTION fn_ana_fornitori_materiali_set_updated_at();


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
 VOCE: FORNITORI DI MATERIALI
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI',
    m.id,
    p.id,
    'SEZIONE',
    'Fornitori di materiali',
    'Sezione contenente i fornitori di materiali dell''azienda e i relativi rapporti di fornitura.',
    'public',
    'ana_fornitori_materiali',
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
 CAMPI DEI FORNITORI DI MATERIALI
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
    'ana_fornitori_materiali',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.RAGIONE_SOCIALE',
            'Ragione sociale',
            'Inserisci la denominazione completa del fornitore di materiali.',
            'ragione_sociale'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.REFERENTE',
            'Referente',
            'Indica il nominativo o il ruolo del referente presso il fornitore.',
            'referente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.TELEFONO',
            'Telefono',
            'Inserisci il numero telefonico del referente o del fornitore.',
            'telefono'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.EMAIL',
            'Email',
            'Inserisci l''indirizzo email del referente o del fornitore.',
            'email'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.CATEGORIA_MERCEOLOGICA',
            'Categoria merceologica',
            'Indica la categoria merceologica alla quale appartengono i materiali acquistati.',
            'categoria_merceologica'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.MATERIALI_FORNITI',
            'Materiali forniti',
            'Descrivi i materiali o le famiglie di materiali forniti all''azienda.',
            'materiali_forniti'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.DATA_INIZIO_COLLABORAZIONE',
            'Data di inizio collaborazione',
            'Indica la data dalla quale è iniziata la collaborazione con il fornitore.',
            'data_inizio_collaborazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.STATO',
            'Stato',
            'Seleziona lo stato della collaborazione: Attivo, Sospeso oppure Terminato.',
            'stato_id'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.CONTRATTO',
            'Contratto',
            'Indica il riferimento al contratto o all''accordo stipulato con il fornitore. Lascia vuoto se non disponibile.',
            'contratto'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.CERTIFICAZIONI',
            'Certificazioni',
            'Indica le certificazioni possedute dal fornitore o il riferimento ai relativi documenti. Lascia vuoto se non disponibili.',
            'certificazioni'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.SCHEDE_TECNICHE_SICUREZZA',
            'Schede tecniche o di sicurezza',
            'Indica il riferimento alle schede tecniche o di sicurezza dei materiali forniti. Lascia vuoto se non applicabili o non disponibili.',
            'schede_tecniche_sicurezza'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.ALTRI_DOCUMENTI',
            'Altri documenti',
            'Indica eventuali ulteriori documenti associati al fornitore o ai materiali forniti.',
            'altri_documenti'
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
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.FORNITORI_MATERIALI.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
