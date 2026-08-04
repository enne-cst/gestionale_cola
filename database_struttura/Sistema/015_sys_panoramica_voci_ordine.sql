-- =======================================================
-- SISTEMA - VOCI IN PANORAMICA: ORDINE PERSONALIZZABILE
-- =======================================================
-- Estende sys_panoramica_voci (013, 014) con l'ordine di visualizzazione
-- scelto dall'utente nella scheda Panoramica. Le voci esistenti restano a
-- 0 (pari merito): l'ordinamento per (ordine, created_at) le mostra
-- comunque nell'ordine in cui erano gia' visualizzate finche' l'utente non
-- le riordina esplicitamente, momento in cui ricevono valori distinti.

ALTER TABLE sys_panoramica_voci
    ADD COLUMN IF NOT EXISTS ordine INTEGER NOT NULL DEFAULT 0;
