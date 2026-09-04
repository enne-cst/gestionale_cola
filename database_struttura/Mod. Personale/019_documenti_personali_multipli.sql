/*
===============================================================================
 MIGRAZIONE 019 - DOCUMENTI PERSONALI MULTIPLI
===============================================================================

 Scopo
 -----
 Completamento del Dossier personale (correzione "Documenti personali
 multipli"): una persona puo' avere un numero non limitato di documenti
 personali, di tipologie anche ripetute. Sostituisce le 4 colonne singole
 aggiunte alla migrazione 018 (tipo_documento_identita/numero_documento_
 identita/scadenza_documento_identita/permesso_soggiorno_stato/
 permesso_soggiorno_dettaglio su ana_persone) con una tabella dedicata.

 Decisioni confermate dall'utente prima di questa migrazione
 -------------------------------------------------------------
 - Tipo di documento: NUOVO catalogo dedicato (cat_tipi_documento_identita),
   non testo libero e non valori fissi lato applicazione - scelta esplicita
   in deroga al criterio "riusa/valori fissi" seguito per sesso/comprensione
   lingua nella migrazione 018.
 - Permesso di soggiorno (§5.4 della correzione): non e' piu' un campo
   autonomo con stato NON_INDICATO/NON_APPLICABILE/POSSEDUTO - diventa una
   delle tipologie del catalogo. L'assenza di un documento di quel tipo
   significa semplicemente "nessun documento di questo tipo registrato",
   senza un terzo stato esplicito "non applicabile": scelta esplicita
   dell'utente, la distinzione mancante/non applicabile viene abbandonata
   per questo campo.
 - Allegati: NON costruiti in questa migrazione. Nessuna funzione di
   caricamento file esiste oggi in alcuna parte del progetto (doc_documenti
   e' un placeholder id/azienda_id/timestamp, mai dotato di un modello
   SQLAlchemy ne' di un endpoint di upload, StorageBackend mai collegato a
   nulla). La tabella qui creata non referenzia doc_documenti: il conteggio
   allegati resta 0 lato applicazione finche' il modulo Documenti non sara'
   costruito in una sessione dedicata.
 - Cancellazione: nessun altro record per-persona di questo modulo
   (per_titoli_studio_persona, per_esperienze) usa cancellazione logica -
   stesso criterio qui, DELETE fisico della sola riga di metadati (nessun
   allegato reale da orfanizzare).

 Le colonne superate su ana_persone (migrazione 018) restano fisicamente in
 tabella per non perdere lo storico gia' eventualmente inserito, ma nessuno
 schema applicativo le legge o le scrive piu' da questa migrazione in poi -
 stesso trattamento gia' riservato a "residenza" nella migrazione 018.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 1. CATALOGO TIPI DI DOCUMENTO DI IDENTITA' (globale di sistema)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_tipi_documento_identita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipi_documento_identita_codice UNIQUE (codice)
);

INSERT INTO cat_tipi_documento_identita (codice, denominazione, descrizione, ordine_visualizzazione, attivo)
VALUES
    ('CARTA_IDENTITA', 'Carta d''identità', 'Carta d''identità italiana o straniera.', 1, TRUE),
    ('PATENTE', 'Patente', 'Patente di guida.', 2, TRUE),
    ('PASSAPORTO', 'Passaporto', 'Passaporto.', 3, TRUE),
    ('PERMESSO_SOGGIORNO', 'Permesso di soggiorno', 'Permesso di soggiorno o documento equivalente.', 4, TRUE),
    ('ALTRO', 'Altro documento', 'Tipologia residuale per documenti non elencati.', 5, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;

CREATE OR REPLACE FUNCTION fn_cat_tipi_documento_identita_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_tipi_documento_identita_set_updated_at ON cat_tipi_documento_identita;
CREATE TRIGGER trg_cat_tipi_documento_identita_set_updated_at
BEFORE UPDATE ON cat_tipi_documento_identita
FOR EACH ROW EXECUTE FUNCTION fn_cat_tipi_documento_identita_set_updated_at();

COMMENT ON TABLE cat_tipi_documento_identita IS
    'Catalogo di sistema delle tipologie di documento personale (modulo Personale, Dossier personale > Documenti personali). Include il permesso di soggiorno come tipologia tra le altre.';


/*
-------------------------------------------------------------------------------
 2. DOCUMENTI PERSONALI (registrazione multipla per persona)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS per_documenti_personali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES ana_persone(id) ON DELETE CASCADE,
    tipo_documento_id UUID NOT NULL REFERENCES cat_tipi_documento_identita(id),

    numero VARCHAR(100),
    data_rilascio DATE,
    data_scadenza DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_per_documenti_personali_date
        CHECK (data_scadenza IS NULL OR data_rilascio IS NULL OR data_scadenza >= data_rilascio)
);

CREATE INDEX IF NOT EXISTS idx_per_documenti_personali_persona
    ON per_documenti_personali (persona_id);

CREATE OR REPLACE FUNCTION fn_per_documenti_personali_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_documenti_personali_set_updated_at ON per_documenti_personali;
CREATE TRIGGER trg_per_documenti_personali_set_updated_at
BEFORE UPDATE ON per_documenti_personali
FOR EACH ROW EXECUTE FUNCTION fn_per_documenti_personali_set_updated_at();

COMMENT ON TABLE per_documenti_personali IS
    'Documenti personali di una persona (modulo Personale, Dossier personale > Documenti personali): un numero non limitato di righe per persona, anche di tipologie ripetute. Nessun collegamento ad allegati reali finché il modulo Documenti non sarà costruito.';


/*
-------------------------------------------------------------------------------
 3. COLONNE SUPERATE SU ana_persone (migrazione 018) - non piu'' lette/scritte
-------------------------------------------------------------------------------
*/
COMMENT ON COLUMN ana_persone.tipo_documento_identita IS
    'Superata dalla migrazione 019 (per_documenti_personali): consentiva un solo documento per persona. Colonna mantenuta per lo storico, non più letta né scritta da alcuno schema applicativo.';

