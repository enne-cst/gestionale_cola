
-- =======================================================
-- MODULO PERSONE - ANAGRAFICA PERSONE
-- =======================================================

CREATE TABLE IF NOT EXISTS per_persone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    categoria VARCHAR(50) NOT NULL,

    nominativo VARCHAR(255) NOT NULL,
    codice_fiscale VARCHAR(16),

    data_nascita DATE,
    comune_nascita VARCHAR(150),
    provincia_nascita VARCHAR(5),

    comune_domicilio VARCHAR(150),
    provincia_domicilio VARCHAR(5),
    indirizzo_domicilio VARCHAR(255),
    cap_domicilio VARCHAR(10),
    frazione_domicilio VARCHAR(150),

    pec VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_per_persone_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_per_persone_azienda_codice_fiscale
        UNIQUE (azienda_id, codice_fiscale)
);
