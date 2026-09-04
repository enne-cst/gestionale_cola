// Tipi TypeScript allineati ai contratti Pydantic di
// backend/app/schemas/personale_hr.py (vero modulo Personale, distinto dal
// motore CCIAA di lib/types/personale.ts).

export interface CatalogoVoce {
  id: string;
  codice: string;
  denominazione: string;
  descrizione: string | null;
  attivo: boolean;
}

export interface CatalogoCreatePayload {
  codice: string;
  denominazione: string;
  descrizione?: string | null;
}

export interface RapportoCorrenteSummary {
  stato: string;
  data_inizio: string;
  mansione: CatalogoVoce | null;
  reparto: CatalogoVoce | null;
}

export interface RapportoAzienda {
  id: string;
  tipo_rapporto: CatalogoVoce;
  data_inizio: string;
  data_fine_prevista: string | null;
  data_fine_effettiva: string | null;
  mansione: CatalogoVoce | null;
  reparto: CatalogoVoce | null;
  stato: string;
  tempo_lavoro: string;
  percentuale_part_time: number | null;
  ccnl: string | null;
  livello_inquadramento: string | null;
  note: string | null;
}

export interface RapportoAziendaCreatePayload {
  tipo_rapporto_id: string;
  data_inizio: string;
  data_fine_prevista?: string | null;
  mansione_id?: string | null;
  reparto_id?: string | null;
  stato?: string;
  tempo_lavoro?: string;
  percentuale_part_time?: number | null;
  ccnl?: string | null;
  livello_inquadramento?: string | null;
  note?: string | null;
}

export interface PersonaListRow {
  id: string;
  nome: string;
  cognome: string;
  rapporto: RapportoCorrenteSummary | null;
  ruoli_principali: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface PersonaEssenzialiCreatePayload {
  nome: string;
  cognome: string;
  codice_fiscale: string;
  telefono?: string | null;
  email?: string | null;
}

export interface NuovaPersonaPayload {
  persona: PersonaEssenzialiCreatePayload;
  rapporto: RapportoAziendaCreatePayload;
}

export interface PersonaDossier {
  matricola_interna: string | null;
  data_nascita: string | null;
  eta: number | null;
  luogo_nascita: string | null;
  provincia_nascita: string | null;
  stato_nascita: string | null;
  sesso: string | null;
  cittadinanza: string | null;

  indirizzo_residenza: string | null;
  cap_residenza: string | null;
  comune_residenza: string | null;
  provincia_residenza: string | null;
  domicilio_coincide_residenza: boolean;
  indirizzo_domicilio: string | null;
  cap_domicilio: string | null;
  comune_domicilio: string | null;
  provincia_domicilio: string | null;

  contatto_emergenza_nome: string | null;
  contatto_emergenza_relazione: string | null;
  contatto_emergenza_telefono: string | null;

