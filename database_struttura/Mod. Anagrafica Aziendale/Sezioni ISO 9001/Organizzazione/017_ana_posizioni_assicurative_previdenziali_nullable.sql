/*
===============================================================================
 MIGRAZIONE - POSIZIONI ASSICURATIVE E PREVIDENZIALI: COLONNE NULLABLE
===============================================================================

 Scopo
 -----
 "Posizioni assicurative e previdenziali" migra al motore "registro
 campo-per-campo" (vedi backend/app/core/registro_campi.py,
 SEZIONE_POSIZIONI_ASSICURATIVE_PREVIDENZIALI), stesso trattamento già
 applicato a "Contratto di lavoro" (migrazione 016): il registro campo-per-
 campo compila un campo alla volta e deve poter creare la riga con qualunque
 sottoinsieme valorizzato (§9.2 "nessun campo è mai obbligatorio").

 Questa migrazione rimuove il vincolo NOT NULL dalle quattro colonne
 interessate. Nessun dato esistente viene toccato. Il vecchio endpoint CRUD
 "piatto" (register_singleton_crud, /api/anagrafica/posizioni-assicurative-
 previdenziali) resta invariato e continua a richiedere i quattro campi
 tramite il proprio schema Pydantic.

 Idempotente (DROP NOT NULL non fallisce se il vincolo è già stato rimosso).
===============================================================================
*/

BEGIN;

ALTER TABLE ana_posizioni_assicurative_previdenziali
    ALTER COLUMN numero_posizione_inps DROP NOT NULL,
    ALTER COLUMN sede_territoriale_inps DROP NOT NULL,
    ALTER COLUMN numero_posizione_inail DROP NOT NULL,
    ALTER COLUMN sede_territoriale_inail DROP NOT NULL;

COMMIT;
