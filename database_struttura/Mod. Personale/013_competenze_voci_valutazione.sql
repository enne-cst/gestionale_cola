-- =======================================================================
-- MODULO PERSONALE (rev2) - CONOSCENZA, COMPETENZA E CONSAPEVOLEZZA
-- =======================================================================
--
-- Quarta tabella del piano concordato (SPECIFICA_IMPLEMENTAZIONE_MODULO_
-- PERSONALE §16, §22.8-§22.11). Il profilo individuale è una
-- composizione calcolata a runtime (§22.12, "non è obbligatorio
-- materializzare questa composizione in tabella"): qui vivono solo le
-- fonti (catalogo condiviso + relazioni verso mansione/azienda, il ruolo
-- è già in rel_ruoli_voci_valutazione, migrazione 012), le eccezioni
-- individuali e le valutazioni storiche.
--
-- cat_voci_valutazione_personale.azienda_id NULLABLE (§22.8): NULL = voce
-- di sistema condivisa da tutte le aziende, valorizzato = voce specifica
-- di una singola azienda. Diverso dal concetto di "profilo generale"
-- (rel_azienda_voci_valutazione, punto 3 sotto): quello seleziona quali
-- voci del catalogo si applicano SEMPRE in una data azienda a prescindere
-- da ruolo/mansione — decisione esplicita di questa sessione di
-- costruirlo subito, non di rimandarlo nonostante §22.9 inviti a
-- verificarne il bisogno prima di crearlo.
--
-- rel_mansioni_voci_valutazione non ha una colonna azienda_id propria:
-- la mansione (cat_mansioni, migrazione 011) è già per azienda, quindi
-- l'appartenenza è già univoca tramite mansione_id.
--
-- Registrazione sys_elementi: nuova sezione di primo livello
-- PERSONALE.COMPETENZE (distinta da RUOLI_INCARICHI perché comprende
-- fonti che non sono legate a un ruolo specifico). ISO_9001 + ISO_45001
-- per decisione esplicita di questa sessione.


-- -----------------------------------------------------------------------
-- 1. CATALOGO CONDIVISO DELLE VOCI DI VALUTAZIONE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_voci_valutazione_personale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID REFERENCES sys_aziende(id) ON DELETE CASCADE,
    codice VARCHAR(80) NOT NULL,
    macroarea VARCHAR(20) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descrizione TEXT,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cat_voci_valutazione_personale_macroarea
        CHECK (macroarea IN ('KNOWLEDGE', 'COMPETENCE', 'AWARENESS'))
);

-- Unicità del codice nel proprio ambito: tra le voci di sistema
-- (azienda_id NULL) e, separatamente, dentro ciascuna azienda. Un indice
-- unico parziale per ramo, perché NULL non collide con sé stesso in un
-- vincolo UNIQUE standard.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_voci_valutazione_personale_sistema
    ON cat_voci_valutazione_personale (codice) WHERE azienda_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_voci_valutazione_personale_azienda
    ON cat_voci_valutazione_personale (azienda_id, codice) WHERE azienda_id IS NOT NULL;

CREATE OR REPLACE FUNCTION fn_cat_voci_valutazione_personale_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_voci_valutazione_personale_set_updated_at ON cat_voci_valutazione_personale;
CREATE TRIGGER trg_cat_voci_valutazione_personale_set_updated_at
BEFORE UPDATE ON cat_voci_valutazione_personale
FOR EACH ROW EXECUTE FUNCTION fn_cat_voci_valutazione_personale_set_updated_at();

COMMENT ON TABLE cat_voci_valutazione_personale IS
    'Catalogo condiviso delle voci di Conoscenza/Competenza/Consapevolezza (modulo Personale §22.8): identità stabile usata per deduplicare quando la stessa voce arriva da più fonti (mansione, ruoli, azienda). azienda_id NULL = voce di sistema.';

-- FK differita da rel_ruoli_voci_valutazione (migrazione 012): la tabella
-- esisteva già senza vincolo per non invertire l'ordine di dipendenza.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_rel_ruoli_voci_valutazione_voce'
    ) THEN
        ALTER TABLE rel_ruoli_voci_valutazione
            ADD CONSTRAINT fk_rel_ruoli_voci_valutazione_voce
                FOREIGN KEY (voce_id)
                REFERENCES cat_voci_valutazione_personale(id);
    END IF;
END;
$$;


-- -----------------------------------------------------------------------
-- 2. VOCI BASE DI VALUTAZIONE DELLA MANSIONE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rel_mansioni_voci_valutazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mansione_id UUID NOT NULL REFERENCES cat_mansioni(id) ON DELETE CASCADE,
    voce_id UUID NOT NULL REFERENCES cat_voci_valutazione_personale(id),

    ordine SMALLINT NOT NULL DEFAULT 1,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_mansioni_voci_valutazione UNIQUE (mansione_id, voce_id)
);

CREATE INDEX IF NOT EXISTS idx_rel_mansioni_voci_valutazione_mansione
    ON rel_mansioni_voci_valutazione (mansione_id, attiva);

