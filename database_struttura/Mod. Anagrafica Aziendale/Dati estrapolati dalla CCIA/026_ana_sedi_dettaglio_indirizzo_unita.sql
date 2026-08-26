/*
===============================================================================
 026 - SEDI: COMPONENTI INDIRIZZO E DETTAGLIO UNITA' LOCALI
===============================================================================

 Scopo
 -----
 Completa ana_sedi (015) con le colonne richieste dalla mappatura CCIAA per
 la sezione 1 (Sede) e la sezione 10 (Sedi secondarie e unità locali), che
 condividono la stessa tabella (distinte dal filtro su tipo_sede):

   - toponimo               (Via/Viale/Piazza..., §1.1/§10.2)
   - indirizzo_originale    (valore sorgente non ricomposto, §1.1/§10.2)
   - numero_rea_unita       (REA dell'unità, §10.2)
   - data_chiusura          (fine vita dell'unità, §10.2)
   - stato                  (attiva/inattiva/sospesa/cessata, §10.1/§10.2)
   - sigla_territoriale     (es. "TV", §10.2)
   - numero_progressivo     (es. "1" in "TV/1", §10.2)

 `indirizzo` resta la denominazione stradale (non rinominata, per non
 rompere gli usi esistenti); `toponimo` la precede concettualmente
 ("Via" + "Roma"). Nessuna colonna esistente viene rimossa o rinominata.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;

ALTER TABLE ana_sedi
    ADD COLUMN IF NOT EXISTS toponimo VARCHAR(30),
    ADD COLUMN IF NOT EXISTS indirizzo_originale TEXT,
    ADD COLUMN IF NOT EXISTS numero_rea_unita VARCHAR(30),
    ADD COLUMN IF NOT EXISTS data_chiusura DATE,
    ADD COLUMN IF NOT EXISTS stato VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sigla_territoriale VARCHAR(10),
    ADD COLUMN IF NOT EXISTS numero_progressivo VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_ana_sedi_date_apertura_chiusura'
    ) THEN
        ALTER TABLE ana_sedi
            ADD CONSTRAINT chk_ana_sedi_date_apertura_chiusura
            CHECK (
                data_chiusura IS NULL
                OR data_apertura IS NULL
                OR data_chiusura >= data_apertura
            );
    END IF;
END $$;

COMMIT;
