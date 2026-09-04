-- =======================================================================
-- MODULO PERSONALE (rev2) - TITOLI DI STUDIO, ESPERIENZE, NOTE, SCADENZIARIO
-- =======================================================================
--
-- Sesta e ultima tabella del piano concordato in questa sessione
-- (SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE §17, §18, §20, §22.16-
-- §22.18).
--
-- Titoli di studio: riusa direttamente cat_tipologie_titoli_studio, già
-- esistente (Cataloghi/005) e già pensato per questa sezione — nessun
-- nuovo catalogo.
--
-- "Stato di verifica" (Titoli, dichiarato/verificato): nessuna nuova
-- colonna, riuso di verifica_riga.py (stesso motivo della migrazione
-- 014).
--
-- Scadenziario: SOLO attività manuali/pianificate (corsi da organizzare,
-- visite da pianificare, promemoria). Le scadenze derivate da
-- formazione/abilitazioni/idoneità/incarichi restano calcolate al volo
-- da un servizio applicativo (PersonnelDeadlineService), non duplicate
-- qui — §20.2 e §29.1 lo impongono esplicitamente ("preferire calcolo al
-- bisogno... non salvare una seconda scadenza indipendente quando la
-- data appartiene già al record sorgente").
--
-- Registrazione sys_elementi: tre nuove sezioni di primo livello,
-- PERSONALE.TITOLI_ESPERIENZE, PERSONALE.NOTE, PERSONALE.SCADENZIARIO.
-- ISO_9001 + ISO_45001 per decisione esplicita di questa sessione.


-- -----------------------------------------------------------------------
-- 1. TITOLI DI STUDIO
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_titoli_studio_persona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,
    tipologia_titolo_id UUID NOT NULL REFERENCES cat_tipologie_titoli_studio(id),

    indirizzo_specializzazione VARCHAR(300),
    istituto VARCHAR(300),
    anno SMALLINT,
    votazione VARCHAR(50),
    documento_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_titoli_studio_anno
        CHECK (anno IS NULL OR (anno >= 1930 AND anno <= EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT))
);

CREATE INDEX IF NOT EXISTS idx_per_titoli_studio_persona ON per_titoli_studio_persona (persona_id);

CREATE OR REPLACE FUNCTION fn_per_titoli_studio_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_titoli_studio_set_updated_at ON per_titoli_studio_persona;
CREATE TRIGGER trg_per_titoli_studio_set_updated_at
BEFORE UPDATE ON per_titoli_studio_persona
FOR EACH ROW EXECUTE FUNCTION fn_per_titoli_studio_set_updated_at();

COMMENT ON TABLE per_titoli_studio_persona IS
    'Titoli di studio di una persona (modulo Personale §17.1). Una persona può averne più di uno. Stato dichiarato/verificato gestito da verifica_riga.py, nessuna colonna qui.';


-- -----------------------------------------------------------------------
-- 2. ESPERIENZE RILEVANTI
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_esperienze (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    attivita_ruolo VARCHAR(300) NOT NULL,
    organizzazione VARCHAR(300),
    data_inizio DATE,
    data_fine DATE,
    rilevanza VARCHAR(20) NOT NULL,
    verificata BOOLEAN NOT NULL DEFAULT FALSE,
    descrizione TEXT,
    documento_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_esperienze_rilevanza
        CHECK (rilevanza IN ('PROFESSIONALE', 'TECNICA', 'ORGANIZZATIVA')),

    CONSTRAINT chk_per_esperienze_date
        CHECK (data_fine IS NULL OR data_inizio IS NULL OR data_fine >= data_inizio)
);

CREATE INDEX IF NOT EXISTS idx_per_esperienze_persona ON per_esperienze (persona_id);

CREATE OR REPLACE FUNCTION fn_per_esperienze_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_esperienze_set_updated_at ON per_esperienze;
CREATE TRIGGER trg_per_esperienze_set_updated_at
BEFORE UPDATE ON per_esperienze
FOR EACH ROW EXECUTE FUNCTION fn_per_esperienze_set_updated_at();

COMMENT ON TABLE per_esperienze IS
    'Esperienze rilevanti di una persona (modulo Personale §17.2). Non sono rapporti aziendali correnti e non modificano mansione o ruoli.';


