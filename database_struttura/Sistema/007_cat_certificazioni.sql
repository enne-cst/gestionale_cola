
-- =======================================================
-- CATALOGO CERTIFICAZIONI
-- =======================================================

CREATE TABLE IF NOT EXISTS cat_certificazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(100) NOT NULL UNIQUE,

    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_certificazioni (
    nome
)
VALUES
    ('ISO 9001'),
    ('ISO 14001'),
    ('ISO 45001')
ON CONFLICT (nome) DO NOTHING;

