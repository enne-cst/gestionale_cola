/*
===============================================================================
 035 - ANA_ELENCO_SOCI_ESTREMI: ALLINEAMENTO ALLA CARD "SOCI" DEL PROTOTIPO
===============================================================================

 Scopo
 -----
 Applica alla card "Soci e titolari di diritti su azioni e quote" lo stesso
 criterio già usato per "Sede"/"Informazioni da statuto/atto costitutivo":
 il prototipo HTML resta la guida, ma qui non serve una nuova tabella "rev2"
 perché la tabella di testata esiste già (030) — basta allinearla:

   - data_atto, data_protocollo: rimossi, non previsti dal catalogo campi
     confermato dall'utente per questa card.
   - capitale_sociale_dichiarato: rimosso come colonna scrivibile. Il dato
     "Capitale sociale rappresentato" mostrato nella card è ora derivato in
     lettura da ana_capitale_sociale.capitale_sottoscritto (vedi
     app/core/registro_campi.py::_capitale_rappresentato_di), per non
     duplicare un valore già presente e verificabile nella sezione
     "Capitale sociale" — stesso principio già applicato a "Sede legale"
     (derivata da ana_sedi, mai una colonna propria).

 Tabella creata dalla migrazione 030, mai popolata in produzione (verificato:
 0 righe) — rimozione diretta delle colonne, non una deprecazione morbida.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

ALTER TABLE ana_elenco_soci_estremi
    DROP COLUMN IF EXISTS data_atto,
    DROP COLUMN IF EXISTS data_protocollo,
    DROP COLUMN IF EXISTS capitale_sociale_dichiarato;
