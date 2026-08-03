
-- =======================================================
-- RELAZIONE UTENTI - AZIENDE
-- =======================================================

CREATE TABLE IF NOT EXISTS rel_utenti_aziende (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    utente_id UUID NOT NULL,

    azienda_id UUID NOT NULL,

    profilo_id UUID NOT NULL,

    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sua_utente
        FOREIGN KEY (utente_id)
        REFERENCES sys_utenti(id),

    CONSTRAINT fk_sua_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_sua_profilo
        FOREIGN KEY (profilo_id)
        REFERENCES sys_profili(id),

    CONSTRAINT uq_sys_utenti_azienda
        UNIQUE (utente_id, azienda_id)
);
