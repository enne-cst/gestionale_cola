/*
===============================================================================
 MIGRAZIONE 006 - A02 (DATA CESSAZIONE) DIVENTA FACOLTATIVA PER TUTTI I RUOLI
===============================================================================

 Scopo
 -----
 La migrazione 004 aveva marcato come OBBLIGATORIA ogni caratteristica
 elencata per ciascun ruolo (nessuna riga risultava tra parentesi nel
 documento sorgente, quindi tutte inserite come OBBLIGATORIA per scelta
 esplicita di quella migrazione). Questo include A02 "Data cessazione" per
 tutti i 35 ruoli: richiederla già in creazione dell'incarico non ha senso
 per una persona ancora in carica (si compila solo quando lascia il ruolo).

 Corregge quel singolo caso: A02 passa a FACOLTATIVA ovunque compaia.

 Non modifica 004_rel_ruoli_caratteristiche.sql (già applicato in ambienti
 esistenti, per convenzione CLAUDE.md non va più toccato retroattivamente).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

UPDATE rel_ruoli_caratteristiche
SET obbligatorieta = 'FACOLTATIVA'
WHERE caratteristica_id = (
    SELECT id FROM cat_caratteristiche_incarico WHERE codice = 'A02'
);

COMMIT;
