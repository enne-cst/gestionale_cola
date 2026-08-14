/*
===============================================================================
 023 - IDENTIFICAZIONE CAMERALE: COLONNE MANCANTI PER "INFORMAZIONI SOCIETARIE"
===============================================================================

 Scopo
 -----
 Completa ana_identificazione_camerale (001) con le colonne richieste dal
 catalogo finale "Informazioni societarie" della specifica Anagrafica
 Aziendale (PARTE II, §28.1/§29.1), assenti dallo schema originale:

   - numero_iscrizione   (Numero iscrizione)
   - data_iscrizione     (Data iscrizione)
   - termine_esercizio   (Termine esercizio, formato GG/MM)
   - inizio_esercizio    (Inizio esercizio, formato GG/MM)
   - data_ultimo_bilancio_approvato (Data ultimo bilancio approvato)

 Non aggiunge una colonna "sede legale" testuale: esiste gia' un'entita'
 autorevole per le sedi (ana_sedi, 015). Il campo "Sede legale" del catalogo
 e' quindi costruito a runtime dalla relazione esistente (vedi
 app/core/registro_campi.py, _sede_legale_di), non duplicato qui, come
 richiesto esplicitamente dalla specifica (§16.1/§29.1: "non duplicare
 automaticamente" quando un'entita' indirizzo/sede e' gia' presente).

 Non aggiunge una colonna lock_version: il modulo usa gia' updated_at come
 ancora di concorrenza ottimistica per l'intera sezione (header If-Match in
 app/api/anagrafica_registry.py, precedente a questa migrazione) con
 risoluzione al microsecondo lato Postgres, equivalente funzionale del
 lock_version suggerito dalla specifica per lo stesso scopo.

 Le colonne legacy non riprese nel catalogo finale (camera_commercio_competente,
 ufficio_registro_imprese, data_inizio_attivita, data_ultimo_protocollo) NON
 vengono rimosse (§28.2): restano disponibili per usi futuri, solo escluse
 dal catalogo campi in app/core/registro_campi.py.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_identificazione_camerale
    ADD COLUMN IF NOT EXISTS numero_iscrizione VARCHAR(50),
    ADD COLUMN IF NOT EXISTS data_iscrizione DATE,
    ADD COLUMN IF NOT EXISTS termine_esercizio CHAR(5),
    ADD COLUMN IF NOT EXISTS inizio_esercizio CHAR(5),
    ADD COLUMN IF NOT EXISTS data_ultimo_bilancio_approvato DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_identificazione_termine_esercizio'
    ) THEN
        ALTER TABLE ana_identificazione_camerale
            ADD CONSTRAINT chk_ana_identificazione_termine_esercizio
            CHECK (
                termine_esercizio IS NULL
                OR termine_esercizio ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_identificazione_inizio_esercizio'
    ) THEN
        ALTER TABLE ana_identificazione_camerale
            ADD CONSTRAINT chk_ana_identificazione_inizio_esercizio
            CHECK (
                inizio_esercizio IS NULL
                OR inizio_esercizio ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
            );
    END IF;
END $$;

COMMIT;
