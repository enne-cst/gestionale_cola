
-- =======================================================
-- CATALOGO STATI CERTIFICAZIONE AZIENDALE
-- =======================================================

CREATE TABLE IF NOT EXISTS cat_stati_certificazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(50) NOT NULL UNIQUE,

    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_stati_certificazione (nome)
VALUES
    ('PROVA'),
    ('ATTIVA'),
    ('SCADUTA'),
    ('DISATTIVATA')
ON CONFLICT (nome) DO NOTHING;

