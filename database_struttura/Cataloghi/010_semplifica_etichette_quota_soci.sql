/*
===============================================================================
 MIGRAZIONE 010 - SEMPLIFICA LE ETICHETTE DELLE CARATTERISTICHE SOCIO
                   (QUOTA/VALORE NOMINALE/VERSAMENTO) E RIMUOVE A59
===============================================================================

 Scopo
 -----
 Correzione 02 (27/08/2026) aveva introdotto nel frontend etichette più
 semplici delle denominazioni di catalogo per tre caratteristiche del ruolo
 Socio, mostrate sia nella tabella riepilogativa "Elenco soci e titolari di
 quote" sia nel form di compilazione dell'incarico
 (`frontend/lib/cciaa-incarichi-caratteristiche.ts::ETICHETTA_FORM_CARATTERISTICA`,
 applicato in `frontend/components/registro/incarico-form-dialog.tsx`).

 Su richiesta esplicita dell'utente, questa migrazione porta la stessa
 semplificazione nel catalogo condiviso, per coerenza:
   - A54 "Percentuale di partecipazione" -> "Quota"
   - A53 "Quota nominale"                -> "Valore nominale"
   - A56 "Valore versato"                -> "Versamento"

 Rimuove inoltre definitivamente A59 "Quota del diritto" (frazione del
 diritto in caso di comproprietà): caratteristica facoltativa introdotta
 dalla migrazione 007, non compilata in nessun incarico esistente
 (verificato: 0 righe in per_incarichi_valori) e giudicata superflua
 dall'utente — la sua vicinanza terminologica alla nuova etichetta "Quota"
 (A54) creerebbe ambiguità. Rimossa da `rel_ruoli_caratteristiche` (Socio) e
 da `cat_caratteristiche_incarico`, non solo disattivata: a differenza delle
 altre correzioni di questo catalogo (che avevano sempre lasciato le
 caratteristiche non pertinenti solo FACOLTATIVA, mai eliminate) qui è
 un'eliminazione voluta e definitiva, su richiesta esplicita.
 `frontend/lib/cciaa-incarichi-caratteristiche.ts` va aggiornato in parallelo
 per togliere 'A59' da `CARATTERISTICHE_VISIBILI_PER_RUOLO.SOCIO`.

 Non modifica 003/004/007 (già applicate, per convenzione CLAUDE.md non
 vanno più toccate retroattivamente).

 La migrazione è idempotente (le UPDATE sono no-op se già applicate, le
 DELETE usano IF EXISTS via sottoquery e non falliscono se A59 è già stata
 rimossa).
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 1. ETICHETTE SEMPLIFICATE (A53/A54/A56)
-------------------------------------------------------------------------------
*/
UPDATE cat_caratteristiche_incarico SET denominazione = 'Quota' WHERE codice = 'A54';
UPDATE cat_caratteristiche_incarico SET denominazione = 'Valore nominale' WHERE codice = 'A53';
UPDATE cat_caratteristiche_incarico SET denominazione = 'Versamento' WHERE codice = 'A56';


/*
-------------------------------------------------------------------------------
 2. RIMOZIONE DEFINITIVA DI A59 "Quota del diritto"
-------------------------------------------------------------------------------
*/
DELETE FROM per_incarichi_valori
WHERE caratteristica_id IN (SELECT id FROM cat_caratteristiche_incarico WHERE codice = 'A59');

DELETE FROM rel_ruoli_caratteristiche
WHERE caratteristica_id IN (SELECT id FROM cat_caratteristiche_incarico WHERE codice = 'A59');

DELETE FROM cat_caratteristiche_incarico WHERE codice = 'A59';


COMMIT;
