// Tipi del motore generico "incarico" (persona + ruolo + caratteristiche,
// vedi backend/app/schemas/personale.py e backend/app/core/incarichi.py):
// sostituisce le tabelle qual_* per le card Soci/Amministratori/Sindaci
// della griglia CCIAA (solo persone fisiche, decisione utente 2026-08-26).

export type AnaPersona = {
  id: string;
  azienda_id: string;
  cognome: string;
  nome: string;
  codice_fiscale: string;
  data_nascita: string | null;
  sesso: string | null;
  luogo_nascita: string | null;
  nazionalita: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonaCreatePayload = {
  cognome: string;
  nome: string;
  codice_fiscale: string;
  data_nascita?: string | null;
  luogo_nascita?: string | null;
  nazionalita?: string | null;
  residenza?: string | null;
};

export type PersonaSummary = {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  data_nascita: string | null;
  luogo_nascita: string | null;
  nazionalita: string | null;
  residenza: string | null;
};

export type RuoloSummary = {
  id: string;
  codice: string;
  codice_documento: string | null;
  denominazione: string;
};

// Corrisponde a cat_caratteristiche_incarico.tipo_dato: guida il controllo
// da usare nel form dinamico (§2.5 della specifica CCIAA).
export type TipoDatoCaratteristica =
  | "TESTO"
  | "TESTO_LUNGO"
  | "CATALOGO"
  | "CATALOGO_MULTIPLO"
  | "NUMERO"
  | "DATA"
  | "BOOLEANO"
  | "DOCUMENTO";

export type CaratteristicaRuolo = {
  id: string;
  codice: string;
  denominazione: string;
  tipoDato: TipoDatoCaratteristica;
  valoriAmmessi: string[] | null;
  obbligatorieta: "OBBLIGATORIA" | "CONDIZIONALE" | "FACOLTATIVA";
};

// I valori di un incarico transitano come stringa (testo/numero/data) o
// booleano/array, secondo il tipo_dato — stesso principio di "un solo tipo
// verificato dal backend" già in uso nel registro campo-per-campo.
export type ValoreIncarico = string | boolean | string[] | null;

export type Incarico = {
  id: string;
  azienda_id: string;
  persona_id: string;
  ruolo_id: string;
  note: string | null;
  valori: Record<string, ValoreIncarico>;
  persona: PersonaSummary;
  ruolo: RuoloSummary;
  created_at: string;
  updated_at: string;
};

export type IncaricoPayload = {
  persona_id: string;
  ruolo_id: string;
  note?: string | null;
  valori: Record<string, ValoreIncarico>;
};
