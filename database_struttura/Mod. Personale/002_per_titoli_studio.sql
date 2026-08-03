-- =======================================================
-- CATALOGO TITOLI DI STUDIO (placeholder minimo)
-- =======================================================
-- Tabella segnaposto: solo le colonne minime da convenzione, sufficienti a
-- soddisfare le foreign key dei moduli che gia' referenziano
-- per_titoli_studio (es. qualifiche CCIA - responsabile FER, direttore
-- tecnico SOA). L'elenco reale dei titoli e altri eventuali campi vanno
-- definiti in una sessione dedicata al modulo Personale.

CREATE TABLE IF NOT EXISTS per_titoli_studio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome VARCHAR(150) NOT NULL UNIQUE,

    attiva BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
