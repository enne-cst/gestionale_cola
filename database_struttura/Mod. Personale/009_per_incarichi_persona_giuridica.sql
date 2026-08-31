-- =======================================================================
-- CORREZIONE 16 - TITOLARE PERSONA GIURIDICA DI UN INCARICO
-- =======================================================================
--
-- Aggiunge a per_incarichi (migrazione 006, già applicata, non più
-- modificabile per convenzione CLAUDE.md) il supporto per un titolare
-- persona giuridica (§ Correzione 16, "Società di revisione legale"):
-- `persona_id` diventa nullable e si aggiunge `persona_giuridica_id`
-- (verso la nuova `ana_persone_giuridiche`, migrazione 008 di questo
-- modulo), con un vincolo di esclusività — esattamente uno dei due
-- valorizzato, mai entrambi e mai nessuno.
--
-- Nessuna modifica a per_incarichi_valori: le caratteristiche
-- dell'incarico (data di nomina, iscrizione al Registro dei Revisori
-- Legali, stato della carica...) restano identiche indipendentemente dal
-- tipo di titolare — è il motivo per cui questa correzione tocca solo la
-- relazione persona-ruolo, non il motore delle caratteristiche.

ALTER TABLE per_incarichi
    ALTER COLUMN persona_id DROP NOT NULL;

ALTER TABLE per_incarichi
    ADD COLUMN IF NOT EXISTS persona_giuridica_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_per_incarichi_persona_giuridica'
    ) THEN
        ALTER TABLE per_incarichi
            ADD CONSTRAINT fk_per_incarichi_persona_giuridica
                FOREIGN KEY (persona_giuridica_id)
                REFERENCES ana_persone_giuridiche(id)
                ON UPDATE CASCADE
                ON DELETE CASCADE;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_per_incarichi_titolare_esclusivo'
    ) THEN
        ALTER TABLE per_incarichi
            ADD CONSTRAINT chk_per_incarichi_titolare_esclusivo
                CHECK ((persona_id IS NOT NULL) <> (persona_giuridica_id IS NOT NULL));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_per_incarichi_persona_giuridica
    ON per_incarichi (persona_giuridica_id);

COMMENT ON COLUMN per_incarichi.persona_giuridica_id IS
    'Titolare persona giuridica dell''incarico (es. società di revisione legale, § Correzione 16) — alternativo a persona_id, mai entrambi valorizzati (chk_per_incarichi_titolare_esclusivo).';
