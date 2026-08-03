
-- =======================================================
-- ANAGRAFICA AZIENDALE - CODICI ATECO
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_codici_ateco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    codice VARCHAR(20) NOT NULL,
    descrizione TEXT,

    classificazione VARCHAR(100),

    ruolo_codice VARCHAR(100),

    origine_codice VARCHAR(150),

    fonte VARCHAR(150),

    codice_nace VARCHAR(20),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_codici_ateco_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_codici_ateco
        UNIQUE (
            azienda_id,
            codice,
            classificazione,
            ruolo_codice,
            origine_codice
        )
);
