
-- =======================================================
-- ANAGRAFICA AZIENDALE - CERTIFICAZIONI POSSEDUTE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_certificazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    -- Collegamento al catalogo, quando la certificazione è riconosciuta
    certificazione_id UUID,

    tipologia_certificazione VARCHAR(255),
    sigla VARCHAR(50),
    norma_riferimento VARCHAR(150),

    numero_certificato VARCHAR(100),

    data_prima_emissione DATE,

    organismo_certificatore VARCHAR(255),
    codice_fiscale_organismo VARCHAR(16),

    fonte VARCHAR(100),
    data_ultimo_aggiornamento DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_certificazioni_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_ana_certificazioni_catalogo
        FOREIGN KEY (certificazione_id)
        REFERENCES cat_certificazioni(id),

    CONSTRAINT uq_ana_certificazioni_certificato
        UNIQUE (
            azienda_id,
            numero_certificato
        )
);

-- =======================================================
-- ANAGRAFICA AZIENDALE - SETTORI IAF DELLE CERTIFICAZIONI
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_certificazioni_settori_iaf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    certificazione_azienda_id UUID NOT NULL,

    -- Collegamento al catalogo, quando il settore è riconosciuto
    settore_iaf_id UUID,

    codice_iaf VARCHAR(20),
    descrizione_iaf VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_certificazioni_iaf_certificazione
        FOREIGN KEY (certificazione_azienda_id)
        REFERENCES ana_certificazioni(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_certificazioni_iaf_catalogo
        FOREIGN KEY (settore_iaf_id)
        REFERENCES cat_settori_iaf(id),

    CONSTRAINT uq_ana_certificazioni_settore
        UNIQUE (
            certificazione_azienda_id,
            codice_iaf
        )
);
