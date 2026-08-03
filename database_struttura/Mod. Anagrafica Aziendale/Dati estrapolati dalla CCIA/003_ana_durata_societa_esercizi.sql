
-- =======================================================
-- ANAGRAFICA AZIENDALE - DURATA SOCIETÀ ED ESERCIZI
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_durata_societa_esercizi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    data_termine_societa DATE,

    scadenza_primo_esercizio DATE,

    scadenza_esercizi_successivi VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_durata_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_durata_azienda
        UNIQUE (azienda_id)
);
