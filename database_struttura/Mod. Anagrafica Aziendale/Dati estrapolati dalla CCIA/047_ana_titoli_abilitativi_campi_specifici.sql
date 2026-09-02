/*
===============================================================================
 MIGRAZIONE 047 - CAMPI SPECIFICI DEI 4 FORM "ALBI, RUOLI, LICENZE E
 CERTIFICAZIONI" (CORREZIONE 21)
===============================================================================

 Scopo
 -----
 Migrazione 046 (Correzione 20) aveva volutamente ridotto ai minimi termini
 i 4 dettagli della tabella unificata, rimandando "l'elenco completo dei
 campi per form Albo/Ruolo/Licenza/Certificazione... a una correzione
 successiva". Questa è quella correzione (21): aggiunge con ALTER TABLE i
 campi specifici di ciascun form definiti nella specifica, senza mai
 riaprire il file 046 già applicato.

 Struttura per punto:
 - § punto 1 (campi comuni): "Stato del titolo" — nuovo `stato_titolo_id`
   su ana_titoli_abilitativi_azienda, catalogo cat_stati_titoli_abilitativi
   (migrazione 031). Distinto dalla conferma del consulente (verifica per
   riga, invariata). "Documenti" resta non rappresentato: il modulo
   Documenti è ancora solo un placeholder (§ CLAUDE.md), come già deciso
   per i campi comuni di Correzione 20.
 - § punto 2 (Albo): tipologia (catalogo), denominazione dell'albo,
   sezione, soggetto iscritto (azienda oppure persona — `persona_id`,
   NULL = azienda), provincia/ambito territoriale, attività o abilitazioni
   collegate. "Numero di iscrizione"/"Ente che gestisce l'albo"/"Data di
   iscrizione" sono i campi comuni già esistenti (numero_attestazione/
   ente_rilascio/data_rilascio), semplicemente rietichettati nel form — non
   duplicati qui.
 - § punto 3 (Ruolo): stesso schema di Albo, senza "categoria" (già
   presente da Correzione 20, qui riletta come "sezione/categoria" non
   viene duplicata: il ruolo usa `sezione_categoria`, nome distinto da
   quello dell'albo perché sono colonne di tabelle diverse).
 - § punto 4 (Licenza): `tipologia_licenza` (testo libero, Correzione 20)
   rinominata `denominazione_licenza` — la correzione distingue esplicita-
   mente "Tipologia di licenza" (ora catalogo, `tipologia_licenza_id`) da
   "Denominazione della licenza" (testo, § tabella del punto 4): sono due
   campi distinti, non uno solo. Aggiunge oggetto/attività autorizzata,
   soggetto titolare (persona_id), sede interessata (sede_id → ana_sedi,
   mai duplicando indirizzo/dati sede), ambito territoriale, data di
   efficacia (se diversa dal rilascio), condizioni/prescrizioni, estremi
   del rinnovo.
 - § punto 5 (Certificazione o attestazione): sostituisce `sotto_tipo`
   (2 opzioni fisse, Correzione 20) con `sotto_tipo_id` verso il nuovo
   catalogo cat_tipologie_certificazione_attestazione (migrazione 035, 3
   configurazioni) — la correzione chiede esplicitamente un catalogo, non
   più opzioni fisse. I dati esistenti vengono riportati prima di rimuovere
   la vecchia colonna (idempotente: il blocco successivo è no-op se
   `sotto_tipo` non esiste più). Aggiunge i campi del sotto-form
   "Certificazione di sistema" (norma_id, edizione_anno, organismo di
   accreditamento, campo di applicazione, data di prima emissione — organi-
   smo di certificazione/numero/date sono i campi comuni esistenti) e del
   sotto-form "Altra certificazione o attestazione" (denominazione, schema/
   norma di riferimento — campo di applicazione condiviso col sotto-form
   precedente, stesso significato). Il sotto-form "Attestazione SOA" non
   introduce colonne proprie sul dettaglio: usa solo i campi comuni
   (numero/ente/date) più la tabella ripetibile
   rel_titoli_abilitativi_soa_categorie sotto.
 - Settori IAF (§ punto 5.1, selezione multipla dal catalogo esistente
   cat_settori_iaf, § "questo catalogo non deve duplicare cat_certifica-
   zioni" per le norme — cat_settori_iaf invece è lo stesso già in uso per
   AnaCertificazione, riusato qui senza duplicarlo): tabella di relazione
   rel_titoli_abilitativi_settori_iaf.
 - Categorie/classifiche SOA (§ punto 5.2): tabella di relazione
   rel_titoli_abilitativi_soa_categorie, cataloghi cat_categorie_soa/
   cat_classifiche_soa (migrazioni 037/038) — una sola attestazione
   collegata a più categorie senza duplicare numero/ente/date (§ punto
   5.2, "Una sola attestazione può quindi essere collegata a più categorie
   senza duplicare numero, ente e date").

 La migrazione è idempotente (ADD COLUMN IF NOT EXISTS, blocchi DO
 condizionati sull'esistenza della colonna da rinominare/rimuovere).
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 CAMPI COMUNI: ana_titoli_abilitativi_azienda
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_titoli_abilitativi_azienda
    ADD COLUMN IF NOT EXISTS stato_titolo_id UUID
        REFERENCES cat_stati_titoli_abilitativi(id);

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_azienda_stato_titolo
    ON ana_titoli_abilitativi_azienda (stato_titolo_id);


/*
-------------------------------------------------------------------------------
 DETTAGLIO ALBO (§ punto 2)
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_titoli_abilitativi_dettaglio_albo
    ADD COLUMN IF NOT EXISTS tipologia_albo_id UUID
        REFERENCES cat_tipologie_albo(id),
    ADD COLUMN IF NOT EXISTS denominazione_albo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sezione VARCHAR(255),
    ADD COLUMN IF NOT EXISTS persona_id UUID
        REFERENCES ana_persone(id),
    ADD COLUMN IF NOT EXISTS provincia_ambito VARCHAR(100),
    ADD COLUMN IF NOT EXISTS attivita_abilitazioni TEXT;

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_albo_persona
    ON ana_titoli_abilitativi_dettaglio_albo (persona_id);


/*
-------------------------------------------------------------------------------
 DETTAGLIO RUOLO (§ punto 3)
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_titoli_abilitativi_dettaglio_ruolo
    ADD COLUMN IF NOT EXISTS tipologia_ruolo_id UUID
        REFERENCES cat_tipologie_ruolo(id),
    ADD COLUMN IF NOT EXISTS sezione_categoria VARCHAR(255),
    ADD COLUMN IF NOT EXISTS persona_id UUID
        REFERENCES ana_persone(id),
    ADD COLUMN IF NOT EXISTS provincia_ambito VARCHAR(100),
    ADD COLUMN IF NOT EXISTS attivita_abilitate TEXT;

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_ruolo_persona
    ON ana_titoli_abilitativi_dettaglio_ruolo (persona_id);


/*
-------------------------------------------------------------------------------
 DETTAGLIO LICENZA (§ punto 4)
-------------------------------------------------------------------------------
*/
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ana_titoli_abilitativi_dettaglio_licenza'
          AND column_name = 'tipologia_licenza'
    ) THEN
        ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza
            RENAME COLUMN tipologia_licenza TO denominazione_licenza;
    END IF;