-- -----------------------------------------------------------------------
-- 3. NOTE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,

    categoria VARCHAR(30) NOT NULL DEFAULT 'GENERALE',
    titolo VARCHAR(200),
    testo TEXT NOT NULL,
    visibilita VARCHAR(30) NOT NULL DEFAULT 'CONDIVISA_AZIENDA',
    in_evidenza BOOLEAN NOT NULL DEFAULT FALSE,
    autore_user_id UUID REFERENCES sys_utenti(id),
    archived_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_note_categoria
        CHECK (categoria IN ('GENERALE', 'FORMAZIONE', 'RUOLO', 'SORVEGLIANZA_SANITARIA', 'COMPETENZE')),

    CONSTRAINT chk_per_note_visibilita
        CHECK (visibilita IN ('SOLO_CONSULENTI', 'CONDIVISA_AZIENDA'))
);

CREATE INDEX IF NOT EXISTS idx_per_note_persona ON per_note (persona_id, created_at DESC);

CREATE OR REPLACE FUNCTION fn_per_note_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_note_set_updated_at ON per_note;
CREATE TRIGGER trg_per_note_set_updated_at
BEFORE UPDATE ON per_note
FOR EACH ROW EXECUTE FUNCTION fn_per_note_set_updated_at();

COMMENT ON TABLE per_note IS
    'Note e annotazioni contestuali su una persona (modulo Personale §18): nessun effetto automatico su scadenze, attività o registrazioni. Il filtro di visibilità va applicato in query dal backend, mai nel client (§18.4/§28.3).';


-- -----------------------------------------------------------------------
-- 4. ATTIVITA' / SCADENZIARIO (solo pianificazione manuale)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS per_attivita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES ana_persone(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(50),
    titolo VARCHAR(300) NOT NULL,
    data_scadenza DATE NOT NULL,
    ora TIME,
    stato VARCHAR(20) NOT NULL DEFAULT 'PIANIFICATA',
    responsabile_user_id UUID REFERENCES sys_utenti(id),
    source_type VARCHAR(50),
    source_id UUID,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_attivita_stato
        CHECK (stato IN ('PIANIFICATA', 'COMPLETATA', 'ANNULLATA'))
);

CREATE INDEX IF NOT EXISTS idx_per_attivita_azienda_data
    ON per_attivita (azienda_id, data_scadenza);

CREATE INDEX IF NOT EXISTS idx_per_attivita_persona
    ON per_attivita (persona_id, data_scadenza);

CREATE OR REPLACE FUNCTION fn_per_attivita_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_attivita_set_updated_at ON per_attivita;
CREATE TRIGGER trg_per_attivita_set_updated_at
BEFORE UPDATE ON per_attivita
FOR EACH ROW EXECUTE FUNCTION fn_per_attivita_set_updated_at();

COMMENT ON TABLE per_attivita IS
    'Attività pianificate manualmente (modulo Personale §20): corsi da organizzare, visite da pianificare, promemoria. Le scadenze derivate da registrazioni esistenti (formazione, abilitazioni, idoneità, incarichi) NON vengono duplicate qui — restano calcolate al volo dal servizio applicativo (§20.2/§29.1). Integrazione Google Calendar volutamente non predisposta in questa tabella: nessun campo va aggiunto finché il flusso OAuth non è approvato (§20.8).';


-- -----------------------------------------------------------------------
-- REGISTRAZIONE IN sys_elementi
-- -----------------------------------------------------------------------
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT v.codice, m.id, NULL, 'SEZIONE', v.denominazione, v.descrizione, 'public', v.nome_tabella, NULL, TRUE
FROM cat_moduli AS m
CROSS JOIN (VALUES
    ('PERSONALE.TITOLI_ESPERIENZE', 'Titoli di studio ed esperienze', 'Sezione del modulo Personale dedicata ai titoli di studio e alle esperienze rilevanti delle persone.', 'per_titoli_studio_persona'),
    ('PERSONALE.NOTE', 'Note', 'Sezione del modulo Personale dedicata alle annotazioni contestuali sulle persone.', 'per_note'),
    ('PERSONALE.SCADENZIARIO', 'Scadenziario', 'Sezione del modulo Personale dedicata alle attività pianificate manualmente.', 'per_attivita')
) AS v(codice, denominazione, descrizione, nome_tabella)
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.TITOLI_ESPERIENZE.ESPERIENZE', m.id, p.id, 'SOTTOSEZIONE',
    'Esperienze rilevanti',
    'Esperienze professionali, tecniche od organizzative rilevanti delle persone.',
    'public', 'per_esperienze', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.TITOLI_ESPERIENZE'
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
        'PERSONALE.TITOLI_ESPERIENZE',
        'PERSONALE.TITOLI_ESPERIENZE.ESPERIENZE',
        'PERSONALE.NOTE',
        'PERSONALE.SCADENZIARIO'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;
