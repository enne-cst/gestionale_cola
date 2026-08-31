// Tipi del motore generico "incarico" (persona + ruolo + caratteristiche,
// vedi backend/app/schemas/personale.py e backend/app/core/incarichi.py):
// sostituisce le tabelle qual_* per le card Soci/Amministratori/Sindaci
// della griglia CCIAA. Solo persone fisiche fino alla Correzione 16
// (decisione utente 2026-08-26); da quella correzione un incarico può
// avere anche un titolare persona GIURIDICA (`AnaPersonaGiuridica`) — vedi
// `persona_giuridica_id`/`persona_giuridica` su `Incarico` sotto.

import type { VerificationStatus } from "@/lib/types/registro";

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

// § Correzione 16: persona giuridica (società, ente) — titolare alternativo
// di un incarico quando il ruolo può essere affidato a un soggetto esterno
// anziché a una persona fisica (primo caso: "Società di revisione legale").
// Nessun campo di persona fisica (nascita, cittadinanza): solo i dati
// identificativi del soggetto giuridico.
export type AnaPersonaGiuridica = {
  id: string;
  azienda_id: string;
  denominazione: string;
  codice_fiscale: string;
  partita_iva: string | null;
  sede: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonaGiuridicaCreatePayload = {
  denominazione: string;
  codice_fiscale: string;
  partita_iva?: string | null;
  sede?: string | null;
  note?: string | null;
};

export type PersonaGiuridicaSummary = {
  id: string;
  denominazione: string;
  codice_fiscale: string;
  partita_iva: string | null;
  sede: string | null;
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
  // § Correzione 16: esattamente uno dei due è valorizzato (mai entrambi,
  // mai nessuno) — stesso vincolo di chk_per_incarichi_titolare_esclusivo
  // lato backend.
  persona_id: string | null;
  persona_giuridica_id: string | null;
  ruolo_id: string;
  note: string | null;
  valori: Record<string, ValoreIncarico>;
  persona: PersonaSummary | null;
  persona_giuridica: PersonaGiuridicaSummary | null;
  ruolo: RuoloSummary;
  created_at: string;
  updated_at: string;
  // Verifica del consulente sulla riga (vedi backend/app/core/incarichi.py):
  // non più la caratteristica A32 dentro il form, stesso trattamento del
  // registro campo-per-campo (nota, audit, concorrenza ottimistica).
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

export type IncaricoPayload = {
  // § Correzione 16: esattamente uno dei due, mai entrambi — verificato sia
  // qui (chi costruisce il payload) sia lato backend (IncaricoCreate).
  persona_id?: string | null;
  persona_giuridica_id?: string | null;
  ruolo_id: string;
  note?: string | null;
  valori: Record<string, ValoreIncarico>;
};
