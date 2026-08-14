
-- =======================================================
-- CODICI STABILI PER MODULI E CERTIFICAZIONI
-- =======================================================
-- Aggiunge a cat_moduli e cat_certificazioni un identificatore stabile
-- (`codice`), indipendente dal `nome` mostrato in interfaccia. Il catalogo
-- sys_elementi (vedi 018_sys_elementi_certificazioni.sql) collega sezioni e
-- campi a moduli e certificazioni tramite questo codice, così una modifica
-- editoriale al nome visualizzato non rompe le associazioni già registrate.

ALTER TABLE cat_moduli
    ADD COLUMN IF NOT EXISTS codice VARCHAR(50);

UPDATE cat_moduli SET codice = 'ANAGRAFICA_AZIENDALE' WHERE nome = 'Anagrafica Aziendale';
UPDATE cat_moduli SET codice = 'PERSONALE' WHERE nome = 'Personale';
UPDATE cat_moduli SET codice = 'SCADENZIARIO_GENERALE' WHERE nome = 'Scadenziario Generale';
UPDATE cat_moduli SET codice = 'PIANO_FORMATIVO' WHERE nome = 'Piano Formativo';
UPDATE cat_moduli SET codice = 'PIANO_MANUTENZIONE' WHERE nome = 'Piano di Manutenzione';
UPDATE cat_moduli SET codice = 'PIANO_MIGLIORAMENTO' WHERE nome = 'Piano di Miglioramento';
UPDATE cat_moduli SET codice = 'CANTIERI' WHERE nome = 'Cantieri';

ALTER TABLE cat_moduli
    ALTER COLUMN codice SET NOT NULL;

ALTER TABLE cat_moduli
    ADD CONSTRAINT uq_cat_moduli_codice UNIQUE (codice);


ALTER TABLE cat_certificazioni
    ADD COLUMN IF NOT EXISTS codice VARCHAR(50);

UPDATE cat_certificazioni SET codice = 'ISO_9001' WHERE nome = 'ISO 9001';
UPDATE cat_certificazioni SET codice = 'ISO_14001' WHERE nome = 'ISO 14001';
UPDATE cat_certificazioni SET codice = 'ISO_45001' WHERE nome = 'ISO 45001';

ALTER TABLE cat_certificazioni
    ALTER COLUMN codice SET NOT NULL;

ALTER TABLE cat_certificazioni
    ADD CONSTRAINT uq_cat_certificazioni_codice UNIQUE (codice);
