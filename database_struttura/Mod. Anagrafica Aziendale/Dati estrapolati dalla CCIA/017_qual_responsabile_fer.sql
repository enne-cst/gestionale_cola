-- =======================================================
-- QUALIFICHE - RESPONSABILE TECNICO FER
-- =======================================================

CREATE TABLE IF NOT EXISTS qual_responsabile_fer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificazione
    azienda_id UUID NOT NULL,
    persona_id UUID NOT NULL,

    -- ===================================================
    -- CARATTERISTICHE DEL RUOLO
    -- ordinate secondo il catalogo A01-A51
    -- ===================================================

    data_assegnazione DATE,                     -- A01 - Data assegnazione

    data_cessazione DATE,                       -- A02 - Data cessazione

    nomina_richiesta BOOLEAN,                   -- A03 - Nomina richiesta

    documento_nomina_id UUID,                   -- A04 - Documento di nomina

    delega_presente BOOLEAN,                    -- A07 - Delega

    interno_esterno VARCHAR(30),                -- A08 - Interno / Esterno

    durata VARCHAR(150),                        -- A09 - Durata incarico

    titolo_studio_id UUID,                      -- A10 - Titolo di studio

    abilitazione_professionale TEXT,            -- A14 - Abilitazione professionale

    assenza_cause_ostative BOOLEAN,             -- A15 - Assenza di cause ostative

    assenza_condanne BOOLEAN,                   -- A16 - Assenza di condanne

    documento_aggiuntivo_id UUID,               -- A17 - Documento aggiuntivo

    note TEXT,                                  -- A18 - Note specifiche

    data_decorrenza DATE,                       -- A19 - Data decorrenza incarico

    data_accettazione DATE,                     -- A20 - Data accettazione incarico

    poteri_attribuiti TEXT,                     -- A21 - Poteri attribuiti

    limitazioni_poteri TEXT,                    -- A22 - Limitazioni dei poteri

    stato_incarico VARCHAR(100),                -- A25 - Stato dell'incarico

    motivo_cessazione TEXT,                     -- A26 - Motivo della cessazione

    requisito_accesso VARCHAR(150),             -- A27 - Requisito di accesso

    tipo_incarico VARCHAR(150),                 -- A28 - Tipologia di incarico

    criterio_scadenza TEXT,                     -- A29 - Criterio di scadenza

    documento_riferimento_id UUID,              -- A30 - Documento di riferimento

    fonte_dato VARCHAR(150),                    -- A31 - Fonte del dato

    lettere_abilitazione VARCHAR(50),           -- A33 - Lettere di abilitazione FER

    titolo_professionale_richiesto VARCHAR(150),-- A40 - Titolo professionale richiesto

    tipologia_rapporto VARCHAR(150),            -- A41 - Tipologia del rapporto con l'azienda

    settore_abilitazione VARCHAR(255),          -- A42 - Settore di abilitazione

    autorita_competente VARCHAR(255),           -- A44 - Ente certificatore / Autorità competente

    ambito_validita TEXT,                       -- A45 - Ambito di validità della qualifica

    documento_qualifica_id UUID,                -- A48 - Documento attestante la qualifica

    data_atto_nomina DATE,                      -- A49 - Data dell'atto o della delibera di nomina

    data_prima_iscrizione DATE,                 -- A50 - Data della prima iscrizione della carica in CCIAA

    data_scadenza DATE,                         -- A51 - Data puntuale di scadenza dell'incarico

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

    CONSTRAINT fk_qual_responsabile_fer_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_qual_responsabile_fer_persona
        FOREIGN KEY (persona_id)
        REFERENCES per_persone(id),

    CONSTRAINT fk_qual_responsabile_fer_documento_nomina
        FOREIGN KEY (documento_nomina_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_responsabile_fer_documento_aggiuntivo
        FOREIGN KEY (documento_aggiuntivo_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_responsabile_fer_documento_riferimento
        FOREIGN KEY (documento_riferimento_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_responsabile_fer_documento_qualifica
        FOREIGN KEY (documento_qualifica_id)
        REFERENCES doc_documenti(id),

    CONSTRAINT fk_qual_responsabile_fer_titolo_studio
        FOREIGN KEY (titolo_studio_id)
        REFERENCES per_titoli_studio(id),

    -- ===================================================
    -- VINCOLI DI INTEGRITÀ
    -- ===================================================

    CONSTRAINT chk_qual_responsabile_fer_scadenza
        CHECK (
            data_scadenza IS NULL
            OR data_decorrenza IS NULL
            OR data_scadenza >= data_decorrenza
        ),

    CONSTRAINT chk_qual_responsabile_fer_cessazione
        CHECK (
            data_cessazione IS NULL
            OR data_decorrenza IS NULL
            OR data_cessazione >= data_decorrenza
        ),

    CONSTRAINT chk_qual_responsabile_fer_accettazione
        CHECK (
            data_accettazione IS NULL
            OR data_atto_nomina IS NULL
            OR data_accettazione >= data_atto_nomina
        )
);