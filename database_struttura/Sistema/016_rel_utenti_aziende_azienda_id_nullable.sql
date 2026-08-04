
-- =======================================================
-- RELAZIONE UTENTI - AZIENDE: azienda_id opzionale per i ruoli
-- non legati a una singola azienda (Consulente, Super Admin)
-- =======================================================

ALTER TABLE rel_utenti_aziende
    ALTER COLUMN azienda_id DROP NOT NULL;