CREATE OR REPLACE FUNCTION fn_rel_mansioni_voci_valutazione_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_mansioni_voci_valutazione_set_updated_at ON rel_mansioni_voci_valutazione;
CREATE TRIGGER trg_rel_mansioni_voci_valutazione_set_updated_at
BEFORE UPDATE ON rel_mansioni_voci_valutazione
FOR EACH ROW EXECUTE FUNCTION fn_rel_mansioni_voci_valutazione_set_updated_at();


-- -----------------------------------------------------------------------
-- 3. VOCI BASE DI VALUTAZIONE DELL'AZIENDA ("profilo generale")
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rel_azienda_voci_valutazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    voce_id UUID NOT NULL REFERENCES cat_voci_valutazione_personale(id),

    ordine SMALLINT NOT NULL DEFAULT 1,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_azienda_voci_valutazione UNIQUE (azienda_id, voce_id)
);

CREATE INDEX IF NOT EXISTS idx_rel_azienda_voci_valutazione_azienda
    ON rel_azienda_voci_valutazione (azienda_id, attiva);

CREATE OR REPLACE FUNCTION fn_rel_azienda_voci_valutazione_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_azienda_voci_valutazione_set_updated_at ON rel_azienda_voci_valutazione;
CREATE TRIGGER trg_rel_azienda_voci_valutazione_set_updated_at
BEFORE UPDATE ON rel_azienda_voci_valutazione
FOR EACH ROW EXECUTE FUNCTION fn_rel_azienda_voci_valutazione_set_updated_at();

COMMENT ON TABLE rel_azienda_voci_valutazione IS
    'Voci base applicabili a tutta l''azienda a prescindere da ruolo o mansione ("profilo generale", modulo Personale §16.2/§22.9).';


-- -----------------------------------------------------------------------
-- 4. VOCI PERSONALI
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_voci_valutazione_personali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    macroarea VARCHAR(20) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descrizione TEXT,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES sys_utenti(id),
    archived_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_voci_valutazione_personali_macroarea
        CHECK (macroarea IN ('KNOWLEDGE', 'COMPETENCE', 'AWARENESS'))
);

CREATE INDEX IF NOT EXISTS idx_per_voci_valutazione_personali_persona
    ON per_voci_valutazione_personali (persona_id, attiva);

CREATE OR REPLACE FUNCTION fn_per_voci_valutazione_personali_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_voci_valutazione_personali_set_updated_at ON per_voci_valutazione_personali;
CREATE TRIGGER trg_per_voci_valutazione_personali_set_updated_at
BEFORE UPDATE ON per_voci_valutazione_personali
FOR EACH ROW EXECUTE FUNCTION fn_per_voci_valutazione_personali_set_updated_at();

COMMENT ON TABLE per_voci_valutazione_personali IS
    'Voci di valutazione aggiunte da una singola persona (modulo Personale §16.9): appartengono solo a lei, non modificano ruolo o mansione, non entrano nel catalogo condiviso senza un''azione esplicita separata.';


-- -----------------------------------------------------------------------
-- 5. VOCI NASCOSTE (eccezioni individuali su voci ereditate)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rel_persone_voci_nascoste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,
    voce_id UUID NOT NULL REFERENCES cat_voci_valutazione_personale(id),

    motivo TEXT,
    hidden_by UUID REFERENCES sys_utenti(id),
    hidden_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    restored_by UUID REFERENCES sys_utenti(id),
    restored_at TIMESTAMPTZ,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_persone_voci_nascoste UNIQUE (persona_id, voce_id)
);

CREATE INDEX IF NOT EXISTS idx_rel_persone_voci_nascoste_persona
    ON rel_persone_voci_nascoste (persona_id, attiva);

CREATE OR REPLACE FUNCTION fn_rel_persone_voci_nascoste_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_persone_voci_nascoste_set_updated_at ON rel_persone_voci_nascoste;
CREATE TRIGGER trg_rel_persone_voci_nascoste_set_updated_at
BEFORE UPDATE ON rel_persone_voci_nascoste
FOR EACH ROW EXECUTE FUNCTION fn_rel_persone_voci_nascoste_set_updated_at();

COMMENT ON TABLE rel_persone_voci_nascoste IS
    'Eccezione individuale che nasconde una voce ereditata per una persona (modulo Personale §16.10): non modifica la fonte né cancella valutazioni, una riga per (persona, voce) riusata tra nascondi/ripristina — lo storico degli eventi va nell''audit generale, non in righe multiple qui.';


-- -----------------------------------------------------------------------
-- 6. VALUTAZIONI (testata + dettagli)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_valutazioni_personale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    macroarea VARCHAR(20) NOT NULL,
    data_valutazione DATE NOT NULL,
    valutatore_user_id UUID REFERENCES sys_utenti(id),
    nota_generale TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_valutazioni_personale_macroarea
        CHECK (macroarea IN ('KNOWLEDGE', 'COMPETENCE', 'AWARENESS'))
);

