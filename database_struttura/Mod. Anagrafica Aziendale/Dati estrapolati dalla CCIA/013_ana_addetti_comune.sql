
-- =======================================================
-- ANAGRAFICA AZIENDALE - ADDETTI PER COMUNE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_addetti_comune (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    rilevazione_addetti_id UUID,

    comune VARCHAR(150) NOT NULL,
    provincia VARCHAR(5),

    numero_sedi_unita_locali INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_addetti_comune_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_ana_addetti_comune_rilevazione
        FOREIGN KEY (rilevazione_addetti_id)
        REFERENCES ana_addetti_visura(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ana_addetti_comune_sedi
        CHECK (
            numero_sedi_unita_locali IS NULL
            OR numero_sedi_unita_locali >= 0
        ),

    CONSTRAINT uq_ana_addetti_comune
        UNIQUE (
            rilevazione_addetti_id,
            comune,
            provincia
        )
);

-- =======================================================
-- ANAGRAFICA AZIENDALE - PERIODI ADDETTI PER COMUNE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_addetti_comune_periodi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    addetti_comune_id UUID NOT NULL,

    periodo VARCHAR(20) NOT NULL,

    numero_dipendenti INTEGER,
    numero_indipendenti INTEGER,
    numero_totale_addetti INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_addetti_comune_periodi
        FOREIGN KEY (addetti_comune_id)
        REFERENCES ana_addetti_comune(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ana_addetti_comune_periodo
        CHECK (
            periodo IN (
                'PRIMO_TRIMESTRE',
                'SECONDO_TRIMESTRE',
                'TERZO_TRIMESTRE',
                'QUARTO_TRIMESTRE',
                'MEDIA'
            )
        ),

    CONSTRAINT chk_ana_addetti_comune_numeri
        CHECK (
            (numero_dipendenti IS NULL OR numero_dipendenti >= 0)
            AND
            (numero_indipendenti IS NULL OR numero_indipendenti >= 0)
            AND
            (numero_totale_addetti IS NULL OR numero_totale_addetti >= 0)
        ),

    CONSTRAINT uq_ana_addetti_comune_periodo
        UNIQUE (
            addetti_comune_id,
            periodo
        )
);

