/*
===============================================================================
 MIGRAZIONE 015 - VARIAZIONI ORGANICO: AGGIORNAMENTO TESTI CATALOGO (REV.2)
===============================================================================

 Scopo
 -----
 Unica differenza reale tra 012_ana_variazioni_organico.sql (gia' applicato
 dalla migrazione 0008) e la Rev.2 allegata: struttura tabella, vista,
 trigger e gerarchia del catalogo (gia' sotto ANAGRAFICA_AZIENDALE.TREND)
 sono identiche. Cambia solo il testo di denominazione/descrizione dei
 campi in sys_elementi, per riflettere che i dati sono consolidati dal
 modulo Personale invece che inseriti manualmente.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;


UPDATE sys_elementi AS e
SET denominazione = v.denominazione,
    descrizione   = v.descrizione,
    updated_at    = CURRENT_TIMESTAMP
FROM (
    VALUES
        ('anno_riferimento', 'Anno', 'Anno al quale si riferisce la panoramica consolidata delle variazioni del personale.'),
        ('numero_nuove_assunzioni', 'Numero di nuove assunzioni', 'Numero complessivo delle nuove assunzioni dell''anno, consolidato dal modulo Personale.'),
        ('numero_cessazioni', 'Numero di cessazioni', 'Numero complessivo dei rapporti di lavoro cessati nell''anno, consolidato dal modulo Personale.'),
        ('obiettivo_variazione_percentuale', 'Obiettivo', 'Obiettivo percentuale di incremento o decremento del personale previsto per l''anno.'),
        ('note', 'Note', 'Informazioni utili a interpretare la panoramica e le variazioni del personale dell''anno.')
) AS v(nome_colonna, denominazione, descrizione)
WHERE e.nome_tabella = 'ana_variazioni_organico'
  AND e.nome_colonna = v.nome_colonna;

UPDATE sys_elementi AS e
SET denominazione = v.denominazione,
    descrizione   = v.descrizione,
    updated_at    = CURRENT_TIMESTAMP
FROM (
    VALUES
        ('organico_medio_annuo', 'Organico medio annuo', 'Valore consolidato dal modulo Personale e recuperato dalla panoramica annuale corrispondente nei dati generali.')
) AS v(nome_colonna, denominazione, descrizione)
WHERE e.nome_tabella = 'vw_ana_variazioni_organico'
  AND e.nome_colonna = v.nome_colonna;

UPDATE sys_elementi
SET descrizione = 'Panoramica annuale delle variazioni del personale, consolidata a partire dai dati del modulo Personale.',
    updated_at  = CURRENT_TIMESTAMP
WHERE codice = 'ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO';

COMMENT ON TABLE ana_variazioni_organico IS
    'Panoramica annuale delle variazioni del personale prodotta dal modulo Personale.';


COMMIT;
