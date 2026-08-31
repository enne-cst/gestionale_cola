-- =======================================================================
-- CORREZIONE 11 - IMPOSTAZIONI GENERALI DELLA SEZIONE "SINDACI"
-- =======================================================================
--
-- Crea la tabella singleton (1:1 con l'azienda) della card "Sindaci e
-- membri degli organi di controllo": finora quella card mostrava la stessa
-- `ana_amministrazione_controllo` della card "Amministratori" (solo
-- `groupTitleOverrides` diverso lato frontend, nessuna configurazione
-- propria dell'organo di controllo, vedi 007_ana_amministrazione_controllo.sql).
--
-- Non si aggiungono colonne a `ana_amministrazione_controllo` (migrazione
-- 007, già applicata, non più modificabile per convenzione CLAUDE.md)
-- perché la sezione Sindaci ha un proprio campo principale ("Assetto di
-- controllo in carica", a scelta singola su 7 valori) concettualmente
-- indipendente da "Organo amministrativo in carica": una singola
-- `SezioneRegistro` non può avere due campi guida indipendenti, ciascuno
-- con la propria cascata di campi condizionali (§ meccanismo
-- dipende_da/valori_dipendenza di app/core/registro_campi.py, pensato per
-- UN campo principale per sezione). Stesso principio già seguito per
-- "Sede"/"Informazioni da statuto" (tabelle "_rev2" dedicate quando la card
-- non è più rappresentabile 1:1 da una tabella condivisa).
--
-- La colonna `numero_sindaci_organi_controllo` di
-- `ana_amministrazione_controllo` (riservata a questo scopo da un commento
-- della migrazione 040) resta quindi non utilizzata da qui in avanti: non
-- rimossa, per lo stesso motivo per cui non si modificano retroattivamente
-- le migrazioni già applicate.
--
-- "Titolo della nomina" (cat_titoli_nomina_organo_controllo, migrazione
-- 021) è già un catalogo a chiave esterna qui, anche se oggi senza opzioni:
-- evita una futura migrazione di tipo colonna quando le opzioni saranno
-- definite (basterà popolare il catalogo).
--
-- Riconoscimento CCIAA (§ Correzione 11): nessuna colonna per "testo
-- originale"/"da verificare" qui. Il meccanismo generico esiste già ed è
-- riusabile senza duplicarlo: `sys_registro_stato_campi` (migrazione 0012)
-- marca già qualunque campo di una sezione a registro come "da verificare"
-- per chiave (sezione_codice, campo_codice), a prescindere da dove il
-- valore è fisicamente salvato. Il testo originale non riconosciuto andrà
-- conservato quando esisterà un importer reale (oggi nessuna pipeline di
-- estrazione dati da visura esiste in questo codebase, solo compilazione
-- manuale dai form, § stesso limite già annotato per Amministratori in
-- registro_campi.py): aggiungere ora una colonna che nessun codice
-- popolerebbe violerebbe "niente ottimizzazione prematura" (CLAUDE.md).

CREATE TABLE IF NOT EXISTS ana_organi_controllo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    assetto_controllo_id UUID,
    numero_componenti INTEGER,
    titolo_nomina_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ana_organi_controllo_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id),

    CONSTRAINT fk_ana_organi_controllo_assetto
        FOREIGN KEY (assetto_controllo_id)
        REFERENCES cat_assetti_controllo(id),

    CONSTRAINT fk_ana_organi_controllo_titolo_nomina
        FOREIGN KEY (titolo_nomina_id)
        REFERENCES cat_titoli_nomina_organo_controllo(id),

    CONSTRAINT uq_ana_organi_controllo_azienda
        UNIQUE (azienda_id),

    CONSTRAINT chk_ana_organi_controllo_numero_componenti
        CHECK (numero_componenti IS NULL OR numero_componenti >= 0)
);

COMMENT ON TABLE ana_organi_controllo IS
    'Impostazioni generali della sezione "Sindaci e membri degli organi di controllo" (Correzione 11): assetto di controllo in carica, numero componenti, titolo della nomina. 1:1 con l''azienda.';
