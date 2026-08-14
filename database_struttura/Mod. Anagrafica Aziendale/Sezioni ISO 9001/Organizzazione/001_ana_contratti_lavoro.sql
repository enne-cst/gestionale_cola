/*
===============================================================================
 MIGRAZIONE - CONTRATTO DI LAVORO
===============================================================================

 Scopo
 -----
 Questa migrazione crea la prima tabella operativa della sottocategoria
 "Organizzazione aziendale": il contratto collettivo di lavoro applicato
 dall'azienda.

 Il modello concordato conserva:
 - il CCNL attualmente applicato;
 - il relativo settore;
 - la data dalla quale viene applicato;
 - l'eventuale CCNL precedente;
 - note libere.

 Non viene gestito, in questa prima versione, uno storico completo composto da
 più periodi. Una sola riga rappresenta quindi la configurazione corrente di
 una singola azienda. Il vincolo UNIQUE su azienda_id rende esplicita questa
 regola.

 Regole di abbonamento
 ---------------------
 La sezione e tutti i suoi campi sono soggetti ad abbonamento e risultano
 accessibili con la certificazione seguente:

 - ISO 9001;

 Per questa certificazione gli elementi sono validi per tutti i settori
 IAF. Per questo motivo la migrazione imposta tutti_settori_iaf = TRUE e non
 inserisce righe in rel_elementi_certificazioni_settori_iaf.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO
     ├── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_APPLICATO
     ├── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.SETTORE_CCNL
     ├── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.DATA_APPLICAZIONE
     ├── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_PRECEDENTE
     └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.NOTE

 Prerequisiti
 ------------
 La migrazione presuppone che esistano già:

 - sys_aziende(id UUID);
 - cat_moduli con il modulo codice ANAGRAFICA_AZIENDALE;
 - cat_certificazioni con il codice ISO_9001;
 - le tabelle create dalla migrazione 001_sys_elementi_certificazioni.sql.

 La migrazione è idempotente: può essere rieseguita senza duplicare elementi o
 relazioni. Non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_contratti_lavoro
-------------------------------------------------------------------------------

 Ogni riga appartiene a una sola azienda e descrive il CCNL attualmente
 applicato. Il CCNL precedente è una semplice informazione facoltativa e non
 rappresenta una seconda riga storica.
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_contratti_lavoro (
    /*
     * Identificatore tecnico interno della configurazione contrattuale.
     * Viene generato automaticamente da PostgreSQL.
     */
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    /*
     * Azienda proprietaria dei dati.
     * NOT NULL impedisce la creazione di contratti non associati a un'azienda.
     * UNIQUE, dichiarato più avanti, limita il modello a un contratto corrente
     * per azienda.
     */
    azienda_id UUID NOT NULL,

    /*
     * Denominazione del contratto collettivo attualmente applicato.
     * Esempio: "CCNL Commercio e Terziario".
     */
    ccnl_applicato VARCHAR(250) NOT NULL,

    /*
     * Settore o comparto contrattuale del CCNL.
     * È distinto dal settore IAF: il settore CCNL descrive il contratto di
     * lavoro, mentre il settore IAF partecipa soltanto alle regole di accesso.
     */
    settore_ccnl VARCHAR(200) NOT NULL,

    /*
     * Data dalla quale il CCNL corrente è applicato dall'azienda.
     * Non viene imposto che sia anteriore a CURRENT_DATE, perché il sistema può
     * dover registrare anche un'applicazione futura già programmata.
     */
    data_applicazione DATE NOT NULL,

    /*
     * Denominazione dell'eventuale CCNL applicato immediatamente prima di quello
     * corrente. NULL significa che il dato non è presente o non è applicabile.
     */
    ccnl_precedente VARCHAR(250),

    /* Annotazioni operative facoltative, senza un limite artificiale breve. */
    note TEXT,

    /* Data e ora di creazione della riga. */
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /*
     * Data e ora dell'ultima modifica.
     * Il trigger definito più avanti mantiene automaticamente questo valore.
     */
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /*
     * Una sola configurazione contrattuale corrente per azienda.
     * Il vincolo UNIQUE crea automaticamente anche l'indice utile alle ricerche
     * per azienda_id, quindi non occorre creare un secondo indice duplicato.
     */
    CONSTRAINT uq_ana_contratti_lavoro_azienda
        UNIQUE (azienda_id),

    /*
     * Il contratto non può sopravvivere senza la relativa azienda.
     * ON DELETE CASCADE elimina la riga operativa quando l'azienda viene
     * eliminata intenzionalmente.
     */
    CONSTRAINT fk_ana_contratti_lavoro_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


/*
-------------------------------------------------------------------------------
 COMMENTO MEMORIZZATO NEL CATALOGO POSTGRESQL
-------------------------------------------------------------------------------

 Il commento sulla tabella è visibile da strumenti come pgAdmin e DBeaver. Non
 modifica i dati né le regole applicative. Le descrizioni dei singoli campi
 sono invece registrate in sys_elementi e possono essere mostrate dal frontend
 tramite un pulsante informativo.
-------------------------------------------------------------------------------
*/
COMMENT ON TABLE ana_contratti_lavoro IS
    'Contratto collettivo di lavoro attualmente applicato da ciascuna azienda.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------

 La funzione viene eseguita dal trigger prima di ogni UPDATE. In questo modo il
 backend non deve ricordarsi di valorizzare updated_at manualmente.
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_contratti_lavoro_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_contratti_lavoro_set_updated_at() IS
    'Aggiorna ana_contratti_lavoro.updated_at prima di ogni modifica.';

