/*
===============================================================================
 MIGRAZIONE 020 - VERIFICA E PRESA VISIONE DELLE MODIFICHE
===============================================================================

 Scopo
 -----
 Migrazione incrementale che integra le correzioni della Revisione 2 dello
 script 012_sys_presa_visione_modifiche.sql, gia' applicato in produzione (la
 tabella sys_presa_visione_modifiche esiste gia' dalla migrazione baseline
 0001). Non ricrea la tabella: applica solo le differenze con ALTER TABLE,
 come richiesto per gli schemi gia' applicati (CLAUDE.md, sezione "Schema
 database"). Rinumerata rispetto al file allegato "012_..._rev.2.sql" per
 evitare il conflitto di prefisso duplicato con 012_sys_presa_visione_modifiche.sql
 gia' esistente nella stessa cartella.

 Correzioni integrate rispetto allo script Rev.2 allegato (che non le
 risolveva tutte)
 ----------------------------------------------------------------------------
 - modifica_vista_at reso nullable (come nella Rev.2), ma qui si introduce
   anche modifica_rilevata_at NOT NULL: nella Rev.2 restava modifica_vista_at
   come unico timestamp NOT NULL, il che impedirebbe comunque di creare la
   riga prima che l'utente la apra la prima volta. modifica_rilevata_at
   distingue "la modifica e' nata" (rilevazione) da "l'utente l'ha aperta la
   prima volta" (modifica_vista_at, ora nullable) come richiesto dai 5
   timestamp distinti della specifica.
 - Aggiunta transazione (assente nello script allegato).
 - Aggiunto trigger di aggiornamento automatico di updated_at (assente nello
   script allegato); nessuna funzione trigger comune esiste nel progetto per
   updated_at (ogni tabella ha la propria, vedi es. ana_ripartizione_organico),
   quindi si segue la stessa convenzione locale.
 - Aggiunti gli indici richiesti dal punto 6.5 della specifica.
 - Aggiunto vincolo: nota_verifica obbligatoria quando lo stato e'
   IN_REVISIONE.

 Modello di storicizzazione delle modifiche successive (§6.3)
 --------------------------------------------------------------
 Decisione confermata dall'utente: nessuno storico delle verifiche passate.
 Una modifica successiva allo stesso record aggiorna la riga esistente
 (stessa unique key utente_id/entita/record_id), riportandola a
 DA_VERIFICARE e azzerando modifica_vista_at/presa_visione_at/nota_verifica
 ("reset atomico"). Nessuna colonna aggiuntiva di versione/evento: la logica
 di reset e' applicativa (vedi app/services/verifica_modifiche.py), non a
 livello di schema.

 Ambito (decisione utente)
 ---------------------------
 Solo tabella e struttura generiche: nessuna entita' reale viene agganciata
 in questo intervento. Il meccanismo resta riservato al profilo CONSULENTE
 (vedi doc/Specifica_tecnica_presa_visione_modifiche.pdf), inclusa
 l'eventuale azione di approvazione/richiesta di revisione introdotta dalla
 Rev.2: nessun nuovo ruolo di sistema.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CATALOGO STATI DI VERIFICA
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_stati_verifica_modifiche (
    codice VARCHAR(30) PRIMARY KEY,
    denominazione VARCHAR(100) NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE cat_stati_verifica_modifiche IS
    'Stati possibili della verifica di una modifica in sys_presa_visione_modifiche.';

INSERT INTO cat_stati_verifica_modifiche (
    codice,
    denominazione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('DA_VERIFICARE', 'Da verificare', 1, TRUE),
    ('APPROVATO', 'Approvato', 2, TRUE),
    ('IN_REVISIONE', 'In revisione', 3, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 sys_presa_visione_modifiche: NUOVE COLONNE
-------------------------------------------------------------------------------
*/
ALTER TABLE sys_presa_visione_modifiche
    ADD COLUMN IF NOT EXISTS modifica_rilevata_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stato_verifica_codice VARCHAR(30) NOT NULL DEFAULT 'DA_VERIFICARE',
    ADD COLUMN IF NOT EXISTS nota_verifica TEXT,
    ADD COLUMN IF NOT EXISTS stato_verifica_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill per righe create prima dell'introduzione della colonna (ambiente
