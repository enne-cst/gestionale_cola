-- =======================================================================
-- MODULO PERSONALE (rev2) - FORMAZIONE, ABILITAZIONI E IDONEITA' SANITARIA
-- =======================================================================
--
-- Quinta tabella del piano concordato (SPECIFICA_IMPLEMENTAZIONE_MODULO_
-- PERSONALE §14, §15, §22.13-§22.15).
--
-- Formazione: MODELLO SEMPLICE per decisione esplicita di questa sessione
-- (una riga = una persona + un corso completato), non il modello
-- normalizzato a 4 tabelle (corso/evento con più partecipanti/
-- partecipazione/attestato) suggerito da §22.13 — corrisponde esattamente
-- alle API per-persona della specifica (§14.9) ed è coerente con
-- "Pianifica corso" che resta un'attività dello Scadenziario (prossima
-- migrazione), non un'entità evento condivisa. cat_corsi_formazione
-- resta comunque un catalogo (per azienda, come mansioni/reparti: i corsi
-- offerti variano troppo da azienda ad azienda per un elenco di sistema),
-- perché serve per raggruppare/filtrare (§14.3, §21) — solo l'evento
-- multi-partecipante non viene modellato in questa fase.
--
-- Abilitazioni: cat_abilitazioni GLOBALE di sistema per decisione
-- esplicita (patentini, PES/PAV/PEI e simili sono tipicamente standard e
-- condivisi tra aziende dello stesso settore, a differenza delle
-- mansioni interne).
--
-- Idoneità sanitaria: nessun catalogo per tipo_visita (resta testo libero
-- — nessuna decisione di scope è stata presa per questo campo specifico,
-- ed è un elenco piccolo e poco variabile; da valutare in futuro se
-- servirà un catalogo). "giudizio" usa invece una classificazione CHECK
-- di dominio standard (Idoneo/Idoneo con prescrizioni/Non idoneo/Idoneo
-- temporaneamente), terminologia consolidata di medicina del lavoro, non
-- una scelta specifica dell'azienda. Nessuna anagrafica medici esiste nel
-- progetto: "medico competente" resta testo libero.
--
-- "Stato di verifica" per riga (Formazione, Abilitazioni): NESSUNA nuova
-- colonna — riuso di verifica_riga.py, il motore generico già usato da
-- Soci/Amministratori/Sindaci/Titoli abilitativi (commento esplicito nel
-- codice: "non deve essere creato un secondo sistema di verifica", §
-- Correzione 20). L'azienda/sezione_codice/riga_id bastano, niente
-- colonna nella tabella del dominio.
--
-- Documenti: colonna UUID senza FK dichiarata lato ORM, stesso motivo già
-- commentato in PerIncaricoValore.valore_documento_id (doc_documenti è
-- ancora un placeholder).
--
-- Registrazione sys_elementi: due nuove sezioni di primo livello,
-- PERSONALE.FORMAZIONE_ABILITAZIONI e PERSONALE.IDONEITA_SANITARIA.
-- ISO_9001 + ISO_45001 per decisione esplicita di questa sessione
-- (mappatura uniforme per ora).


-- -----------------------------------------------------------------------
-- 1. CATALOGO CORSI DI FORMAZIONE (per azienda)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_corsi_formazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(300) NOT NULL,
    categoria VARCHAR(200),
    durata_standard_ore NUMERIC(6, 2),
    validita_mesi INTEGER,
    soglia_preavviso_giorni INTEGER,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_corsi_formazione_azienda_codice UNIQUE (azienda_id, codice)
);

CREATE INDEX IF NOT EXISTS idx_cat_corsi_formazione_azienda ON cat_corsi_formazione (azienda_id, attivo);

CREATE OR REPLACE FUNCTION fn_cat_corsi_formazione_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_corsi_formazione_set_updated_at ON cat_corsi_formazione;
CREATE TRIGGER trg_cat_corsi_formazione_set_updated_at
BEFORE UPDATE ON cat_corsi_formazione
FOR EACH ROW EXECUTE FUNCTION fn_cat_corsi_formazione_set_updated_at();


