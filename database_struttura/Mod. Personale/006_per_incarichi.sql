/*
===============================================================================
 MIGRAZIONE 006 - INCARICHI DELLE PERSONE (RUOLO + CARATTERISTICHE)
===============================================================================

 Scopo
 -----
 Questa migrazione crea il motore generico che collega una persona
 (`ana_persone`) a un ruolo del catalogo (`cat_ruoli`), con i valori delle
 caratteristiche richieste dal ruolo (`cat_caratteristiche_incarico`,
 configurate per ruolo in `rel_ruoli_caratteristiche`).

 Sostituisce le tabelle `qual_soci`, `qual_elenco_soci`,
 `qual_amministratori_cariche`, `qual_sindaco`, `qual_revisore_legale`,
 `qual_direttore_tecnico_soa`, `qual_amministratore_delegato`,
 `qual_componente_consiglio_amministrazione` e `qual_responsabile_fer`
 (rimosse dalla migrazione 007 dello stesso modulo e dalla migrazione 024 di
 Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA), che duplicavano
 l'anagrafica della persona invece di riferirla e replicavano lo stesso
 insieme di colonne per ogni ruolo.

 Struttura
 ---------
 - `per_incarichi`: una riga per relazione persona-ruolo. Non contiene dati
   della carica: quelli vivono soltanto in `per_incarichi_valori`, per non
   duplicare ciò che il catalogo caratteristiche già rappresenta (es. le
   date di assegnazione/cessazione sono le caratteristiche A01/A02, non
   colonne su questa tabella).
 - `per_incarichi_valori`: una riga per caratteristica compilata di un
   incarico. Una sola colonna `valore_*` è valorizzata, secondo il
   `tipo_dato` della caratteristica collegata (`cat_caratteristiche_incarico.tipo_dato`).
   L'obbligatorietà per ruolo è verificata dal backend leggendo
   `rel_ruoli_caratteristiche`, non da vincoli qui.

 Prerequisiti
 ------------
 - ana_persone (migrazione 001 di questo modulo);
 - cat_ruoli, cat_caratteristiche_incarico, rel_ruoli_caratteristiche
   (migrazioni 002-004 di Cataloghi);
 - doc_documenti (Documenti);
 - cat_moduli, sys_elementi, rel_elementi_certificazioni.

 La migrazione è idempotente e non inserisce incarichi di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: per_incarichi
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS per_incarichi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    persona_id UUID NOT NULL,
    ruolo_id UUID NOT NULL,

    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_per_incarichi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_per_incarichi_persona
        FOREIGN KEY (persona_id)
        REFERENCES ana_persone(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_per_incarichi_ruolo
        FOREIGN KEY (ruolo_id)
        REFERENCES cat_ruoli(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_per_incarichi_persona
    ON per_incarichi (persona_id);

CREATE INDEX IF NOT EXISTS idx_per_incarichi_azienda_ruolo
    ON per_incarichi (azienda_id, ruolo_id);

COMMENT ON TABLE per_incarichi IS
    'Relazione persona-ruolo. I dati della carica vivono in per_incarichi_valori, mai su questa riga.';


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: per_incarichi_valori
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS per_incarichi_valori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    incarico_id UUID NOT NULL,
    caratteristica_id UUID NOT NULL,

    valore_testo TEXT,
    valore_numero NUMERIC(15, 4),
    valore_data DATE,
    valore_booleano BOOLEAN,
    valore_documento_id UUID,
    valore_multiplo JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_per_incarichi_valori_incarico_caratteristica
        UNIQUE (incarico_id, caratteristica_id),

    CONSTRAINT fk_per_incarichi_valori_incarico
        FOREIGN KEY (incarico_id)
        REFERENCES per_incarichi(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_per_incarichi_valori_caratteristica
        FOREIGN KEY (caratteristica_id)
        REFERENCES cat_caratteristiche_incarico(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_per_incarichi_valori_documento
        FOREIGN KEY (valore_documento_id)
        REFERENCES doc_documenti(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_per_incarichi_valori_caratteristica
    ON per_incarichi_valori (caratteristica_id);

COMMENT ON TABLE per_incarichi_valori IS
    'Valore di una singola caratteristica per un incarico. Una sola colonna valore_* valorizzata, secondo il tipo_dato della caratteristica.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_per_incarichi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_incarichi_set_updated_at
    ON per_incarichi;

CREATE TRIGGER trg_per_incarichi_set_updated_at
BEFORE UPDATE ON per_incarichi
FOR EACH ROW
EXECUTE FUNCTION fn_per_incarichi_set_updated_at();

CREATE OR REPLACE FUNCTION fn_per_incarichi_valori_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_per_incarichi_valori_set_updated_at
    ON per_incarichi_valori;

CREATE TRIGGER trg_per_incarichi_valori_set_updated_at
BEFORE UPDATE ON per_incarichi_valori
FOR EACH ROW
EXECUTE FUNCTION fn_per_incarichi_valori_set_updated_at();


/*
-------------------------------------------------------------------------------
 SOTTOSEZIONE: INCARICHI ASSEGNATI
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
    'PERSONALE.RUOLI_INCARICHI.INCARICHI_ASSEGNATI',
    m.id,
    p.id,
    'SOTTOSEZIONE',
    'Incarichi assegnati',
    'Relazioni persona-ruolo effettivamente assegnate, con i valori delle caratteristiche richieste dal ruolo.',
    'public',
    'per_incarichi',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.RUOLI_INCARICHI'
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
WHERE e.codice = 'PERSONALE.RUOLI_INCARICHI.INCARICHI_ASSEGNATI'
  AND c.codice IN ('ISO_9001', 'ISO_14001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
