
-- =======================================================
-- CERTIFICAZIONI ATTIVATE PER AZIENDA
-- =======================================================

CREATE TABLE IF NOT EXISTS sys_aziende_certificazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    certificazione_id UUID NOT NULL,

    stato_id UUID NOT NULL,

    data_attivazione DATE NOT NULL,

    data_scadenza DATE NOT NULL,

    rinnovo_automatico BOOLEAN NOT NULL DEFAULT TRUE,

    data_disattivazione DATE,

    data_cancellazione_prevista DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sac_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_sac_certificazione
        FOREIGN KEY (certificazione_id)
        REFERENCES cat_certificazioni(id),

    CONSTRAINT fk_sac_stato
        FOREIGN KEY (stato_id)
        REFERENCES cat_stati_certificazione(id),

    CONSTRAINT uq_sys_aziende_certificazioni
        UNIQUE (azienda_id, certificazione_id),

    CONSTRAINT chk_sac_date
        CHECK (data_scadenza >= data_attivazione),

    CONSTRAINT chk_sac_cancellazione
        CHECK (
            data_cancellazione_prevista IS NULL
            OR data_disattivazione IS NOT NULL
        )
);

