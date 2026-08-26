/*
===============================================================================
 MIGRAZIONE 001 - ANAGRAFICA PERSONE
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella anagrafica del modulo Personale. Ogni riga
 rappresenta una persona fisica collegata a una specifica azienda e contiene
 sia i dati identificativi sia gli indicatori sintetici richiesti nella scheda.

 Mansione, persona di backup, processi speciali, livelli professionali e
 frequenza delle visite mediche sono riepiloghi correnti. Le informazioni di
 dettaglio e i relativi storici potranno essere gestiti dalle tabelle dedicate
 del modulo senza eliminare questi indicatori di sintesi.

 Conoscenza dell'organizzazione, competenze e consapevolezza utilizzano un
 unico catalogo controllato con tre valori selezionabili: Livello 1, Livello 2
 e Livello 3. La frequenza delle visite mediche è un valore numerico intero,
 utilizzabile dall'interfaccia con un controllo incrementale.

 Cardinalita
 -----------
 Ogni azienda può registrare più persone. Il codice fiscale è univoco soltanto
 all'interno della stessa azienda, così la medesima persona può essere presente
 in aziende differenti senza creare collegamenti tra tenant.

 Regole di abbonamento
 ---------------------
 La sezione e tutti i suoi campi sono accessibili con:
 - ISO 9001;
 - ISO 45001.

 Tutti gli elementi sono validi per tutti i settori IAF. ISO 14001 non viene
 associata.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 PERSONALE.ANAGRAFICA_PERSONE
 ├── ...FOTOGRAFIA
 ├── ...COGNOME
 ├── ...NOME
 ├── ...SESSO
 ├── ...DATA_NASCITA
 ├── ...LUOGO_NASCITA
 ├── ...NAZIONALITA
 ├── ...CONOSCENZA_LINGUA_ITALIANA
 ├── ...CODICE_FISCALE
 ├── ...RESIDENZA
 ├── ...TIPOLOGIA_CONTRATTO
 ├── ...DATA_ASSUNZIONE
 ├── ...DATA_FINE_RAPPORTO
 ├── ...MANSIONE
 ├── ...PERSONA_BACKUP
 ├── ...PROCESSI_SPECIALI_ESEGUITI
 ├── ...CONOSCENZA_ORGANIZZAZIONE_LIVELLO
 ├── ...COMPETENZE_LIVELLO
 ├── ...CONSAPEVOLEZZA_LIVELLO
 ├── ...FREQUENZA_VISITE_MEDICHE
 ├── ...ALTRO
 └── ...NOTE

 Prerequisiti
 ------------
 - sys_aziende(id UUID);
 - cat_moduli con codice PERSONALE;
 - cat_certificazioni con codici ISO_9001 e ISO_45001;
 - sys_elementi e rel_elementi_certificazioni.

 La migrazione è idempotente e non inserisce persone di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO: livelli sintetici della persona
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_livelli_sintetici_personale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(30) NOT NULL,
    denominazione VARCHAR(100) NOT NULL,
    valore SMALLINT NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_cat_livelli_sintetici_personale_codice
        UNIQUE (codice),

    CONSTRAINT uq_cat_livelli_sintetici_personale_valore
        UNIQUE (valore)
);

INSERT INTO cat_livelli_sintetici_personale (
    codice,
    denominazione,
    valore,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('LIVELLO_1', 'Livello 1', 1, 1, TRUE),
    ('LIVELLO_2', 'Livello 2', 2, 2, TRUE),
    ('LIVELLO_3', 'Livello 3', 3, 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    valore                 = EXCLUDED.valore,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_persone
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_persone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    fotografia TEXT,
    cognome VARCHAR(150) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    sesso VARCHAR(50),
    data_nascita DATE,
    luogo_nascita VARCHAR(200),
    nazionalita VARCHAR(100),
    conoscenza_lingua_italiana VARCHAR(100),
    codice_fiscale VARCHAR(32) NOT NULL,
    residenza TEXT,

    tipologia_contratto VARCHAR(200),
    data_assunzione DATE,
    data_fine_rapporto DATE,
    mansione VARCHAR(200),
    persona_backup_id UUID,
    processi_speciali_eseguiti TEXT,
    conoscenza_organizzazione_livello_id UUID,
    competenze_livello_id UUID,
    consapevolezza_livello_id UUID,
    frequenza_visite_mediche INTEGER,

    altro TEXT,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_persone_azienda_codice_fiscale
        UNIQUE (azienda_id, codice_fiscale),

    CONSTRAINT fk_ana_persone_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_persone_backup
        FOREIGN KEY (persona_backup_id)
        REFERENCES ana_persone(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_ana_persone_conoscenza_organizzazione_livello
        FOREIGN KEY (conoscenza_organizzazione_livello_id)
        REFERENCES cat_livelli_sintetici_personale(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ana_persone_competenze_livello
        FOREIGN KEY (competenze_livello_id)
        REFERENCES cat_livelli_sintetici_personale(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ana_persone_consapevolezza_livello
        FOREIGN KEY (consapevolezza_livello_id)
        REFERENCES cat_livelli_sintetici_personale(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


CREATE INDEX IF NOT EXISTS idx_ana_persone_azienda_nominativo
    ON ana_persone (azienda_id, cognome, nome);


COMMENT ON TABLE ana_persone IS
    'Anagrafica delle persone fisiche e relativi indicatori sintetici correnti per azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_persone_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_persone_set_updated_at() IS
    'Aggiorna ana_persone.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_ana_persone_set_updated_at
    ON ana_persone;

CREATE TRIGGER trg_ana_persone_set_updated_at
BEFORE UPDATE ON ana_persone
FOR EACH ROW
EXECUTE FUNCTION fn_ana_persone_set_updated_at();


/*
-------------------------------------------------------------------------------
 SEZIONE: ANAGRAFICA PERSONE
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
    'PERSONALE.ANAGRAFICA_PERSONE',
    m.id,
    NULL,
    'SEZIONE',
    'Anagrafica persone',
    'Raccoglie i dati identificativi della persona e gli indicatori sintetici correnti relativi al rapporto con l''azienda.',
    'public',
    'ana_persone',
    NULL,
    TRUE
FROM cat_moduli AS m
WHERE m.codice = 'PERSONALE'
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
 CAMPI DELL'ANAGRAFICA PERSONE
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
    'ana_persone',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.ANAGRAFICA_PERSONE'
CROSS JOIN (
    VALUES
        (
            'PERSONALE.ANAGRAFICA_PERSONE.FOTOGRAFIA',
            'Fotografia',
            'Associa alla persona una fotografia identificativa. Il campo conserva il riferimento al file, non il contenuto binario dell''immagine.',
            'fotografia'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.COGNOME',
            'Cognome',
            'Indica il cognome anagrafico della persona.',
            'cognome'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.NOME',
            'Nome',
            'Indica il nome anagrafico della persona.',
            'nome'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.SESSO',
            'Sesso',
            'Indica il sesso riportato nei dati anagrafici della persona.',
            'sesso'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.DATA_NASCITA',
            'Data di nascita',
            'Indica la data di nascita della persona.',
            'data_nascita'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.LUOGO_NASCITA',
            'Luogo di nascita',
            'Indica il comune o il luogo di nascita della persona.',
            'luogo_nascita'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.NAZIONALITA',
            'Nazionalità',
            'Indica la nazionalità della persona.',
            'nazionalita'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.CONOSCENZA_LINGUA_ITALIANA',
            'Conoscenza della lingua italiana',
            'Riporta sinteticamente la conoscenza della lingua italiana posseduta dalla persona.',
            'conoscenza_lingua_italiana'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.CODICE_FISCALE',
            'Codice fiscale',
            'Indica il codice fiscale della persona. Deve essere univoco all''interno della stessa azienda.',
            'codice_fiscale'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.RESIDENZA',
            'Residenza',
            'Indica l''indirizzo di residenza corrente della persona.',
            'residenza'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.TIPOLOGIA_CONTRATTO',
            'Tipologia di contratto',
            'Mostra sinteticamente la tipologia del contratto o del rapporto corrente. Il dettaglio e lo storico sono gestiti nelle funzioni dedicate.',
            'tipologia_contratto'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.DATA_ASSUNZIONE',
            'Data di assunzione',
            'Mostra la data di inizio del rapporto corrente della persona con l''azienda.',
            'data_assunzione'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.DATA_FINE_RAPPORTO',
            'Data di fine rapporto',
            'Mostra l''eventuale data di conclusione del rapporto corrente o più recente.',
            'data_fine_rapporto'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.MANSIONE',
            'Mansione',
            'Mostra sinteticamente la mansione principale corrente. Il dettaglio delle mansioni è gestito nelle funzioni dedicate.',
            'mansione'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.PERSONA_BACKUP',
            'Persona di backup',
            'Indica l''eventuale persona individuata come sostituto o backup sintetico.',
            'persona_backup_id'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.PROCESSI_SPECIALI_ESEGUITI',
            'Processi speciali eseguiti',
            'Riepiloga i processi speciali nei quali la persona opera. Le informazioni analitiche sono gestite nelle funzioni dedicate.',
            'processi_speciali_eseguiti'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.CONOSCENZA_ORGANIZZAZIONE_LIVELLO',
            'Conoscenza dell''organizzazione - livello',
            'Seleziona dal menu a tendina il livello sintetico corrente di conoscenza dell''organizzazione: Livello 1, Livello 2 o Livello 3.',
            'conoscenza_organizzazione_livello_id'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.COMPETENZE_LIVELLO',
            'Competenze - livello',
            'Seleziona dal menu a tendina il livello sintetico corrente delle competenze: Livello 1, Livello 2 o Livello 3.',
            'competenze_livello_id'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.CONSAPEVOLEZZA_LIVELLO',
            'Consapevolezza - livello',
            'Seleziona dal menu a tendina il livello sintetico corrente di consapevolezza: Livello 1, Livello 2 o Livello 3.',
            'consapevolezza_livello_id'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.FREQUENZA_VISITE_MEDICHE',
            'Frequenza delle visite mediche',
            'Inserisci tramite il controllo numerico incrementale la frequenza prevista per le visite mediche. Il dettaglio sanitario è gestito nelle funzioni dedicate.',
            'frequenza_visite_mediche'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.ALTRO',
            'Altro',
            'Inserisci eventuali informazioni aggiuntive non comprese negli altri campi della scheda.',
            'altro'
        ),
        (
            'PERSONALE.ANAGRAFICA_PERSONE.NOTE',
            'Note',
            'Inserisci annotazioni generali facoltative sulla persona.',
            'note'
        )
) AS v(codice, denominazione, descrizione, nome_colonna)
WHERE m.codice = 'PERSONALE'
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
 ASSOCIAZIONE A ISO 9001 E ISO 45001 PER TUTTI I SETTORI IAF
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
       e.codice = 'PERSONALE.ANAGRAFICA_PERSONE'
       OR e.codice LIKE 'PERSONALE.ANAGRAFICA_PERSONE.%'
  )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
