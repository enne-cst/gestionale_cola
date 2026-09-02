/*
===============================================================================
 MIGRAZIONE 049 - SEDI SECONDARIE E UNITA' LOCALI (CORREZIONE 23)
===============================================================================

 Scopo
 -----
 Porta la card "Sedi secondarie e unità locali" allo stesso standard delle
 altre card CCIAA convertite (rev2/Correzioni 19-22): tabella riepilogativa
 sostenuta da strutture SQL adeguate, cataloghi al posto del testo libero,
 relazioni molti-a-molti al posto delle stringhe con virgole.

 Verificato prima di questa migrazione (§ istruzione esplicita della
 correzione, "Claude deve verificare come la piattaforma gestisce
 attualmente gli indirizzi/le unità locali"): `ana_sedi` (migrazione 015,
 estesa dalla 026) è GIA' la tabella delle unità locali — la sede legale
 stessa vi convive come una riga distinta via `tipo_sede ILIKE '%legale%'`
 (funzione `_sede_legale_di`, app/core/registro_campi.py). Ha già indirizzo
 completo inline (nessuna struttura indirizzi condivisa esiste nel
 progetto, quindi nessun `indirizzo_id`), riferimento CCIAA
 (`numero_unita_locale`, univoco per azienda quando valorizzato — i NULL
 non collidono in un vincolo UNIQUE Postgres), date di apertura/chiusura.
 `ana_sedi_attivita` (026) è già la tabella "attività esercitate presso
 l'unità" del §5. Non viene quindi creata alcuna `ana_unita_locali` né
 `ana_attivita_unita_locali`: si estendono le tabelle esistenti (§11,
 "non creare una seconda struttura se esistono già tabelle equivalenti").
 La sede legale non viene toccata da questa migrazione né dalla card che la
 userà: resta un'altra riga della stessa tabella, selezionata come oggi.

 Cosa manca davvero e viene aggiunto qui
 ----------------------------------------
 1. Stato amministrativo dell'unità come catalogo (§7): `ana_sedi.stato`
    resta (testo libero, non più usato dalla nuova card, stessa
    convenzione di "rimozione rimandata a decisione esplicita" già in uso
    per le duplicazioni rev2) + nuova colonna `stato_unita_id` verso
    `cat_stati_unita_locale` (migrazione 040) + `note`.
 2. Tipologie multiple (§4): una stessa unità può avere più qualificazioni
    ("Deposito, magazzino") — mai una stringa con virgole. Nuova relazione
    `rel_unita_locali_tipologie` verso `cat_tipologie_unita_locale`
    (migrazione 039). La colonna esistente `tipo_sede` (NOT NULL) resta
    invariata: è l'unico segnale che `_sede_legale_di` usa per riconoscere
    la sede legale, non va toccata né riletta dalla nuova card per le
    unità locali.
 3. Attività principale (§5): `ana_sedi_attivita` ha già descrizione/date,
    manca il flag booleano "attività principale" (oggi solo un
    `ruolo_importanza` testuale) — aggiunto con un vincolo che ammette al
    più un'attività principale per unità.
 4. Codici ATECO strutturati (§6): `ana_codici_ateco.sede_id` (028) esiste
    ma è testo libero (`codice VARCHAR`), non il catalogo versionato
    richiesto esplicitamente ("il catalogo versionato dei codici di
    attività economica previsto nella Correzione 19"). Nuova relazione
    `rel_unita_locali_codici_ateco` verso `cat_codici_ateco_2025`
    (migrazione 027, oggi vuoto: l'import ufficiale resta fuori scopo,
    stesso limite già accettato in Correzione 19/45). `ana_codici_ateco`
    resta al suo posto, non più referenziata da questa card.
 5. Contatti della sede (§8, "eventuali contatti della sede"): `ana_contatti`
    esiste solo a livello azienda. Aggiunta `sede_id` nullable, stessa
    scelta già fatta in migrazione 028 per ana_codici_ateco/
    ana_albi_ruoli_licenze (NULL = contatto dell'intera azienda, invariato).
 6. Numero di unità locali dichiarato in visura (§1): nuova tabella 1:1 con
    l'azienda, `ana_unita_locali_riepilogo`. Conserva SOLO il valore
    dichiarato: il numero effettivo si conta dalle righe attive di
    `ana_sedi` e non va mai salvato come dato ridondante (calcolato lato
    applicazione, § SEZIONE_UNITA_LOCALI in registro_campi.py).

 Riconoscimento CCIAA e cancellazioni (§10-11, garantiti a livello di
 schema anche se nessuna pipeline di import esiste oggi nel progetto, per
 nessuna card): `numero_unita_locale` resta la chiave di riconoscimento
 univoca per azienda; nessun ON DELETE CASCADE automatico rimuove una riga
 di `ana_sedi` per l'assenza da un'estrazione futura — solo `data_chiusura`/
 `stato_unita_id` la marcano cessata, mai una DELETE implicita.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 1. STATO AMMINISTRATIVO DELL'UNITA' (catalogo) + NOTE
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_sedi
    ADD COLUMN IF NOT EXISTS stato_unita_id UUID,
    ADD COLUMN IF NOT EXISTS note TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_sedi_stato_unita'
    ) THEN
        ALTER TABLE ana_sedi
            ADD CONSTRAINT fk_ana_sedi_stato_unita
            FOREIGN KEY (stato_unita_id)
            REFERENCES cat_stati_unita_locale(id);
    END IF;
END $$;

COMMENT ON COLUMN ana_sedi.stato_unita_id IS
    'Stato amministrativo dell''unità (catalogo cat_stati_unita_locale, Correzione 23 §7), distinto dalla conferma del consulente. La vecchia colonna "stato" (testo libero) resta per compatibilità ma non è più usata dalla card "Sedi secondarie e unità locali".';


/*
-------------------------------------------------------------------------------
 2. TIPOLOGIE MULTIPLE (relazione molti-a-molti)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_unita_locali_tipologie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    unita_locale_id UUID NOT NULL,
    tipologia_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rel_unita_locali_tipologie_unita
        FOREIGN KEY (unita_locale_id)
        REFERENCES ana_sedi(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_unita_locali_tipologie_tipologia
        FOREIGN KEY (tipologia_id)
        REFERENCES cat_tipologie_unita_locale(id),

    CONSTRAINT uq_rel_unita_locali_tipologie
        UNIQUE (unita_locale_id, tipologia_id)
);

CREATE INDEX IF NOT EXISTS idx_rel_unita_locali_tipologie_unita
    ON rel_unita_locali_tipologie (unita_locale_id);

COMMENT ON TABLE rel_unita_locali_tipologie IS
    'Tipologie collegate a un''unità locale (Correzione 23 §4): relazione molti-a-molti, mai una stringa con virgole — una stessa unità può avere più tipologie (es. "Deposito, magazzino").';


/*
-------------------------------------------------------------------------------
 3. ATTIVITA' PRINCIPALE (estensione di ana_sedi_attivita)
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_sedi_attivita
    ADD COLUMN IF NOT EXISTS attivita_principale BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ana_sedi_attivita_principale_per_sede
    ON ana_sedi_attivita (sede_id)
    WHERE attivita_principale;

COMMENT ON COLUMN ana_sedi_attivita.attivita_principale IS
    'Attività principale esercitata presso l''unità (Correzione 23 §5): al più una per unità (indice unico parziale), mostrata da sola nella vista riepilogativa.';


/*
-------------------------------------------------------------------------------
 4. CODICI ATECO STRUTTURATI (relazione verso il catalogo versionato)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_unita_locali_codici_ateco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    unita_locale_id UUID NOT NULL,
    codice_attivita_id UUID NOT NULL,

    principale BOOLEAN NOT NULL DEFAULT FALSE,
    data_inizio DATE,
    data_fine DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rel_unita_locali_codici_ateco_unita
        FOREIGN KEY (unita_locale_id)
        REFERENCES ana_sedi(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_unita_locali_codici_ateco_codice
        FOREIGN KEY (codice_attivita_id)
        REFERENCES cat_codici_ateco_2025(id),

    CONSTRAINT uq_rel_unita_locali_codici_ateco
        UNIQUE (unita_locale_id, codice_attivita_id),

    CONSTRAINT chk_rel_unita_locali_codici_ateco_date
        CHECK (
            data_fine IS NULL
            OR data_inizio IS NULL
            OR data_fine >= data_inizio
        )
);

CREATE INDEX IF NOT EXISTS idx_rel_unita_locali_codici_ateco_unita
    ON rel_unita_locali_codici_ateco (unita_locale_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_rel_unita_locali_codici_ateco_principale
    ON rel_unita_locali_codici_ateco (unita_locale_id)
    WHERE principale;

COMMENT ON TABLE rel_unita_locali_codici_ateco IS
    'Codici ATECO di un''unità locale (Correzione 23 §6), collegati al catalogo versionato cat_codici_ateco_2025 (mai testo libero): al più un codice principale per unità (indice unico parziale).';


/*
-------------------------------------------------------------------------------
 5. CONTATTI DELLA SEDE (estensione di ana_contatti)
-------------------------------------------------------------------------------
*/
ALTER TABLE ana_contatti
    ADD COLUMN IF NOT EXISTS sede_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_contatti_sede'
    ) THEN
        ALTER TABLE ana_contatti
            ADD CONSTRAINT fk_ana_contatti_sede
            FOREIGN KEY (sede_id)
            REFERENCES ana_sedi(id)
            ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ana_contatti_sede
    ON ana_contatti (sede_id);

