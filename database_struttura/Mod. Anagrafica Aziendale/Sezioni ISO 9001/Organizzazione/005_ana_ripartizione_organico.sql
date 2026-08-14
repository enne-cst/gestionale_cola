/*
===============================================================================
 MIGRAZIONE 005 - RIPARTIZIONE ORGANICO
===============================================================================

 Scopo
 -----
 Questa migrazione crea la tabella operativa che conserva la ripartizione
 annuale dell'organico di ciascuna azienda per ruolo, genere, nazionalità,
 durata del rapporto di lavoro e titolo di studio.

 Ogni rilevazione rappresenta la situazione al 31 dicembre dell'anno indicato.
 È ammessa una sola ripartizione per azienda e anno.

 Numeri e percentuali
 -------------------
 La tabella conserva soltanto il numero di addetti di ciascuna categoria.
 Le percentuali sono valori derivati e vengono calcolate dalla vista
 vw_ana_ripartizione_organico rispetto al campo numero_addetti della
 corrispondente rilevazione annuale in ana_dati_generali.

 Il collegamento tramite azienda_id e anno_riferimento garantisce che ogni
 ripartizione abbia la relativa rilevazione annuale dei dati generali.

 Regole di abbonamento
 ---------------------
 La voce e tutti i suoi campi sono accessibili esclusivamente con la
 certificazione ISO 9001.

 Gli indicatori descrivono caratteristiche generali dell'organico e non
 dipendono dall'attività svolta dall'azienda. La voce è quindi valida per tutti
 i settori IAF e la migrazione imposta tutti_settori_iaf = TRUE.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE
 └── ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO
     ├── ...ANNO_RIFERIMENTO
     ├── ...NUMERO_AMMINISTRATIVI / ...PERCENTUALE_AMMINISTRATIVI
     ├── ...NUMERO_PROJECT_MANAGER / ...PERCENTUALE_PROJECT_MANAGER
     ├── ...NUMERO_TECNICI / ...PERCENTUALE_TECNICI
     ├── ...NUMERO_PREPOSTI / ...PERCENTUALE_PREPOSTI
     ├── ...NUMERO_OPERATIVI / ...PERCENTUALE_OPERATIVI
     ├── ...NUMERO_DIRIGENTI_SICUREZZA / ...PERCENTUALE_DIRIGENTI_SICUREZZA
     ├── ...NUMERO_UOMINI / ...PERCENTUALE_UOMINI
     ├── ...NUMERO_DONNE / ...PERCENTUALE_DONNE
     ├── ...NUMERO_ITALIANI / ...PERCENTUALE_ITALIANI
     ├── ...NUMERO_STRANIERI / ...PERCENTUALE_STRANIERI
     ├── ...NUMERO_TEMPO_DETERMINATO / ...PERCENTUALE_TEMPO_DETERMINATO
     ├── ...NUMERO_TEMPO_INDETERMINATO / ...PERCENTUALE_TEMPO_INDETERMINATO
     ├── ...NUMERO_LAUREATI / ...PERCENTUALE_LAUREATI
     └── ...NUMERO_DIPLOMATI / ...PERCENTUALE_DIPLOMATI

 La migrazione è idempotente e non inserisce dati aziendali di esempio.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA OPERATIVA: ana_ripartizione_organico
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS ana_ripartizione_organico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    azienda_id UUID NOT NULL,
    anno_riferimento SMALLINT NOT NULL,

    numero_amministrativi INTEGER NOT NULL,
    numero_project_manager INTEGER NOT NULL,
    numero_tecnici INTEGER NOT NULL,
    numero_preposti INTEGER NOT NULL,
    numero_operativi INTEGER NOT NULL,
    numero_dirigenti_sicurezza INTEGER NOT NULL,
    numero_uomini INTEGER NOT NULL,
    numero_donne INTEGER NOT NULL,
    numero_italiani INTEGER NOT NULL,
    numero_stranieri INTEGER NOT NULL,
    numero_tempo_determinato INTEGER NOT NULL,
    numero_tempo_indeterminato INTEGER NOT NULL,
    numero_laureati INTEGER NOT NULL,
    numero_diplomati INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ana_ripartizione_organico_azienda_anno
        UNIQUE (azienda_id, anno_riferimento),

    CONSTRAINT fk_ana_ripartizione_organico_azienda
        FOREIGN KEY (azienda_id)
        REFERENCES sys_aziende(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_ana_ripartizione_organico_dati_generali
        FOREIGN KEY (azienda_id, anno_riferimento)
        REFERENCES ana_dati_generali(azienda_id, anno_riferimento)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


COMMENT ON TABLE ana_ripartizione_organico IS
    'Ripartizione annuale dell''organico al 31 dicembre.';


/*
-------------------------------------------------------------------------------
 VISTA CON LE PERCENTUALI CALCOLATE
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE VIEW vw_ana_ripartizione_organico AS
SELECT
    r.id,
    r.azienda_id,
    r.anno_riferimento,
    r.numero_amministrativi,
    ROUND(r.numero_amministrativi * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_amministrativi,
    r.numero_project_manager,
    ROUND(r.numero_project_manager * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_project_manager,
    r.numero_tecnici,
    ROUND(r.numero_tecnici * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_tecnici,
    r.numero_preposti,
    ROUND(r.numero_preposti * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_preposti,
    r.numero_operativi,
    ROUND(r.numero_operativi * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_operativi,
    r.numero_dirigenti_sicurezza,
    ROUND(r.numero_dirigenti_sicurezza * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_dirigenti_sicurezza,
    r.numero_uomini,
    ROUND(r.numero_uomini * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_uomini,
    r.numero_donne,
    ROUND(r.numero_donne * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_donne,
    r.numero_italiani,
    ROUND(r.numero_italiani * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_italiani,
    r.numero_stranieri,
    ROUND(r.numero_stranieri * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_stranieri,
    r.numero_tempo_determinato,
    ROUND(r.numero_tempo_determinato * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_tempo_determinato,
    r.numero_tempo_indeterminato,
    ROUND(r.numero_tempo_indeterminato * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_tempo_indeterminato,
    r.numero_laureati,
    ROUND(r.numero_laureati * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_laureati,
    r.numero_diplomati,
    ROUND(r.numero_diplomati * 100.0 / NULLIF(d.numero_addetti, 0), 2)
        AS percentuale_diplomati,
    r.created_at,
    r.updated_at
FROM ana_ripartizione_organico AS r
JOIN ana_dati_generali AS d
  ON d.azienda_id = r.azienda_id
 AND d.anno_riferimento = r.anno_riferimento;


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_ana_ripartizione_organico_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_ana_ripartizione_organico_set_updated_at() IS
    'Aggiorna ana_ripartizione_organico.updated_at.';

DROP TRIGGER IF EXISTS trg_ana_ripartizione_organico_set_updated_at
    ON ana_ripartizione_organico;

CREATE TRIGGER trg_ana_ripartizione_organico_set_updated_at
BEFORE UPDATE ON ana_ripartizione_organico
FOR EACH ROW
EXECUTE FUNCTION fn_ana_ripartizione_organico_set_updated_at();


/*
-------------------------------------------------------------------------------
 SEZIONE PADRE: ORGANIZZAZIONE
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
 VOCE: RIPARTIZIONE ORGANICO
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
    'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO',
    m.id,
    p.id,
    'SEZIONE',
    'Ripartizione organico',
    'Sezione contenente la ripartizione annuale dell''organico aziendale al 31 dicembre.',
    'public',
    'ana_ripartizione_organico',
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
 CAMPI INSERITI DELLA RIPARTIZIONE ORGANICO
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
    'ana_ripartizione_organico',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO'
CROSS JOIN (
    VALUES
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.ANNO_RIFERIMENTO', 'Anno di riferimento', 'Indica l''anno della rilevazione. I valori devono rappresentare la situazione dell''organico al 31 dicembre.', 'anno_riferimento'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_AMMINISTRATIVI', 'Amministrativi (n°)', 'Inserisci il numero di addetti che svolgono funzioni amministrative al 31 dicembre dell''anno di riferimento.', 'numero_amministrativi'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_PROJECT_MANAGER', 'Project manager (n°)', 'Inserisci il numero di addetti che ricoprono il ruolo di project manager al 31 dicembre dell''anno di riferimento.', 'numero_project_manager'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_TECNICI', 'Tecnici (n°)', 'Inserisci il numero di addetti che svolgono funzioni tecniche al 31 dicembre dell''anno di riferimento.', 'numero_tecnici'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_PREPOSTI', 'Preposti (n°)', 'Inserisci il numero di addetti che ricoprono il ruolo di preposto al 31 dicembre dell''anno di riferimento.', 'numero_preposti'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_OPERATIVI', 'Operativi (n°)', 'Inserisci il numero di addetti impiegati in attività operative al 31 dicembre dell''anno di riferimento.', 'numero_operativi'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_DIRIGENTI_SICUREZZA', 'Dirigenti della sicurezza (n°)', 'Inserisci il numero di addetti individuati come dirigenti ai fini della sicurezza sul lavoro.', 'numero_dirigenti_sicurezza'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_UOMINI', 'Uomini (n°)', 'Inserisci il numero di addetti di genere maschile al 31 dicembre dell''anno di riferimento.', 'numero_uomini'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_DONNE', 'Donne (n°)', 'Inserisci il numero di addetti di genere femminile al 31 dicembre dell''anno di riferimento.', 'numero_donne'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_ITALIANI', 'Italiani (n°)', 'Inserisci il numero di addetti con cittadinanza italiana al 31 dicembre dell''anno di riferimento.', 'numero_italiani'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_STRANIERI', 'Stranieri (n°)', 'Inserisci il numero di addetti con cittadinanza diversa da quella italiana al 31 dicembre dell''anno di riferimento.', 'numero_stranieri'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_TEMPO_DETERMINATO', 'Tempo determinato (n°)', 'Inserisci il numero di addetti con contratto a tempo determinato al 31 dicembre dell''anno di riferimento.', 'numero_tempo_determinato'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_TEMPO_INDETERMINATO', 'Tempo indeterminato (n°)', 'Inserisci il numero di addetti con contratto a tempo indeterminato al 31 dicembre dell''anno di riferimento.', 'numero_tempo_indeterminato'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_LAUREATI', 'Laureati (n°)', 'Inserisci il numero di addetti in possesso di un titolo di laurea al 31 dicembre dell''anno di riferimento.', 'numero_laureati'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.NUMERO_DIPLOMATI', 'Diplomati (n°)', 'Inserisci il numero di addetti in possesso di un diploma al 31 dicembre dell''anno di riferimento.', 'numero_diplomati')
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
 CAMPI CALCOLATI DELLA RIPARTIZIONE ORGANICO
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
    'vw_ana_ripartizione_organico',
    v.nome_colonna,
    TRUE
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO'
CROSS JOIN (
    VALUES
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_AMMINISTRATIVI', 'Amministrativi (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_amministrativi'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_PROJECT_MANAGER', 'Project manager (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_project_manager'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_TECNICI', 'Tecnici (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_tecnici'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_PREPOSTI', 'Preposti (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_preposti'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_OPERATIVI', 'Operativi (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_operativi'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_DIRIGENTI_SICUREZZA', 'Dirigenti della sicurezza (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_dirigenti_sicurezza'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_UOMINI', 'Uomini (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_uomini'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_DONNE', 'Donne (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_donne'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_ITALIANI', 'Italiani (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_italiani'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_STRANIERI', 'Stranieri (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_stranieri'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_TEMPO_DETERMINATO', 'Tempo determinato (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_tempo_determinato'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_TEMPO_INDETERMINATO', 'Tempo indeterminato (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_tempo_indeterminato'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_LAUREATI', 'Laureati (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_laureati'),
        ('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.PERCENTUALE_DIPLOMATI', 'Diplomati (%)', 'Percentuale calcolata sul numero complessivo degli addetti della stessa azienda e dello stesso anno.', 'percentuale_diplomati')
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
 ASSOCIAZIONE A ISO 9001 E A TUTTI I SETTORI IAF
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
WHERE (
        e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE'
        OR e.codice = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO'
        OR LEFT(
               e.codice,
               LENGTH('ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.')
           ) = 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.RIPARTIZIONE_ORGANICO.'
      )
  AND c.codice = 'ISO_9001'
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
