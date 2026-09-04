-- =======================================================================
-- MODULO PERSONALE (rev2) - AMBITO, FONTE E STATO DEGLI INCARICHI
-- =======================================================================
--
-- Prima estensione preparatoria per il nuovo modulo Personale (tab Ruoli
-- della scheda persona, vedi SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE
-- §13 e §22.7). Decisione esplicita: il tab Ruoli riusa il motore
-- ruolo+caratteristiche già esistente (cat_ruoli/per_incarichi/
-- per_incarichi_valori, nato per le cariche societarie CCIAA) invece di
-- un modello parallelo.
--
-- Tre concetti richiesti dalla nuova tabella "Ruoli registrati" non hanno
-- oggi una colonna dedicata:
--
-- 1. Ambito del ruolo (Governance/Sicurezza/Qualità/Ambiente/
--    Organizzazione/Altro) — attributo del CATALOGO (cat_ruoli), non
--    dell'assegnazione: un dato ruolo ha sempre lo stesso ambito
--    indipendentemente da chi lo ricopre. Colonna aggiunta NULLABLE:
--    la mappatura dei 34 ruoli esistenti è un giudizio di dominio che va
--    proposto e approvato voce per voce, non dedotto qui in automatico —
--    resta in una migrazione dati successiva dedicata.
--
-- 2. Fonte dell'incarico (CCIAA / AZIENDA) — oggi non esiste alcuna
--    pipeline di import automatico dalla CCIAA verso per_incarichi
--    (verificato: nessun modulo fuori da personale.py/incarichi.py/
--    registro_campi.py referenzia PerIncarico), ogni riga è inserita
--    manualmente. "Fonte" descrive comunque l'origine concettuale del
--    dato, non il canale tecnico di inserimento: le righe esistenti
--    (cariche societarie Soci/Amministratori/Sindaci) sono tutte
--    CCIAA per decisione esplicita.
--
-- 3. Stato dell'incarico (PIANIFICATO/ATTIVO/SOSPESO/CESSATO) — oggi
--    "attivo" è solo dedotto dall'assenza della caratteristica A02 (data
--    cessazione): commento esplicito in app/core/incarichi.py (righe
--    ~206-212) segnala che questa euristica "non è abbastanza affidabile
--    da usare come unica fonte" per una nozione generale di stato.
--    Colonna backfillata dalla stessa euristica solo per le righe
--    esistenti (CESSATO se esiste una A02 valorizzata, altrimenti
--    ATTIVO) — nessun PIANIFICATO/SOSPESO retroattivo sullo storico.
--
-- Ambito/fonte/stato sono attributi universali di ogni ruolo/incarico
-- (non opzionali per tipo di ruolo come le caratteristiche A01-A56),
-- quindi colonne dirette con CHECK, non nuove voci nel catalogo
-- caratteristiche — coerente con sys_registro_audit.azione, già un CHECK
-- su valori fissi di sistema.
--
-- Nessuna nuova registrazione in sys_elementi: cat_ruoli (le sue righe,
-- migrazione 002) e per_incarichi (sottosezione "Incarichi assegnati",
-- migrazione 006) sono già interamente taggati; queste sono nuove colonne
-- delle stesse entità già registrate, non nuove informazioni autonome.


-- -----------------------------------------------------------------------
-- 1. AMBITO DEL RUOLO (cat_ruoli)
-- -----------------------------------------------------------------------
ALTER TABLE cat_ruoli
    ADD COLUMN IF NOT EXISTS ambito VARCHAR(30);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cat_ruoli_ambito'
    ) THEN
        ALTER TABLE cat_ruoli
            ADD CONSTRAINT chk_cat_ruoli_ambito
                CHECK (
                    ambito IS NULL
                    OR ambito IN ('GOVERNANCE', 'SICUREZZA', 'QUALITA', 'AMBIENTE', 'ORGANIZZAZIONE', 'ALTRO')
                );
    END IF;
END;
$$;

COMMENT ON COLUMN cat_ruoli.ambito IS
    'Ambito del ruolo (modulo Personale §13.1), mostrato nella tabella "Ruoli registrati". NULL finché la mappatura dei ruoli esistenti non è stata proposta e approvata voce per voce.';


-- -----------------------------------------------------------------------
-- 2. FONTE DELL'INCARICO (per_incarichi)
-- -----------------------------------------------------------------------
ALTER TABLE per_incarichi
    ADD COLUMN IF NOT EXISTS fonte VARCHAR(20) NOT NULL DEFAULT 'CCIAA';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_per_incarichi_fonte'
    ) THEN
        ALTER TABLE per_incarichi
            ADD CONSTRAINT chk_per_incarichi_fonte
                CHECK (fonte IN ('CCIAA', 'AZIENDA'));
    END IF;
END;
$$;

COMMENT ON COLUMN per_incarichi.fonte IS
    'Origine dell''incarico (modulo Personale §13.2): CCIAA = carica societaria (assegnazione in sola lettura, corregge dalla fonte camerale), AZIENDA = assegnazione manuale dal modulo Personale (modificabile). Righe preesistenti a questa migrazione: tutte CCIAA per decisione esplicita.';


-- -----------------------------------------------------------------------
-- 3. STATO DELL'INCARICO (per_incarichi)
-- -----------------------------------------------------------------------
ALTER TABLE per_incarichi
    ADD COLUMN IF NOT EXISTS stato VARCHAR(20);

UPDATE per_incarichi AS pi
SET stato = 'CESSATO'
WHERE stato IS NULL
  AND EXISTS (
      SELECT 1
      FROM per_incarichi_valori AS v
      JOIN cat_caratteristiche_incarico AS c
        ON c.id = v.caratteristica_id
      WHERE v.incarico_id = pi.id
        AND c.codice = 'A02'
        AND v.valore_data IS NOT NULL
  );

UPDATE per_incarichi
SET stato = 'ATTIVO'
WHERE stato IS NULL;

ALTER TABLE per_incarichi
    ALTER COLUMN stato SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_per_incarichi_stato'
    ) THEN
        ALTER TABLE per_incarichi
            ADD CONSTRAINT chk_per_incarichi_stato
                CHECK (stato IN ('PIANIFICATO', 'ATTIVO', 'SOSPESO', 'CESSATO'));
    END IF;
END;
$$;

COMMENT ON COLUMN per_incarichi.stato IS
    'Stato dell''incarico (modulo Personale §13.1). Righe preesistenti a questa migrazione: derivato dalla caratteristica A02 (data cessazione) esistente — CESSATO se valorizzata, altrimenti ATTIVO; nessun PIANIFICATO/SOSPESO retroattivo. Sostituisce, per il nuovo modulo, l''euristica "attivo = assenza di A02" di app.core.incarichi (che resta invariata per i propri usi interni).';
