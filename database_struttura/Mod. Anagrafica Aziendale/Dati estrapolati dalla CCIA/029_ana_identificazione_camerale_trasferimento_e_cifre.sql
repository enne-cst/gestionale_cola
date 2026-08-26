/*
===============================================================================
 029 - IDENTIFICAZIONE CAMERALE: TRASFERIMENTO DA ALTRA PROVINCIA E
       INDICATORI "L'IMPRESA IN CIFRE"
===============================================================================

 Scopo
 -----
 Completa ana_identificazione_camerale (001, esteso da 023) con due gruppi
 di colonne richiesti dalla mappatura CCIAA, entrambi 1:1 con l'azienda
 come il resto della tabella:

   - Trasferimento da altra provincia (§1.4, blocco condizionale mostrato
     solo se applicabile):
       - provincia_provenienza
       - numero_rea_precedente
       - data_trasferimento_provincia
     ("presenza del trasferimento" è derivabile da
     provincia_provenienza IS NOT NULL, nessuna colonna dedicata)

   - Indicatori "L'impresa in cifre" non disponibili altrove (§0.4),
     snapshot numerici dalla fonte camerale:
       - pratiche_ultimi_12_mesi
       - trasferimenti_quote
       - trasferimenti_sede
       - partecipazioni_altre_societa

 Stesso precedente della migrazione 023: colonne eterogenee ma
 concettualmente dati singoli dell'impresa, raggruppate in un solo ALTER
 sulla stessa tabella.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_identificazione_camerale
    ADD COLUMN IF NOT EXISTS provincia_provenienza VARCHAR(5),
    ADD COLUMN IF NOT EXISTS numero_rea_precedente VARCHAR(30),
    ADD COLUMN IF NOT EXISTS data_trasferimento_provincia DATE,
    ADD COLUMN IF NOT EXISTS pratiche_ultimi_12_mesi INTEGER,
    ADD COLUMN IF NOT EXISTS trasferimenti_quote INTEGER,
    ADD COLUMN IF NOT EXISTS trasferimenti_sede INTEGER,
    ADD COLUMN IF NOT EXISTS partecipazioni_altre_societa BOOLEAN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_identificazione_impresa_cifre'
    ) THEN
        ALTER TABLE ana_identificazione_camerale
            ADD CONSTRAINT chk_ana_identificazione_impresa_cifre
            CHECK (
                (pratiche_ultimi_12_mesi IS NULL OR pratiche_ultimi_12_mesi >= 0)
                AND (trasferimenti_quote IS NULL OR trasferimenti_quote >= 0)
                AND (trasferimenti_sede IS NULL OR trasferimenti_sede >= 0)
            );
    END IF;
END $$;

COMMIT;