-- -----------------------------------------------------------------------
-- 2. FORMAZIONE ACQUISITA (modello semplice: persona + corso + esito)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_formazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,
    corso_id UUID NOT NULL REFERENCES cat_corsi_formazione(id),

    tipologia VARCHAR(20),
    data_completamento DATE NOT NULL,
    ore_riconosciute NUMERIC(6, 2) NOT NULL,
    ente_formatore VARCHAR(300) NOT NULL,
    esito VARCHAR(20) NOT NULL DEFAULT 'AMMESSO',
    numero_attestato VARCHAR(100),
    scadenza_esplicita DATE,
    regola_scadenza VARCHAR(200),
    documento_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_formazione_tipologia
        CHECK (tipologia IS NULL OR tipologia IN ('BASE', 'AGGIORNAMENTO', 'SPECIALISTICA')),

    CONSTRAINT chk_per_formazione_esito
        CHECK (esito IN ('AMMESSO', 'NON_AMMESSO', 'DA_VALUTARE')),

    CONSTRAINT chk_per_formazione_ore_positive
        CHECK (ore_riconosciute > 0),

    CONSTRAINT chk_per_formazione_data_non_futura
        CHECK (data_completamento <= CURRENT_DATE)
);

CREATE INDEX IF NOT EXISTS idx_per_formazione_persona
    ON per_formazione (persona_id, data_completamento DESC);

CREATE INDEX IF NOT EXISTS idx_per_formazione_scadenza
    ON per_formazione (azienda_id, scadenza_esplicita);

CREATE OR REPLACE FUNCTION fn_per_formazione_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_formazione_set_updated_at ON per_formazione;
CREATE TRIGGER trg_per_formazione_set_updated_at
BEFORE UPDATE ON per_formazione
FOR EACH ROW EXECUTE FUNCTION fn_per_formazione_set_updated_at();

COMMENT ON TABLE per_formazione IS
    'Formazione acquisita da una persona (modulo Personale §14.5): una riga = una persona + un corso completato. La scadenza esplicita, quando presente, prevale sulla durata catalogata del corso (§14.5).';


-- -----------------------------------------------------------------------
-- 3. CATALOGO ABILITAZIONI (globale di sistema)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_abilitazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(300) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL DEFAULT 1,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_abilitazioni_codice UNIQUE (codice)
);

CREATE OR REPLACE FUNCTION fn_cat_abilitazioni_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_abilitazioni_set_updated_at ON cat_abilitazioni;
CREATE TRIGGER trg_cat_abilitazioni_set_updated_at
BEFORE UPDATE ON cat_abilitazioni
FOR EACH ROW EXECUTE FUNCTION fn_cat_abilitazioni_set_updated_at();

COMMENT ON TABLE cat_abilitazioni IS
    'Catalogo globale di sistema delle abilitazioni professionali (modulo Personale §14.6), estendibile senza modificare la struttura della piattaforma. Nessun valore precaricato in questa migrazione: la lista iniziale va proposta e approvata a parte, come già fatto per cat_ruoli.';


-- -----------------------------------------------------------------------
-- 4. ABILITAZIONI DELLA PERSONA
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_abilitazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,
    abilitazione_catalogo_id UUID NOT NULL REFERENCES cat_abilitazioni(id),

    livello_tipologia VARCHAR(200),
    data_conseguimento DATE NOT NULL,
    data_scadenza DATE,
    documento_id UUID,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_abilitazioni_date
        CHECK (data_scadenza IS NULL OR data_scadenza >= data_conseguimento)
);

CREATE INDEX IF NOT EXISTS idx_per_abilitazioni_persona
    ON per_abilitazioni (persona_id, data_scadenza);

CREATE OR REPLACE FUNCTION fn_per_abilitazioni_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_abilitazioni_set_updated_at ON per_abilitazioni;
CREATE TRIGGER trg_per_abilitazioni_set_updated_at
BEFORE UPDATE ON per_abilitazioni
FOR EACH ROW EXECUTE FUNCTION fn_per_abilitazioni_set_updated_at();

COMMENT ON TABLE per_abilitazioni IS
    'Abilitazioni possedute da una persona (modulo Personale §14.6). Nessuna relazione con mezzi/attrezzature in questa versione (§3.3 esclusioni).';


