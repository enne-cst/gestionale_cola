/*
===============================================================================
 MIGRAZIONE 007 - CORREZIONE CATALOGO PER LE CARD CCIAA
 (Amministratori / Sindaci / Revisori / Soci)
===============================================================================

 Scopo
 -----
 La migrazione 004 aveva marcato come OBBLIGATORIA ogni caratteristica
 elencata per ciascun ruolo (nessuna riga tra parentesi nel documento
 sorgente). Per i ruoli camerali (Amministratore, Amministratore Delegato,
 Componente CdA, Sindaco, Revisore Legale) questo include caratteristiche
 pensate per altri usi del motore incarichi (documenti di nomina, assenza di
 cause ostative/condanne, interno/esterno...) che nella sezione CCIAA
 dell'Anagrafica Aziendale non sono compilabili (in particolare quelle di
 tipo DOCUMENTO, che richiedono un vero allegato non ancora collegato in
 questo contesto) o non pertinenti alla visura camerale. Il risultato
 verificato in sessione: la creazione di un incarico per questi ruoli dalla
 card CCIAA falliva perché il backend richiede tutte le caratteristiche
 OBBLIGATORIA del ruolo.

 Questa migrazione non elimina né disattiva alcuna caratteristica (restano
 disponibili per un futuro modulo Personale completo): le porta a
 FACOLTATIVA solo per i 5 ruoli camerali, mantenendo OBBLIGATORIA soltanto
 le caratteristiche realmente richieste dalla specifica CCIAA (§5.4/§6.2:
 data atto di nomina, data di iscrizione, data di scadenza, stato della
 carica, criterio di scadenza, rappresentanza legale/poteri per gli
 amministratori, registro professionale per sindaci/revisori).

 Aggiunge inoltre:
 - i valori ammessi mancanti per A25 "Stato dell'incarico" (oggi CATALOGO
   senza opzioni) e A29 "Criterio di scadenza", secondo il catalogo descritto
   dalla specifica CCIAA §5.1/§5.4/§6.2;
 - 5 nuove caratteristiche (A57-A61) per il ruolo Socio, mancanti nella
   migrazione 002 di Mod. Personale/006_per_incarichi (tipologia della
   partecipazione, numero di azioni o quote, quota del diritto in caso di
   comproprietà, titolarità individuale/congiunta, descrizione di vincoli
   ulteriori — specifica CCIAA §4.4).

 Non modifica 002/003/004/006 (già applicate, per convenzione CLAUDE.md non
 vanno più toccate retroattivamente).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 1. OBBLIGATORIETA': solo i campi richiesti dalla specifica CCIAA restano
    OBBLIGATORIA per i ruoli camerali; il resto del catalogo condiviso
    diventa FACOLTATIVA per quei ruoli soltanto.
-------------------------------------------------------------------------------
*/
UPDATE rel_ruoli_caratteristiche AS rrc
SET obbligatorieta = 'FACOLTATIVA'
FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c
WHERE rrc.ruolo_id = r.id
  AND rrc.caratteristica_id = c.id
  AND r.codice_documento IN ('R003', 'R031', 'R032') -- Amministratore, Amministratore Delegato, Componente CdA
  AND c.codice NOT IN ('A01','A02','A18','A21','A22','A23','A24','A25','A29','A32','A49','A50','A51');

UPDATE rel_ruoli_caratteristiche AS rrc
SET obbligatorieta = 'FACOLTATIVA'
FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c
WHERE rrc.ruolo_id = r.id
  AND rrc.caratteristica_id = c.id
  AND r.codice_documento = 'R033' -- Sindaco
  AND c.codice NOT IN ('A01','A02','A11','A12','A13','A18','A25','A29','A32','A49','A50','A51');

UPDATE rel_ruoli_caratteristiche AS rrc
SET obbligatorieta = 'FACOLTATIVA'
FROM cat_ruoli AS r, cat_caratteristiche_incarico AS c
WHERE rrc.ruolo_id = r.id
  AND rrc.caratteristica_id = c.id
  AND r.codice_documento = 'R034' -- Revisore Legale
  AND c.codice NOT IN ('A01','A02','A18','A25','A29','A32','A34','A35','A36','A49','A50','A51');


