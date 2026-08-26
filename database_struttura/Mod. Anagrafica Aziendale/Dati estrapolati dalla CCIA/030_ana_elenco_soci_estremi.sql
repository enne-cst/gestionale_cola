
-- =======================================================
-- ANAGRAFICA AZIENDALE - ESTREMI DELL'ELENCO SOCI
-- =======================================================
-- Dato di testata dell'intero elenco soci depositato (mappatura CCIAA
-- §4.2), 1:1 con l'azienda come ana_capitale_sociale: non è un dato del
-- singolo socio (quello vive in per_incarichi/per_incarichi_valori, ruolo
-- SOCIO), ma la data/protocollo/capitale dichiarati per l'elenco nel suo
-- complesso.

CREATE TABLE IF NOT EXISTS ana_elenco_soci_estremi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    data_riferimento DATE,
    data_atto DATE,
    data_deposito DATE,
    data_protocollo DATE,
    numero_protocollo VARCHAR(50),

    capitale_sociale_dichiarato NUMERIC(15,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_elenco_soci_estremi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_elenco_soci_estremi_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_elenco_soci_estremi_capitale
        CHECK (
            capitale_sociale_dichiarato IS NULL
            OR capitale_sociale_dichiarato >= 0
        )
);
