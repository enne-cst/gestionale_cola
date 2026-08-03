
-- =======================================================
-- ANAGRAFICA AZIENDALE - CONTATTI
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_contatti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    tipo_contatto VARCHAR(100) NOT NULL,

    valore VARCHAR(255) NOT NULL,

    descrizione VARCHAR(255),

    principale BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_contatti_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_contatti
        UNIQUE (
            azienda_id,
            tipo_contatto,
            valore
        )
);