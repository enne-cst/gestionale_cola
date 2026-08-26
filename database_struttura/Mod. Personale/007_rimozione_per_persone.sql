/*
===============================================================================
 MIGRAZIONE 007 - RIMOZIONE DI per_persone
===============================================================================

 Scopo
 -----
 Elimina la tabella `per_persone`, sostituita da `ana_persone` (migrazione
 001 di questo modulo) come unica fonte autorevole dell'anagrafica persona.

 Deve essere eseguita DOPO Mod. Anagrafica Aziendale/Dati estrapolati dalla
 CCIA/024 (rimuove le tabelle `qual_*` che referenziavano ancora
 `per_persone`): altrimenti il DROP fallirebbe per le foreign key pendenti.

 Impatto sui dati
 ----------------
 Verificato sul database di sviluppo al momento della decisione: una sola
 riga di test. Decisione esplicita dell'utente: cancellazione fisica,
 nessun backfill verso ana_persone.
===============================================================================
*/

BEGIN;

DROP TABLE IF EXISTS per_persone CASCADE;

COMMIT;
