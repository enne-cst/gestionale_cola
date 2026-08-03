

-- =======================================================
-- ANAGRAFICA AZIENDALE - RILEVAZIONI ADDETTI DA VISURA
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_addetti_visura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    fonte VARCHAR(100),
    anno_riferimento INTEGER,
    data_rilevazione DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_addetti_visura_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_addetti_visura_rilevazione
        UNIQUE (
            azienda_id,
            fonte,
            anno_riferimento,
            data_rilevazione
        ),

    CONSTRAINT chk_ana_addetti_visura_anno
        CHECK (
            anno_riferimento IS NULL
            OR anno_riferimento >= 1900
        )
);

-- =======================================================
-- ANAGRAFICA AZIENDALE - PERIODI DELLE RILEVAZIONI ADDETTI
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_addetti_visura_periodi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rilevazione_addetti_id UUID NOT NULL,

    periodo VARCHAR(20) NOT NULL,

    numero_dipendenti INTEGER,
    numero_indipendenti INTEGER,
    numero_collaboratori INTEGER,
    numero_totale_addetti INTEGER,

    percentuale_tempo_determinato NUMERIC(5,2),
    percentuale_tempo_indeterminato NUMERIC(5,2),

    percentuale_tempo_pieno NUMERIC(5,2),
    percentuale_tempo_parziale NUMERIC(5,2),

    percentuale_operai NUMERIC(5,2),
    percentuale_impiegati NUMERIC(5,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_addetti_periodi_rilevazione
        FOREIGN KEY (rilevazione_addetti_id)
        REFERENCES ana_addetti_visura(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ana_addetti_periodo
        CHECK (
            periodo IN (
                'PRIMO_TRIMESTRE',
                'SECONDO_TRIMESTRE',
                'TERZO_TRIMESTRE',
                'QUARTO_TRIMESTRE',
                'MEDIA'
            )
        ),

    CONSTRAINT chk_ana_addetti_numeri
        CHECK (
            (numero_dipendenti IS NULL OR numero_dipendenti >= 0)
            AND
            (numero_indipendenti IS NULL OR numero_indipendenti >= 0)
            AND
            (numero_collaboratori IS NULL OR numero_collaboratori >= 0)
            AND
            (numero_totale_addetti IS NULL OR numero_totale_addetti >= 0)
        ),

    CONSTRAINT chk_ana_addetti_percentuali
        CHECK (
            (percentuale_tempo_determinato IS NULL
                OR percentuale_tempo_determinato BETWEEN 0 AND 100)
            AND
            (percentuale_tempo_indeterminato IS NULL
                OR percentuale_tempo_indeterminato BETWEEN 0 AND 100)
            AND
            (percentuale_tempo_pieno IS NULL
                OR percentuale_tempo_pieno BETWEEN 0 AND 100)
            AND
            (percentuale_tempo_parziale IS NULL
                OR percentuale_tempo_parziale BETWEEN 0 AND 100)
            AND
            (percentuale_operai IS NULL
                OR percentuale_operai BETWEEN 0 AND 100)
            AND
            (percentuale_impiegati IS NULL
                OR percentuale_impiegati BETWEEN 0 AND 100)
        ),

    CONSTRAINT uq_ana_addetti_visura_periodo
        UNIQUE (
            rilevazione_addetti_id,
            periodo
        )
);
