-- =======================================================================
-- MODULO PERSONALE (rev2) - RAPPORTO AZIENDALE, MANSIONE E REPARTO
-- =======================================================================
--
-- Seconda tabella del piano di migrazione concordato per il nuovo modulo
-- Personale (SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE §12, §22.3).
-- `ana_persone` (migrazione 001) ha già mansione/tipologia_contratto/
-- date come "indicatori sintetici correnti" (commento esplicito in quella
-- migrazione): questa tabella è la storicizzazione di dettaglio a cui
-- quel commento rimandava, non una sostituzione. Il servizio applicativo
-- che apre/chiude un rapporto aggiornerà anche le colonne di sintesi su
-- ana_persone — nessun trigger DB, per non nascondere la logica.
--
-- Decisioni di questa sessione applicate qui:
-- - cat_mansioni/cat_reparti: catalogo PER AZIENDA (azienda_id
--   obbligatorio) — mansioni e reparti variano troppo da azienda ad
--   azienda per un catalogo globale.
-- - cat_tipi_rapporto: catalogo GLOBALE di sistema (come cat_ruoli) — i
--   valori (indeterminato/determinato/collaborazione/amministratore/
--   altro, da §12.3 "Dettagli contrattuali > durata", l'unico punto della
--   specifica che elenca valori concreti per questo campo) sono standard
--   e comuni a qualunque azienda, a differenza di mansioni/reparti.
-- - Registrazione sys_elementi a grana di SEZIONE/SOTTOSEZIONE (una voce
--   per tabella), non per singolo campo: queste sono tabelle operative di
--   registrazione (più vicine a per_incarichi che al dossier a campi
--   indipendenti di ana_persone). ISO_9001 + ISO_45001, tutti i settori
--   IAF, per decisione esplicita di questa sessione (mappatura uniforme
--   per ora, affinabile in futuro senza toccare il codice: la tabella
--   rel_elementi_certificazioni resta dati, non logica).
-- - Cardinalità "un solo rapporto attivo per persona alla volta": non
--   imposta come vincolo DB (stesso stile già in uso nel progetto per le
--   regole di cardinalità — verificate e confermate a livello applicativo,
--   es. Amministratore Unico in app.core.incarichi), per non bloccare casi
--   legittimi non ancora previsti.


-- -----------------------------------------------------------------------
-- 1. CATALOGO TIPI DI RAPPORTO (globale di sistema)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_tipi_rapporto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipi_rapporto_codice UNIQUE (codice)
);

INSERT INTO cat_tipi_rapporto (codice, denominazione, descrizione, ordine_visualizzazione, attivo)
VALUES
    ('INDETERMINATO', 'Tempo indeterminato', 'Rapporto di lavoro subordinato a tempo indeterminato.', 1, TRUE),
    ('DETERMINATO', 'Tempo determinato', 'Rapporto di lavoro subordinato a termine.', 2, TRUE),
    ('COLLABORAZIONE', 'Collaborazione', 'Rapporto di collaborazione non subordinata.', 3, TRUE),
    ('AMMINISTRATORE', 'Amministratore', 'Rapporto legato a una carica amministrativa, non a un contratto di lavoro subordinato.', 4, TRUE),
    ('ALTRO', 'Altro', 'Tipologia residuale da usare quando il rapporto non rientra nelle classificazioni disponibili.', 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;

CREATE OR REPLACE FUNCTION fn_cat_tipi_rapporto_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipi_rapporto_set_updated_at ON cat_tipi_rapporto;
CREATE TRIGGER trg_cat_tipi_rapporto_set_updated_at
BEFORE UPDATE ON cat_tipi_rapporto
FOR EACH ROW EXECUTE FUNCTION fn_cat_tipi_rapporto_set_updated_at();


-- -----------------------------------------------------------------------
-- 2. CATALOGO MANSIONI (per azienda)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_mansioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL DEFAULT 1,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_mansioni_azienda_codice UNIQUE (azienda_id, codice)
);

CREATE INDEX IF NOT EXISTS idx_cat_mansioni_azienda ON cat_mansioni (azienda_id, attivo);

CREATE OR REPLACE FUNCTION fn_cat_mansioni_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_mansioni_set_updated_at ON cat_mansioni;
CREATE TRIGGER trg_cat_mansioni_set_updated_at
BEFORE UPDATE ON cat_mansioni
FOR EACH ROW EXECUTE FUNCTION fn_cat_mansioni_set_updated_at();

COMMENT ON TABLE cat_mansioni IS
    'Catalogo delle mansioni, per azienda (modulo Personale §12/§22.4): ogni azienda definisce il proprio elenco, nessun valore di sistema precaricato.';


-- -----------------------------------------------------------------------
-- 3. CATALOGO REPARTI (per azienda)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_reparti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL DEFAULT 1,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_reparti_azienda_codice UNIQUE (azienda_id, codice)
);

CREATE INDEX IF NOT EXISTS idx_cat_reparti_azienda ON cat_reparti (azienda_id, attivo);

CREATE OR REPLACE FUNCTION fn_cat_reparti_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_reparti_set_updated_at ON cat_reparti;
CREATE TRIGGER trg_cat_reparti_set_updated_at
BEFORE UPDATE ON cat_reparti
FOR EACH ROW EXECUTE FUNCTION fn_cat_reparti_set_updated_at();

