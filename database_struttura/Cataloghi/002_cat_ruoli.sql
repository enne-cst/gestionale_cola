/*
===============================================================================
 MIGRAZIONE 002 - CATALOGO DEI RUOLI
===============================================================================

 Scopo
 -----
 Questa migrazione crea il catalogo generale dei ruoli utilizzabili nel modulo
 Personale. Il catalogo è estendibile tramite l'inserimento di nuove righe,
 senza modificare la struttura della piattaforma.

 La migrazione inserisce i 34 ruoli della configurazione iniziale e registra
 ciascun ruolo in sys_elementi. Il codice documento R001-R034 consente di
 collegare senza ambiguita' ogni ruolo alla propria configurazione di
 caratteristiche. Le associazioni a certificazioni e settori IAF sono
 applicate alla singola voce del catalogo.

 Regole IAF specifiche
 ---------------------
 - Responsabile Cyber Security: IAF 33;
 - Capocantiere: IAF 28;
 - DGSA: IAF 31;
 - Responsabile Logistica: IAF 31;
 - Direttore Tecnico SOA: IAF 28;
 - Responsabile Tecnico Officina: IAF 29.

 Tutti gli altri ruoli sono validi per tutti i settori IAF previsti dalle
 rispettive certificazioni.

 Gerarchia registrata in sys_elementi
 ------------------------------------

 PERSONALE.RUOLI_INCARICHI
 └── PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI
     ├── ...LEGALE_RAPPRESENTANTE
     ├── ...DATORE_LAVORO
     ├── ...AMMINISTRATORE
     └── ... ulteriori ruoli del catalogo

 Prerequisiti
 ------------
 - cat_moduli con codice PERSONALE;
 - cat_certificazioni con codici ISO_9001, ISO_14001 e ISO_45001;
 - cat_settori_iaf con denominazioni IAF 28, IAF 29, IAF 31 e IAF 33;
 - sys_elementi, rel_elementi_certificazioni e
   rel_elementi_certificazioni_settori_iaf.

 La migrazione è idempotente e non inserisce incarichi assegnati alle persone.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_ruoli
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_ruoli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    codice_documento VARCHAR(10),
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    ruolo_sistema BOOLEAN NOT NULL DEFAULT TRUE,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_ruoli_codice
        UNIQUE (codice)
);

ALTER TABLE cat_ruoli
    ADD COLUMN IF NOT EXISTS codice_documento VARCHAR(10);


INSERT INTO cat_ruoli (
    codice,
    codice_documento,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    ruolo_sistema,
    attivo
)
VALUES
    ('LEGALE_RAPPRESENTANTE', 'R001', 'Legale Rappresentante', 'Soggetto dotato della rappresentanza legale dell''azienda.', 1, TRUE, TRUE),
    ('DATORE_LAVORO', 'R002', 'Datore di Lavoro', 'Soggetto titolare del rapporto di lavoro e dei poteri decisionali e di spesa in materia di sicurezza.', 2, TRUE, TRUE),
    ('AMMINISTRATORE', 'R003', 'Amministratore', 'Componente dell''organo amministrativo dell''azienda.', 3, TRUE, TRUE),
    ('DIRIGENTE', 'R004', 'Dirigente', 'Soggetto che attua le direttive del datore di lavoro organizzando l''attività e vigilando su di essa.', 4, TRUE, TRUE),
    ('PROCURATORE', 'R005', 'Procuratore', 'Soggetto al quale sono conferiti poteri di rappresentanza mediante procura.', 5, TRUE, TRUE),
    ('RGQ', 'R006', 'Responsabile Gestione Qualità (RGQ)', 'Responsabile del sistema di gestione per la qualità.', 6, TRUE, TRUE),
    ('RGI', 'R007', 'Responsabile Gestione Integrata (RGI)', 'Responsabile del sistema di gestione integrato.', 7, TRUE, TRUE),
    ('AUDITOR_INTERNO', 'R008', 'Auditor Interno', 'Persona incaricata di svolgere audit interni sui sistemi di gestione.', 8, TRUE, TRUE),
    ('RSPP', 'R009', 'RSPP', 'Responsabile del Servizio di Prevenzione e Protezione.', 9, TRUE, TRUE),
    ('ASPP', 'R010', 'ASPP', 'Addetto al Servizio di Prevenzione e Protezione.', 10, TRUE, TRUE),
    ('RLS', 'R011', 'RLS', 'Rappresentante dei Lavoratori per la Sicurezza.', 11, TRUE, TRUE),
    ('PREPOSTO', 'R012', 'Preposto', 'Persona che sovrintende all''attività lavorativa e garantisce l''attuazione delle direttive ricevute.', 12, TRUE, TRUE),
    ('ADDETTO_ANTINCENDIO', 'R013', 'Addetto Antincendio', 'Addetto incaricato della prevenzione incendi e della gestione delle emergenze antincendio.', 13, TRUE, TRUE),
    ('ADDETTO_PRIMO_SOCCORSO', 'R014', 'Addetto Primo Soccorso', 'Addetto incaricato delle misure di primo soccorso aziendale.', 14, TRUE, TRUE),
    ('MEDICO_COMPETENTE', 'R015', 'Medico Competente', 'Medico incaricato della sorveglianza sanitaria nei casi previsti.', 15, TRUE, TRUE),
    ('PES', 'R016', 'PES', 'Persona Esperta ai fini dei lavori elettrici.', 16, TRUE, TRUE),
    ('PAV', 'R017', 'PAV', 'Persona Avvertita ai fini dei lavori elettrici.', 17, TRUE, TRUE),
    ('PEI', 'R018', 'PEI', 'Persona Idonea ai lavori elettrici sotto tensione.', 18, TRUE, TRUE),
    ('RESPONSABILE_RENTRI', 'R019', 'Responsabile RENTRI', 'Responsabile degli adempimenti aziendali connessi al RENTRI.', 19, TRUE, TRUE),
    ('RESPONSABILE_AMBIENTALE', 'R020', 'Responsabile Ambientale', 'Responsabile degli aspetti e degli adempimenti ambientali dell''azienda.', 20, TRUE, TRUE),
    ('RESPONSABILE_WHISTLEBLOWING', 'R021', 'Responsabile Whistleblowing', 'Responsabile della gestione delle segnalazioni whistleblowing.', 21, TRUE, TRUE),
    ('RESPONSABILE_SECURITY', 'R022', 'Responsabile Security', 'Responsabile della sicurezza organizzativa e della protezione aziendale.', 22, TRUE, TRUE),
    ('RESPONSABILE_CYBER_SECURITY', 'R023', 'Responsabile Cyber Security', 'Responsabile della sicurezza informatica e della protezione dei sistemi digitali.', 23, TRUE, TRUE),
    ('CAPOCANTIERE', 'R024', 'Capocantiere', 'Responsabile operativo del coordinamento delle attività di cantiere.', 24, TRUE, TRUE),
    ('DGSA', 'R025', 'DGSA', 'Consulente per la sicurezza del trasporto di merci pericolose.', 25, TRUE, TRUE),
    ('RESPONSABILE_LOGISTICA', 'R026', 'Responsabile Logistica', 'Responsabile dell''organizzazione e del coordinamento delle attività logistiche.', 26, TRUE, TRUE),
    ('DIRETTORE_TECNICO_SOA', 'R027', 'Direttore Tecnico SOA (DT SOA)', 'Direttore tecnico rilevante ai fini della qualificazione SOA.', 27, TRUE, TRUE),
    ('RESPONSABILE_TECNICO_OFFICINA', 'R028', 'Responsabile Tecnico Officina Autoriparazione (RT)', 'Responsabile tecnico delle attività di officina.', 28, TRUE, TRUE),
    ('RESPONSABILE_FER', 'R029', 'Responsabile Tecnico FER', 'Responsabile tecnico delle attività connesse alle fonti di energia rinnovabile.', 29, TRUE, TRUE),
    ('OPERAIO', 'R030', 'Operaio', 'Lavoratore operativo al quale possono essere attribuite caratteristiche essenziali di incarico.', 30, TRUE, TRUE),
    ('AMMINISTRATORE_DELEGATO', 'R031', 'Amministratore Delegato', 'Amministratore al quale sono state conferite deleghe gestionali.', 31, TRUE, TRUE),
    ('COMPONENTE_CDA', 'R032', 'Componente (CDA)', 'Componente del Consiglio di Amministrazione.', 32, TRUE, TRUE),
    ('SINDACO', 'R033', 'Sindaco', 'Componente dell''organo di controllo societario.', 33, TRUE, TRUE),
    ('REVISORE_LEGALE', 'R034', 'Revisore Legale', 'Soggetto incaricato della revisione legale dei conti.', 34, TRUE, TRUE),
    ('SOCIO', 'R035', 'Socio', 'Titolare di una partecipazione al capitale sociale dell''azienda (quota o azioni).', 35, TRUE, TRUE)
ON CONFLICT (codice) DO UPDATE
SET codice_documento       = EXCLUDED.codice_documento,
    denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    ruolo_sistema          = EXCLUDED.ruolo_sistema,
    attivo                 = EXCLUDED.attivo;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_ruoli_codice_documento
    ON cat_ruoli (codice_documento);


COMMENT ON TABLE cat_ruoli IS
    'Catalogo estendibile dei ruoli utilizzabili negli incarichi del modulo Personale.';

COMMENT ON COLUMN cat_ruoli.codice_documento IS
    'Codice R001-R034 della configurazione iniziale; puo'' essere nullo per ruoli personalizzati aggiunti successivamente.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_ruoli_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_cat_ruoli_set_updated_at() IS
    'Aggiorna cat_ruoli.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_cat_ruoli_set_updated_at
    ON cat_ruoli;

CREATE TRIGGER trg_cat_ruoli_set_updated_at
BEFORE UPDATE ON cat_ruoli
FOR EACH ROW
EXECUTE FUNCTION fn_cat_ruoli_set_updated_at();


/*
-------------------------------------------------------------------------------
 SEZIONE: RUOLI E INCARICHI
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
    'PERSONALE.RUOLI_INCARICHI',
    m.id,
    NULL,
    'SEZIONE',
    'Ruoli e incarichi',
    'Sezione del modulo Personale dedicata al catalogo dei ruoli e agli incarichi attribuiti alle persone.',
    'public',
    NULL,
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
 VOCE: CATALOGO DEI RUOLI
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
    'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI',
    m.id,
    p.id,
    'SOTTOSEZIONE',
    'Catalogo dei ruoli',
    'Catalogo configurabile dei ruoli selezionabili negli incarichi delle persone.',
    'public',
    'cat_ruoli',
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
    'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI.' || r.codice,
    m.id,
    p.id,
    'FUNZIONALITA',
    r.denominazione,
    r.descrizione,
    'public',
    'cat_ruoli',
    'codice',
    r.attivo
FROM cat_moduli AS m
JOIN sys_elementi AS p
  ON p.codice = 'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI'
CROSS JOIN cat_ruoli AS r
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
 ACCESSO ALLA SEZIONE E AL CATALOGO
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
        'PERSONALE.RUOLI_INCARICHI',
        'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI'
    )
  AND c.codice IN ('ISO_9001', 'ISO_14001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


/*
-------------------------------------------------------------------------------
 ASSOCIAZIONI RUOLO-CERTIFICAZIONE
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
    v.tutti_settori_iaf
FROM (
    VALUES
        ('LEGALE_RAPPRESENTANTE', 'ISO_9001', TRUE),
        ('LEGALE_RAPPRESENTANTE', 'ISO_14001', TRUE),
        ('LEGALE_RAPPRESENTANTE', 'ISO_45001', TRUE),
        ('DATORE_LAVORO', 'ISO_45001', TRUE),
        ('AMMINISTRATORE', 'ISO_9001', TRUE),
        ('AMMINISTRATORE', 'ISO_14001', TRUE),
        ('AMMINISTRATORE', 'ISO_45001', TRUE),
        ('DIRIGENTE', 'ISO_45001', TRUE),
        ('RGQ', 'ISO_9001', TRUE),
        ('RGI', 'ISO_9001', TRUE),
        ('RGI', 'ISO_14001', TRUE),
        ('RGI', 'ISO_45001', TRUE),
        ('AUDITOR_INTERNO', 'ISO_9001', TRUE),
        ('AUDITOR_INTERNO', 'ISO_14001', TRUE),
        ('AUDITOR_INTERNO', 'ISO_45001', TRUE),
        ('RSPP', 'ISO_45001', TRUE),
        ('ASPP', 'ISO_45001', TRUE),
        ('RLS', 'ISO_45001', TRUE),
        ('PREPOSTO', 'ISO_45001', TRUE),
        ('ADDETTO_ANTINCENDIO', 'ISO_45001', TRUE),
        ('ADDETTO_PRIMO_SOCCORSO', 'ISO_45001', TRUE),
        ('MEDICO_COMPETENTE', 'ISO_45001', TRUE),
        ('PES', 'ISO_45001', TRUE),
        ('PAV', 'ISO_45001', TRUE),
        ('PEI', 'ISO_45001', TRUE),
        ('RESPONSABILE_RENTRI', 'ISO_14001', TRUE),
        ('RESPONSABILE_AMBIENTALE', 'ISO_14001', TRUE),
        ('RESPONSABILE_WHISTLEBLOWING', 'ISO_9001', TRUE),
        ('RESPONSABILE_WHISTLEBLOWING', 'ISO_14001', TRUE),
        ('RESPONSABILE_WHISTLEBLOWING', 'ISO_45001', TRUE),
        ('RESPONSABILE_SECURITY', 'ISO_9001', TRUE),
        ('RESPONSABILE_SECURITY', 'ISO_14001', TRUE),
        ('RESPONSABILE_SECURITY', 'ISO_45001', TRUE),
        ('RESPONSABILE_CYBER_SECURITY', 'ISO_9001', FALSE),
        ('CAPOCANTIERE', 'ISO_9001', FALSE),
        ('CAPOCANTIERE', 'ISO_14001', FALSE),
        ('CAPOCANTIERE', 'ISO_45001', FALSE),
        ('DGSA', 'ISO_45001', FALSE),
        ('RESPONSABILE_LOGISTICA', 'ISO_9001', FALSE),
        ('DIRETTORE_TECNICO_SOA', 'ISO_9001', FALSE),
        ('RESPONSABILE_TECNICO_OFFICINA', 'ISO_9001', FALSE),
        ('RESPONSABILE_FER', 'ISO_9001', TRUE),
        ('RESPONSABILE_FER', 'ISO_14001', TRUE),
        ('SINDACO', 'ISO_9001', TRUE),
        ('SINDACO', 'ISO_14001', TRUE),
        ('SINDACO', 'ISO_45001', TRUE),
        ('REVISORE_LEGALE', 'ISO_9001', TRUE),
        ('REVISORE_LEGALE', 'ISO_14001', TRUE),
        ('REVISORE_LEGALE', 'ISO_45001', TRUE),
        ('SOCIO', 'ISO_9001', TRUE),
        ('SOCIO', 'ISO_14001', TRUE),
        ('SOCIO', 'ISO_45001', TRUE),
        ('AMMINISTRATORE_DELEGATO', 'ISO_9001', TRUE),
        ('AMMINISTRATORE_DELEGATO', 'ISO_14001', TRUE),
        ('AMMINISTRATORE_DELEGATO', 'ISO_45001', TRUE),
        ('COMPONENTE_CDA', 'ISO_9001', TRUE),
        ('COMPONENTE_CDA', 'ISO_14001', TRUE),
        ('COMPONENTE_CDA', 'ISO_45001', TRUE)
) AS v(ruolo_codice, certificazione_codice, tutti_settori_iaf)
JOIN sys_elementi AS e
  ON e.codice = 'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI.' || v.ruolo_codice
JOIN cat_certificazioni AS c
  ON c.codice = v.certificazione_codice
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


/*
-------------------------------------------------------------------------------
 SETTORI IAF SPECIFICI
-------------------------------------------------------------------------------
*/
INSERT INTO rel_elementi_certificazioni_settori_iaf (
    elemento_id,
    certificazione_id,
    settore_iaf_id
)
SELECT
    e.id,
    c.id,
    s.id
