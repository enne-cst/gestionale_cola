/*
===============================================================================
 MIGRAZIONE 018 - DOSSIER PERSONALE (Correzione, struttura "Persona e rapporto")
===============================================================================

 Scopo
 -----
 Colonne aggiuntive su ana_persone per il contenitore espandibile "Dossier
 personale" della sottosezione Persona e rapporto (modulo Personale §12.3):
 anagrafica completa, residenza/domicilio, contatti di emergenza, lingua e
 comprensione, documenti personali. I "Dettagli contrattuali" del dossier
 non richiedono nuove colonne: sono gia' tutti presenti su
 per_rapporti_azienda (tipo_rapporto_id, data_fine_prevista, tempo_lavoro,
 percentuale_part_time, ccnl, livello_inquadramento - migrazione 011).

 Decisioni confermate dall'utente prima di scrivere questa migrazione
 ----------------------------------------------------------------------
 - Sesso, cittadinanza (nazionalita) e comprensione della lingua italiana
   (conoscenza_lingua_italiana) sono RIUSATE cosi' come sono: colonne testo
   libero gia' esistenti (migrazione 001), condivise col motore CCIAA
   (Soci/Amministratori/Sindaci). Nessun catalogo dedicato viene creato ora:
   i valori fissi richiesti dal prototipo restano un vincolo applicativo
   (frontend + validazione Pydantic), non uno schema DB.
 - Residenza strutturata: ana_persone.residenza (testo libero) e' oggi usata
   anche dal motore CCIAA (schemas.personale.AnaPersoneCreate/Update,
   PersonaSummary, form rapido in persona-picker.tsx, etichetta "Domicilio").
   L'utente ha scelto esplicitamente di migrare anche quell'uso sulle nuove
   colonne strutturate (invece di duplicare mantenendo "residenza" invariata
   per il CCIAA): la colonna "residenza" resta fisicamente nella tabella (non
   viene eliminata, nessuna perdita dati) ma smette di essere letta/scritta
   da qualunque schema applicativo da questa migrazione in poi - sostituita
   da indirizzo_residenza (piu' comune/provincia/CAP, prima assenti anche nel
   CCIAA). Backfill best-effort piu' sotto: essendo testo libero non
   strutturato, il valore intero migra in indirizzo_residenza, comune/CAP/
   provincia restano da compilare manualmente dove servano.
 - Permesso di soggiorno: stato dedicato con valori fissi (NON_INDICATO /
   NON_APPLICABILE / POSSEDUTO) via CHECK, stesso stile gia' in uso per
   per_rapporti_azienda.stato - "non applicabile" non e' mai equiparato a
   "mancante" (NON_INDICATO), come richiesto esplicitamente dalla
   correzione.
 - Domicilio diverso dalla residenza: le colonne domicilio_* NON hanno un
   CHECK che le forzi a NULL quando domicilio_coincide_residenza e' TRUE -
   la correzione vieta esplicitamente di cancellare automaticamente dati
   gia' registrati per un domicilio diverso senza conferma; la scelta se
   ignorarli in lettura resta applicativa.

 Cardinalita e regole di abbonamento
 ------------------------------------
 1:1 con ana_persone (stesse regole di accesso: ISO_9001 + ISO_45001, tutti
 i settori IAF), nessuna nuova tabella.

 Idempotente: rieseguibile senza effetti aggiuntivi.
===============================================================================
*/

BEGIN;


ALTER TABLE ana_persone
    ADD COLUMN IF NOT EXISTS matricola_interna VARCHAR(50),
    ADD COLUMN IF NOT EXISTS provincia_nascita VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stato_nascita VARCHAR(100),

    ADD COLUMN IF NOT EXISTS indirizzo_residenza VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cap_residenza VARCHAR(10),
    ADD COLUMN IF NOT EXISTS comune_residenza VARCHAR(150),
    ADD COLUMN IF NOT EXISTS provincia_residenza VARCHAR(100),
    ADD COLUMN IF NOT EXISTS domicilio_coincide_residenza BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS indirizzo_domicilio VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cap_domicilio VARCHAR(10),
    ADD COLUMN IF NOT EXISTS comune_domicilio VARCHAR(150),
    ADD COLUMN IF NOT EXISTS provincia_domicilio VARCHAR(100),

    ADD COLUMN IF NOT EXISTS contatto_emergenza_nome VARCHAR(200),
    ADD COLUMN IF NOT EXISTS contatto_emergenza_relazione VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contatto_emergenza_telefono VARCHAR(50),

    ADD COLUMN IF NOT EXISTS lingua_madre VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supporto_linguistico_necessario BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS altre_lingue TEXT,

    ADD COLUMN IF NOT EXISTS tipo_documento_identita VARCHAR(100),
    ADD COLUMN IF NOT EXISTS numero_documento_identita VARCHAR(100),
    ADD COLUMN IF NOT EXISTS scadenza_documento_identita DATE,
    ADD COLUMN IF NOT EXISTS permesso_soggiorno_stato VARCHAR(20) NOT NULL DEFAULT 'NON_INDICATO',
    ADD COLUMN IF NOT EXISTS permesso_soggiorno_dettaglio VARCHAR(200);

