/*
===============================================================================
 033 - ANA_STATUTO_REV2 (PILOTA): CONTENUTO DELLA CARD "INFORMAZIONI DA
       STATUTO/ATTO COSTITUTIVO" DEL PROTOTIPO HTML 25-08-26
===============================================================================

 Scopo
 -----
 Stesso criterio di lavoro validato dall'utente con `ana_sede_rev2` (032):
 tabella dedicata che replica 1:1 i 14 campi mostrati nella card "Informazioni
 da statuto/atto costitutivo" (sezione 2 della visura camerale) del prototipo
 `frontend/grafica/modifiche 25-08-26/ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO 25-08-26.html`
 (blocco `cciaaSections`, id `statute`), invece di continuare a comporre la
 card da tre sezioni a registro diverse (`ana_identificazione_camerale`,
 `ana_durata_societa_esercizi`, `ana_amministrazione_controllo`) più la
 tabella ripetibile `ana_iscrizioni_registro_imprese` — combinazione che
 esisteva prima di questa migrazione in
 `frontend/components/registro/cciaa-section-panel.tsx` (case "statuto").

 Duplicazione consapevole, stesso principio già accettato per `ana_sede_rev2`:
   - data_termine_societa / scadenza_primo_esercizio / scadenza_esercizi_successivi
     duplicano `ana_durata_societa_esercizi` (che resta la fonte della sua
     pagina standalone, invariata);
   - denominazione/forma_giuridica/data_atto_costitutivo duplicano concetti
     già in `ana_identificazione_camerale` (sezione "informazioni-societarie");
   - sistema_amministrazione_adottato è concettualmente vicino a
     `organo_amministrativo_in_carica` di `ana_amministrazione_controllo`
     (che resta la fonte per le card "Amministratori"/"Sindaci" e per la
     Sintesi camerale, invariate).
 Nessuna delle tabelle sopra viene toccata da questa migrazione. La card
 "Statuto" non incorpora più (dopo il collegamento in
 `cciaa-section-panel.tsx`) la tabella ripetibile "Iscrizioni registro
 imprese": il prototipo la rappresenta con 3 campi piatti
 (registro_imprese/sezione_ordinaria/sezione_titolarita_effettiva), non con
 una tabella; `ana_iscrizioni_registro_imprese` resta comunque intatta e
 raggiungibile dalla propria pagina standalone.

 Mappatura campo HTML -> colonna
 --------------------------------
   statute-name                (Denominazione)                      -> denominazione
   statute-registry             (Registro delle Imprese)             -> registro_imprese
   statute-registration-date    (Data di iscrizione)                 -> data_iscrizione
   statute-section               (Sezione ordinaria)                  -> sezione_ordinaria
   statute-beneficial-owner      (Sezione titolarità effettiva)        -> sezione_titolarita_effettiva
   statute-legal-form            (Forma giuridica)                     -> forma_giuridica
   statute-incorporation-date    (Data atto di costituzione)           -> data_atto_costitutivo
   statute-end-date              (Data termine società)                -> data_termine_societa
   statute-first-year-end        (Scadenza primo esercizio)            -> scadenza_primo_esercizio
   statute-next-year-end         (Scadenza esercizi successivi)        -> scadenza_esercizi_successivi
   statute-extension-days        (Proroga approvazione bilancio)       -> giorni_proroga_approvazione_bilancio
   statute-management-system     (Sistema di amministrazione adottato) -> sistema_amministrazione_adottato
   statute-accounting-control    (Controllo contabile)                 -> controllo_contabile
   statute-admin-bodies          (Organi amministrativi previsti)      -> organi_amministrativi_previsti

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

CREATE TABLE IF NOT EXISTS ana_statuto_rev2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    denominazione VARCHAR(255),
    registro_imprese VARCHAR(150),
    data_iscrizione DATE,
    sezione_ordinaria VARCHAR(255),
    sezione_titolarita_effettiva VARCHAR(255),
    forma_giuridica VARCHAR(150),
    data_atto_costitutivo DATE,

    data_termine_societa DATE,
    scadenza_primo_esercizio DATE,
    scadenza_esercizi_successivi VARCHAR(50),
    giorni_proroga_approvazione_bilancio INTEGER,

    sistema_amministrazione_adottato VARCHAR(150),
    controllo_contabile VARCHAR(150),
    organi_amministrativi_previsti TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_statuto_rev2_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT uq_ana_statuto_rev2_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_statuto_rev2_proroga_bilancio
        CHECK (
            giorni_proroga_approvazione_bilancio IS NULL
            OR giorni_proroga_approvazione_bilancio >= 0
        )
);
