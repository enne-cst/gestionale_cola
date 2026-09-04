-- =======================================================================
-- MODULO PERSONALE (rev2) - VALORIZZAZIONE AMBITO DEI 35 RUOLI ESISTENTI
-- =======================================================================
--
-- Popola cat_ruoli.ambito (aggiunta nullable dalla migrazione 010) per
-- tutti i ruoli della configurazione iniziale. Mappatura proposta e
-- approvata dall'utente il 2026-09-03, basata sulla descrizione di
-- ciascun ruolo e, dove disponibile, coerente con le certificazioni
-- ISO/IAF già associate al ruolo in rel_elementi_certificazioni (i ruoli
-- taggati solo ISO_45001 -> SICUREZZA; solo ISO_9001 -> QUALITA; solo
-- ISO_14001 -> AMBIENTE; i ruoli societari/di vertice, taggati su tutte e
-- tre -> GOVERNANCE).
--
-- Casi non immediati:
-- - RGI e Auditor Interno attraversano più standard per definizione (non
--   un singolo ambito) -> ORGANIZZAZIONE, non QUALITA.
-- - Responsabile Security/Cyber Security/Capocantiere/Logistica: funzioni
--   di coordinamento trasversale, non legate a un singolo standard ISO
--   nonostante il tag di certificazione presente -> ORGANIZZAZIONE.
-- - Responsabile Whistleblowing: meccanismo di compliance/governance, non
--   operativo -> GOVERNANCE, non ORGANIZZAZIONE.
-- - Responsabile Tecnico FER: tecnico ma sul dominio delle fonti
--   rinnovabili -> AMBIENTE, non QUALITA.
-- - Operaio: ruolo generico non legato a un dominio normativo specifico
--   -> ALTRO.
--
-- Eventuali ruoli aggiunti in futuro al catalogo restano NULL finché non
-- classificati esplicitamente (nessun default implicito).


UPDATE cat_ruoli SET ambito = v.ambito
FROM (VALUES
    ('LEGALE_RAPPRESENTANTE', 'GOVERNANCE'),
    ('AMMINISTRATORE', 'GOVERNANCE'),
    ('PROCURATORE', 'GOVERNANCE'),
    ('AMMINISTRATORE_DELEGATO', 'GOVERNANCE'),
    ('COMPONENTE_CDA', 'GOVERNANCE'),
    ('SINDACO', 'GOVERNANCE'),
    ('REVISORE_LEGALE', 'GOVERNANCE'),
    ('SOCIO', 'GOVERNANCE'),
    ('RESPONSABILE_WHISTLEBLOWING', 'GOVERNANCE'),

    ('DATORE_LAVORO', 'SICUREZZA'),
    ('DIRIGENTE', 'SICUREZZA'),
    ('RSPP', 'SICUREZZA'),
    ('ASPP', 'SICUREZZA'),
    ('RLS', 'SICUREZZA'),
    ('PREPOSTO', 'SICUREZZA'),
    ('ADDETTO_ANTINCENDIO', 'SICUREZZA'),
    ('ADDETTO_PRIMO_SOCCORSO', 'SICUREZZA'),
    ('MEDICO_COMPETENTE', 'SICUREZZA'),
    ('PES', 'SICUREZZA'),
    ('PAV', 'SICUREZZA'),
    ('PEI', 'SICUREZZA'),
    ('DGSA', 'SICUREZZA'),

    ('RGQ', 'QUALITA'),
    ('DIRETTORE_TECNICO_SOA', 'QUALITA'),
    ('RESPONSABILE_TECNICO_OFFICINA', 'QUALITA'),

    ('RESPONSABILE_RENTRI', 'AMBIENTE'),
    ('RESPONSABILE_AMBIENTALE', 'AMBIENTE'),
    ('RESPONSABILE_FER', 'AMBIENTE'),

    ('RGI', 'ORGANIZZAZIONE'),
    ('AUDITOR_INTERNO', 'ORGANIZZAZIONE'),
    ('RESPONSABILE_SECURITY', 'ORGANIZZAZIONE'),
    ('RESPONSABILE_CYBER_SECURITY', 'ORGANIZZAZIONE'),
    ('CAPOCANTIERE', 'ORGANIZZAZIONE'),
    ('RESPONSABILE_LOGISTICA', 'ORGANIZZAZIONE'),

    ('OPERAIO', 'ALTRO')
) AS v(codice, ambito)
WHERE cat_ruoli.codice = v.codice;
