
-- **********************************************************************************
-- **********************************************************************************
-- MODULO ANAGRAFICA AZIENDALE
-- da qui in poi verranno sviluppate le varie sezioni del modulo anagrafica aziendale
-- **********************************************************************************
-- **********************************************************************************


-- =======================================================
-- ANAGRAFICA AZIENDALE - IDENTIFICAZIONE CAMERALE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_identificazione_camerale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    ragione_sociale VARCHAR(255),
    forma_giuridica VARCHAR(150),
    codice_fiscale VARCHAR(16),
    partita_iva VARCHAR(11),

    camera_commercio_competente VARCHAR(150),
    ufficio_registro_imprese VARCHAR(150),

    numero_rea VARCHAR(30),
    provincia_rea VARCHAR(5),

    stato_attivita VARCHAR(100),

    data_atto_costitutivo DATE,
    data_inizio_attivita DATE,
    data_ultimo_protocollo DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_identificazione_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_identificazione_azienda
        UNIQUE (azienda_id)
);