COMMENT ON COLUMN ana_persone.numero_documento_identita IS
    'Superata dalla migrazione 019 (per_documenti_personali). Colonna mantenuta per lo storico, non più letta né scritta.';

COMMENT ON COLUMN ana_persone.scadenza_documento_identita IS
    'Superata dalla migrazione 019 (per_documenti_personali). Colonna mantenuta per lo storico, non più letta né scritta.';

COMMENT ON COLUMN ana_persone.permesso_soggiorno_stato IS
    'Superata dalla migrazione 019: il permesso di soggiorno è ora una tipologia di per_documenti_personali (§5.4 della correzione), non uno stato a parte. Colonna mantenuta per lo storico, non più letta né scritta.';

COMMENT ON COLUMN ana_persone.permesso_soggiorno_dettaglio IS
    'Superata dalla migrazione 019, stesso motivo della colonna permesso_soggiorno_stato. Colonna mantenuta per lo storico, non più letta né scritta.';


/*
-------------------------------------------------------------------------------
 REGISTRAZIONE IN sys_elementi (grana di sezione/sottosezione, coerente con
 le altre tabelle operative del modulo - vedi migrazione 011)
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.DOCUMENTI_PERSONALI', m.id, NULL, 'SEZIONE',
    'Documenti personali',
    'Sezione del modulo Personale dedicata ai documenti di identità personali, con possibilità di più documenti per persona.',
    'public', NULL, NULL, TRUE
FROM cat_moduli AS m WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.DOCUMENTI_PERSONALI.CATALOGO_TIPI_DOCUMENTO', m.id, p.id, 'SOTTOSEZIONE',
    'Catalogo tipi di documento',
    'Elenco di sistema utilizzato dal menu a tendina Tipo di documento.',
    'public', 'cat_tipi_documento_identita', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.DOCUMENTI_PERSONALI'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id = EXCLUDED.modulo_id, elemento_padre_id = EXCLUDED.elemento_padre_id, tipo_elemento = EXCLUDED.tipo_elemento,
    denominazione = EXCLUDED.denominazione, descrizione = EXCLUDED.descrizione, schema_database = EXCLUDED.schema_database,
    nome_tabella = EXCLUDED.nome_tabella, nome_colonna = EXCLUDED.nome_colonna, attivo = EXCLUDED.attivo;

INSERT INTO sys_elementi (codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione, descrizione, schema_database, nome_tabella, nome_colonna, attivo)
SELECT 'PERSONALE.DOCUMENTI_PERSONALI.REGISTRAZIONI', m.id, p.id, 'SOTTOSEZIONE',
    'Documenti registrati',
    'Documenti personali registrati per ciascuna persona, con tipo, numero e date.',
    'public', 'per_documenti_personali', NULL, TRUE
FROM cat_moduli AS m JOIN sys_elementi AS p ON p.codice = 'PERSONALE.DOCUMENTI_PERSONALI'
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
        'PERSONALE.DOCUMENTI_PERSONALI',
        'PERSONALE.DOCUMENTI_PERSONALI.CATALOGO_TIPI_DOCUMENTO',
        'PERSONALE.DOCUMENTI_PERSONALI.REGISTRAZIONI'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
