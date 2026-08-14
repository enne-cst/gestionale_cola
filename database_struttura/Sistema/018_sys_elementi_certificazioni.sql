
-- =======================================================
-- CATALOGO CENTRALE DEGLI ELEMENTI SOGGETTI AD ABBONAMENTO
-- =======================================================
-- sys_elementi rappresenta, in una struttura ad albero, le sezioni e i campi
-- dei moduli applicativi (root = sezione di primo livello, elemento_padre_id
-- NULL). Ogni voce dei moduli 'base' esiste comunque a schema/frontend senza
-- essere registrata qui: questo catalogo censisce solo ciò la cui visibilità
-- dipende da un abbonamento (certificazione attiva), più le sue eventuali
-- sotto-voci, fino al singolo campo — utile anche al pulsante informativo
-- del frontend, che mostra `descrizione`.
--
-- rel_elementi_certificazioni collega un elemento a una o più certificazioni
-- che lo sbloccano (semantica OR: basta una riga con certificazione attiva).
-- Quando tutti_settori_iaf è FALSE, l'elemento è sbloccato solo per i
-- settori IAF elencati in rel_elementi_certificazioni_settori_iaf per quella
-- stessa coppia elemento/certificazione; nessuna delle sezioni ISO 9001
-- attualmente in produzione usa questa restrizione, ma la tabella esiste già
-- per non richiedere una migrazione dedicata quando servirà.

CREATE TABLE IF NOT EXISTS sys_elementi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Percorso gerarchico stabile (es. 'ANAGRAFICA_AZIENDALE.ORGANIZZAZIONE.
    -- CONTRATTO_LAVORO.CCNL_APPLICATO'), usato dal backend per il controllo
    -- di accesso e dagli script di migrazione come chiave di upsert.
    codice VARCHAR(200) NOT NULL,

    modulo_id UUID NOT NULL,

    elemento_padre_id UUID,

    -- 'SEZIONE' (una pagina/tabella o un suo raggruppamento interno) o
    -- 'CAMPO' (una singola colonna, reale o derivata da vista).
    tipo_elemento VARCHAR(20) NOT NULL,

    denominazione VARCHAR(255) NOT NULL,

    -- Testo mostrato dal pulsante informativo dell'interfaccia.
    descrizione TEXT,

    schema_database VARCHAR(50) NOT NULL DEFAULT 'public',

    -- NULL per le sezioni che non corrispondono a una singola tabella/vista
    -- fisica (es. raggruppamenti puramente organizzativi del catalogo).
    nome_tabella VARCHAR(100),

    -- Valorizzato solo sui CAMPO; NULL su tutte le SEZIONE.
    nome_colonna VARCHAR(100),

    attivo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_sys_elementi_codice
        UNIQUE (codice),

    CONSTRAINT fk_sys_elementi_modulo
        FOREIGN KEY (modulo_id)
        REFERENCES cat_moduli(id),

    CONSTRAINT fk_sys_elementi_padre
        FOREIGN KEY (elemento_padre_id)
        REFERENCES sys_elementi(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rel_elementi_certificazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    elemento_id UUID NOT NULL,

    certificazione_id UUID NOT NULL,

    -- TRUE: l'elemento è sbloccato per qualunque settore IAF dell'azienda,
    -- quando la certificazione è attiva. FALSE: va verificata anche
    -- rel_elementi_certificazioni_settori_iaf.
    tutti_settori_iaf BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_elementi_certificazioni
        UNIQUE (elemento_id, certificazione_id),

    CONSTRAINT fk_rel_elementi_certificazioni_elemento
        FOREIGN KEY (elemento_id)
        REFERENCES sys_elementi(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_elementi_certificazioni_certificazione
        FOREIGN KEY (certificazione_id)
        REFERENCES cat_certificazioni(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rel_elementi_certificazioni_settori_iaf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    elemento_id UUID NOT NULL,

    certificazione_id UUID NOT NULL,

    settore_iaf_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_rel_elementi_certificazioni_settori_iaf
        UNIQUE (elemento_id, certificazione_id, settore_iaf_id),

    -- La coppia deve già esistere in rel_elementi_certificazioni (con
    -- tutti_settori_iaf = FALSE): questa tabella restringe una regola
    -- generale, non ne definisce una nuova.
    CONSTRAINT fk_rel_elementi_certificazioni_settori_iaf_coppia
        FOREIGN KEY (elemento_id, certificazione_id)
        REFERENCES rel_elementi_certificazioni(elemento_id, certificazione_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rel_elementi_certificazioni_settori_iaf_settore
        FOREIGN KEY (settore_iaf_id)
        REFERENCES cat_settori_iaf(id)
        ON DELETE CASCADE
);
