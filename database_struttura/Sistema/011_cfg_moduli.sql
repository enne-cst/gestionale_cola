
-- =======================================================
-- CONFIGURAZIONE MODULI
-- =======================================================

CREATE TABLE IF NOT EXISTS cfg_moduli (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    settore_iaf_id UUID NOT NULL,

    certificazione_id UUID NOT NULL,

    modulo_id UUID NOT NULL,

    CONSTRAINT fk_cfg_moduli_iaf
        FOREIGN KEY (settore_iaf_id)
        REFERENCES cat_settori_iaf(id),

    CONSTRAINT fk_cfg_moduli_certificazione
        FOREIGN KEY (certificazione_id)
        REFERENCES cat_certificazioni(id),

    CONSTRAINT fk_cfg_moduli_modulo
        FOREIGN KEY (modulo_id)
        REFERENCES cat_moduli(id),

    CONSTRAINT uq_cfg_moduli
        UNIQUE (
            settore_iaf_id,
            certificazione_id,
            modulo_id
        )
);

-- =======================================================
-- CONFIGURAZIONE INIZIALE ISO 9001
-- per altre configurazioni basta duplicare la funzione seguente
-- =======================================================

INSERT INTO cfg_moduli (
    settore_iaf_id,
    certificazione_id,
    modulo_id
)
SELECT
    iaf.id,
    cert.id,
    mod.id
FROM cat_settori_iaf iaf
CROSS JOIN cat_certificazioni cert
CROSS JOIN cat_moduli mod
WHERE iaf.nome IN (
    'IAF 28'
)
AND cert.nome IN (
    'ISO 9001'
)
AND mod.nome IN (
    'Piano Formativo'
)
ON CONFLICT (
    settore_iaf_id,
    certificazione_id,
    modulo_id
) DO NOTHING;