FROM (
    VALUES
        ('RESPONSABILE_CYBER_SECURITY', 'ISO_9001', 'IAF 33'),
        ('CAPOCANTIERE', 'ISO_9001', 'IAF 28'),
        ('CAPOCANTIERE', 'ISO_14001', 'IAF 28'),
        ('CAPOCANTIERE', 'ISO_45001', 'IAF 28'),
        ('DGSA', 'ISO_45001', 'IAF 31'),
        ('RESPONSABILE_LOGISTICA', 'ISO_9001', 'IAF 31'),
        ('DIRETTORE_TECNICO_SOA', 'ISO_9001', 'IAF 28'),
        ('RESPONSABILE_TECNICO_OFFICINA', 'ISO_9001', 'IAF 29')
) AS v(ruolo_codice, certificazione_codice, settore_iaf_nome)
JOIN sys_elementi AS e
  ON e.codice = 'PERSONALE.RUOLI_INCARICHI.CATALOGO_RUOLI.' || v.ruolo_codice
JOIN cat_certificazioni AS c
  ON c.codice = v.certificazione_codice
JOIN cat_settori_iaf AS s
  ON s.nome = v.settore_iaf_nome
ON CONFLICT (elemento_id, certificazione_id, settore_iaf_id) DO NOTHING;


COMMIT;