-- -----------------------------------------------------------------------
-- 5. IDONEITA' SANITARIA
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_giudizi_idoneita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    tipo_visita VARCHAR(200) NOT NULL,
    data_visita DATE NOT NULL,
    giudizio VARCHAR(30) NOT NULL,
    periodicita_mesi INTEGER,
    data_scadenza DATE,
    medico_competente VARCHAR(300),
    prescrizioni_minime TEXT,
    documento_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_giudizi_idoneita_giudizio
        CHECK (giudizio IN ('IDONEO', 'IDONEO_CON_PRESCRIZIONI', 'NON_IDONEO', 'IDONEO_TEMPORANEAMENTE')),

    CONSTRAINT chk_per_giudizi_idoneita_periodicita
        CHECK (periodicita_mesi IS NULL OR periodicita_mesi > 0),

    CONSTRAINT chk_per_giudizi_idoneita_scadenza
        CHECK (data_scadenza IS NULL OR data_scadenza >= data_visita)
);

CREATE INDEX IF NOT EXISTS idx_per_giudizi_idoneita_persona
    ON per_giudizi_idoneita (persona_id, data_visita DESC);

CREATE OR REPLACE FUNCTION fn_per_giudizi_idoneita_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_giudizi_idoneita_set_updated_at ON per_giudizi_idoneita;
CREATE TRIGGER trg_per_giudizi_idoneita_set_updated_at
BEFORE UPDATE ON per_giudizi_idoneita
FOR EACH ROW EXECUTE FUNCTION fn_per_giudizi_idoneita_set_updated_at();

COMMENT ON TABLE per_giudizi_idoneita IS
    'Giudizi di idoneità sanitaria (modulo Personale §15.1): principio di minimizzazione, nessuna diagnosi o referto clinico completo. Accesso da limitare a permessi sanitari dedicati quando i permessi granulari saranno definiti.';


-- -----------------------------------------------------------------------
-- REGISTRAZIONE IN sys_elementi
-- -----------------------------------------------------------------------
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.FORMAZIONE_ABILITAZIONI', m.id, NULL, 'SEZIONE',
    'Formazione e abilitazioni',
    'Sezione del modulo Personale dedicata alla formazione svolta e alle abilitazioni possedute dalle persone.',
    'public', NULL, NULL, TRUE
FROM cat_moduli AS m WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT v.codice, m.id, p.id, 'SOTTOSEZIONE', v.denominazione, v.descrizione, 'public', v.nome_tabella, NULL, TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p ON p.codice = 'PERSONALE.FORMAZIONE_ABILITAZIONI'
CROSS JOIN (VALUES
    ('PERSONALE.FORMAZIONE_ABILITAZIONI.CATALOGO_CORSI', 'Catalogo corsi di formazione', 'Elenco dei corsi configurabile dall''azienda.', 'cat_corsi_formazione'),
    ('PERSONALE.FORMAZIONE_ABILITAZIONI.FORMAZIONE', 'Formazione acquisita', 'Registrazioni di formazione completata dalle persone.', 'per_formazione'),
    ('PERSONALE.FORMAZIONE_ABILITAZIONI.CATALOGO_ABILITAZIONI', 'Catalogo abilitazioni', 'Elenco di sistema delle abilitazioni professionali.', 'cat_abilitazioni'),
    ('PERSONALE.FORMAZIONE_ABILITAZIONI.ABILITAZIONI', 'Abilitazioni', 'Abilitazioni possedute dalle persone.', 'per_abilitazioni')
) AS v(codice, denominazione, descrizione, nome_tabella)
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.IDONEITA_SANITARIA', m.id, NULL, 'SEZIONE',
    'Idoneità sanitaria',
    'Sezione del modulo Personale dedicata ai giudizi di idoneità sanitaria delle persone. Dati minimizzati, nessuna diagnosi.',
    'public', 'per_giudizi_idoneita', NULL, TRUE
FROM cat_moduli AS m WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO rel_elementi_certificazioni (elemento_id, certificazione_id, tutti_settori_iaf)
SELECT e.id, c.id, TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE (
        e.codice = 'PERSONALE.FORMAZIONE_ABILITAZIONI' OR e.codice LIKE 'PERSONALE.FORMAZIONE_ABILITAZIONI.%'
        OR e.codice = 'PERSONALE.IDONEITA_SANITARIA'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;
