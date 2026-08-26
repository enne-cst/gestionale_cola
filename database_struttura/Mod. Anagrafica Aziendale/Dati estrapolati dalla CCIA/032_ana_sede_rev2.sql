/*
===============================================================================
 032 - ANA_SEDE_REV2 (PILOTA): CONTENUTO DELLA CARD "SEDE" DEL PROTOTIPO
       HTML 25-08-26, REPLICATO 1:1 IN UNA TABELLA DEDICATA
===============================================================================

 Scopo
 -----
 Tabella sperimentale, non ancora collegata a backend/frontend, richiesta
 esplicitamente dall'utente per verificare se raggruppare in un'unica
 tabella tutte le informazioni mostrate nella card "Sede" (sezione 1 della
 visura camerale) del prototipo
 `frontend/grafica/modifiche 25-08-26/ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO 25-08-26.html`
 (blocco `cciaaSections`, id `registered-office`) dia un risultato grafico
 più fedele di quello attuale, dove le stesse informazioni sono sparse tra
 `ana_identificazione_camerale` (codice fiscale, partita IVA, REA, camera di
 commercio, trasferimento — quest'ultimo aggiunto dalla 029) e `ana_sedi`
 (indirizzo/comune/provincia/CAP/nazione della sede, derivata a runtime in
 `app/core/registro_campi.py::_sede_legale_di`).

 Decisione esplicita dell'utente (26/08/2026): duplicare qui questi campi è
 accettato consapevolmente per questo esperimento, in deroga al criterio
 "non duplicare" seguito finora (vedi commento in 023). Se il risultato è
 soddisfacente, l'utente ha indicato di voler ripetere il criterio per le
 altre sezioni e poi eliminare le tabelle/colonne divenute obsolete
 (ana_sedi, le colonne pertinenti di ana_identificazione_camerale) — nessuna
 rimozione va fatta ora, solo in una sessione futura dopo conferma esplicita.

 1:1 con l'azienda, come ana_identificazione_camerale/ana_elenco_soci_estremi:
 nel prototipo la card "Sede" rappresenta la sola sede legale, non l'elenco
 di sedi operative/unità locali (quello è un'altra card, "Sedi secondarie e
 unità locali", fuori dallo scopo di questa tabella).

 Mappatura campo HTML -> colonna
 --------------------------------
   office-address    (Indirizzo sede legale)          -> indirizzo_sede_legale
   office-city       (Comune)                          -> comune
   office-province   (Provincia)                        -> provincia
   office-postcode   (CAP)                              -> cap
   office-country    (Nazione)                          -> nazione
   office-pec        (Domicilio digitale / PEC)          -> pec
   office-vat        (Partita IVA)                       -> partita_iva
   office-tax-code   (Codice fiscale)                    -> codice_fiscale
   office-rea        (Numero REA)                        -> numero_rea
   office-chamber    (Camera di Commercio competente)    -> camera_commercio_competente
   office-transferred(Trasferita da altra provincia)      -> provincia_provenienza
   office-previous-rea(Numero REA precedente)             -> numero_rea_precedente

 "Trasferita da altra provincia" nel prototipo è un solo campo testuale
 ("Sì, dalla provincia di Bolzano"): qui si preferisce lo stesso pattern già
 in uso nella 029 per lo stesso concetto — nessuna colonna booleana propria,
 la presenza del trasferimento si deduce da provincia_provenienza IS NOT NULL
 — per non introdurre due rappresentazioni diverse dello stesso fatto nello
 stesso schema.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

CREATE TABLE IF NOT EXISTS ana_sede_rev2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    indirizzo_sede_legale VARCHAR(255),
    comune VARCHAR(150),
    provincia VARCHAR(100),
    cap VARCHAR(10),
    nazione VARCHAR(100),

    pec VARCHAR(255),
    partita_iva VARCHAR(11),
    codice_fiscale VARCHAR(16),
    numero_rea VARCHAR(30),
    camera_commercio_competente VARCHAR(150),

    provincia_provenienza VARCHAR(100),
    numero_rea_precedente VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_sede_rev2_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_sede_rev2_azienda
        UNIQUE (azienda_id)
);
