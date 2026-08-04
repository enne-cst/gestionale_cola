-- =======================================================
-- SISTEMA - VOCI IN PANORAMICA
-- =======================================================
-- Configurazione, per azienda, dei singoli campi che il consulente ha
-- scelto di mostrare nella scheda "Panoramica" di un modulo. Tabella
-- trasversale ai moduli applicativi (non solo Anagrafica Aziendale): il
-- modulo e la sezione sono identificati per nome/slug, non da una chiave
-- esterna dedicata, cosi' che lo stesso meccanismo si possa riusare per
-- qualunque modulo futuro senza nuove migrazioni strutturali.
--
-- Non memorizza il valore del campo, solo quali campi sono stati scelti:
-- la Panoramica legge sempre il valore corrente dalla sezione di origine,
-- cosi' da non duplicare il dato ed evitare disallineamenti (cfr. principio
-- "niente logica duplicata" del documento di progetto).

CREATE TABLE IF NOT EXISTS sys_panoramica_voci (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    modulo VARCHAR(150) NOT NULL,
    sezione_slug VARCHAR(150) NOT NULL,
    campo VARCHAR(150) NOT NULL,
    etichetta VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sys_panoramica_voci_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_sys_panoramica_voci
        UNIQUE (azienda_id, modulo, sezione_slug, campo)
);
