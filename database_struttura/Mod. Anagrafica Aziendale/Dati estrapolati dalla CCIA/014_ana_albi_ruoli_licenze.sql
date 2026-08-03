
-- =======================================================
-- ANAGRAFICA AZIENDALE - ALBI, RUOLI E LICENZE
-- =======================================================

CREATE TABLE IF NOT EXISTS ana_albi_ruoli_licenze (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    tipologia VARCHAR(255) NOT NULL,

    numero_iscrizione VARCHAR(100),
    provincia VARCHAR(5),
    sezione VARCHAR(150),

    categoria VARCHAR(100),
    descrizione_categoria TEXT,
    classe VARCHAR(100),

    data_domanda_accertamento DATE,
    data_delibera DATE,

    data_inizio DATE,
    data_scadenza DATE,

    stato VARCHAR(100),
    motivo_cancellazione TEXT,

    data_comunicazione DATE,
    data_cessazione DATE,
    data_caricamento DATE,

    fonte VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_albi_ruoli_licenze_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT chk_ana_albi_ruoli_licenze_date
        CHECK (
            data_scadenza IS NULL
            OR data_inizio IS NULL
            OR data_scadenza >= data_inizio
        ),

    CONSTRAINT uq_ana_albi_ruoli_licenze
        UNIQUE (
            azienda_id,
            tipologia,
            numero_iscrizione,
            categoria
        )
);
