/*
===============================================================================
 MIGRAZIONE 030 - CATALOGO DELLE MACRO-TIPOLOGIE DI TITOLI ABILITATIVI
===============================================================================

 Scopo
 -----
 Crea il catalogo utilizzato dal campo "Tipologia" della tabella unificata
 "Albi, ruoli, licenze e certificazioni" (Correzione 20, seconda parte
 della card "Attività, albi, ruoli e licenze" dell'Anagrafica Aziendale).

 Quattro macro-tipologie, ciascuna sostenuta da una propria struttura di
 dettaglio (migrazione 046: ana_titoli_abilitativi_dettaglio_albo/_ruolo/
 _licenza/_certificazione) collegata alla riga principale
 (ana_titoli_abilitativi_azienda) tramite macro_tipologia_id. Contiene più
 di tre valori, quindi per convenzione (§ CLAUDE.md, "Configurazione prima
 della programmazione") non è scritto direttamente nel frontend ma proviene
 da questo catalogo estendibile — stesso pattern di cat_organi_amministrativi/
 cat_assetti_controllo.

 La migrazione è idempotente.
===============================================================================
*/

BEGIN;


/*
-------------------------------------------------------------------------------
 TABELLA CATALOGO: cat_macro_tipologie_titoli_abilitativi
-------------------------------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS cat_macro_tipologie_titoli_abilitativi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codice VARCHAR(60) NOT NULL,
    denominazione VARCHAR(200) NOT NULL,
    descrizione TEXT,
    ordine_visualizzazione SMALLINT NOT NULL,
    attivo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cat_macro_tipologie_titoli_abilitativi_codice
        UNIQUE (codice)
);


INSERT INTO cat_macro_tipologie_titoli_abilitativi (
    codice,
    denominazione,
    descrizione,
    ordine_visualizzazione,
    attivo
)
VALUES
    ('ALBO', 'Albo', NULL, 1, TRUE),
    ('RUOLO', 'Ruolo', NULL, 2, TRUE),
    ('LICENZA', 'Licenza', NULL, 3, TRUE),
    (
        'CERTIFICAZIONE_ATTESTAZIONE', 'Certificazione o attestazione',
        'Comprende sia le certificazioni di sistema di gestione (es. ISO 9001) sia le attestazioni SOA: la colonna "Tipologia" della tabella distingue le due cose in lettura (§ Correzione 20 punto 7), il codice del catalogo resta unico.',
        4, TRUE
    )
ON CONFLICT (codice) DO UPDATE
SET denominazione          = EXCLUDED.denominazione,
    descrizione            = EXCLUDED.descrizione,
    ordine_visualizzazione = EXCLUDED.ordine_visualizzazione,
    attivo                 = EXCLUDED.attivo;


COMMENT ON TABLE cat_macro_tipologie_titoli_abilitativi IS
    'Catalogo estendibile delle macro-tipologie selezionabili per un titolo abilitativo (Albo/Ruolo/Licenza/Certificazione o attestazione), tabella "Albi, ruoli, licenze e certificazioni".';


/*
-------------------------------------------------------------------------------
 AGGIORNAMENTO AUTOMATICO DI updated_at
-------------------------------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION fn_cat_macro_tipologie_titoli_abilitativi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cat_macro_tipologie_titoli_abilitativi_set_updated_at
    ON cat_macro_tipologie_titoli_abilitativi;

CREATE TRIGGER trg_cat_macro_tipologie_titoli_abilitativi_set_updated_at
BEFORE UPDATE ON cat_macro_tipologie_titoli_abilitativi
FOR EACH ROW
EXECUTE FUNCTION fn_cat_macro_tipologie_titoli_abilitativi_set_updated_at();


COMMIT;
