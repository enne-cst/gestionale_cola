/*
===============================================================================
 MIGRAZIONE 025 - VALORI DEL CATALOGO cat_titoli_nomina_organo_controllo
===============================================================================

 Scopo
 -----
 Popola il catalogo `cat_titoli_nomina_organo_controllo` (migrazione 021,
 Correzione 11: struttura creata vuota, "le opzioni verranno definite
 separatamente") con i 4 valori richiesti dalla Correzione 13 per il campo
 "Titolo della nomina" della configurazione "Sindaco unico".

 Nota sul nome: la Correzione 13 indica come riferimento "tabella
 indicativa: cat_titoli_nomina_organi_controllo" (plurale "organi"). È lo
 stesso concetto già introdotto dalla Correzione 11 come campo "Titolo
 della nomina" della sezione Organi di controllo — non una tabella diversa
 da creare da capo: questa migrazione popola la tabella singolare già
 esistente (`cat_titoli_nomina_organo_controllo`) invece di crearne una
 seconda con un nome quasi identico.

 Prerequisiti
 ------------
 Migrazione 021 (crea la tabella, vuota).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;

INSERT INTO cat_titoli_nomina_organo_controllo (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('NON_INDICATO_VISURA', 'Non indicato nella visura', NULL, 1, TRUE),
    ('NOMINA_VOLONTARIA_ATTO_COSTITUTIVO', 'Nomina volontaria prevista dall''atto costitutivo', NULL, 2, TRUE),
    ('NOMINA_OBBLIGATORIA_LEGGE', 'Nomina obbligatoria per legge', NULL, 3, TRUE),
    ('NOMINA_DISPOSTA_TRIBUNALE', 'Nomina disposta dal tribunale', NULL, 4, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;

COMMIT;
