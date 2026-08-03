

-- =======================================================
-- CATALOGO MODULI
-- =======================================================

CREATE TABLE IF NOT EXISTS cat_moduli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(100) NOT NULL UNIQUE,

    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    base BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_moduli (
    nome,
    base
)
VALUES
    ('Anagrafica Aziendale', TRUE),
    ('Personale', FALSE),
    ('Scadenziario Generale', TRUE),
    ('Piano Formativo', FALSE),
    ('Piano di Manutenzione', FALSE),
    ('Piano di Miglioramento', FALSE),
    ('Cantieri', FALSE)
ON CONFLICT (nome) DO NOTHING;