ALTER TABLE ana_persone
    DROP CONSTRAINT IF EXISTS chk_ana_persone_permesso_soggiorno_stato;

ALTER TABLE ana_persone
    ADD CONSTRAINT chk_ana_persone_permesso_soggiorno_stato
        CHECK (permesso_soggiorno_stato IN ('NON_INDICATO', 'NON_APPLICABILE', 'POSSEDUTO'));


-- Backfill best-effort: "residenza" era un unico campo di testo libero, non
-- scomponibile in modo affidabile - il suo intero contenuto migra come
-- indirizzo di residenza, senza inventare comune/CAP/provincia.
UPDATE ana_persone
SET indirizzo_residenza = residenza
WHERE residenza IS NOT NULL
  AND indirizzo_residenza IS NULL;

COMMENT ON COLUMN ana_persone.residenza IS
    'Superata dalla migrazione 018 (indirizzo_residenza + comune/CAP/provincia strutturati). Colonna mantenuta per non perdere dati storici, non piu'' letta ne'' scritta da alcuno schema applicativo.';


/*
-------------------------------------------------------------------------------
 REGISTRAZIONE CAMPI IN sys_elementi (stessa grana per-campo di ana_persone,
 vedi migrazione 001)
-------------------------------------------------------------------------------
*/
INSERT INTO sys_elementi (
    codice, modulo_id, elemento_padre_id, tipo_elemento, denominazione,
    descrizione, schema_database, nome_tabella, nome_colonna, attivo
)
SELECT
    v.codice, m.id, p.id, 'CAMPO', v.denominazione, v.descrizione,
    'public', 'ana_persone', v.nome_colonna, TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.ANAGRAFICA_PERSONE'
CROSS JOIN (
    VALUES
        ('PERSONALE.ANAGRAFICA_PERSONE.MATRICOLA_INTERNA', 'Matricola interna',
         'Codice identificativo interno assegnato dall''azienda alla persona.', 'matricola_interna'),
        ('PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_NASCITA', 'Provincia di nascita',
         'Provincia del luogo di nascita della persona.', 'provincia_nascita'),
        ('PERSONALE.ANAGRAFICA_PERSONE.STATO_NASCITA', 'Stato di nascita',
         'Stato estero o Italia in cui e'' nata la persona, distinto dalla cittadinanza.', 'stato_nascita'),

        ('PERSONALE.ANAGRAFICA_PERSONE.INDIRIZZO_RESIDENZA', 'Indirizzo di residenza',
         'Via e numero civico di residenza della persona.', 'indirizzo_residenza'),
        ('PERSONALE.ANAGRAFICA_PERSONE.CAP_RESIDENZA', 'CAP di residenza',
         'Codice di avviamento postale della residenza.', 'cap_residenza'),
        ('PERSONALE.ANAGRAFICA_PERSONE.COMUNE_RESIDENZA', 'Comune di residenza',
         'Comune di residenza della persona.', 'comune_residenza'),
        ('PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_RESIDENZA', 'Provincia di residenza',
         'Provincia di residenza della persona.', 'provincia_residenza'),
        ('PERSONALE.ANAGRAFICA_PERSONE.DOMICILIO_COINCIDE_RESIDENZA', 'Il domicilio coincide con la residenza',
         'Indica se il domicilio della persona coincide con la residenza dichiarata.', 'domicilio_coincide_residenza'),
        ('PERSONALE.ANAGRAFICA_PERSONE.INDIRIZZO_DOMICILIO', 'Indirizzo di domicilio',
         'Via e numero civico del domicilio, se diverso dalla residenza.', 'indirizzo_domicilio'),
        ('PERSONALE.ANAGRAFICA_PERSONE.CAP_DOMICILIO', 'CAP di domicilio',
         'Codice di avviamento postale del domicilio, se diverso dalla residenza.', 'cap_domicilio'),
        ('PERSONALE.ANAGRAFICA_PERSONE.COMUNE_DOMICILIO', 'Comune di domicilio',
         'Comune di domicilio, se diverso dalla residenza.', 'comune_domicilio'),
        ('PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_DOMICILIO', 'Provincia di domicilio',
         'Provincia di domicilio, se diversa dalla residenza.', 'provincia_domicilio'),

        ('PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_NOME', 'Contatto di emergenza',
         'Nominativo della persona di riferimento in caso di emergenza. Puo'' essere un contatto esterno non registrato come persona a se'' stante.', 'contatto_emergenza_nome'),
        ('PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_RELAZIONE', 'Relazione con la persona',
         'Relazione tra la persona e il contatto di emergenza indicato.', 'contatto_emergenza_relazione'),
        ('PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_TELEFONO', 'Telefono del contatto di emergenza',
         'Recapito telefonico del contatto di emergenza.', 'contatto_emergenza_telefono'),

        ('PERSONALE.ANAGRAFICA_PERSONE.LINGUA_MADRE', 'Lingua madre',
         'Lingua madre della persona.', 'lingua_madre'),
        ('PERSONALE.ANAGRAFICA_PERSONE.SUPPORTO_LINGUISTICO_NECESSARIO', 'Supporto linguistico necessario',
         'Indica se la persona necessita di supporto linguistico per la formazione e le istruzioni operative.', 'supporto_linguistico_necessario'),
        ('PERSONALE.ANAGRAFICA_PERSONE.ALTRE_LINGUE', 'Altre lingue',
         'Altre lingue conosciute dalla persona.', 'altre_lingue'),

        ('PERSONALE.ANAGRAFICA_PERSONE.TIPO_DOCUMENTO_IDENTITA', 'Tipo di documento di identita''',
         'Tipologia del documento di identita'' della persona.', 'tipo_documento_identita'),
        ('PERSONALE.ANAGRAFICA_PERSONE.NUMERO_DOCUMENTO_IDENTITA', 'Numero del documento',
         'Numero del documento di identita''.', 'numero_documento_identita'),
        ('PERSONALE.ANAGRAFICA_PERSONE.SCADENZA_DOCUMENTO_IDENTITA', 'Scadenza del documento',
         'Data di scadenza del documento di identita''.', 'scadenza_documento_identita'),
        ('PERSONALE.ANAGRAFICA_PERSONE.PERMESSO_SOGGIORNO_STATO', 'Permesso di soggiorno',
         'Stato del permesso di soggiorno: non indicato, non applicabile oppure posseduto. "Non applicabile" non e'' equiparato a un dato mancante.', 'permesso_soggiorno_stato'),
        ('PERSONALE.ANAGRAFICA_PERSONE.PERMESSO_SOGGIORNO_DETTAGLIO', 'Estremi del permesso di soggiorno',
         'Estremi facoltativi del permesso di soggiorno posseduto.', 'permesso_soggiorno_dettaglio')
) AS v(codice, denominazione, descrizione, nome_colonna)
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


