/*
===============================================================================
 MIGRAZIONE 004 - ASSOCIAZIONE TRA RUOLI E CARATTERISTICHE
===============================================================================

 Scopo
 -----
 Questa migrazione collega ogni ruolo del catalogo alle caratteristiche che
 compongono la sua configurazione personale. La relazione e' configurabile:
 una caratteristica puo' essere obbligatoria, facoltativa o condizionale e
 puo' avere una condizione applicativa testuale.

 Regola della configurazione iniziale
 ------------------------------------
 Nel documento sorgente le caratteristiche riportate senza parentesi sono
 obbligatorie, mentre quelle tra parentesi sono facoltative o condizionali.
 Nella matrice fornita non risultano codici tra parentesi: tutte le associazioni
 iniziali sono quindi inserite come OBBLIGATORIA.

 Il ruolo R001 - Legale Rappresentante non compare nella matrice delle
 associazioni e rimane senza configurazione iniziale. Il catalogo resta
 comunque estendibile senza modifiche strutturali.

 Prerequisiti
 ------------
 - migrazione 002: cat_ruoli, con codice_documento R001-R034;
 - migrazione 003: cat_caratteristiche_incarico, con codici A01-A51;
 - cat_moduli, sys_elementi, cat_certificazioni e
   rel_elementi_certificazioni.

 La migrazione e' idempotente e non assegna incarichi alle persone.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA DI CONFIGURAZIONE: rel_ruoli_caratteristiche
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS rel_ruoli_caratteristiche (
    ruolo_id UUID NOT NULL,
    caratteristica_id UUID NOT NULL,
    obbligatorieta VARCHAR(20) NOT NULL DEFAULT 'OBBLIGATORIA',
    condizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_rel_ruoli_caratteristiche
        PRIMARY KEY (ruolo_id, caratteristica_id),
    CONSTRAINT fk_rel_ruoli_caratteristiche_ruolo
        FOREIGN KEY (ruolo_id)
        REFERENCES cat_ruoli (id),
    CONSTRAINT fk_rel_ruoli_caratteristiche_caratteristica
        FOREIGN KEY (caratteristica_id)
        REFERENCES cat_caratteristiche_incarico (id)
);

CREATE INDEX IF NOT EXISTS ix_rel_ruoli_caratteristiche_caratteristica
    ON rel_ruoli_caratteristiche (caratteristica_id);

CREATE INDEX IF NOT EXISTS ix_rel_ruoli_caratteristiche_ruolo_ordine
    ON rel_ruoli_caratteristiche (ruolo_id, ordine_visualizzazione);

COMMENT ON TABLE rel_ruoli_caratteristiche IS
    'Configurazione delle caratteristiche richieste per ciascun ruolo del modulo Personale.';

COMMENT ON COLUMN rel_ruoli_caratteristiche.obbligatorieta IS
    'Livello applicativo: OBBLIGATORIA, FACOLTATIVA oppure CONDIZIONALE.';

COMMENT ON COLUMN rel_ruoli_caratteristiche.condizione IS
    'Condizione testuale da valutare quando l''obbligatorieta e'' CONDIZIONALE.';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_rel_ruoli_caratteristiche_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_rel_ruoli_caratteristiche_set_updated_at() IS
    'Aggiorna rel_ruoli_caratteristiche.updated_at prima di ogni modifica.';

DROP TRIGGER IF EXISTS trg_rel_ruoli_caratteristiche_set_updated_at
    ON rel_ruoli_caratteristiche;

CREATE TRIGGER trg_rel_ruoli_caratteristiche_set_updated_at
BEFORE UPDATE ON rel_ruoli_caratteristiche
FOR EACH ROW
EXECUTE FUNCTION fn_rel_ruoli_caratteristiche_set_updated_at();


/*
-------------------------------------------------------------------------------
 CONFIGURAZIONE INIZIALE RUOLO-CARATTERISTICA
-------------------------------------------------------------------------------
*/
INSERT INTO rel_ruoli_caratteristiche (
    ruolo_id,
    caratteristica_id,
    obbligatorieta,
    condizione,
    ordine_visualizzazione,
    attivo
)
SELECT
    r.id,
    c.id,
    'OBBLIGATORIA',
    NULL,
    x.ordine::SMALLINT,
    TRUE
