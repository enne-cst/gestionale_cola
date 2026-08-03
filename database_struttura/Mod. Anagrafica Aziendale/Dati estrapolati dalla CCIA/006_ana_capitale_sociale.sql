
-- =======================================================
-- ANAGRAFICA AZIENDALE - CAPITALE SOCIALE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_capitale_sociale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    valuta VARCHAR(3),

    capitale_deliberato NUMERIC(15,2),
    capitale_sottoscritto NUMERIC(15,2),
    capitale_versato NUMERIC(15,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_capitale_sociale_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_capitale_sociale_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_capitale_sociale_importi
        CHECK (
            capitale_deliberato IS NULL
            OR capitale_deliberato >= 0
        ),

    CONSTRAINT chk_ana_capitale_sottoscritto_importi
        CHECK (
            capitale_sottoscritto IS NULL
            OR capitale_sottoscritto >= 0
        ),

    CONSTRAINT chk_ana_capitale_versato_importi
        CHECK (
            capitale_versato IS NULL
            OR capitale_versato >= 0
        )
);
