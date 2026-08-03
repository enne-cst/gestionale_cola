-- =======================================================
-- QUALIFICHE - REVISORE LEGALE
-- =======================================================

CREATE TABLE IF NOT EXISTS qual_revisore_legale (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificazione dell'azienda
    azienda_id UUID NOT NULL,

    -- Identificazione del soggetto incaricato
    tipo_soggetto VARCHAR(20) NOT NULL,

    -- Persona fisica
    persona_id UUID,

    -- Società di revisione
    denominazione_societa_revisione VARCHAR(255),
    codice_fiscale_societa_revisione VARCHAR(16),

    -- ===================================================
    -- CARATTERISTICHE GENERALI DEL RUOLO
    -- ordinate secondo il catalogo A01-A48
    -- ===================================================

    data_assegnazione DATE,                      -- A01 - Data assegnazione

    data_cessazione DATE,                        -- A02 - Data cessazione

    nomina_richiesta BOOLEAN,                    -- A03 - Nomina richiesta

    documento_nomina_id UUID,                    -- A04 - Documento di nomina

    interno_esterno VARCHAR(30),                 -- A08 - Interno / Esterno

    durata VARCHAR(255),                         -- A09 - Durata incarico

    assenza_cause_ostative BOOLEAN,              -- A15 - Assenza di cause ostative

    assenza_condanne BOOLEAN,                    -- A16 - Assenza di condanne

    documento_aggiuntivo_id UUID,                -- A17 - Documento aggiuntivo

    note TEXT,                                   -- A18 - Note specifiche

    data_decorrenza DATE,                        -- A19 - Data decorrenza incarico

    data_accettazione DATE,                      -- A20 - Data accettazione incarico

    poteri_attribuiti TEXT,                      -- A21 - Poteri attribuiti

    limitazioni_poteri TEXT,                     -- A22 - Limitazioni dei poteri

    stato_incarico VARCHAR(100),                 -- A25 - Stato dell'incarico

    motivo_cessazione TEXT,                      -- A26 - Motivo cessazione

    tipo_incarico VARCHAR(255) NOT NULL,         -- A28 - Tipologia incarico

    criterio_scadenza TEXT,                      -- A29 - Criterio di scadenza

    documento_riferimento_id UUID,               -- A30 - Documento di riferimento

    fonte_dato VARCHAR(150),                     -- A31 - Fonte del dato

    -- ===================================================
    -- CARATTERISTICHE SPECIFICHE DEL REVISORE LEGALE
    -- ===================================================

    numero_iscrizione_registro_revisori
        VARCHAR(100),                            -- A34 - Numero iscrizione Registro Revisori Legali

    data_iscrizione_registro_revisori DATE,      -- A35 - Data iscrizione Registro Revisori Legali

    stato_iscrizione_registro VARCHAR(150),      -- A36 - Stato iscrizione Registro Revisori Legali

    autorita_competente VARCHAR(255),            -- A44 - Ente certificatore / Autorità competente

    ambito_validita TEXT,                        -- A45 - Ambito di validità della qualifica

    documento_qualifica_id UUID,                 -- A48 - Documento attestante la qualifica

    data_atto_nomina DATE,                       -- A49 - Data dell'atto o della delibera di nomina

    data_prima_iscrizione DATE,                  -- A50 - Data della prima iscrizione della carica in CCIAA

    data_scadenza DATE,                          -- A51 - Data puntuale di scadenza dell'incarico

    -- ===================================================
    -- DATI DI SISTEMA
    -- ===================================================

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    -- ===================================================
    -- CHIAVI ESTERNE
    -- ===================================================

    CONSTRAINT fk_qual_revisore_legale_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_qual_revisore_legale_persona
        FOREIGN KEY (persona_id)
        REFERENCES per_persone(id),

    CONSTRAINT fk_qual_revisore_legale_documento_nomina
        FOREIGN KEY (documento_nomina_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_revisore_legale_documento_aggiuntivo
        FOREIGN KEY (documento_aggiuntivo_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_revisore_legale_documento_riferimento
        FOREIGN KEY (documento_riferimento_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_revisore_legale_documento_qualifica
        FOREIGN KEY (documento_qualifica_id)
        REFERENCES doc_documenti(id),

    -- ===================================================
    -- VINCOLI DI INTEGRITÀ
    -- ===================================================

    CONSTRAINT chk_qual_revisore_legale_tipo_soggetto
        CHECK (
            tipo_soggetto IN (
                'PERSONA',
                'ORGANIZZAZIONE'
            )
        ),

    CONSTRAINT chk_qual_revisore_legale_identificazione
        CHECK (
            (
                tipo_soggetto = 'PERSONA'
                AND persona_id IS NOT NULL
                AND denominazione_societa_revisione IS NULL
                AND codice_fiscale_societa_revisione IS NULL
            )
            OR
            (
                tipo_soggetto = 'ORGANIZZAZIONE'
                AND persona_id IS NULL
                AND denominazione_societa_revisione IS NOT NULL
            )
        ),

    CONSTRAINT chk_qual_revisore_legale_scadenza
        CHECK (
            data_scadenza IS NULL
            OR data_decorrenza IS NULL
            OR data_scadenza >= data_decorrenza
        ),

    CONSTRAINT chk_qual_revisore_legale_cessazione
        CHECK (
            data_cessazione IS NULL
            OR data_decorrenza IS NULL
            OR data_cessazione >= data_decorrenza
        )
);