-- gia' popolato): usa created_at come miglior approssimazione disponibile
-- del momento di rilevazione, poi rende la colonna NOT NULL.
UPDATE sys_presa_visione_modifiche
SET modifica_rilevata_at = created_at
WHERE modifica_rilevata_at IS NULL;

ALTER TABLE sys_presa_visione_modifiche
    ALTER COLUMN modifica_rilevata_at SET NOT NULL,
    ALTER COLUMN modifica_rilevata_at SET DEFAULT CURRENT_TIMESTAMP;


/*
-------------------------------------------------------------------------------
 sys_presa_visione_modifiche: CORREZIONE NULLABILITA' TIMESTAMP
-------------------------------------------------------------------------------
 modifica_vista_at: valorizzato solo alla prima apertura da parte
 dell'utente, quindi nullable (correzione §6.2/punto 8.5 della specifica).
 presa_visione_at: azione esplicita dell'utente, nessun default automatico
 (correzione rispetto allo script attuale, che lo valorizzava alla
 creazione della riga).
*/
ALTER TABLE sys_presa_visione_modifiche
    ALTER COLUMN modifica_vista_at DROP NOT NULL,
    ALTER COLUMN presa_visione_at DROP NOT NULL,
    ALTER COLUMN presa_visione_at DROP DEFAULT;


/*
-------------------------------------------------------------------------------
 VINCOLI
-------------------------------------------------------------------------------
*/
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sys_presa_visione_stato_verifica'
    ) THEN
        ALTER TABLE sys_presa_visione_modifiche
            ADD CONSTRAINT fk_sys_presa_visione_stato_verifica
            FOREIGN KEY (stato_verifica_codice)
            REFERENCES cat_stati_verifica_modifiche(codice);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_sys_presa_visione_nota_se_in_revisione'
    ) THEN
        ALTER TABLE sys_presa_visione_modifiche
            ADD CONSTRAINT chk_sys_presa_visione_nota_se_in_revisione
            CHECK (
                stato_verifica_codice <> 'IN_REVISIONE'
                OR (nota_verifica IS NOT NULL AND btrim(nota_verifica) <> '')
            );
    END IF;
END $$;


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_sys_presa_visione_modifiche_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_sys_presa_visione_modifiche_set_updated_at() IS
    'Aggiorna sys_presa_visione_modifiche.updated_at.';

DROP TRIGGER IF EXISTS trg_sys_presa_visione_modifiche_set_updated_at
    ON sys_presa_visione_modifiche;

CREATE TRIGGER trg_sys_presa_visione_modifiche_set_updated_at
BEFORE UPDATE ON sys_presa_visione_modifiche
FOR EACH ROW
EXECUTE FUNCTION fn_sys_presa_visione_modifiche_set_updated_at();


/*
-------------------------------------------------------------------------------
 INDICI (§6.5 della specifica)
-------------------------------------------------------------------------------
*/
-- Modifiche aperte per azienda e utente (non ancora prese in visione).
CREATE INDEX IF NOT EXISTS idx_sys_presa_visione_aperte
    ON sys_presa_visione_modifiche (azienda_id, utente_id)
    WHERE presa_visione_at IS NULL;

-- Filtro/ricerca per stato di verifica.
CREATE INDEX IF NOT EXISTS idx_sys_presa_visione_stato
    ON sys_presa_visione_modifiche (stato_verifica_codice);

-- Ricerca per entita' e record specifico.
CREATE INDEX IF NOT EXISTS idx_sys_presa_visione_entita_record
    ON sys_presa_visione_modifiche (entita, record_id);

-- Ordinamento per momento di rilevazione.
CREATE INDEX IF NOT EXISTS idx_sys_presa_visione_rilevata
    ON sys_presa_visione_modifiche (modifica_rilevata_at);


COMMIT;