  lingua_madre: string | null;
  comprensione_lingua_italiana: string | null;
  supporto_linguistico_necessario: boolean;
  altre_lingue: string | null;
}

export type PersonaDossierUpdatePayload = PersonaDossier;

export interface RapportoDettagliUpdatePayload {
  // Solo per registrare il primo rapporto di una persona che non ne ha
  // ancora uno: il backend le richiede solo in quel caso.
  tipo_rapporto_id?: string;
  data_inizio?: string;
  data_fine_prevista?: string | null;
  tempo_lavoro: string;
  percentuale_part_time?: number | null;
  ccnl?: string | null;
  livello_inquadramento?: string | null;
}

export interface PersonaProfilo {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  telefono: string | null;
  email: string | null;
  dossier: PersonaDossier;
  rapporto_corrente: RapportoAzienda | null;
  created_at: string;
  updated_at: string;
}

export interface PersonaEssenzialiUpdatePayload {
  nome?: string;
  cognome?: string;
  codice_fiscale?: string;
  telefono?: string | null;
  email?: string | null;
}

export interface PersonaProfiloUpdatePayload {
  persona?: PersonaEssenzialiUpdatePayload;
  dossier?: PersonaDossierUpdatePayload;
  rapporto?: RapportoDettagliUpdatePayload;
}

// ---------------------------------------------------------------------------
// Ruoli e responsabilità (§13) — riusa il motore ruolo+incarico del CCIAA
// (lib/types/personale.ts: RuoloSummary, CaratteristicaRuolo, ValoreIncarico),
// solo la lettura per persona è nuova.
// ---------------------------------------------------------------------------

export type DocumentazioneRuolo = "PRESENTE" | "DA_INTEGRARE" | "NON_PRESENTE" | "IMPORTATO_CCIAA" | "NON_RICHIESTO";

export interface PersonaRuolo {
  id: string;
  ruolo_id: string;
  ruolo_denominazione: string;
  ambito: string | null;
  fonte: string;
  stato: string;
  data_inizio: string | null;
  data_fine: string | null;
  documentazione: DocumentazioneRuolo;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Documenti personali (completamento Dossier personale) — record multipli
// per persona. Nessun allegato reale finché il modulo Documenti non sarà
// costruito: numero_allegati resta sempre 0.
// ---------------------------------------------------------------------------

export interface DocumentoPersonale {
  id: string;
  tipo_documento: CatalogoVoce;
  numero: string | null;
  data_rilascio: string | null;
  data_scadenza: string | null;
  numero_allegati: number;
}

export interface DocumentoPersonalePayload {
  tipo_documento_id: string;
  numero?: string | null;
  data_rilascio?: string | null;
  data_scadenza?: string | null;
}

// ---------------------------------------------------------------------------
// Mansionario del ruolo (profilo standard delle competenze) — Azienda +
// Ruolo, condiviso da tutte le persone che lo ricoprono. "id" è l'id della
// relazione ruolo↔competenza (per rimuoverla), "voce_id" è l'id della voce
// di catalogo (per modificarne nome/descrizione).
// ---------------------------------------------------------------------------

export interface CompetenzaRuolo {
  id: string;
  voce_id: string;
  nome: string;
  descrizione: string | null;
}

export interface CompetenzaRuoloPayload {
  nome: string;
  descrizione?: string | null;
}

// ---------------------------------------------------------------------------
// Formazione e abilitazioni — F e A restano due tabelle distinte lato
// backend (catalogo corsi per azienda / catalogo abilitazioni di sistema),
// unificate in un'unica lista di registrazioni per la vista "Registrazioni
// acquisite". "catalogo_id" è l'id del corso o dell'abilitazione a seconda
// di `tipo`; il tipo non è mai modificabile dopo la creazione.
// ---------------------------------------------------------------------------

export type TipoRegistrazioneFormativa = "FORMAZIONE" | "ABILITAZIONE";
export type StatoRegistrazioneFormativa = "VALIDA" | "IN_SCADENZA" | "SCADUTA";

export interface CatalogoCorso {
  id: string;
  codice: string;
  denominazione: string;
  obbligatorio: boolean;
  attivo: boolean;
}

export interface CatalogoCorsoPayload {
  codice: string;
  denominazione: string;
}

export interface CatalogoAbilitazione {
  id: string;
  codice: string;
  denominazione: string;
  obbligatorio: boolean;
  attivo: boolean;
}

export interface RegistrazioneFormativa {
  id: string;
  tipo: TipoRegistrazioneFormativa;
  catalogo_id: string;
  denominazione: string;
  ente_formatore: string | null;
  data_conseguimento: string;
  data_scadenza: string;
  durata_ore: string;
  documento_presente: boolean;
  obbligatorio: boolean;
  stato: StatoRegistrazioneFormativa;
}

export interface RegistrazioneFormativaPayload {
  tipo: TipoRegistrazioneFormativa;
  catalogo_id: string;
  data_conseguimento: string;
  data_scadenza: string;
  durata_ore: string;
  ente_formatore?: string | null;
}
