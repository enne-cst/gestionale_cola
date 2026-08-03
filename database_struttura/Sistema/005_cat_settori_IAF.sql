
-- =======================================================
-- CATALOGO SETTORI IAF
-- =======================================================

CREATE TABLE IF NOT EXISTS cat_settori_iaf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(100) NOT NULL UNIQUE,

    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_settori_iaf (nome)
VALUES ('IAF 28')
ON CONFLICT (nome) DO NOTHING;

