
-- =======================================================
-- AZIENDE REGISTRATE ALLA PIATTAFORMA
-- =======================================================

CREATE TABLE IF NOT EXISTS sys_aziende (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ragione_sociale VARCHAR(255) NOT NULL,

    partita_iva VARCHAR(11),

    codice_fiscale VARCHAR(16),

    email_registrazione VARCHAR(255) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sys_aziende_identificativo_fiscale
        CHECK (
            partita_iva IS NOT NULL
            OR codice_fiscale IS NOT NULL
        )
);

