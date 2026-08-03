
-- =======================================================
-- ANAGRAFICA AZIENDALE - ISCRIZIONI REGISTRO IMPRESE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_iscrizioni_registro_imprese (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    tipo_iscrizione VARCHAR(150),
    sezione VARCHAR(150),
    data_iscrizione DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_iscrizioni_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
);
