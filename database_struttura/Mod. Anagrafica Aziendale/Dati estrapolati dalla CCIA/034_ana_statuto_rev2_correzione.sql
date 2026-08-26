/*
===============================================================================
 034 - ANA_STATUTO_REV2: RIMOZIONE DI DUE CAMPI NON PREVISTI
===============================================================================

 Scopo
 -----
 Correzione segnalata dall'utente il 27/08/2026: il catalogo definitivo
 della card "Informazioni da statuto/atto costitutivo" ha 12 campi, non 14.
 `sezione_ordinaria` e `sezione_titolarita_effettiva` (aggiunti dalla 033
 leggendo due `confirmedField` del prototipo HTML che in realtà appartengono
 al blocco "Registro delle Imprese" ma non fanno parte dell'elenco campi
 confermato dall'utente) vanno rimossi.

 Tabella creata nella stessa sessione (033), mai popolata in produzione
 (verificato: 0 righe con questi campi valorizzati) — rimozione diretta
 delle colonne, non un semplice "non usarle più" nel catalogo applicativo,
 per non lasciare schema morto.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

ALTER TABLE ana_statuto_rev2
    DROP COLUMN IF EXISTS sezione_ordinaria,
    DROP COLUMN IF EXISTS sezione_titolarita_effettiva;
