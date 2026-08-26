/*
===============================================================================
 MIGRAZIONE 024 - RIMOZIONE DELLE TABELLE qual_* OBSOLETE
===============================================================================

 Scopo
 -----
 Elimina le tabelle `qual_soci`, `qual_elenco_soci`,
 `qual_amministratori_cariche`, `qual_sindaco`, `qual_revisore_legale`,
 `qual_direttore_tecnico_soa`, `qual_amministratore_delegato`,
 `qual_componente_consiglio_amministrazione` e `qual_responsabile_fer`.

 Motivo
 ------
 Duplicavano l'anagrafica della persona (riferendo `per_persone`, colonne
 domicilio comprese in `qual_soci`) invece di limitarsi al riferimento
 stabile e ai dati della carica, e replicavano lo stesso insieme di colonne
 (catalogo A01-A51) separatamente per ogni ruolo. Sostituite dal motore
 generico ruolo + caratteristiche (`per_incarichi`/`per_incarichi_valori`,
 Mod. Personale/006), che collega `ana_persone` a `cat_ruoli` senza
 duplicare dati anagrafici.

 Deve essere eseguita DOPO Mod. Personale/006 (crea la struttura
 sostitutiva) e PRIMA di Mod. Personale/007 (rimuove `per_persone`, ancora
 referenziata da queste tabelle finché non vengono eliminate).

 Impatto sui dati
 ----------------
 Verificato sul database di sviluppo al momento della decisione: nessun dato
 reale presente, una sola riga di test in `qual_amministratori_cariche`.
 Decisione esplicita dell'utente: cancellazione fisica, nessun backfill.
===============================================================================
*/

BEGIN;

DROP TABLE IF EXISTS qual_soci CASCADE;
DROP TABLE IF EXISTS qual_elenco_soci CASCADE;
DROP TABLE IF EXISTS qual_amministratori_cariche CASCADE;
DROP TABLE IF EXISTS qual_sindaco CASCADE;
DROP TABLE IF EXISTS qual_revisore_legale CASCADE;
DROP TABLE IF EXISTS qual_direttore_tecnico_soa CASCADE;
DROP TABLE IF EXISTS qual_amministratore_delegato CASCADE;
DROP TABLE IF EXISTS qual_componente_consiglio_amministrazione CASCADE;
DROP TABLE IF EXISTS qual_responsabile_fer CASCADE;

COMMIT;