CREATE INDEX IF NOT EXISTS idx_per_valutazioni_personale_persona
    ON per_valutazioni_personale (persona_id, macroarea, data_valutazione DESC);

CREATE OR REPLACE FUNCTION fn_per_valutazioni_personale_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_valutazioni_personale_set_updated_at ON per_valutazioni_personale;
CREATE TRIGGER trg_per_valutazioni_personale_set_updated_at
BEFORE UPDATE ON per_valutazioni_personale
FOR EACH ROW EXECUTE FUNCTION fn_per_valutazioni_personale_set_updated_at();

COMMENT ON TABLE per_valutazioni_personale IS
    'Testata di una sessione di valutazione (modulo Personale §16.6): il salvataggio crea sempre una nuova riga, mai un aggiornamento di una valutazione precedente (storico mai sovrascritto).';


CREATE TABLE IF NOT EXISTS per_valutazioni_personale_dettagli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valutazione_id UUID NOT NULL REFERENCES per_valutazioni_personale(id) ON DELETE CASCADE,
    voce_id UUID REFERENCES cat_voci_valutazione_personale(id),
    voce_personale_id UUID REFERENCES per_voci_valutazione_personali(id),

    livello VARCHAR(20) NOT NULL,
    evidenza_nota TEXT,
    snapshot_nome VARCHAR(200),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_valutazioni_personale_dettagli_livello
        CHECK (livello IN ('BASE', 'INTERMEDIO', 'AVANZATO')),

    CONSTRAINT chk_per_valutazioni_personale_dettagli_voce_esclusiva
        CHECK ((voce_id IS NOT NULL) <> (voce_personale_id IS NOT NULL))
);

-- "Una sola riga per voce nella stessa valutazione" (§22.11): un indice
-- unico parziale per ciascun tipo di voce, dato che al più una delle due
-- colonne è valorizzata per riga.
CREATE UNIQUE INDEX IF NOT EXISTS uq_per_valutazioni_personale_dettagli_voce
    ON per_valutazioni_personale_dettagli (valutazione_id, voce_id) WHERE voce_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_per_valutazioni_personale_dettagli_voce_personale
    ON per_valutazioni_personale_dettagli (valutazione_id, voce_personale_id) WHERE voce_personale_id IS NOT NULL;

CREATE OR REPLACE FUNCTION fn_per_valutazioni_personale_dettagli_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_valutazioni_personale_dettagli_set_updated_at ON per_valutazioni_personale_dettagli;
CREATE TRIGGER trg_per_valutazioni_personale_dettagli_set_updated_at
BEFORE UPDATE ON per_valutazioni_personale_dettagli
FOR EACH ROW EXECUTE FUNCTION fn_per_valutazioni_personale_dettagli_set_updated_at();


-- -----------------------------------------------------------------------
-- REGISTRAZIONE IN sys_elementi
-- -----------------------------------------------------------------------
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.COMPETENZE', m.id, NULL, 'SEZIONE',
    'Conoscenza, competenza e consapevolezza',
    'Sezione del modulo Personale dedicata al profilo di valutazione delle persone: catalogo delle voci, fonti (mansione, azienda, voci personali) e valutazioni storiche.',
    'public', NULL, NULL, TRUE
FROM cat_moduli AS m WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT v.codice, m.id, p.id, 'SOTTOSEZIONE', v.denominazione, v.descrizione, 'public', v.nome_tabella, NULL, TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p ON p.codice = 'PERSONALE.COMPETENZE'
CROSS JOIN (VALUES
    ('PERSONALE.COMPETENZE.CATALOGO_VOCI', 'Catalogo voci di valutazione', 'Voci di Conoscenza, Competenza e Consapevolezza condivise, di sistema o specifiche di un''azienda.', 'cat_voci_valutazione_personale'),
    ('PERSONALE.COMPETENZE.VOCI_MANSIONE', 'Voci base della mansione', 'Voci apportate al profilo dalla mansione corrente della persona.', 'rel_mansioni_voci_valutazione'),
    ('PERSONALE.COMPETENZE.VOCI_AZIENDA', 'Voci base dell''azienda', 'Voci applicabili a tutta l''azienda a prescindere da ruolo o mansione (profilo generale).', 'rel_azienda_voci_valutazione'),
    ('PERSONALE.COMPETENZE.VOCI_PERSONALI', 'Voci personali ed eccezioni', 'Voci aggiunte da una singola persona e voci ereditate nascoste per eccezione individuale.', 'per_voci_valutazione_personali'),
    ('PERSONALE.COMPETENZE.VALUTAZIONI', 'Valutazioni', 'Storico delle valutazioni delle persone sulle voci applicabili.', 'per_valutazioni_personale')
) AS v(codice, denominazione, descrizione, nome_tabella)
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO rel_elementi_certificazioni (elemento_id, certificazione_id, tutti_settori_iaf)
SELECT e.id, c.id, TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE (e.codice = 'PERSONALE.COMPETENZE' OR e.codice LIKE 'PERSONALE.COMPETENZE.%')
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;
