-- =======================================================================
-- MODULO PERSONALE - ESTENSIONE PER "COMPETENZE" (livello complessivo)
-- =======================================================================
--
-- Specificazione implementativa "Costruzione completa della scheda
-- Competenze": una sola colonna additiva, autorizzata esplicitamente
-- dall'utente dopo audit del repository.
--
-- per_valutazioni_personale (migrazione 013/0100, mai popolata) è la
-- testata di una sessione di valutazione con persona/azienda/macroarea/
-- data/valutatore/nota già presenti e insert-only per disegno ("il
-- salvataggio crea sempre una nuova riga, mai un aggiornamento" - commento
-- originale della tabella), ma non aveva alcuna colonna per il "livello
-- complessivo" del macro-indicatore, indipendente dalle valutazioni
-- analitiche delle singole voci (che vivono solo in
-- per_valutazioni_personale_dettagli). Il modale "Valuta indicatore" crea
-- una riga con solo questa colonna valorizzata e nessuna riga di
-- dettaglio collegata: lo storico è quindi già garantito dalla tabella
-- esistente, senza bisogno di una tabella separata.
--
-- Stessa terminologia già in uso in per_valutazioni_personale_dettagli.
-- livello (BASE/INTERMEDIO/AVANZATO), non le "Livello 1/2/3" di
-- cat_livelli_sintetici_personale (le 3 colonne dormienti di ana_persone
-- legate a quel catalogo restano intenzionalmente non toccate).

ALTER TABLE per_valutazioni_personale
    ADD COLUMN IF NOT EXISTS livello_complessivo VARCHAR(20);

ALTER TABLE per_valutazioni_personale
    DROP CONSTRAINT IF EXISTS chk_per_valutazioni_personale_livello_complessivo;

ALTER TABLE per_valutazioni_personale
    ADD CONSTRAINT chk_per_valutazioni_personale_livello_complessivo
        CHECK (livello_complessivo IS NULL OR livello_complessivo IN ('BASE', 'INTERMEDIO', 'AVANZATO'));

COMMENT ON COLUMN per_valutazioni_personale.livello_complessivo IS
    'Livello del macro-indicatore (Conoscenza/Competenza/Consapevolezza) quando questa riga rappresenta una valutazione diretta del macro-indicatore stesso (nessuna riga di dettaglio collegata). NULL quando la riga è invece una sessione di valutazioni analitiche delle singole voci.';
