-- =======================================================================
-- CORREZIONE 16 - ANAGRAFICA PERSONE GIURIDICHE
-- =======================================================================
--
-- Crea l'anagrafica delle persone giuridiche (società, enti), distinta da
-- `ana_persone` (persone fisiche, migrazione 001 di questo modulo): serve
-- da titolare alternativo di un incarico (`per_incarichi`, vedi migrazione
-- 009 di questo modulo) per i ruoli che possono essere affidati a un
-- soggetto esterno anziché a un individuo — il primo caso, § Correzione 16,
-- è la configurazione "Società di revisione legale" della card "Sindaci e
-- membri degli organi di controllo".
--
-- Decisione esplicita dell'utente (AskUserQuestion, 31/08/2026): tabella
-- indipendente + FK dedicata su `per_incarichi`, non un'estensione di
-- `ana_persone` con un discriminatore di tipo — il motore incarichi
-- (`per_incarichi`/`per_incarichi_valori`, verifica, audit, tabelle) resta
-- condiviso e invariato: solo `per_incarichi.persona_id` (ora nullable) e
-- il nuovo `per_incarichi.persona_giuridica_id` cambiano, tutto il resto
-- (caratteristiche, verifica per riga, audit) non sa e non deve sapere se
-- il titolare è una persona fisica o giuridica.
--
-- Solo i campi identificativi essenziali della persona giuridica come
-- soggetto esterno (denominazione, codice fiscale, partita IVA, sede):
-- "dati di iscrizione pertinenti" ed "estremi dell'incarico" (§ testo
-- Correzione 16) sono già rappresentati dalle caratteristiche esistenti del
-- ruolo REVISORE_LEGALE (A01/A49/A50/A51/A25/A29/A34/A35/A36/A02/A62/A63,
-- vedi `rel_ruoli_caratteristiche`) — nessuna colonna duplicata qui.
--
-- Nessuna colonna propria di una persona fisica (nascita, cittadinanza,
-- residenza come indirizzo personale...): per esplicita richiesta della
-- Correzione 16, "Non devono essere richiesti campi propri di una persona
-- fisica".

CREATE TABLE IF NOT EXISTS ana_persone_giuridiche (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,

    denominazione VARCHAR(300) NOT NULL,
    codice_fiscale VARCHAR(32) NOT NULL,
    partita_iva VARCHAR(20),
    sede TEXT,
    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_persone_giuridiche_azienda_codice_fiscale
        UNIQUE (azienda_id, codice_fiscale),

    CONSTRAINT fk_ana_persone_giuridiche_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ana_persone_giuridiche_azienda_denominazione
    ON ana_persone_giuridiche (azienda_id, denominazione);

COMMENT ON TABLE ana_persone_giuridiche IS
    'Anagrafica delle persone giuridiche (società, enti) per azienda: titolare alternativo di un incarico quando il ruolo può essere affidato a un soggetto esterno anziché a una persona fisica (§ Correzione 16).';


CREATE OR REPLACE FUNCTION fn_ana_persone_giuridiche_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_persone_giuridiche_set_updated_at() IS
    'Aggiorna ana_persone_giuridiche.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_ana_persone_giuridiche_set_updated_at
    ON ana_persone_giuridiche;

CREATE TRIGGER trg_ana_persone_giuridiche_set_updated_at
BEFORE UPDATE ON ana_persone_giuridiche
FOR EACH ROW
EXECUTE FUNCTION fn_ana_persone_giuridiche_set_updated_at();