/*
 * DROP IF EXISTS rende questa parte rieseguibile: rimuove soltanto il trigger
 * collegato alla tabella, non la funzione e non i dati aziendali.
 */
DROP TRIGGER IF EXISTS trg_ana_contratti_lavoro_set_updated_at
    ON ana_contratti_lavoro;

CREATE TRIGGER trg_ana_contratti_lavoro_set_updated_at
BEFORE UPDATE ON ana_contratti_lavoro
FOR EACH ROW
EXECUTE FUNCTION fn_ana_contratti_lavoro_set_updated_at();


/*
-------------------------------------------------------------------------------
 SEZIONE PADRE A PAGAMENTO: ORGANIZZAZIONE
-------------------------------------------------------------------------------

 ORGANIZZAZIONE non è un modulo: è una sezione interna al modulo
 ANAGRAFICA_AZIENDALE. È la radice comune che conterrà questa e le successive
 tabelle operative dell'area organizzativa.
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE',
    m.id,
    NULL,
    'SEZIONE',
    'Organizzazione',
    'Sezione organizzativa interna al modulo Anagrafica aziendale.',
    'public',
    NULL,
    NULL,
    TRUE
FROM cat_moduli AS m
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
ON CONFLICT (codice) DO UPDATE
SET modulo_id        = EXCLUDED.modulo_id,
    elemento_padre_id = EXCLUDED.elemento_padre_id,
    tipo_elemento    = EXCLUDED.tipo_elemento,
    denominazione    = EXCLUDED.denominazione,
    descrizione      = EXCLUDED.descrizione,
    schema_database  = EXCLUDED.schema_database,
    nome_tabella     = EXCLUDED.nome_tabella,
    nome_colonna     = EXCLUDED.nome_colonna,
    attivo           = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 ELEMENTO FIGLIO A PAGAMENTO: CONTRATTO DI LAVORO
-------------------------------------------------------------------------------

 La sezione Contratto di lavoro appartiene al modulo ANAGRAFICA_AZIENDALE e usa
 ORGANIZZAZIONE come elemento padre. Il riferimento tecnico riguarda l'intera
 tabella, quindi nome_colonna resta NULL.
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO',
    m.id,
    p.id,
    'SEZIONE',
    'Contratto di lavoro',
    'Sezione riservata contenente i dati del contratto collettivo applicato dall''azienda.',
    'public',
    'ana_contratti_lavoro',
    NULL,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE'
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
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
 ELEMENTI FIGLI A PAGAMENTO: I CINQUE CAMPI OPERATIVI
-------------------------------------------------------------------------------

 Ogni elemento:
 - appartiene al modulo ANAGRAFICA_AZIENDALE;
 - usa la sezione CONTRATTO_LAVORO come elemento padre;
 - punta alla propria colonna fisica nella tabella operativa;
 - possiede un codice stabile che il backend può usare per il controllo di
   accesso.
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
    v.codice,
    m.id,
    p.id,
    'CAMPO',
    v.denominazione,
    v.descrizione,
    'public',
    'ana_contratti_lavoro',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO'
CROSS JOIN (
    VALUES
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_APPLICATO',
            'CCNL applicato',
            'Inserisci la denominazione completa del contratto collettivo attualmente applicato, ad esempio "CCNL Commercio e Terziario".',
            'ccnl_applicato'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.SETTORE_CCNL',
            'Settore CCNL',
            'Inserisci il settore o comparto indicato nel CCNL applicato. Non inserire il settore IAF.',
            'settore_ccnl'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.DATA_APPLICAZIONE',
            'Data di applicazione',
            'Indica la data dalla quale il CCNL corrente viene applicato dall''azienda.',
            'data_applicazione'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_PRECEDENTE',
            'Eventuale CCNL precedente',
            'Inserisci la denominazione del CCNL applicato prima di quello corrente. Lascia vuoto se non presente.',
            'ccnl_precedente'
        ),
        (
            'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.NOTE',
            'Note',
            'Inserisci eventuali informazioni aggiuntive utili sul contratto di lavoro. Il campo è facoltativo.',
            'note'
        )
) AS v(codice, denominazione, descrizione, nome_colonna)
WHERE m.codice = 'ANAGRAFICA_AZIENDALE'
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
 ASSOCIAZIONE ALLE CERTIFICAZIONI E A TUTTI I SETTORI IAF
-------------------------------------------------------------------------------

 Il CROSS JOIN genera le 7 regole necessarie:

   7 elementi × 1 certificazione = 7 associazioni.

 Per ogni elemento vale la regola:

   certificazione posseduta AND settore IAF compatibile.

 Poiché tutti_settori_iaf è TRUE, qualunque settore IAF dell'azienda è
 compatibile con la regola.
-------------------------------------------------------------------------------
*/
INSERT INTO rel_elementi_certificazioni (
    elemento_id,
    certificazione_id,
    tutti_settori_iaf
)
SELECT
    e.id,
    c.id,
    TRUE
FROM sys_elementi AS e
CROSS JOIN cat_certificazioni AS c
WHERE e.codice IN (
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_APPLICATO',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.SETTORE_CCNL',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.DATA_APPLICAZIONE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.CCNL_PRECEDENTE',
      'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.CONTRATTO_LAVORO.NOTE'
  )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
