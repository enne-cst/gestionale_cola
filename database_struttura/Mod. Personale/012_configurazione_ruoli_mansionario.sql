-- =======================================================================
-- MODULO PERSONALE (rev2) - CONFIGURAZIONE AZIENDALE DEL RUOLO E MANSIONARIO
-- =======================================================================
--
-- Terza tabella del piano concordato (SPECIFICA_IMPLEMENTAZIONE_MODULO_
-- PERSONALE §13.4/§13.5/§13.6, §22.5/§22.6/§22.9). Separa esplicitamente:
-- - l'assegnazione persona-ruolo (già in per_incarichi, invariata);
-- - la configurazione aziendale del ruolo (qui, cfg_ruoli_azienda): una
--   sola per (azienda, ruolo), condivisa da tutte le persone che lo
--   ricoprono — mai copiata sulla persona.
--
-- "Riporta a" / "Collabora con": TESTO LIBERO per decisione esplicita di
-- questa sessione. doc/master_rev2.txt §3.3.2 descrive un meccanismo di
-- organigramma sul catalogo dei ruoli (gerarchia predefinita + override
-- per azienda) che non esiste ancora — costruirlo è un lavoro a sé,
-- perché tocca cat_ruoli in modo trasversale a tutta la piattaforma, non
-- solo al modulo Personale. La specifica del modulo Personale prevede
-- esplicitamente questo fallback (§22.5: "riporta_a_testo: fallback se
-- non esiste organigramma").
--
-- Voci base di valutazione legate al ruolo (rel_ruoli_voci_valutazione):
-- referenziano direttamente cfg_ruoli_azienda (non azienda_id+ruolo_id
-- separati) perché condividono lo stesso workspace nel prototipo (card
-- del ruolo, due tab: "Mansionario" e "Conoscenza, competenza e
-- consapevolezza") — cfg_ruoli_azienda scopa già univocamente
-- (azienda, ruolo). Il catalogo condiviso cat_voci_valutazione_personale
-- e le altre fonti (mansione, azienda, personali) sono nella prossima
-- migrazione (013), insieme alle valutazioni.
--
-- Concorrenza ottimistica (§23.4, "soprattutto mansionario e voci base"):
-- cfg_ruoli_azienda.version, incrementata dal servizio applicativo a ogni
-- salvataggio del mansionario; il backend confronta la versione ricevuta
-- prima di scrivere e risponde 409 se non coincide — nessuna logica qui,
-- solo la colonna.
--
-- Registrazione sys_elementi: sotto la sezione già esistente
-- PERSONALE.RUOLI_INCARICHI (migrazione 002), non una nuova sezione di
-- primo livello — stesso ambito applicativo. ISO_9001 + ISO_45001 per
-- decisione esplicita di questa sessione.


-- -----------------------------------------------------------------------
-- 1. CONFIGURAZIONE AZIENDALE DEL RUOLO
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cfg_ruoli_azienda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    ruolo_id UUID NOT NULL REFERENCES cat_ruoli(id),

    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    scopo TEXT,
    riporta_a_testo VARCHAR(300),
    collabora_con_testo VARCHAR(300),
    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cfg_ruoli_azienda_ruolo UNIQUE (azienda_id, ruolo_id)
);

CREATE INDEX IF NOT EXISTS idx_cfg_ruoli_azienda_azienda ON cfg_ruoli_azienda (azienda_id);

CREATE OR REPLACE FUNCTION fn_cfg_ruoli_azienda_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cfg_ruoli_azienda_set_updated_at ON cfg_ruoli_azienda;
CREATE TRIGGER trg_cfg_ruoli_azienda_set_updated_at
BEFORE UPDATE ON cfg_ruoli_azienda
FOR EACH ROW EXECUTE FUNCTION fn_cfg_ruoli_azienda_set_updated_at();

COMMENT ON TABLE cfg_ruoli_azienda IS
    'Configurazione aziendale del ruolo (modulo Personale §13.4-§13.7): una sola riga per (azienda, ruolo), condivisa da tutte le persone che ricoprono il ruolo. Non contiene assegnazioni individuali (restano in per_incarichi).';


-- -----------------------------------------------------------------------
-- 2. VOCI DEL MANSIONARIO
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cfg_ruoli_mansionario_voci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configurazione_ruolo_id UUID NOT NULL REFERENCES cfg_ruoli_azienda(id) ON DELETE CASCADE,

    sezione VARCHAR(20) NOT NULL,
    testo TEXT NOT NULL,
    ordine SMALLINT NOT NULL DEFAULT 1,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cfg_ruoli_mansionario_voci_sezione
        CHECK (sezione IN ('ATTIVITA', 'RESPONSABILITA', 'AUTORITA'))
);

