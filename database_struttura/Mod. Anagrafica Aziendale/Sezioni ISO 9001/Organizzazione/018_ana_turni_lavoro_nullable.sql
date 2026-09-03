/*
===============================================================================
 MIGRAZIONE - TURNI DI LAVORO: COLONNE NULLABLE
===============================================================================

 Scopo
 -----
 "Turni di lavoro" migra al motore "registro campo-per-campo" (vedi
 backend/app/core/registro_campi.py, SEZIONE_TURNI_LAVORO), stesso
 trattamento già applicato a "Contratto di lavoro" (migrazione 016) e
 "Posizioni assicurative e previdenziali" (migrazione 017).

 Questa migrazione rimuove il vincolo NOT NULL dalle quattro colonne
 booleane interessate. Nessun dato esistente viene toccato. Il vecchio
 endpoint CRUD "piatto" resta invariato e continua a richiedere i quattro
 campi tramite il proprio schema Pydantic.

 Idempotente (DROP NOT NULL non fallisce se il vincolo è già stato rimosso).
===============================================================================
*/

BEGIN;

ALTER TABLE ana_turni_lavoro
    ALTER COLUMN presenza_turnazioni DROP NOT NULL,
    ALTER COLUMN lavoro_notturno DROP NOT NULL,
    ALTER COLUMN lavoro_festivo DROP NOT NULL,
    ALTER COLUMN lavoro_ciclo_continuo DROP NOT NULL;

COMMIT;