FROM (
    VALUES
        ('R002', ARRAY['A01','A02','A03','A04','A07','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R003', ARRAY['A01','A02','A03','A04','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A28','A29','A30','A31','A32','A48','A49','A50','A51']::VARCHAR[]),
        ('R004', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A24','A25','A26','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R005', ARRAY['A01','A02','A03','A04','A07','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R006', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R007', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R008', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A45','A48']::VARCHAR[]),
        ('R009', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A44','A45','A48']::VARCHAR[]),
        ('R010', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A45','A48']::VARCHAR[]),
        ('R011', ARRAY['A01','A02','A05','A06','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A28','A29','A30','A31','A32']::VARCHAR[]),
        ('R012', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A48']::VARCHAR[]),
        ('R013', ARRAY['A01','A02','A03','A04','A08','A09','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A42','A45','A46','A47','A48']::VARCHAR[]),
        ('R014', ARRAY['A01','A02','A03','A04','A08','A09','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A42','A45','A46','A47','A48']::VARCHAR[]),
        ('R015', ARRAY['A01','A02','A03','A04','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A43','A44','A45','A48']::VARCHAR[]),
        ('R016', ARRAY['A01','A02','A03','A04','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A42','A45','A46','A47','A48']::VARCHAR[]),
        ('R017', ARRAY['A01','A02','A03','A04','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A42','A45','A46','A47','A48']::VARCHAR[]),
        ('R018', ARRAY['A01','A02','A03','A04','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A25','A26','A27','A28','A29','A30','A31','A32','A42','A45','A46','A47','A48']::VARCHAR[]),
        ('R019', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A42','A44','A45','A48']::VARCHAR[]),
        ('R020', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A42','A44','A45','A48']::VARCHAR[]),
        ('R021', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A44','A45','A48']::VARCHAR[]),
        ('R022', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A42','A45','A48']::VARCHAR[]),
        ('R023', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A42','A44','A45','A48']::VARCHAR[]),
        ('R024', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A42','A45','A48']::VARCHAR[]),
        ('R025', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A43','A44','A45','A46','A47','A48']::VARCHAR[]),
        ('R026', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A41','A42','A45','A48']::VARCHAR[]),
        ('R027', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A37','A38','A39','A40','A41','A42','A44','A45','A48']::VARCHAR[]),
        ('R028', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A40','A41','A42','A43','A44','A45','A48']::VARCHAR[]),
        ('R029', ARRAY['A01','A02','A03','A04','A07','A08','A09','A10','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A27','A28','A29','A30','A31','A32','A33','A40','A41','A42','A44','A45','A48']::VARCHAR[]),
        ('R030', ARRAY['A01','A02','A08','A10','A14','A17','A18','A25','A26','A30','A31','A32']::VARCHAR[]),
        ('R031', ARRAY['A01','A02','A03','A04','A07','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A28','A29','A30','A31','A32','A48','A49','A50','A51']::VARCHAR[]),
        ('R032', ARRAY['A01','A02','A03','A04','A05','A06','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A28','A29','A30','A31','A32','A48','A49','A50','A51']::VARCHAR[]),
        ('R033', ARRAY['A01','A02','A03','A04','A05','A06','A08','A09','A11','A12','A13','A14','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A28','A29','A30','A31','A32','A48','A49','A50','A51']::VARCHAR[]),
        ('R034', ARRAY['A01','A02','A03','A04','A08','A09','A15','A16','A17','A18','A19','A20','A21','A22','A25','A26','A28','A29','A30','A31','A32','A34','A35','A36','A44','A45','A48','A49','A50','A51']::VARCHAR[]),
        ('R035', ARRAY['A01','A02','A18','A25','A31','A32','A52','A53','A54','A55','A56']::VARCHAR[])
) AS v(codice_documento_ruolo, caratteristiche)
CROSS JOIN LATERAL unnest(v.caratteristiche)
    WITH ORDINALITY AS x(codice_caratteristica, ordine)
JOIN cat_ruoli AS r
  ON r.codice_documento = v.codice_documento_ruolo
JOIN cat_caratteristiche_incarico AS c
  ON c.codice = x.codice_caratteristica
ON CONFLICT (ruolo_id, caratteristica_id) DO UPDATE
SET obbligatorieta        = EXCLUDED.obbligatorieta,
    condizione            = EXCLUDED.condizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


/*
-------------------------------------------------------------------------------
 REGISTRAZIONE DELLA CONFIGURAZIONE IN sys_elementi
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
    'PERSONALE.RUOLI_INCARICHI.CONFIGURAZIONE_RUOLI',
    m.id,
    p.id,
    'SOTTOSEZIONE',
    'Configurazione ruoli e caratteristiche',
    'Associazione configurabile tra ciascun ruolo e le caratteristiche richieste per il relativo incarico.',
    'public',
    'rel_ruoli_caratteristiche',
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
 ACCESSO ALLA CONFIGURAZIONE
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
WHERE e.codice = 'PERSONALE.RUOLI_INCARICHI.CONFIGURAZIONE_RUOLI'
  AND c.codice IN ('ISO_9001', 'ISO_14001', 'ISO_45001')
ON CONFLICT (elemento_id, certificazione_id) DO UPDATE
SET tutti_settori_iaf = EXCLUDED.tutti_settori_iaf;


COMMIT;
