
-- =======================================================
-- RELAZIONE AZIENDE - SETTORI IAF
-- =======================================================

CREATE TABLE IF NOT EXISTS rel_aziende_settori_iaf (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    settore_iaf_id UUID NOT NULL,

    CONSTRAINT fk_rasi_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_rasi_settore
        FOREIGN KEY (settore_iaf_id)
        REFERENCES cat_settori_iaf(id),

    CONSTRAINT uq_rel_aziende_settori_iaf
        UNIQUE (azienda_id, settore_iaf_id)
);

