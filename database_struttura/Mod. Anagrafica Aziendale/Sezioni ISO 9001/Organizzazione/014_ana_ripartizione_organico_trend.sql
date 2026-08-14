/*
===============================================================================
 MIGRAZIONE 014 - RIPARTIZIONE ORGANICO: RICLASSIFICAZIONE IN TREND E VINCOLI
===============================================================================

 Scopo
 -----
 Migrazione incrementale che integra le correzioni della Revisione 2 dello
 script 005_ana_ripartizione_organico.sql, gia' applicato in produzione dalla
 migrazione Alembic 0008. Non ricrea la tabella (CREATE TABLE IF NOT EXISTS
 non modificherebbe nulla su un database dove esiste gia'): applica solo le
 differenze.

 Differenze integrate
 ---------------------
 1. La voce "Ripartizione organico" e i suoi 28 campi (14 memorizzati + 14
    calcolati) vengono riclassificati nel catalogo da
    ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO a
    ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO, tramite UPDATE (non
    delete+insert) per preservare id e associazioni esistenti in
    rel_elementi_certificazioni.
 2. Vincoli CHECK >= 0 sui conteggi di ana_ripartizione_organico e
    ana_variazioni_organico (§4.2/§5.2/§8.7 della specifica di integrazione).
    Postgres valida automaticamente le righe esistenti all'aggiunta del
    vincolo: se sono presenti valori negativi la migrazione fallisce in modo
    esplicito, senza correggerli silenziosamente (nessun dato aziendale reale
    atteso in questo ambiente di sviluppo).

 La sezione ANAGRAFICA_AZIENDALE.TREND e' gia' presente (creata dalla
 migrazione 0008 tramite 012_ana_variazioni_organico.sql): qui viene solo
 referenziata, non ricreata.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 RICLASSIFICAZIONE CATALOGO: VOCE "RIPARTIZIONE ORGANICO"
-------------------------------------------------------------------------------
*/
UPDATE sys_elementi
SET codice             = 'ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO',
    elemento_padre_id  = (SELECT id FROM sys_elementi WHERE codice = 'ANAGRAFICA_AZIENDALE.TREND'),
    denominazione      = 'Ripartizione organico',
    descrizione        = 'Panoramica annuale della composizione del personale, consolidata a partire dai dati del modulo Personale.',
    updated_at         = CURRENT_TIMESTAMP
WHERE codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO';


