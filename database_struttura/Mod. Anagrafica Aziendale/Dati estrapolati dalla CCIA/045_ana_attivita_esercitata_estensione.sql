/*
===============================================================================
 MIGRAZIONE 045 - ATTIVITA' ECONOMICA: ESTENSIONE DI ana_attivita_esercitata
===============================================================================

 Scopo
 -----
 Correzione 19 (prima parte, card "Attività, albi, ruoli e licenze"): la
 sezione "Attività economica" richiesta dall'utente è, per struttura, la
 stessa cosa già rappresentata da ana_attivita_esercitata (migrazione 004,
 §CLAUDE.md "convenzione obbligatoria") — un solo record corrente per
 azienda con la situazione generale e attuale dell'attività aziendale.
 Prima di creare una nuova tabella "ana_attivita_economica_azienda" come
 indicativamente suggerito, si è verificato che la tabella esistente copre
 già 3 dei campi richiesti con semantica equivalente:

   - descrizione_attivita_esercitata  -> "Attività prevalente"
   - data_decorrenza_attivita         -> "Data inizio attività"
   - presenza_attivita_import_export  -> "Attività import-export"

 Questa migrazione ESTENDE quella tabella (ALTER TABLE, mai modificando la
 004 già applicata, §CLAUDE.md) invece di duplicarla, aggiungendo le colonne
 mancanti:

   - stato_attivita_id: catalogo (cat_stati_attivita, migrazione 026),
     nasce vuoto per scelta esplicita dell'utente.
   - attivita_sede_legale / data_inizio_attivita_sede: separati in due
     colonne distinte (mai un unico testo ricomposto), come richiesto
     esplicitamente — l'interfaccia ricompone il testo in lettura.
   - codice_ateco_2025_id / codice_atecori_id / codice_nace_2_1_id: catalogo
     versionato per ciascun sistema di classificazione (migrazioni
     027/028/029), mai testo libero. Rappresentano il codice PRINCIPALE
     mostrato in questa tabella; la gestione di eventuali codici multipli
     con indicatore di prevalenza resta demandata alla tabella ripetibile
     già esistente (ana_codici_ateco, migrazione 005) — fuori scopo per
     questa prima parte.
   - contratto_rete: booleano nullable (Sì/No/Non indicato).
   - albi_ruoli_licenze_presenti / registri_ambientali_presenti: booleani
     nullable riepilogativi (Sì/No/Non indicato); la coerenza con eventuali
     record di dettaglio (nessun "No" con albi/registri attivi) è
     responsabilità del backend, non del database.

 Nessun dato esistente viene toccato o rimosso.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_attivita_esercitata
    ADD COLUMN IF NOT EXISTS stato_attivita_id UUID,
    ADD COLUMN IF NOT EXISTS attivita_sede_legale TEXT,
    ADD COLUMN IF NOT EXISTS data_inizio_attivita_sede DATE,
    ADD COLUMN IF NOT EXISTS codice_ateco_2025_id UUID,
    ADD COLUMN IF NOT EXISTS codice_atecori_id UUID,
    ADD COLUMN IF NOT EXISTS codice_nace_2_1_id UUID,
    ADD COLUMN IF NOT EXISTS contratto_rete BOOLEAN,
    ADD COLUMN IF NOT EXISTS albi_ruoli_licenze_presenti BOOLEAN,
    ADD COLUMN IF NOT EXISTS registri_ambientali_presenti BOOLEAN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_attivita_esercitata_stato_attivita'
    ) THEN
        ALTER TABLE ana_attivita_esercitata
            ADD CONSTRAINT fk_ana_attivita_esercitata_stato_attivita
            FOREIGN KEY (stato_attivita_id)
            REFERENCES cat_stati_attivita(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_attivita_esercitata_codice_ateco_2025'
    ) THEN
        ALTER TABLE ana_attivita_esercitata
            ADD CONSTRAINT fk_ana_attivita_esercitata_codice_ateco_2025
            FOREIGN KEY (codice_ateco_2025_id)
            REFERENCES cat_codici_ateco_2025(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_attivita_esercitata_codice_atecori'
    ) THEN
        ALTER TABLE ana_attivita_esercitata
            ADD CONSTRAINT fk_ana_attivita_esercitata_codice_atecori
            FOREIGN KEY (codice_atecori_id)
            REFERENCES cat_codici_atecori(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ana_attivita_esercitata_codice_nace'
    ) THEN
        ALTER TABLE ana_attivita_esercitata
            ADD CONSTRAINT fk_ana_attivita_esercitata_codice_nace
            FOREIGN KEY (codice_nace_2_1_id)
            REFERENCES cat_codici_nace(id);
    END IF;
END $$;

COMMENT ON COLUMN ana_attivita_esercitata.stato_attivita_id IS
    'Stato dell''attività (catalogo cat_stati_attivita, oggi vuoto in attesa di analisi delle visure reali).';
COMMENT ON COLUMN ana_attivita_esercitata.attivita_sede_legale IS
    'Descrizione dell''attività esercitata presso la sede legale, separata dalla data (data_inizio_attivita_sede): l''interfaccia ricompone il testo unico del prototipo in lettura.';
COMMENT ON COLUMN ana_attivita_esercitata.data_inizio_attivita_sede IS
    'Data di inizio dell''attività indicata in attivita_sede_legale, separata dalla descrizione.';
COMMENT ON COLUMN ana_attivita_esercitata.codice_ateco_2025_id IS
    'Codice ATECO 2025 principale (catalogo cat_codici_ateco_2025). Eventuali codici multipli restano in ana_codici_ateco.';
COMMENT ON COLUMN ana_attivita_esercitata.codice_atecori_id IS
    'Codice ATECORI 2007-2022 principale (catalogo cat_codici_atecori).';
COMMENT ON COLUMN ana_attivita_esercitata.codice_nace_2_1_id IS
    'Codice NACE 2.1 principale (catalogo cat_codici_nace).';
COMMENT ON COLUMN ana_attivita_esercitata.albi_ruoli_licenze_presenti IS
    'Indicatore riepilogativo Sì/No/Non indicato: se Sì deve essere coerente con eventuali record di dettaglio negli albi/ruoli/licenze (nessun "No" con record attivi).';
COMMENT ON COLUMN ana_attivita_esercitata.registri_ambientali_presenti IS
    'Indicatore riepilogativo Sì/No/Non indicato: se Sì deve essere coerente con eventuali record di dettaglio nei registri ambientali (nessun "No" con record attivi).';

COMMIT;
