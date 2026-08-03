-- =======================================================
-- DOCUMENTI (placeholder minimo)
-- =======================================================
-- Tabella segnaposto: contiene solo le colonne obbligatorie da convenzione
-- (id, azienda_id, timestamp), sufficienti a soddisfare le foreign key dei
-- moduli che gia' referenziano doc_documenti (es. qualifiche CCIA).
-- La struttura completa del modulo Documenti (tipologia, versioning,
-- storage, metadati) e' rimandata a una sessione dedicata.

CREATE TABLE IF NOT EXISTS doc_documenti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doc_documenti_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
);
