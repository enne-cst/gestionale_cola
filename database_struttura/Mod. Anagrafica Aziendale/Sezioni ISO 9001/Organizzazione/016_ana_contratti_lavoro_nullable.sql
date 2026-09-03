/*
===============================================================================
 MIGRAZIONE - CONTRATTO DI LAVORO: COLONNE NULLABLE (PILOTA REGISTRO)
===============================================================================

 Scopo
 -----
 "Contratto di lavoro" diventa la sezione pilota della migrazione al motore
 "registro campo-per-campo" (vedi backend/app/core/registro_campi.py,
 SEZIONE_CONTRATTO_LAVORO) già usato dalle card di "Dati CCIAA": a differenza
 del vecchio form, che salvava ccnl_applicato/settore_ccnl/data_applicazione
 in un solo invio atomico, il registro campo-per-campo compila un campo alla
 volta e deve poter creare la riga con qualunque sottoinsieme valorizzato
 (§9.2 "nessun campo è mai obbligatorio").

 Questa migrazione rimuove il vincolo NOT NULL dalle tre colonne interessate.
 Nessun dato esistente viene toccato: righe già completamente compilate
 restano identiche, la rimozione del vincolo si limita a permettere anche
 righe parzialmente compilate d'ora in avanti.

 Il vecchio endpoint CRUD "piatto" (`register_singleton_crud`, path
 /api/anagrafica/contratto-lavoro) resta invariato e continua a richiedere i
 tre campi tramite il proprio schema Pydantic (ContrattoLavoroUpsert): la
 validazione "obbligatorio" si sposta quindi dal database allo schema per
 quella sola via di scrittura, il registro campo-per-campo ne resta
 indipendente.

 La migrazione è idempotente (DROP NOT NULL non fallisce se il vincolo è
 già stato rimosso).
===============================================================================
*/

BEGIN;

ALTER TABLE ana_contratti_lavoro
    ALTER COLUMN ccnl_applicato DROP NOT NULL,
    ALTER COLUMN settore_ccnl DROP NOT NULL,
    ALTER COLUMN data_applicazione DROP NOT NULL;

COMMIT;
