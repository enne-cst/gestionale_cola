/*
===============================================================================
 025 - SISTEMI DI AMMINISTRAZIONE: DETTAGLIO ORGANI PREVISTI DALLO STATUTO
===============================================================================

 Scopo
 -----
 Completa ana_sistemi_amministrazione (007) con le colonne richieste dalla
 mappatura CCIAA §2.4.4 "Organi amministrativi previsti": ogni riga oggi
 rappresenta solo il nome del sistema di amministrazione (es. "Consiglio di
 Amministrazione"), senza i dettagli della configurazione statutaria.

 Queste colonne descrivono regole previste dallo statuto (quante
 configurazioni alternative, con quali regole), non la carica di una
 persona: restano quindi su questa tabella, mai sul motore incarichi
 (per_incarichi), che modella nomine effettive, non regole generali.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_sistemi_amministrazione
    ADD COLUMN IF NOT EXISTS numero_minimo_componenti INTEGER,
    ADD COLUMN IF NOT EXISTS numero_massimo_componenti INTEGER,
    ADD COLUMN IF NOT EXISTS regole_decisionali TEXT,
    ADD COLUMN IF NOT EXISTS deleghe_previste TEXT,
    ADD COLUMN IF NOT EXISTS regime_rappresentanza TEXT,
    ADD COLUMN IF NOT EXISTS gestione_opposizione TEXT,
    ADD COLUMN IF NOT EXISTS in_carica BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_sistemi_amministrazione_componenti'
    ) THEN
        ALTER TABLE ana_sistemi_amministrazione
            ADD CONSTRAINT chk_ana_sistemi_amministrazione_componenti
            CHECK (
                (numero_minimo_componenti IS NULL OR numero_minimo_componenti >= 0)
                AND (numero_massimo_componenti IS NULL OR numero_massimo_componenti >= 0)
                AND (
                    numero_minimo_componenti IS NULL
                    OR numero_massimo_componenti IS NULL
                    OR numero_massimo_componenti >= numero_minimo_componenti
                )
            );
    END IF;
END $$;

COMMIT;
