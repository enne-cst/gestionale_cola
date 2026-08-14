/*
===============================================================================
 022 - REGISTRO: AUDIT MINIMO DELLE AZIONI PER CAMPO
===============================================================================

 Scopo
 -----
 Traccia minima (§16.3 della specifica Anagrafica Aziendale) delle azioni
 rilevanti sui campi di un modulo a registro: cambio di valore, transizione
 automatica a DA_VERIFICARE, verifica, richiesta di revisione, cambio di
 visibilita'. Alimenta anche la card "Ultime modifiche" della Panoramica.

 Non e' pensata come log di sicurezza generico ne' sostituisce un futuro
 audit trail applicativo piu' ampio: e' scoped al solo registro
 campo-per-campo (stessa chiave sezione_codice/campo_codice di
 sys_registro_stato_campi, 021).

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

CREATE TABLE IF NOT EXISTS sys_registro_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL REFERENCES sys_aziende(id),
    utente_id UUID REFERENCES sys_utenti(id),

    sezione_codice VARCHAR(150) NOT NULL,
    campo_codice VARCHAR(100) NOT NULL,

    azione VARCHAR(30) NOT NULL,
    valore_precedente TEXT,
    valore_nuovo TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_sys_registro_audit_azione CHECK (
        azione IN ('MODIFICA_VALORE', 'AUTO_DA_VERIFICARE', 'VERIFICA', 'RICHIESTA_REVISIONE', 'CAMBIO_VISIBILITA')
    )
);

COMMENT ON TABLE sys_registro_audit IS
    'Log minimo delle azioni sui campi di un modulo a registro (vedi sys_registro_stato_campi, 021).';

CREATE INDEX IF NOT EXISTS idx_sys_registro_audit_azienda_data
    ON sys_registro_audit (azienda_id, created_at DESC);

COMMIT;