COMMENT ON COLUMN ana_contatti.sede_id IS
    'Unità locale a cui appartiene il contatto (Correzione 23 §8). NULL (comportamento invariato) = contatto dell''intera azienda, come prima di questa colonna.';


/*
-------------------------------------------------------------------------------
 6. NUMERO DI UNITA' LOCALI DICHIARATO IN VISURA (1:1 con l'azienda)
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_unita_locali_riepilogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    numero_unita_locali_dichiarato INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_unita_locali_riepilogo_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_unita_locali_riepilogo_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_unita_locali_riepilogo_non_negativo
        CHECK (
            numero_unita_locali_dichiarato IS NULL
            OR numero_unita_locali_dichiarato >= 0
        )
);

COMMENT ON TABLE ana_unita_locali_riepilogo IS
    'Numero di unità locali dichiarato nella visura CCIAA (Correzione 23 §1) — un solo record per azienda. Il numero effettivo si calcola contando le righe attive di ana_sedi e non viene mai salvato qui.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at (nuove tabelle)
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_rel_unita_locali_tipologie_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_unita_locali_tipologie_set_updated_at
    ON rel_unita_locali_tipologie;
CREATE TRIGGER trg_rel_unita_locali_tipologie_set_updated_at
BEFORE UPDATE ON rel_unita_locali_tipologie
FOR EACH ROW
EXECUTE FUNCTION fn_rel_unita_locali_tipologie_set_updated_at();


CREATE OR REPLACE FUNCTION fn_rel_unita_locali_codici_ateco_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rel_unita_locali_codici_ateco_set_updated_at
    ON rel_unita_locali_codici_ateco;
CREATE TRIGGER trg_rel_unita_locali_codici_ateco_set_updated_at
BEFORE UPDATE ON rel_unita_locali_codici_ateco
FOR EACH ROW
EXECUTE FUNCTION fn_rel_unita_locali_codici_ateco_set_updated_at();


CREATE OR REPLACE FUNCTION fn_ana_unita_locali_riepilogo_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ana_unita_locali_riepilogo_set_updated_at
    ON ana_unita_locali_riepilogo;
CREATE TRIGGER trg_ana_unita_locali_riepilogo_set_updated_at
BEFORE UPDATE ON ana_unita_locali_riepilogo
FOR EACH ROW
EXECUTE FUNCTION fn_ana_unita_locali_riepilogo_set_updated_at();


COMMIT;
