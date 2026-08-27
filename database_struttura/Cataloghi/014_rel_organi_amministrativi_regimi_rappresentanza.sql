/*
===============================================================================
 MIGRAZIONE 014 - ASSOCIAZIONE TRA ORGANI AMMINISTRATIVI E REGIMI DI
 RAPPRESENTANZA
===============================================================================

 Scopo
 -----
 Questa migrazione predispone la relazione tra il catalogo degli organi
 amministrativi (migrazione 011) e il catalogo dei regimi di rappresentanza
 (migrazione 013), richiesta dalla Correzione 05 per poter in futuro
 stabilire quali regimi siano compatibili con ciascuna forma amministrativa.

 Le associazioni definitive verranno completate analizzando, una alla volta,
 le altre configurazioni dell'organo amministrativo (Consiglio di
 amministrazione, amministrazione pluripersonale congiuntiva/disgiuntiva):
 qui viene inserita solo l'associazione già certa, "Amministratore unico" ->
 "Rappresentanza generale attribuita all'amministratore unico". Il campo
 "Regime di rappresentanza" del frontend non filtra ancora le opzioni in base
 a questa relazione (mostra tutto il catalogo attivo, come "Organo
 amministrativo in carica"): il filtro arriverà quando le associazioni
 saranno complete.

 Prerequisiti
 ------------
 - migrazione 011: cat_organi_amministrativi;
 - migrazione 013: cat_regimi_rappresentanza.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA DI CONFIGURAZIONE: rel_organi_amministrativi_regimi_rappresentanza
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_organi_amministrativi_regimi_rappresentanza (
    organo_amministrativo_id UUID NOT NULL,
    regime_rappresentanza_id UUID NOT NULL,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_rel_organi_amministrativi_regimi_rappresentanza
        PRIMARY KEY (organo_amministrativo_id, regime_rappresentanza_id),
    CONSTRAINT fk_rel_organi_amm_regimi_organo
        FOREIGN KEY (organo_amministrativo_id)
        REFERENCES cat_organi_amministrativi (id),
    CONSTRAINT fk_rel_organi_amm_regimi_regime
        FOREIGN KEY (regime_rappresentanza_id)
        REFERENCES cat_regimi_rappresentanza (id)
);

CREATE INDEX IF NOT EXISTS ix_rel_organi_amm_regimi_regime
    ON rel_organi_amministrativi_regimi_rappresentanza (regime_rappresentanza_id);

COMMENT ON TABLE rel_organi_amministrativi_regimi_rappresentanza IS
    'Regimi di rappresentanza compatibili con ciascun organo amministrativo. Associazioni completate progressivamente, una configurazione alla volta.';


/*
-------------------------------------------------------------------------------
 ASSOCIAZIONE INIZIALE: AMMINISTRATORE UNICO
-------------------------------------------------------------------------------
*/
INSERT INTO rel_organi_amministrativi_regimi_rappresentanza (
    organo_amministrativo_id,
    regime_rappresentanza_id,
    ordine_visualizzazione,
    attivo
)
SELECT
    o.id,
    r.id,
    1,
    TRUE
FROM cat_organi_amministrativi AS o
JOIN cat_regimi_rappresentanza AS r
  ON r.codice = 'RAPPRESENTANZA_GENERALE_AMMINISTRATORE_UNICO'
WHERE o.codice = 'AMMINISTRATORE_UNICO'
ON CONFLICT (organo_amministrativo_id, regime_rappresentanza_id) DO UPDATE
SET ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMIT;
