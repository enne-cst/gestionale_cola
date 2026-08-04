-- =======================================================
-- SISTEMA - VOCI IN PANORAMICA: SUPPORTO A INTERI RECORD
-- =======================================================
-- Estende sys_panoramica_voci (013) per permettere di fissare in Panoramica
-- non solo un campo di una sezione "singleton" (un record per azienda),
-- ma anche un intero record di una sezione a elenco (es. una singola sede,
-- un singolo contatto): in quel caso indicare un campo non avrebbe senso,
-- perche' l'elenco puo' contenere piu' record. Il record viene identificato
-- da record_id invece che da un nome di campo.
--
-- campo diventa opzionale (valorizzato solo per i campi delle sezioni
-- singleton), record_id e' il suo corrispettivo per le sezioni a elenco. I
-- due usi si escludono a vicenda: un semplice UNIQUE su colonne nullable
-- non impedirebbe duplicati quando la colonna e' NULL in piu' righe, quindi
-- ciascun uso ha il proprio indice univoco parziale.

ALTER TABLE sys_panoramica_voci
    ALTER COLUMN campo DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS record_id UUID NULL;

ALTER TABLE sys_panoramica_voci
    DROP CONSTRAINT IF EXISTS uq_sys_panoramica_voci;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sys_panoramica_voci_campo
    ON sys_panoramica_voci (azienda_id, modulo, sezione_slug, campo)
    WHERE campo IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sys_panoramica_voci_record
    ON sys_panoramica_voci (azienda_id, modulo, sezione_slug, record_id)
    WHERE record_id IS NOT NULL;
