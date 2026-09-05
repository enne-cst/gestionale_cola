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

// ---------------------------------------------------------------------------
// Idoneità sanitaria — riusa per_giudizi_idoneita (visite completate) e
// per_attivita/Scadenziario (appuntamento pianificato, promemoria). Nessuno
// stato "vigente"/"sostituita" è salvato: è sempre ricalcolato dal backend
// in lettura. "documento_presente" segue lo stesso pattern di Formazione/
// Abilitazioni/Documenti personali: nessun upload/apertura file reale.
// ---------------------------------------------------------------------------

export type GiudizioIdoneitaValore = "IDONEO" | "IDONEO_CON_PRESCRIZIONI" | "NON_IDONEO" | "IDONEO_TEMPORANEAMENTE";
export type StatoGiudizioIdoneita = "VALIDA" | "IN_SCADENZA" | "SCADUTA" | "SOSTITUITA";
export type StatoAppuntamentoVisita = "PIANIFICATA" | "ANNULLATA";

export interface TipoVisita {
  id: string;
  codice: string;
  denominazione: string;
}

export interface GiudizioIdoneita {
  id: string;
  tipo_visita: TipoVisita;
  data_visita: string;
  giudizio: GiudizioIdoneitaValore;
  periodicita_mesi: number | null;
  data_scadenza: string | null;
  medico_competente: string | null;
  prescrizioni_presenti: boolean;
  prescrizioni_minime: string | null;
  documento_presente: boolean;
  stato: StatoGiudizioIdoneita;
}

export interface GiudizioIdoneitaPayload {
  tipo_visita_id: string;
  data_visita: string;
  giudizio: GiudizioIdoneitaValore;
  periodicita_mesi?: number | null;
  data_scadenza?: string | null;
  medico_competente?: string | null;
  prescrizioni_presenti: boolean;
  prescrizioni_minime?: string | null;
}

export interface IndicatoriIdoneita {
  ultimo_giudizio: GiudizioIdoneitaValore | null;
  valido_fino_al: string | null;
  limitazioni_segnalate: boolean;
}

export interface AppuntamentoVisita {
  id: string;
  titolo: string;
  data: string;
  ora: string | null;
  medico_competente: string | null;
  luogo: string | null;
  note: string | null;
  stato: StatoAppuntamentoVisita;
}

export interface AppuntamentoVisitaCreatePayload {
  tipo_visita_id: string;
  data: string;
  ora?: string | null;
  medico_competente?: string | null;
  luogo?: string | null;
  note?: string | null;
}

export interface AppuntamentoVisitaUpdatePayload {
  data: string;
  ora?: string | null;
  medico_competente?: string | null;
  luogo?: string | null;
  note?: string | null;
  stato: StatoAppuntamentoVisita;
}

export interface PromemoriaVisitaPayload {
  oggetto: string;
  data: string;
  ora?: string | null;
  destinatari?: string | null;
  nota?: string | null;
}

export interface PromemoriaVisita {
  id: string;
  oggetto: string;
  data: string;
  ora: string | null;
  nota: string | null;
}

export interface EsposizioneAssociata {
  denominazione: string;
}

export interface IdoneitaSanitaria {
  indicatori: IndicatoriIdoneita;
  storico: GiudizioIdoneita[];
  prossimo_appuntamento: AppuntamentoVisita | null;
  esposizioni: EsposizioneAssociata[];
}

// ---------------------------------------------------------------------------
// Competenze (Conoscenza, Competenza, Consapevolezza + Titoli di studio +
// Esperienze rilevanti). Il livello complessivo del macro-indicatore è
// sempre indipendente dalle valutazioni analitiche delle singole voci
// (mai una media o un conteggio) — vedi backend/app/schemas/personale_hr.py.
// ---------------------------------------------------------------------------

export type MacroareaCompetenze = "KNOWLEDGE" | "COMPETENCE" | "AWARENESS";
export type LivelloValutazione = "BASE" | "INTERMEDIO" | "AVANZATO";

export interface MacroIndicatore {
  macroarea: MacroareaCompetenze;
  livello: LivelloValutazione | null;
  data_valutazione: string | null;
  valutatore: string | null;
  nota: string | null;
  voci_attive: number | null;
  voci_nascoste: number | null;
}

export interface MacroIndicatoreValutaPayload {
  livello: LivelloValutazione;
  data_valutazione: string;
  nota?: string | null;
}

export interface Conoscenza {
  id: string;
  nome: string;
  descrizione: string | null;
  livello: LivelloValutazione | null;
  data_valutazione: string | null;
  valutatore: string | null;
}

export interface ConoscenzaPayload {
  nome: string;
  descrizione?: string | null;
}

export interface ValutazioneVocePayload {
  voce_id: string;
  livello: LivelloValutazione;
  evidenza_nota?: string | null;
}

export interface ValutaVociPayload {
  data_valutazione: string;
  nota_generale?: string | null;
  voci: ValutazioneVocePayload[];
}

export interface Competenza {
  voce_id: string;
  nome: string;
  descrizione: string | null;
  ruoli_origine: string[];
  livello: LivelloValutazione | null;
  data_valutazione: string | null;
  valutatore: string | null;
}

export interface CompetenzaNascosta {
  voce_id: string;
  nome: string;
  descrizione: string | null;
  ruoli_origine: string[];
  livello: LivelloValutazione | null;
  data_valutazione: string | null;
}

export interface CompetenzePersona {
  attive: Competenza[];
  nascoste: CompetenzaNascosta[];
}

// Titoli di studio

export type StatoVerifica = "PENDING_VERIFICATION" | "VERIFIED" | "REVISION_REQUIRED";

export interface TitoloStudio {
  id: string;
  tipologia: CatalogoVoce;
  indirizzo_specializzazione: string | null;
  istituto: string | null;
  anno: number | null;
  votazione: string | null;
  documento_presente: boolean;
  verificationStatus: StatoVerifica | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface TitoloStudioPayload {
  tipologia_titolo_id: string;
  indirizzo_specializzazione?: string | null;
  istituto?: string | null;
  anno?: number | null;
  votazione?: string | null;
}

// Esperienze rilevanti

export type RilevanzaEsperienza = "PROFESSIONALE" | "TECNICA" | "ORGANIZZATIVA";

export interface Esperienza {
  id: string;
  attivita_ruolo: string;
  organizzazione: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  rilevanza: RilevanzaEsperienza;
  descrizione: string | null;
  verificata: boolean;
  documento_presente: boolean;
}

export interface EsperienzaPayload {
  attivita_ruolo: string;
  organizzazione?: string | null;
  data_inizio?: string | null;
  data_fine?: string | null;
  rilevanza: RilevanzaEsperienza;
  descrizione?: string | null;
}

// ---------------------------------------------------------------------------
// Note — interne, riservate ai consulenti. Nessun campo Visibilità nel
// form: ogni nota creata da questa scheda è sempre SOLO_CONSULENTI lato
// backend. Nessun titolo separato, nessuna evidenza, nessun filtro.
// ---------------------------------------------------------------------------

export type NotaCategoria = "GENERALE" | "FORMAZIONE" | "RUOLO" | "SORVEGLIANZA_SANITARIA" | "COMPETENZE";

export interface NotaCategoriaVoce {
  codice: NotaCategoria;
  denominazione: string;
}

export interface Nota {
  id: string;
  categoria: NotaCategoria;
  testo: string;
  autore: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotaPayload {
  categoria: NotaCategoria;
  testo: string;
}