INSERT INTO rel_elementi_certificazioni (elemento_id, certificazione_id, tutti_settori_iaf)
SELECT e.id, c.id, TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE e.codice IN (
        'PERSONALE.ANAGRAFICA_PERSONE.MATRICOLA_INTERNA',
        'PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_NASCITA',
        'PERSONALE.ANAGRAFICA_PERSONE.STATO_NASCITA',
        'PERSONALE.ANAGRAFICA_PERSONE.INDIRIZZO_RESIDENZA',
        'PERSONALE.ANAGRAFICA_PERSONE.CAP_RESIDENZA',
        'PERSONALE.ANAGRAFICA_PERSONE.COMUNE_RESIDENZA',
        'PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_RESIDENZA',
        'PERSONALE.ANAGRAFICA_PERSONE.DOMICILIO_COINCIDE_RESIDENZA',
        'PERSONALE.ANAGRAFICA_PERSONE.INDIRIZZO_DOMICILIO',
        'PERSONALE.ANAGRAFICA_PERSONE.CAP_DOMICILIO',
        'PERSONALE.ANAGRAFICA_PERSONE.COMUNE_DOMICILIO',
        'PERSONALE.ANAGRAFICA_PERSONE.PROVINCIA_DOMICILIO',
        'PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_NOME',
        'PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_RELAZIONE',
        'PERSONALE.ANAGRAFICA_PERSONE.CONTATTO_EMERGENZA_TELEFONO',
        'PERSONALE.ANAGRAFICA_PERSONE.LINGUA_MADRE',
        'PERSONALE.ANAGRAFICA_PERSONE.SUPPORTO_LINGUISTICO_NECESSARIO',
        'PERSONALE.ANAGRAFICA_PERSONE.ALTRE_LINGUE',
        'PERSONALE.ANAGRAFICA_PERSONE.TIPO_DOCUMENTO_IDENTITA',
        'PERSONALE.ANAGRAFICA_PERSONE.NUMERO_DOCUMENTO_IDENTITA',
        'PERSONALE.ANAGRAFICA_PERSONE.SCADENZA_DOCUMENTO_IDENTITA',
        'PERSONALE.ANAGRAFICA_PERSONE.PERMESSO_SOGGIORNO_STATO',
        'PERSONALE.ANAGRAFICA_PERSONE.PERMESSO_SOGGIORNO_DETTAGLIO'
    )
  AND c.codice IN ('ISO_9001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
