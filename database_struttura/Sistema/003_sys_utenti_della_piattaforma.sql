
-- =======================================================
-- UTENTI DELLA PIATTAFORMA
-- =======================================================

CREATE TABLE IF NOT EXISTS sys_utenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(100) NOT NULL,

    cognome VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    email_verificata BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
