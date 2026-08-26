/*
===============================================================================
 MIGRAZIONE 008 - CARATTERISTICHE "DOMICILIO DELLA CARICA" E
 "PEC PERSONALE/PROFESSIONALE" PER I RUOLI CAMERALI
===============================================================================

 Scopo
 -----
 La mappatura CCIAA (§4.3/§5.2/§6.2) richiede, per soci/amministratori/
 sindaci/revisori, un "Domicilio" riferito alla carica (distinto dalla
 residenza anagrafica generica già in ana_persone.residenza) e una "PEC
 personale/professionale" (distinta dalla PEC aziendale in ana_contatti).
 Nessuna caratteristica esistente (A01-A61) rappresenta questi due dati.

 Aggiunge due nuove caratteristiche al catalogo condiviso
 cat_caratteristiche_incarico:
   - A62 Domicilio della carica (TESTO_LUNGO)
   - A63 PEC personale/professionale (TESTO)

 e le associa, come FACOLTATIVA (nessuno dei due dati è sempre presente in
 visura), ai 5 ruoli camerali già configurati dalla migrazione 007 più il
 ruolo Socio: Amministratore, Amministratore Delegato, Componente CdA,
 Sindaco, Revisore Legale, Socio.

 Non modifica 002/003/004/006/007 (già applicate, per convenzione
 CLAUDE.md non vanno più toccate retroattivamente).

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 1. NUOVE CARATTERISTICHE
-------------------------------------------------------------------------------
*/
INSERT INTO cat_caratteristiche_incarico (
    codice, denominazione, descrizione, tipo_dato, unita_misura, valori_ammessi, regola_validazione, sensibile, ordine_visualizzazione, attivo
)
VALUES
    (
        'A62', 'Domicilio della carica',
        'Domicilio riportato in visura per la carica, distinto dalla residenza anagrafica della persona.',
        'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 62, TRUE
    ),
    (
        'A63', 'PEC personale/professionale',
        'Indirizzo PEC personale o professionale del titolare della carica, distinto dalla PEC aziendale.',
        'TESTO', NULL, NULL, NULL, FALSE, 63, TRUE
    )
ON CONFLICT (codice) DO NOTHING;


/*
-------------------------------------------------------------------------------
 2. ASSOCIAZIONE AI RUOLI CAMERALI (FACOLTATIVA)
-------------------------------------------------------------------------------
*/
INSERT INTO rel_ruoli_caratteristiche (ruolo_id, caratteristica_id, obbligatorieta, condizione, ordine_visualizzazione, attivo)
SELECT r.id, c.id, 'FACOLTATIVA', NULL, x.ordine::SMALLINT, TRUE
FROM (
    VALUES
        ('A62', 62),
        ('A63', 63)
) AS x(codice_caratteristica, ordine)
CROSS JOIN (
    VALUES ('R003'), ('R031'), ('R032'), ('R033'), ('R034'), ('R035')
) AS ruoli(codice_documento_ruolo)
JOIN cat_ruoli AS r ON r.codice_documento = ruoli.codice_documento_ruolo
JOIN cat_caratteristiche_incarico AS c ON c.codice = x.codice_caratteristica
ON CONFLICT (ruolo_id, caratteristica_id) DO UPDATE
SET obbligatorieta = EXCLUDED.obbligatorieta,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo = EXCLUDED.attivo;


COMMIT;
