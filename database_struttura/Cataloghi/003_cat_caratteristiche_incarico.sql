/*
===============================================================================
 MIGRAZIONE 003 - CATALOGO DELLE CARATTERISTICHE DEGLI INCARICHI
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo delle caratteristiche A01-A51 utilizzabili
 per configurare i ruoli e i relativi incarichi.

 Ogni caratteristica definisce:
 - codice e denominazione stabili;
 - descrizione informativa;
 - tipo di dato necessario per generare il campo nell'interfaccia;
 - eventuali valori ammessi e regole di validazione;
 - indicazione di sensibilità;
 - ordine e stato di attivazione.

 L'obbligatorietà non appartiene al catalogo: la stessa caratteristica può
 essere obbligatoria per un ruolo, facoltativa per un altro o richiesta soltanto
 al verificarsi di una condizione. Questa informazione sarà registrata nella
 successiva relazione tra ruoli e caratteristiche.

 Tipi di dato iniziali
 ---------------------
 - DATA;
 - BOOLEANO;
 - DOCUMENTO;
 - TESTO;
 - TESTO_LUNGO;
 - NUMERO;
 - CATALOGO;
 - CATALOGO_MULTIPLO.

 Regole ISO e IAF
 ----------------
 Le caratteristiche non ricevono associazioni ISO/IAF autonome. La loro
 applicabilità deriva dal ruolo al quale vengono collegate, evitando che una
 caratteristica specialistica risulti disponibile fuori dal relativo contesto.

 Prerequisiti
 ------------
 - cat_moduli con codice PERSONALE;
 - sys_elementi;
 - la sezione PERSONALE.RUOLI_INCARICHI creata dalla migrazione 002.

 La migrazione è idempotente e non inserisce valori compilati per gli incarichi.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_caratteristiche_incarico
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_caratteristiche_incarico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(10) NOT NULL,
    denominazione VARCHAR(250) NOT NULL,
    descrizione TEXT,
    tipo_dato VARCHAR(30) NOT NULL,
    unita_misura VARCHAR(50),
    valori_ammessi JSONB,
    regola_validazione TEXT,
    sensibile BOOLEAN NOT NULL DEFAULT FALSE,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_caratteristiche_incarico_codice
        UNIQUE (codice)
);


INSERT INTO cat_caratteristiche_incarico (
    codice,
    denominazione,
    descrizione,
    tipo_dato,
    unita_misura,
    valori_ammessi,
    regola_validazione,
    sensibile,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('A01', 'Data assegnazione', 'Data nella quale il ruolo o l''incarico viene assegnato alla persona.', 'DATA', NULL, NULL, NULL, FALSE, 1, TRUE),
    ('A02', 'Data cessazione', 'Data di conclusione o cessazione del ruolo o dell''incarico.', 'DATA', NULL, NULL, NULL, FALSE, 2, TRUE),
    ('A03', 'Nomina richiesta', 'Indica se per l''incarico è richiesta una nomina formale.', 'BOOLEANO', NULL, NULL, NULL, FALSE, 3, TRUE),
    ('A04', 'Documento di nomina', 'Documento che formalizza la nomina della persona.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 4, TRUE),
    ('A05', 'Elezione richiesta', 'Indica se il ruolo richiede un procedimento di elezione.', 'BOOLEANO', NULL, NULL, NULL, FALSE, 5, TRUE),
    ('A06', 'Verbale di elezione', 'Verbale o documento che attesta l''elezione della persona.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 6, TRUE),
    ('A07', 'Delega', 'Documento o atto con cui vengono conferite deleghe alla persona.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 7, TRUE),
    ('A08', 'Interno / Esterno', 'Indica se la persona incaricata è interna oppure esterna all''azienda.', 'CATALOGO', NULL, '["INTERNO", "ESTERNO"]'::jsonb, NULL, FALSE, 8, TRUE),
    ('A09', 'Durata incarico', 'Durata prevista dell''incarico.', 'NUMERO', NULL, NULL, NULL, FALSE, 9, TRUE),
    ('A10', 'Titolo di studio', 'Titolo di studio richiesto o posseduto ai fini dell''incarico.', 'TESTO', NULL, NULL, NULL, FALSE, 10, TRUE),
    ('A11', 'Iscrizione ad Albo', 'Indica se è richiesta o presente l''iscrizione a un albo professionale.', 'BOOLEANO', NULL, NULL, NULL, FALSE, 11, TRUE),
    ('A12', 'Numero iscrizione Albo', 'Numero identificativo dell''iscrizione all''albo professionale.', 'TESTO', NULL, NULL, NULL, FALSE, 12, TRUE),
    ('A13', 'Ente / Ordine professionale', 'Ente o ordine professionale presso il quale è registrata l''iscrizione.', 'TESTO', NULL, NULL, NULL, FALSE, 13, TRUE),
    ('A14', 'Abilitazione professionale', 'Abilitazione professionale richiesta o posseduta dalla persona.', 'TESTO', NULL, NULL, NULL, FALSE, 14, TRUE),
    ('A15', 'Assenza di cause ostative', 'Dichiarazione o verifica relativa all''assenza di cause ostative all''incarico.', 'BOOLEANO', NULL, NULL, NULL, TRUE, 15, TRUE),
    ('A16', 'Assenza di condanne', 'Dichiarazione o verifica relativa all''assenza di condanne incompatibili con l''incarico.', 'BOOLEANO', NULL, NULL, NULL, TRUE, 16, TRUE),
    ('A17', 'Documento aggiuntivo', 'Ulteriore documento richiesto per lo specifico ruolo o incarico.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 17, TRUE),
    ('A18', 'Note specifiche', 'Annotazioni specifiche riferite al ruolo o all''incarico.', 'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 18, TRUE),
    ('A19', 'Data decorrenza incarico', 'Data dalla quale l''incarico produce effetto.', 'DATA', NULL, NULL, NULL, FALSE, 19, TRUE),
    ('A20', 'Data accettazione incarico', 'Data nella quale la persona accetta formalmente l''incarico.', 'DATA', NULL, NULL, NULL, FALSE, 20, TRUE),
    ('A21', 'Poteri attribuiti', 'Descrizione dei poteri conferiti alla persona con l''incarico.', 'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 21, TRUE),
    ('A22', 'Limitazioni dei poteri', 'Descrizione degli eventuali limiti applicati ai poteri attribuiti.', 'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 22, TRUE),
    ('A23', 'Rappresentanza legale (Sì/No)', 'Indica se l''incarico attribuisce la rappresentanza legale dell''azienda.', 'BOOLEANO', NULL, NULL, NULL, FALSE, 23, TRUE),
    ('A24', 'Modalità di firma', 'Modalità con cui la persona può esercitare il potere di firma.', 'TESTO', NULL, NULL, NULL, FALSE, 24, TRUE),
    ('A25', 'Stato dell''incarico', 'Stato corrente dell''incarico.', 'CATALOGO', NULL, NULL, NULL, FALSE, 25, TRUE),
    ('A26', 'Motivo della cessazione', 'Motivazione della conclusione o cessazione dell''incarico.', 'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 26, TRUE),
    ('A27', 'Requisito di accesso', 'Requisito necessario per poter assumere il ruolo o l''incarico.', 'TESTO', NULL, NULL, NULL, FALSE, 27, TRUE),
    ('A28', 'Tipologia di incarico', 'Classificazione della tipologia di incarico attribuito.', 'CATALOGO', NULL, NULL, NULL, FALSE, 28, TRUE),
    ('A29', 'Criterio di scadenza', 'Regola utilizzata per determinare la scadenza dell''incarico.', 'CATALOGO', NULL, NULL, NULL, FALSE, 29, TRUE),
    ('A30', 'Documento di riferimento', 'Documento principale utilizzato come riferimento per l''incarico.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 30, TRUE),
    ('A31', 'Fonte del dato', 'Origine dalla quale è stata acquisita l''informazione relativa all''incarico.', 'CATALOGO', NULL, NULL, NULL, FALSE, 31, TRUE),
    ('A32', 'Stato verifica consulente', 'Stato della verifica effettuata dal consulente sul dato o sull''incarico.', 'CATALOGO', NULL, '["DA_VERIFICARE", "APPROVATO", "IN_REVISIONE"]'::jsonb, NULL, FALSE, 32, TRUE),
    ('A33', 'Lettere di abilitazione FER', 'Lettere o classi di abilitazione possedute per le fonti di energia rinnovabile.', 'CATALOGO_MULTIPLO', NULL, NULL, NULL, FALSE, 33, TRUE),
    ('A34', 'Numero iscrizione Registro Revisori Legali', 'Numero di iscrizione della persona al Registro dei Revisori Legali.', 'TESTO', NULL, NULL, NULL, FALSE, 34, TRUE),
    ('A35', 'Data iscrizione Registro Revisori Legali', 'Data di iscrizione della persona al Registro dei Revisori Legali.', 'DATA', NULL, NULL, NULL, FALSE, 35, TRUE),
    ('A36', 'Stato iscrizione Registro Revisori Legali', 'Stato corrente dell''iscrizione al Registro dei Revisori Legali.', 'CATALOGO', NULL, NULL, NULL, FALSE, 36, TRUE),
    ('A37', 'Numero attestazione SOA', 'Numero identificativo dell''attestazione SOA.', 'TESTO', NULL, NULL, NULL, FALSE, 37, TRUE),
    ('A38', 'Categoria SOA', 'Categoria o insieme di categorie associate all''attestazione SOA.', 'CATALOGO_MULTIPLO', NULL, NULL, NULL, FALSE, 38, TRUE),
    ('A39', 'Classifica SOA', 'Classifica economica associata alla categoria SOA.', 'CATALOGO', NULL, NULL, NULL, FALSE, 39, TRUE),
    ('A40', 'Titolo professionale richiesto', 'Titolo o qualifica professionale richiesta per l''incarico.', 'TESTO', NULL, NULL, NULL, FALSE, 40, TRUE),
    ('A41', 'Tipologia del rapporto con l''azienda', 'Tipologia del rapporto che collega la persona all''azienda.', 'CATALOGO', NULL, NULL, NULL, FALSE, 41, TRUE),
    ('A42', 'Settore di abilitazione', 'Settore o insieme di settori per i quali la persona risulta abilitata.', 'CATALOGO_MULTIPLO', NULL, NULL, NULL, FALSE, 42, TRUE),
    ('A43', 'Numero di iscrizione ad elenco specialistico', 'Numero identificativo dell''iscrizione a un elenco specialistico.', 'TESTO', NULL, NULL, NULL, FALSE, 43, TRUE),
    ('A44', 'Ente certificatore / Autorità competente', 'Ente certificatore o autorità competente che ha rilasciato o riconosciuto la qualifica.', 'TESTO', NULL, NULL, NULL, FALSE, 44, TRUE),
    ('A45', 'Ambito di validità della qualifica', 'Descrizione dell''ambito nel quale la qualifica risulta valida.', 'TESTO_LUNGO', NULL, NULL, NULL, FALSE, 45, TRUE),
    ('A46', 'Data ultimo rinnovo', 'Data dell''ultimo rinnovo della qualifica o dell''abilitazione.', 'DATA', NULL, NULL, NULL, FALSE, 46, TRUE),
    ('A47', 'Data prossimo rinnovo', 'Data prevista per il prossimo rinnovo della qualifica o dell''abilitazione.', 'DATA', NULL, NULL, NULL, FALSE, 47, TRUE),
    ('A48', 'Documento attestante la qualifica', 'Documento che attesta la qualifica, l''abilitazione o il requisito posseduto.', 'DOCUMENTO', NULL, NULL, NULL, FALSE, 48, TRUE),
    ('A49', 'Data atto di nomina', 'Data dell''atto formale con cui è stata effettuata la nomina.', 'DATA', NULL, NULL, NULL, FALSE, 49, TRUE),
    ('A50', 'Data prima iscrizione', 'Data della prima iscrizione nel registro, albo o elenco applicabile.', 'DATA', NULL, NULL, NULL, FALSE, 50, TRUE),
    ('A51', 'Data scadenza', 'Data di scadenza dell''incarico, qualifica o iscrizione.', 'DATA', NULL, NULL, NULL, FALSE, 51, TRUE),
    ('A52', 'Tipo di soggetto', 'Indica se il titolare della partecipazione è una persona fisica o un altro tipo di soggetto. Oggi limitato a PERSONA: i soggetti diversi dalla persona fisica non sono ancora supportati dal ruolo Socio.', 'CATALOGO', NULL, '["PERSONA"]'::jsonb, NULL, FALSE, 52, TRUE),
    ('A53', 'Quota nominale', 'Valore nominale della quota o delle azioni attribuite al socio.', 'NUMERO', 'EUR', NULL, NULL, FALSE, 53, TRUE),
    ('A54', 'Percentuale di partecipazione', 'Incidenza della partecipazione sul capitale sociale, da 0 a 100.', 'NUMERO', '%', NULL, NULL, FALSE, 54, TRUE),
    ('A55', 'Tipo di diritto', 'Natura del diritto esercitato sulla partecipazione.', 'CATALOGO', NULL, '["PROPRIETA", "NUDA_PROPRIETA", "USUFRUTTO", "PEGNO", "SEQUESTRO", "INTESTAZIONE_FIDUCIARIA", "COMPROPRIETA", "ALTRO"]'::jsonb, NULL, FALSE, 55, TRUE),
    ('A56', 'Valore versato', 'Parte del valore nominale della partecipazione già versata dal socio.', 'NUMERO', 'EUR', NULL, NULL, FALSE, 56, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    tipo_dato              = EXCLUDED.tipo_dato,
    unita_misura           = EXCLUDED.unita_misura,
    valori_ammessi         = EXCLUDED.valori_ammessi,
    regola_validazione     = EXCLUDED.regola_validazione,
    sensibile              = EXCLUDED.sensibile,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_caratteristiche_incarico IS
    'Catalogo configurabile delle caratteristiche A01-A51 utilizzabili nei ruoli e negli incarichi.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_caratteristiche_incarico_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_caratteristiche_incarico_set_updated_at() IS
    'Aggiorna cat_caratteristiche_incarico.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_caratteristiche_incarico_set_updated_at
    ON cat_caratteristiche_incarico;

CREATE TRIGGER trg_cat_caratteristiche_incarico_set_updated_at
BEFORE UPDATE ON cat_caratteristiche_incarico
FOR EACH ROW
EXECUTE FUNCTION fn_cat_caratteristiche_incarico_set_updated_at();


/*
-------------------------------------------------------------------------------
 VOCE: CATALOGO DELLE CARATTERISTICHE
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice,
    modulo_id,
    elemento_padre_id,
    tipo_elemento,
    denominazione,
    descrizione,
    schema_database,
    nome_tabella,
    nome_colonna,
    attivo
)
SELECT
    'PERSONALE.RUOLI_INCARICHI.CATALOGO_CARATTERISTICHE',
    m.id,
    p.id,
    'SOTTOSEZIONE',
    'Catalogo delle caratteristiche',
    'Catalogo configurabile delle caratteristiche utilizzate per costruire dinamicamente le schede dei ruoli e degli incarichi.',
    'public',
    'cat_caratteristiche_incarico',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.RUOLI_INCARICHI'
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id         = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento     = EXCLUDED.tipo_elemento,
    denominazione     = EXCLUDED.denominazione,
    descrizione       = EXCLUDED.descrizione,
    schema_database   = EXCLUDED.schema_database,
    nome_tabella      = EXCLUDED.nome_tabella,
    nome_colonna      = EXCLUDED.nome_colonna,
    attivo            = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 ELEMENTI DEL CATALOGO
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice,
    modulo_id,
    elemento_padre_id,
    tipo_elemento,
    denominazione,
    descrizione,
    schema_database,
    nome_tabella,
    nome_colonna,
    attivo
)
SELECT
    'PERSONALE.RUOLI_INCARICHI.CATALOGO_CARATTERISTICHE.' || c.codice,
    m.id,
    p.id,
    'FUNZIONALITA',
    c.denominazione,
    c.descrizione,
    'public',
    'cat_caratteristiche_incarico',
    'codice',
    c.attivo
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.RUOLI_INCARICHI.CATALOGO_CARATTERISTICHE'
CROSS JOIN cat_caratteristiche_incarico AS c
WHERE m.codice = 'PERSONALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id         = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento     = EXCLUDED.tipo_elemento,
    denominazione     = EXCLUDED.denominazione,
    descrizione       = EXCLUDED.descrizione,
    schema_database   = EXCLUDED.schema_database,
    nome_tabella      = EXCLUDED.nome_tabella,
    nome_colonna      = EXCLUDED.nome_colonna,
    attivo            = EXCLUDED.attivo;


COMMIT;