/*
-------------------------------------------------------------------------------
 RICLASSIFICAZIONE CATALOGO: CAMPI MEMORIZZATI E CALCOLATI (28 righe)
-------------------------------------------------------------------------------
 Il codice cambia solo nel prefisso (ORGANIZZAZIONE -> TREND); il suffisso
 dopo "RIPARTIZIONE_ORGANICO." resta identico, quindi si ricostruisce con
 split_part invece di riscrivere ogni codice per esteso.
*/
UPDATE sys_elementi
SET codice     = 'ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO.'
                 || split_part(codice, 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.', 2),
    updated_at = CURRENT_TIMESTAMP
WHERE codice LIKE 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.%';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO TESTI: CAMPI MEMORIZZATI (denominazione/descrizione)
-------------------------------------------------------------------------------
*/
UPDATE sys_elementi AS e
SET denominazione = v.denominazione,
    descrizione   = v.descrizione,
    updated_at    = CURRENT_TIMESTAMP
FROM (
    VALUES
        ('anno_riferimento', 'Anno di riferimento', 'Anno della panoramica consolidata. I valori rappresentano la situazione del personale al 31 dicembre.'),
        ('numero_amministrativi', 'Amministrativi (n°)', 'Numero consolidato dal modulo Personale degli addetti che svolgono funzioni amministrative al 31 dicembre.'),
        ('numero_project_manager', 'Project manager (n°)', 'Numero consolidato dal modulo Personale degli addetti che ricoprono il ruolo di project manager al 31 dicembre.'),
        ('numero_tecnici', 'Tecnici (n°)', 'Numero consolidato dal modulo Personale degli addetti che svolgono funzioni tecniche al 31 dicembre.'),
        ('numero_preposti', 'Preposti (n°)', 'Numero consolidato dal modulo Personale degli addetti che ricoprono il ruolo di preposto al 31 dicembre.'),
        ('numero_operativi', 'Operativi (n°)', 'Numero consolidato dal modulo Personale degli addetti impiegati in attività operative al 31 dicembre.'),
        ('numero_dirigenti_sicurezza', 'Dirigenti della sicurezza (n°)', 'Numero consolidato dal modulo Personale degli addetti individuati come dirigenti ai fini della sicurezza sul lavoro.'),
        ('numero_uomini', 'Uomini (n°)', 'Numero consolidato dal modulo Personale degli addetti di genere maschile al 31 dicembre.'),
        ('numero_donne', 'Donne (n°)', 'Numero consolidato dal modulo Personale degli addetti di genere femminile al 31 dicembre.'),
        ('numero_italiani', 'Italiani (n°)', 'Numero consolidato dal modulo Personale degli addetti con cittadinanza italiana al 31 dicembre.'),
        ('numero_stranieri', 'Stranieri (n°)', 'Numero consolidato dal modulo Personale degli addetti con cittadinanza diversa da quella italiana al 31 dicembre.'),
        ('numero_tempo_determinato', 'Tempo determinato (n°)', 'Numero consolidato dal modulo Personale degli addetti con contratto a tempo determinato al 31 dicembre.'),
        ('numero_tempo_indeterminato', 'Tempo indeterminato (n°)', 'Numero consolidato dal modulo Personale degli addetti con contratto a tempo indeterminato al 31 dicembre.'),
        ('numero_laureati', 'Laureati (n°)', 'Numero consolidato dal modulo Personale degli addetti in possesso di un titolo di laurea al 31 dicembre.'),
        ('numero_diplomati', 'Diplomati (n°)', 'Numero consolidato dal modulo Personale degli addetti in possesso di un diploma al 31 dicembre.')
) AS v(nome_colonna, denominazione, descrizione)
WHERE e.nome_tabella = 'ana_ripartizione_organico'
  AND e.nome_colonna = v.nome_colonna;


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO TESTI: CAMPI CALCOLATI (denominazione/descrizione)
-------------------------------------------------------------------------------
 Solo il testo cambia rispetto alla versione attuale (identico nella Rev.2):
 riportato qui per completezza e coerenza con l'aggiornamento dei campi
 memorizzati sopra.
*/
UPDATE sys_elementi AS e
SET denominazione = v.denominazione,
    descrizione   = v.descrizione,
    updated_at    = CURRENT_TIMESTAMP
FROM (
    VALUES
        ('percentuale_amministrativi', 'Amministrativi (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_project_manager', 'Project manager (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_tecnici', 'Tecnici (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_preposti', 'Preposti (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_operativi', 'Operativi (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_dirigenti_sicurezza', 'Dirigenti della sicurezza (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_uomini', 'Uomini (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_donne', 'Donne (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_italiani', 'Italiani (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_stranieri', 'Stranieri (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_tempo_determinato', 'Tempo determinato (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_tempo_indeterminato', 'Tempo indeterminato (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_laureati', 'Laureati (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.'),
        ('percentuale_diplomati', 'Diplomati (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.')
) AS v(nome_colonna, denominazione, descrizione)
WHERE e.nome_tabella = 'vw_ana_ripartizione_organico'
  AND e.nome_colonna = v.nome_colonna;


/*
-------------------------------------------------------------------------------
 COMMENTO TABELLA (allineato alla Rev.2)
-------------------------------------------------------------------------------
*/
COMMENT ON TABLE ana_ripartizione_organico IS
    'Panoramica annuale della composizione del personale prodotta dal modulo Personale.';


/*
-------------------------------------------------------------------------------
 VINCOLI DI NON NEGATIVITA': ana_ripartizione_organico (14 conteggi)
-------------------------------------------------------------------------------
 Un DO block con loop evita di ripetere 14 volte lo stesso IF/ADD CONSTRAINT.
 Ogni vincolo viene aggiunto solo se non esiste gia' (idempotenza); Postgres
 valida le righe esistenti nel momento dell'ADD CONSTRAINT: se ci sono valori
 negativi la migrazione si interrompe con errore esplicito.
*/
DO $$
DECLARE
    colonna TEXT;
BEGIN
    FOREACH colonna IN ARRAY ARRAY[
        'numero_amministrativi', 'numero_project_manager', 'numero_tecnici',
        'numero_preposti', 'numero_operativi', 'numero_dirigenti_sicurezza',
        'numero_uomini', 'numero_donne', 'numero_italiani', 'numero_stranieri',
        'numero_tempo_determinato', 'numero_tempo_indeterminato',
        'numero_laureati', 'numero_diplomati'
    ]
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'chk_ripartizione_organico_' || colonna || '_ge0'
        ) THEN
            EXECUTE format(
                'ALTER TABLE ana_ripartizione_organico ADD CONSTRAINT %I CHECK (%I >= 0)',
                'chk_ripartizione_organico_' || colonna || '_ge0',
                colonna
            );
        END IF;
    END LOOP;
END $$;


/*
-------------------------------------------------------------------------------
 VINCOLI DI NON NEGATIVITA': ana_variazioni_organico (assunzioni, cessazioni)
-------------------------------------------------------------------------------
 obiettivo_variazione_percentuale resta senza vincolo di segno: puo' essere
 positivo, nullo o negativo (§5.2 della specifica).
*/
DO $$
DECLARE
    colonna TEXT;
BEGIN
    FOREACH colonna IN ARRAY ARRAY['numero_nuove_assunzioni', 'numero_cessazioni']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'chk_variazioni_organico_' || colonna || '_ge0'
        ) THEN
            EXECUTE format(
                'ALTER TABLE ana_variazioni_organico ADD CONSTRAINT %I CHECK (%I >= 0)',
                'chk_variazioni_organico_' || colonna || '_ge0',
                colonna
            );
        END IF;
    END LOOP;
END $$;


COMMIT;
