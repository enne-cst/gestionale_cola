
-- =======================================================
-- ANAGRAFICA AZIENDALE - ATTESTAZIONI SOA
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_soa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    numero_attestazione VARCHAR(100),

    organismo_denominazione VARCHAR(255),
    organismo_codice_identificativo VARCHAR(50),

    data_rilascio DATE,
    data_scadenza DATE,

    regolamento VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_soa_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_soa_attestazione
        UNIQUE (
            azienda_id,
            numero_attestazione
        ),

    CONSTRAINT chk_ana_soa_date
        CHECK (
            data_scadenza IS NULL
            OR data_rilascio IS NULL
            OR data_scadenza >= data_rilascio
        )
);

-- =======================================================
-- ANAGRAFICA AZIENDALE - CATEGORIE DELLE ATTESTAZIONI SOA
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_soa_categorie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    soa_id UUID NOT NULL,

    categoria VARCHAR(20) NOT NULL,
    descrizione TEXT,

    classifica VARCHAR(20),
    limite_economico NUMERIC(15,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_soa_categorie_soa
        FOREIGN KEY (soa_id)
        REFERENCES ana_soa(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_soa_categoria
        UNIQUE (
            soa_id,
            categoria
        ),

    CONSTRAINT chk_ana_soa_limite
        CHECK (
            limite_economico IS NULL
            OR limite_economico >= 0
        )
);