CREATE INDEX IF NOT EXISTS idx_cfg_ruoli_mansionario_voci_config
    ON cfg_ruoli_mansionario_voci (configurazione_ruolo_id, sezione, ordine);

CREATE OR REPLACE FUNCTION fn_cfg_ruoli_mansionario_voci_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cfg_ruoli_mansionario_voci_set_updated_at ON cfg_ruoli_mansionario_voci;
CREATE TRIGGER trg_cfg_ruoli_mansionario_voci_set_updated_at
BEFORE UPDATE ON cfg_ruoli_mansionario_voci
FOR EACH ROW EXECUTE FUNCTION fn_cfg_ruoli_mansionario_voci_set_updated_at();

COMMENT ON TABLE cfg_ruoli_mansionario_voci IS
    'Attività/responsabilità/autorità del mansionario (modulo Personale §13.5), una voce per riga, mai un unico testo con elenco puntato — permette riordino, disattivazione e audit per voce.';


-- -----------------------------------------------------------------------
-- 3. VOCI BASE DI VALUTAZIONE DEL RUOLO (relazione)
-- -----------------------------------------------------------------------
-- Referenzia cat_voci_valutazione_personale, creata nella prossima
-- migrazione (013): la FK viene aggiunta lì per non invertire l'ordine di
-- dipendenza tra le due migrazioni.
CREATE TABLE IF NOT EXISTS rel_ruoli_voci_valutazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configurazione_ruolo_id UUID NOT NULL REFERENCES cfg_ruoli_azienda(id) ON DELETE CASCADE,
    voce_id UUID NOT NULL,

    ordine SMALLINT NOT NULL DEFAULT 1,
    attiva BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_ruoli_voci_valutazione UNIQUE (configurazione_ruolo_id, voce_id)
);

CREATE INDEX IF NOT EXISTS idx_rel_ruoli_voci_valutazione_config
    ON rel_ruoli_voci_valutazione (configurazione_ruolo_id, attiva);

CREATE OR REPLACE FUNCTION fn_rel_ruoli_voci_valutazione_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_ruoli_voci_valutazione_set_updated_at ON rel_ruoli_voci_valutazione;
CREATE TRIGGER trg_rel_ruoli_voci_valutazione_set_updated_at
BEFORE UPDATE ON rel_ruoli_voci_valutazione
FOR EACH ROW EXECUTE FUNCTION fn_rel_ruoli_voci_valutazione_set_updated_at();

COMMENT ON TABLE rel_ruoli_voci_valutazione IS
    'Voci base di Conoscenza/Competenza/Consapevolezza apportate dal ruolo (modulo Personale §13.6): configura cosa valutare, non esegue la valutazione. Disattivare una riga qui non cancella le valutazioni storiche delle persone (§13.8).';


-- -----------------------------------------------------------------------
-- REGISTRAZIONE IN sys_elementi (sotto la sezione RUOLI_INCARICHI già
-- esistente, migrazione 002)
-- -----------------------------------------------------------------------
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RUOLI_INCARICHI.MANSIONARIO', m.id, p.id, 'SOTTOSEZIONE',
    'Mansionario del ruolo',
    'Scopo, attività, responsabilità e autorità del ruolo, configurati una sola volta per azienda e riusati da tutte le persone che lo ricoprono.',
    'public', 'cfg_ruoli_azienda', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RUOLI_INCARICHI'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.RUOLI_INCARICHI.VOCI_VALUTAZIONE_RUOLO', m.id, p.id, 'SOTTOSEZIONE',
    'Voci base di valutazione del ruolo',
    'Voci di Conoscenza, Competenza e Consapevolezza apportate dal ruolo al profilo delle persone che lo ricoprono.',
    'public', 'rel_ruoli_voci_valutazione', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.RUOLI_INCARICHI'
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
        'PERSONALE.RUOLI_INCARICHI.MANSIONARIO',
        'PERSONALE.RUOLI_INCARICHI.VOCI_VALUTAZIONE_RUOLO'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;