/*
-------------------------------------------------------------------------------
 2. VALORI AMMESSI mancanti (specifica CCIAA §5.1/§5.4/§6.1/§6.2)
-------------------------------------------------------------------------------
*/
UPDATE cat_caratteristiche_incarico
SET valori_ammessi = '["IN_CARICA", "CESSATA", "SOSPESA", "REVOCATA", "DIMISSIONARIA", "NON_DETERMINATO"]'::jsonb
WHERE codice = 'A25';

UPDATE cat_caratteristiche_incarico
SET valori_ammessi = '["A_TEMPO_INDETERMINATO", "FINO_A_DATA", "PER_NUMERO_DI_ESERCIZI", "FINO_APPROVAZIONE_BILANCIO", "FINO_A_REVOCA_DIMISSIONI", "ALTRA_DURATA", "NON_INDICATA"]'::jsonb
WHERE codice = 'A29';


/*
-------------------------------------------------------------------------------
 3. NUOVE CARATTERISTICHE PER IL RUOLO SOCIO (specifica CCIAA §4.4)
-------------------------------------------------------------------------------
*/
INSERT INTO cat_caratteristiche_incarico (
    codice, denominazione, descrizione, tipo_dato, unita_misura, valori_ammessi, regola_validazione, sensibile, ordine_visualizzazione, attivo
)
VALUES
    (
        'A57', 'Tipologia della partecipazione',
        'Indica se il diritto riguarda quote, azioni o altra partecipazione prevista dalla forma giuridica.',
        'CATALOGO', NULL, '["QUOTA", "AZIONE", "ALTRA_PARTECIPAZIONE"]'::jsonb, NULL, FALSE, 57, TRUE
    ),
    (
        'A58', 'Numero di azioni o quote',
        'Quantita'' dei titoli quando la fonte la esprime come numero. Non sostituisce il valore nominale.',
        'NUMERO', NULL, NULL, NULL, FALSE, 58, TRUE
    ),
    (
        'A59', 'Quota del diritto',
        'Frazione o percentuale del diritto spettante al titolare quando vi e'' contitolarita''. Non va confusa con la percentuale di partecipazione sul capitale.',
        'NUMERO', '%', NULL, NULL, FALSE, 59, TRUE
    ),
    (
        'A60', 'Titolarita'' individuale o congiunta',
        'Modalita'' con cui il diritto sulla partecipazione e'' detenuto.',
        'CATALOGO', NULL, '["INDIVIDUALE", "CONGIUNTA", "IN_COMUNIONE", "NON_SPECIFICATA"]'::jsonb, NULL, FALSE, 60, TRUE
    ),
    (
        'A61', 'Descrizione di vincoli ulteriori',
        'Eventuali condizioni o vincoli sulla partecipazione non rappresentabili dal tipo di diritto.',
        'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 61, TRUE
    )
ON CONFLICT (codice) DO NOTHING;

INSERT INTO rel_ruoli_caratteristiche (ruolo_id, caratteristica_id, obbligatorieta, condizione, ordine_visualizzazione, attivo)
SELECT r.id, c.id, x.obbligatorieta, NULL, x.ordine::SMALLINT, TRUE
FROM (
    VALUES
        ('A57', 'OBBLIGATORIA', 57),
        ('A58', 'FACOLTATIVA', 58),
        ('A59', 'FACOLTATIVA', 59),
        ('A60', 'FACOLTATIVA', 60),
        ('A61', 'FACOLTATIVA', 61)
) AS x(codice_caratteristica, obbligatorieta, ordine)
JOIN cat_ruoli AS r ON r.codice_documento = 'R035' -- Socio
JOIN cat_caratteristiche_incarico AS c ON c.codice = x.codice_caratteristica
ON CONFLICT (ruolo_id, caratteristica_id) DO UPDATE
SET obbligatorieta = EXCLUDED.obbligatorieta,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo = EXCLUDED.attivo;


COMMIT;
