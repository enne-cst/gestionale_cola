/*
===============================================================================
 MIGRAZIONE 017 - REGIMI DI RAPPRESENTANZA COMPATIBILI CON IL CONSIGLIO DI
 AMMINISTRAZIONE
===============================================================================

 Scopo
 -----
 Estende con una nuova associazione la relazione tra organi amministrativi e
 regimi di rappresentanza già creata dalla migrazione 014 (§ Correzione 06
 punto 6: "le compatibilità devono essere gestite mediante la relazione già
 prevista tra i due cataloghi" — non una tabella nuova).

 Solo l'associazione già inequivocabile viene inserita qui: "Rappresentanza
 attribuita al presidente e ai consiglieri delegati" è per definizione
 propria del Consiglio di amministrazione (un organo collegiale con
 presidente e consiglieri). Le voci "congiuntiva"/"disgiuntiva secondo atto
 di nomina" e "mista per categorie di atti" restano non ancora associate a
 nessun organo: potrebbero risultare pertinenti anche alle configurazioni
 pluripersonali non ancora definite, la cui analisi stabilirà le
 associazioni corrette (§ nota della migrazione 014, "una configurazione
 alla volta"). Il campo "Regime di rappresentanza" del frontend continua a
 mostrare tutto il catalogo attivo, senza filtrare per organo (invariato
 rispetto alla migrazione 014).

 Prerequisiti
 ------------
 - migrazione 011: cat_organi_amministrativi;
 - migrazione 013: cat_regimi_rappresentanza;
 - migrazione 014: rel_organi_amministrativi_regimi_rappresentanza.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

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
  ON r.codice = 'RAPPRESENTANZA_PRESIDENTE_CONSIGLIERI_DELEGATI'
WHERE o.codice = 'CONSIGLIO_AMMINISTRAZIONE'
ON CONFLICT (organo_amministrativo_id, regime_rappresentanza_id) DO UPDATE
SET ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;

COMMIT;
