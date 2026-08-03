/*
===========================================================
WEBBAPP
Database iniziale
Versione: 0.1
Autore: Edoardo Costa
===========================================================
*/

-- =======================================================
-- ESTENSIONI
-- =======================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================================================
-- SISTEMA PROFILI UTENTE
-- =======================================================

CREATE TABLE IF NOT EXISTS sys_profili (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descrizione TEXT,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sys_profili (
    codice,
    nome,
    descrizione
)
VALUES
    (
        'SUPERADMIN',
        'Amministratore',
        'Gestisce l’intera piattaforma.'
    ),
    (
        'CONSULENTE',
        'Consulente',
        'Accede e gestisce le aziende assegnate.'
    ),
    (
        'AZIENDA_ADMIN',
        'Amministratore aziendale',
        'Gestisce gli utenti e le impostazioni della propria azienda.'
    ),
    (
        'OPERATORE',
        'Utente aziendale',
        'Accede alle aziende alle quali è associato.'
    )
ON CONFLICT (codice) DO NOTHING;