END $$;

ALTER TABLE ana_titoli_abilitativi_dettaglio_licenza
    ADD COLUMN IF NOT EXISTS tipologia_licenza_id UUID
        REFERENCES cat_tipologie_licenza(id),
    ADD COLUMN IF NOT EXISTS oggetto_attivita TEXT,
    ADD COLUMN IF NOT EXISTS persona_id UUID
        REFERENCES ana_persone(id),
    ADD COLUMN IF NOT EXISTS sede_id UUID
        REFERENCES ana_sedi(id),
    ADD COLUMN IF NOT EXISTS ambito_territoriale VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data_efficacia DATE,
    ADD COLUMN IF NOT EXISTS condizioni_prescrizioni TEXT,
    ADD COLUMN IF NOT EXISTS estremi_rinnovo VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_licenza_persona
    ON ana_titoli_abilitativi_dettaglio_licenza (persona_id);
CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_licenza_sede
    ON ana_titoli_abilitativi_dettaglio_licenza (sede_id);


/*
-------------------------------------------------------------------------------
 DETTAGLIO CERTIFICAZIONE O ATTESTAZIONE (§ punto 5)
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione
    ADD COLUMN IF NOT EXISTS sotto_tipo_id UUID
        REFERENCES cat_tipologie_certificazione_attestazione(id),
    ADD COLUMN IF NOT EXISTS norma_id UUID
        REFERENCES cat_norme_certificazione(id),
    ADD COLUMN IF NOT EXISTS edizione_anno VARCHAR(50),
    ADD COLUMN IF NOT EXISTS organismo_accreditamento VARCHAR(255),
    ADD COLUMN IF NOT EXISTS campo_applicazione TEXT,
    ADD COLUMN IF NOT EXISTS data_prima_emissione DATE,
    ADD COLUMN IF NOT EXISTS denominazione VARCHAR(255),
    ADD COLUMN IF NOT EXISTS schema_norma VARCHAR(255);

-- Riporta i dati esistenti dal vecchio `sotto_tipo` (2 opzioni fisse) al
-- nuovo catalogo, poi rimuove la vecchia colonna: no-op se già eseguita.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ana_titoli_abilitativi_dettaglio_certificazione'
          AND column_name = 'sotto_tipo'
    ) THEN
        UPDATE ana_titoli_abilitativi_dettaglio_certificazione d
        SET sotto_tipo_id = c.id
        FROM cat_tipologie_certificazione_attestazione c
        WHERE d.sotto_tipo_id IS NULL
          AND c.codice = CASE d.sotto_tipo
              WHEN 'CERTIFICAZIONE' THEN 'CERTIFICAZIONE_SISTEMA'
              WHEN 'ATTESTAZIONE_SOA' THEN 'ATTESTAZIONE_SOA'
              ELSE 'ALTRA'
          END;

        ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione
            DROP CONSTRAINT IF EXISTS chk_ana_titoli_abilitativi_dettaglio_certificazione_sotto_tipo;

        ALTER TABLE ana_titoli_abilitativi_dettaglio_certificazione
            DROP COLUMN sotto_tipo;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_certificazione_sotto_tipo
    ON ana_titoli_abilitativi_dettaglio_certificazione (sotto_tipo_id);
CREATE INDEX IF NOT EXISTS idx_ana_titoli_abilitativi_dettaglio_certificazione_norma
    ON ana_titoli_abilitativi_dettaglio_certificazione (norma_id);


/*
-------------------------------------------------------------------------------
 SETTORI IAF DELLA CERTIFICAZIONE DI SISTEMA (§ punto 5.1, selezione
 multipla dal catalogo esistente cat_settori_iaf — mai duplicato)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_titoli_abilitativi_settori_iaf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dettaglio_certificazione_id UUID NOT NULL,
    settore_iaf_id UUID NOT NULL,

    CONSTRAINT fk_rel_titoli_abilitativi_settori_iaf_dettaglio
        FOREIGN KEY (dettaglio_certificazione_id)
        REFERENCES ana_titoli_abilitativi_dettaglio_certificazione(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_titoli_abilitativi_settori_iaf_settore
        FOREIGN KEY (settore_iaf_id)
        REFERENCES cat_settori_iaf(id),

    CONSTRAINT uq_rel_titoli_abilitativi_settori_iaf
        UNIQUE (dettaglio_certificazione_id, settore_iaf_id)
);


/*
-------------------------------------------------------------------------------
 CATEGORIE/CLASSIFICHE SOA DELL'ATTESTAZIONE (§ punto 5.2, tabella interna
 ripetibile — una attestazione, più righe categoria/classifica)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_titoli_abilitativi_soa_categorie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dettaglio_certificazione_id UUID NOT NULL,
    categoria_soa_id UUID NOT NULL,
    classifica_soa_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rel_titoli_abilitativi_soa_categorie_dettaglio
        FOREIGN KEY (dettaglio_certificazione_id)
        REFERENCES ana_titoli_abilitativi_dettaglio_certificazione(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_titoli_abilitativi_soa_categorie_categoria
        FOREIGN KEY (categoria_soa_id)
        REFERENCES cat_categorie_soa(id),

    CONSTRAINT fk_rel_titoli_abilitativi_soa_categorie_classifica
        FOREIGN KEY (classifica_soa_id)
        REFERENCES cat_classifiche_soa(id),

    CONSTRAINT uq_rel_titoli_abilitativi_soa_categorie
        UNIQUE (dettaglio_certificazione_id, categoria_soa_id)
);

CREATE OR REPLACE FUNCTION fn_rel_titoli_abilitativi_soa_categorie_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_titoli_abilitativi_soa_categorie_set_updated_at
    ON rel_titoli_abilitativi_soa_categorie;

CREATE TRIGGER trg_rel_titoli_abilitativi_soa_categorie_set_updated_at
BEFORE UPDATE ON rel_titoli_abilitativi_soa_categorie
FOR EACH ROW
EXECUTE FUNCTION fn_rel_titoli_abilitativi_soa_categorie_set_updated_at();


COMMIT;
