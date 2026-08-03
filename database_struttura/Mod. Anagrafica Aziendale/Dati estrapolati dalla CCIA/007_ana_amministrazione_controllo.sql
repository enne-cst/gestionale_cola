
-- =======================================================
-- ANAGRAFICA AZIENDALE - AMMINISTRAZIONE E CONTROLLO
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_amministrazione_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    organo_amministrativo_in_carica VARCHAR(255),

    numero_minimo_amministratori INTEGER,
    numero_amministratori_in_carica INTEGER,

    durata_in_carica_organo VARCHAR(255),

    numero_sindaci_organi_controllo INTEGER,
    numero_titolari_cariche INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_amministrazione_controllo_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_amministrazione_controllo_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_amministrazione_controllo_numeri
        CHECK (
            (
                numero_minimo_amministratori IS NULL
                OR numero_minimo_amministratori >= 0
            )
            AND
            (
                numero_amministratori_in_carica IS NULL
                OR numero_amministratori_in_carica >= 0
            )
            AND
            (
                numero_sindaci_organi_controllo IS NULL
                OR numero_sindaci_organi_controllo >= 0
            )
            AND
            (
                numero_titolari_cariche IS NULL
                OR numero_titolari_cariche >= 0
            )
        )
);

-- =======================================================
-- ANAGRAFICA AZIENDALE - SISTEMI DI AMMINISTRAZIONE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_sistemi_amministrazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    amministrazione_controllo_id UUID NOT NULL,

    sistema_amministrazione VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_sistemi_amministrazione
        FOREIGN KEY (amministrazione_controllo_id)
        REFERENCES ana_amministrazione_controllo(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_ana_sistema_amministrazione
        UNIQUE (
            amministrazione_controllo_id,
            sistema_amministrazione
        )
);
