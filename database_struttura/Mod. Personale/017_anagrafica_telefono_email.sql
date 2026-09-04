-- =======================================================================
-- MODULO PERSONALE (rev2) - TELEFONO ED EMAIL SU ana_persone
-- =======================================================================
--
-- Gap trovato costruendo la card "Dati essenziali" della scheda persona
-- (SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE §12.1): telefono ed email
-- sono campi "sempre visibili" (non nel Dossier collassato), ma
-- ana_persone (migrazione 001) non li ha mai avuti. Aggiunti come
-- colonne dirette, nullable, additive — nessun impatto sulle righe
-- esistenti né sul motore CCIAA che usa la stessa tabella.
--
-- Il resto del Dossier personale (residenza/domicilio strutturati,
-- contatti di emergenza, lingua e comprensione, documenti personali)
-- resta fuori da questa migrazione: sono campi del blocco collassato,
-- non richiesti per costruire la card sempre visibile — proposta a parte
-- quando si arriva a costruire quel blocco.


ALTER TABLE ana_persone
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

COMMENT ON COLUMN ana_persone.telefono IS
    'Telefono della persona (modulo Personale §12.1, campo sempre visibile, facoltativo).';

COMMENT ON COLUMN ana_persone.email IS
    'Email della persona (modulo Personale §12.1, campo sempre visibile, facoltativo, validato lato applicativo).';
