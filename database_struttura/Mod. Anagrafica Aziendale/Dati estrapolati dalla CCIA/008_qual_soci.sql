-- =======================================================
-- QUALIFICHE - SOCI
-- =======================================================

CREATE TABLE IF NOT EXISTS qual_soci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    -- Valorizzato quando il socio è una persona fisica
    persona_id UUID,

    tipo_soggetto VARCHAR(20) NOT NULL,

    -- Usati quando il socio è una società o un ente
    denominazione_organizzazione VARCHAR(255),
    codice_fiscale_organizzazione VARCHAR(16),

    comune_domicilio VARCHAR(150),
    provincia_domicilio VARCHAR(5),
    indirizzo_domicilio VARCHAR(255),
    cap_domicilio VARCHAR(10),

    tipo_diritto VARCHAR(100),

    quota_nominale NUMERIC(15,2),
    quota_versata NUMERIC(15,2),
    percentuale_partecipazione NUMERIC(7,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_qual_soci_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_qual_soci_persona
        FOREIGN KEY (persona_id)
        REFERENCES per_persone(id),

    CONSTRAINT chk_qual_soci_tipo_soggetto
        CHECK (
            tipo_soggetto IN (
                'PERSONA',
                'ORGANIZZAZIONE'
            )
        ),

    CONSTRAINT chk_qual_soci_identificazione
        CHECK (
            (
                tipo_soggetto = 'PERSONA'
                AND persona_id IS NOT NULL
                AND denominazione_organizzazione IS NULL
            )
            OR
            (
                tipo_soggetto = 'ORGANIZZAZIONE'
                AND persona_id IS NULL
                AND denominazione_organizzazione IS NOT NULL
            )
        ),

    CONSTRAINT chk_qual_soci_quote
        CHECK (
            (quota_nominale IS NULL OR quota_nominale >= 0)
            AND
            (quota_versata IS NULL OR quota_versata >= 0)
            AND
            (
                percentuale_partecipazione IS NULL
                OR percentuale_partecipazione BETWEEN 0 AND 100
            )
        )
);

-- =======================================================
-- QUALIFICHE - DATI GENERALI ELENCO SOCI
-- =======================================================

CREATE TABLE IF NOT EXISTS qual_elenco_soci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    numero_soci INTEGER,
    data_riferimento DATE,

    numero_complessivo_soci INTEGER,

    capitale_sociale_dichiarato NUMERIC(15,2),
    valuta VARCHAR(3),

    data_deposito_pratica DATE,
    data_protocollo DATE,
    numero_protocollo VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_qual_elenco_soci_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_qual_elenco_soci_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_qual_elenco_soci_numeri
        CHECK (
            (numero_soci IS NULL OR numero_soci >= 0)
            AND
            (
                numero_complessivo_soci IS NULL
                OR numero_complessivo_soci >= 0
            )
        ),

    CONSTRAINT chk_qual_elenco_soci_capitale
        CHECK (
            capitale_sociale_dichiarato IS NULL
            OR capitale_sociale_dichiarato >= 0
        )
);