COMMENT ON TABLE cat_reparti IS
    'Catalogo dei reparti, per azienda (modulo Personale §12/§22.4): ogni azienda definisce il proprio elenco, nessun valore di sistema precaricato.';


-- -----------------------------------------------------------------------
-- 4. RAPPORTO AZIENDALE (storicizzato)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_rapporti_azienda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    tipo_rapporto_id UUID NOT NULL REFERENCES cat_tipi_rapporto(id),
    data_inizio DATE NOT NULL,
    data_fine_prevista DATE,
    data_fine_effettiva DATE,
    mansione_id UUID REFERENCES cat_mansioni(id),
    reparto_id UUID REFERENCES cat_reparti(id),
    stato VARCHAR(20) NOT NULL DEFAULT 'ATTIVO',
    tempo_lavoro VARCHAR(20) NOT NULL DEFAULT 'PIENO',
    percentuale_part_time NUMERIC(5, 2),
    ccnl TEXT,
    livello_inquadramento VARCHAR(200),
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_rapporti_azienda_stato
        CHECK (stato IN ('PIANIFICATO', 'ATTIVO', 'CESSATO')),

    CONSTRAINT chk_per_rapporti_azienda_tempo_lavoro
        CHECK (tempo_lavoro IN ('PIENO', 'PARZIALE')),

    CONSTRAINT chk_per_rapporti_azienda_percentuale_part_time
        CHECK (
            (tempo_lavoro = 'PARZIALE' AND percentuale_part_time IS NOT NULL AND percentuale_part_time > 0 AND percentuale_part_time <= 100)
            OR (tempo_lavoro = 'PIENO' AND percentuale_part_time IS NULL)
        ),

    CONSTRAINT chk_per_rapporti_azienda_date_fine_prevista
        CHECK (data_fine_prevista IS NULL OR data_fine_prevista >= data_inizio),

    CONSTRAINT chk_per_rapporti_azienda_date_fine_effettiva
        CHECK (data_fine_effettiva IS NULL OR data_fine_effettiva >= data_inizio)
);

CREATE INDEX IF NOT EXISTS idx_per_rapporti_azienda_persona
    ON per_rapporti_azienda (persona_id, data_inizio DESC);

CREATE INDEX IF NOT EXISTS idx_per_rapporti_azienda_azienda_stato
    ON per_rapporti_azienda (azienda_id, stato);

CREATE OR REPLACE FUNCTION fn_per_rapporti_azienda_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_rapporti_azienda_set_updated_at ON per_rapporti_azienda;
CREATE TRIGGER trg_per_rapporti_azienda_set_updated_at
BEFORE UPDATE ON per_rapporti_azienda
FOR EACH ROW EXECUTE FUNCTION fn_per_rapporti_azienda_set_updated_at();

COMMENT ON TABLE per_rapporti_azienda IS
    'Storico dei rapporti aziendali di una persona (modulo Personale §12.2/§22.3). Mai sovrascritto: un cambio di mansione/reparto/tipologia chiude il periodo corrente (data_fine_effettiva) e ne apre uno nuovo. Le colonne di sintesi su ana_persone (mansione, tipologia_contratto, date) vengono allineate dal servizio applicativo, non da un trigger.';


-- -----------------------------------------------------------------------
-- REGISTRAZIONE IN sys_elementi (grana di sezione/sottosezione, non per
-- singolo campo — vedi nota in testa al file)
-- -----------------------------------------------------------------------
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RAPPORTO_AZIENDALE', m.id, NULL, 'SEZIONE',
    'Rapporto aziendale',
    'Sezione del modulo Personale dedicata al rapporto di lavoro, alla mansione e al reparto della persona.',
    'public', NULL, NULL, TRUE
FROM cat_moduli AS m WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_TIPI_RAPPORTO', m.id, p.id, 'SOTTOSEZIONE',
    'Catalogo tipi di rapporto',
    'Elenco di sistema utilizzato dal menu a tendina Tipo di rapporto.',
    'public', 'cat_tipi_rapporto', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RAPPORTO_AZIENDALE'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_MANSIONI', m.id, p.id, 'SOTTOSEZIONE',
    'Catalogo mansioni',
    'Elenco delle mansioni configurabile dall''azienda.',
    'public', 'cat_mansioni', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RAPPORTO_AZIENDALE'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_REPARTI', m.id, p.id, 'SOTTOSEZIONE',
    'Catalogo reparti',
    'Elenco dei reparti configurabile dall''azienda.',
    'public', 'cat_reparti', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RAPPORTO_AZIENDALE'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RAPPORTO_AZIENDALE.STORICO_RAPPORTI', m.id, p.id, 'SOTTOSEZIONE',
    'Storico dei rapporti',
    'Storico dei rapporti aziendali di ciascuna persona, con mansione, reparto e periodo.',
    'public', 'per_rapporti_azienda', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RAPPORTO_AZIENDALE'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO rel_elementi_certificazioni (elemento_id, certificazione_id, tutti_settori_iaf)
SELECT e.id, c.id, TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE e.codice IN (
        'PERSONALE.RAPPORTO_AZIENDALE',
        'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_TIPI_RAPPORTO',
        'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_MANSIONI',
        'PERSONALE.RAPPORTO_AZIENDALE.CATALOGO_REPARTI',
        'PERSONALE.RAPPORTO_AZIENDALE.STORICO_RAPPORTI'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;
