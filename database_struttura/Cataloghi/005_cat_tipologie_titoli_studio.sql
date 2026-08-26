/*
===============================================================================
 MIGRAZIONE 005 - CATALOGO DELLE TIPOLOGIE DI TITOLO DI STUDIO
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo utilizzato dal menu a tendina del campo
 "Tipologia del titolo" nella sezione Titoli di studio del modulo Personale.

 Il catalogo contiene una classificazione iniziale dei principali titoli
 scolastici, professionali, tecnici superiori, accademici e universitari.
 Rimane estendibile mediante l'inserimento di nuove righe, senza modificare la
 struttura della tabella operativa che registra i titoli delle persone.

 Regole di abbonamento
 ---------------------
 Il catalogo e tutti i suoi valori sono accessibili con:
 - ISO 9001;
 - ISO 14001;
 - ISO 45001.

 Tutti gli elementi sono validi per tutti i settori IAF.

 Prerequisiti
 ------------
 - cat_moduli con codice PERSONALE;
 - cat_certificazioni con codici ISO_9001, ISO_14001 e ISO_45001;
 - sys_elementi e rel_elementi_certificazioni.

 La migrazione e' idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_tipologie_titoli_studio
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_tipologie_titoli_studio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(80) NOT NULL,
    denominazione VARCHAR(250) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_tipologie_titoli_studio_codice
        UNIQUE (codice)
);


INSERT INTO cat_tipologie_titoli_studio (
    codice,
    denominazione,
    categoria,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('NESSUN_TITOLO', 'Nessun titolo di studio', 'NESSUNO', 'Consente di registrare esplicitamente l''assenza di un titolo di studio.', 1, TRUE),
    ('LICENZA_PRIMARIA', 'Licenza di scuola primaria', 'SCOLASTICO', 'Titolo conclusivo della scuola primaria.', 2, TRUE),
    ('LICENZA_SECONDARIA_PRIMO_GRADO', 'Licenza di scuola secondaria di primo grado', 'SCOLASTICO', 'Titolo conclusivo del primo ciclo di istruzione.', 3, TRUE),
    ('QUALIFICA_PROFESSIONALE', 'Qualifica professionale', 'PROFESSIONALE', 'Qualifica conseguita al termine di un percorso di istruzione o formazione professionale.', 4, TRUE),
    ('DIPLOMA_PROFESSIONALE', 'Diploma professionale', 'PROFESSIONALE', 'Diploma conseguito nell''ambito dell''istruzione e formazione professionale.', 5, TRUE),
    ('DIPLOMA_SECONDARIA_SECONDO_GRADO', 'Diploma di scuola secondaria di secondo grado', 'SCOLASTICO', 'Diploma di maturità o altro diploma conclusivo della scuola secondaria di secondo grado.', 6, TRUE),
    ('SPECIALIZZAZIONE_TECNICA_SUPERIORE_IFTS', 'Certificato di specializzazione tecnica superiore (IFTS)', 'TECNICO_SUPERIORE', 'Titolo rilasciato al termine di un percorso IFTS.', 7, TRUE),
    ('DIPLOMA_ITS_ACADEMY', 'Diploma ITS Academy', 'TECNICO_SUPERIORE', 'Diploma di specializzazione per le tecnologie applicate rilasciato da un ITS Academy.', 8, TRUE),
    ('DIPLOMA_ACCADEMICO_PRIMO_LIVELLO', 'Diploma accademico di primo livello (AFAM)', 'AFAM', 'Diploma accademico di primo livello dell''Alta Formazione Artistica, Musicale e Coreutica.', 9, TRUE),
    ('DIPLOMA_ACCADEMICO_SECONDO_LIVELLO', 'Diploma accademico di secondo livello (AFAM)', 'AFAM', 'Diploma accademico di secondo livello dell''Alta Formazione Artistica, Musicale e Coreutica.', 10, TRUE),
    ('LAUREA_TRIENNALE', 'Laurea triennale', 'UNIVERSITARIO', 'Titolo universitario di primo ciclo.', 11, TRUE),
    ('LAUREA_MAGISTRALE', 'Laurea magistrale', 'UNIVERSITARIO', 'Titolo universitario di secondo ciclo.', 12, TRUE),
    ('LAUREA_MAGISTRALE_CICLO_UNICO', 'Laurea magistrale a ciclo unico', 'UNIVERSITARIO', 'Titolo universitario conseguito al termine di un corso di laurea magistrale a ciclo unico.', 13, TRUE),
    ('LAUREA_VECCHIO_ORDINAMENTO', 'Laurea del vecchio ordinamento', 'UNIVERSITARIO', 'Titolo universitario conseguito secondo l''ordinamento previgente alla riforma dei cicli universitari.', 14, TRUE),
    ('MASTER_UNIVERSITARIO_PRIMO_LIVELLO', 'Master universitario di primo livello', 'POST_LAUREA', 'Titolo universitario post laurea di primo livello.', 15, TRUE),
    ('MASTER_UNIVERSITARIO_SECONDO_LIVELLO', 'Master universitario di secondo livello', 'POST_LAUREA', 'Titolo universitario post laurea di secondo livello.', 16, TRUE),
    ('DIPLOMA_SPECIALIZZAZIONE', 'Diploma di specializzazione', 'POST_LAUREA', 'Titolo conseguito al termine di una scuola o di un corso di specializzazione.', 17, TRUE),
    ('DOTTORATO_RICERCA', 'Dottorato di ricerca', 'POST_LAUREA', 'Titolo universitario di formazione alla ricerca.', 18, TRUE),
    ('TITOLO_ESTERO', 'Titolo di studio estero', 'ESTERO', 'Titolo conseguito all''estero, eventualmente riconosciuto o dichiarato equivalente in Italia.', 19, TRUE),
    ('ALTRO', 'Altro titolo di studio', 'ALTRO', 'Tipologia residuale da utilizzare quando il titolo non rientra nelle classificazioni disponibili.', 20, TRUE)
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    categoria              = EXCLUDED.categoria,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_tipologie_titoli_studio IS
    'Catalogo estendibile delle tipologie selezionabili per i titoli di studio delle persone.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_tipologie_titoli_studio_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_tipologie_titoli_studio_set_updated_at() IS
    'Aggiorna cat_tipologie_titoli_studio.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_tipologie_titoli_studio_set_updated_at
    ON cat_tipologie_titoli_studio;

CREATE TRIGGER trg_cat_tipologie_titoli_studio_set_updated_at
BEFORE UPDATE ON cat_tipologie_titoli_studio
FOR EACH ROW
EXECUTE FUNCTION fn_cat_tipologie_titoli_studio_set_updated_at();


/*
-------------------------------------------------------------------------------
 REGISTRAZIONE DEL CATALOGO IN sys_elementi
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
    'PERSONALE.CATALOGO_TIPOLOGIE_TITOLO_STUDIO',
    m.id,
    NULL,
    'CATALOGO',
    'Catalogo tipologie dei titoli di studio',
    'Elenco configurabile utilizzato dal menu a tendina Tipologia del titolo.',
    'public',
    'cat_tipologie_titoli_studio',
    NULL,
    TRUE
FROM cat_moduli AS m
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
 VALORI DEL CATALOGO
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
    'PERSONALE.CATALOGO_TIPOLOGIE_TITOLO_STUDIO.' || t.codice,
    m.id,
    p.id,
    'FUNZIONALITA',
    t.denominazione,
    t.descrizione,
    'public',
    'cat_tipologie_titoli_studio',
    'codice',
    t.attivo
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.CATALOGO_TIPOLOGIE_TITOLO_STUDIO'
CROSS JOIN cat_tipologie_titoli_studio AS t
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
 ASSOCIAZIONE A ISO 9001, ISO 14001 E ISO 45001 PER TUTTI I SETTORI IAF
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
       e.codice = 'PERSONALE.CATALOGO_TIPOLOGIE_TITOLO_STUDIO'
       OR e.codice LIKE 'PERSONALE.CATALOGO_TIPOLOGIE_TITOLO_STUDIO.%'
  )
  AND c.codice IN ('ISO_9001', 'ISO_14001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
