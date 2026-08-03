
-- =======================================================
-- ANAGRAFICA AZIENDALE - SEDI
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_sedi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    tipo_sede VARCHAR(100) NOT NULL,

    numero_unita_locale VARCHAR(50),

    denominazione_sede VARCHAR(255),

    data_apertura DATE,

    indirizzo VARCHAR(255),
    numero_civico VARCHAR(20),
    cap VARCHAR(10),

    comune VARCHAR(150),
    provincia VARCHAR(5),
    frazione VARCHAR(150),

    nazione VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_sedi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_sedi_unita_locale
        UNIQUE (
            azienda_id,
            numero_unita_locale
        )
);