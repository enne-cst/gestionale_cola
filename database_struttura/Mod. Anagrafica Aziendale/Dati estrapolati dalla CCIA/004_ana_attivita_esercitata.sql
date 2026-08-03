
-- =======================================================
-- ANAGRAFICA AZIENDALE - ATTIVITÀ ESERCITATA
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_attivita_esercitata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    descrizione_attivita_esercitata TEXT,

    data_decorrenza_attivita DATE,

    presenza_attivita_import_export BOOLEAN,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_attivita_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_attivita_azienda
        UNIQUE (azienda_id)
);
