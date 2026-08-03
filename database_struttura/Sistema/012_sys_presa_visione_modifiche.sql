-- =======================================================
-- SISTEMA - PRESA VISIONE MODIFICHE
-- =======================================================

CREATE TABLE IF NOT EXISTS sys_presa_visione_modifiche (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    utente_id UUID NOT NULL,

    entita VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,

    modifica_vista_at TIMESTAMPTZ NOT NULL,
    presa_visione_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sys_presa_visione_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_sys_presa_visione_utente
        FOREIGN KEY (utente_id)
        REFERENCES sys_utenti(id),

    CONSTRAINT uq_sys_presa_visione
        UNIQUE (
            utente_id,
            entita,
            record_id
        )
);