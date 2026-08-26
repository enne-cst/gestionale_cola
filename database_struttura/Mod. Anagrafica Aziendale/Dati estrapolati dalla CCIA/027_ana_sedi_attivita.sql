
-- =======================================================
-- ANAGRAFICA AZIENDALE - ATTIVITA' ESERCITATE PRESSO L'UNITA'
-- =======================================================
-- Tabella ripetibile per unità locale (mappatura CCIAA §10.2, blocco
-- "Attività esercitate presso l'unità"). Distinta da ana_attivita_esercitata
-- (attività dell'intera impresa) e da ana_codici_ateco (classificazioni):
-- qui vive solo la descrizione testuale dell'attività svolta in una
-- specifica unità, con il proprio periodo di validità.

CREATE TABLE IF NOT EXISTS ana_sedi_attivita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sede_id UUID NOT NULL,

    descrizione_attivita TEXT NOT NULL,

    data_inizio DATE,
    data_fine DATE,

    ruolo_importanza VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_sedi_attivita_sede
        FOREIGN KEY (sede_id)
        REFERENCES ana_sedi(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ana_sedi_attivita_date
        CHECK (
            data_fine IS NULL
            OR data_inizio IS NULL
            OR data_fine >= data_inizio
        )
);

CREATE INDEX IF NOT EXISTS idx_ana_sedi_attivita_sede
    ON ana_sedi_attivita (sede_id);
