// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/schemas/anagrafica.py. Solo i campi delle sezioni già
// implementate nel frontend.

import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";
import type { VerificationStatus } from "@/lib/types/registro";

interface ConMetadati {
  id: string;
  azienda_id: string;
  created_at: string;
  updated_at: string;
}

export interface IdentificazioneCamerale extends ConMetadati {
  ragione_sociale: string | null;
  forma_giuridica: string | null;
  codice_fiscale: string | null;
  partita_iva: string | null;
  camera_commercio_competente: string | null;
  ufficio_registro_imprese: string | null;
  numero_rea: string | null;
  provincia_rea: string | null;
  stato_attivita: string | null;
  data_atto_costitutivo: string | null;
  data_inizio_attivita: string | null;
  data_ultimo_protocollo: string | null;
}

export interface CapitaleSociale extends ConMetadati {
  valuta: string | null;
  capitale_deliberato: string | null;
  capitale_sottoscritto: string | null;
  capitale_versato: string | null;
}

export interface AttivitaEsercitata extends ConMetadati {
  descrizione_attivita_esercitata: string | null;
  data_decorrenza_attivita: string | null;
  presenza_attivita_import_export: boolean | null;
}

export interface DurataSocietaEsercizi extends ConMetadati {
  data_termine_societa: string | null;
  scadenza_primo_esercizio: string | null;
  scadenza_esercizi_successivi: string | null;
}

export interface SedeAttivita {
  id: string;
  descrizione_attivita: string;
  data_inizio: string | null;
  data_fine: string | null;
  ruolo_importanza: string | null;
}

export interface Sede extends ConMetadati {
  tipo_sede: string;
  numero_unita_locale: string | null;
  denominazione_sede: string | null;
  data_apertura: string | null;
  indirizzo: string | null;
  numero_civico: string | null;
  cap: string | null;
  comune: string | null;
  provincia: string | null;
  frazione: string | null;
  nazione: string | null;
  toponimo: string | null;
  indirizzo_originale: string | null;
  numero_rea_unita: string | null;
  data_chiusura: string | null;
  stato: string | null;
  sigla_territoriale: string | null;
  numero_progressivo: string | null;
  attivita: SedeAttivita[];
}

export interface Contatto extends ConMetadati {
  tipo_contatto: string;
  valore: string;
  descrizione: string | null;
  principale: boolean;
}

export interface IscrizioneRegistroImprese extends ConMetadati {
  tipo_iscrizione: string | null;
  sezione: string | null;
  data_iscrizione: string | null;
}

export interface CodiceAteco extends ConMetadati {
  codice: string;
  descrizione: string | null;
  classificazione: string | null;
  ruolo_codice: string | null;
  origine_codice: string | null;
  fonte: string | null;
  codice_nace: string | null;
  sede_id: string | null;
}

export interface AlboRuoloLicenza extends ConMetadati {
  tipologia: string;
  numero_iscrizione: string | null;
  provincia: string | null;
  sezione: string | null;
  categoria: string | null;
  descrizione_categoria: string | null;
  classe: string | null;
  data_domanda_accertamento: string | null;
  data_delibera: string | null;
  data_inizio: string | null;
  data_scadenza: string | null;
  stato: string | null;
  motivo_cancellazione: string | null;
  data_comunicazione: string | null;
  data_cessazione: string | null;
  data_caricamento: string | null;
  fonte: string | null;
  sede_id: string | null;
}

export interface SistemaAmministrazione {
  id: string;
  sistema_amministrazione: string;
  numero_minimo_componenti: number | null;
  numero_massimo_componenti: number | null;
  regole_decisionali: string | null;
  deleghe_previste: string | null;
  regime_rappresentanza: string | null;
  gestione_opposizione: string | null;
  in_carica: boolean;
}

export interface AmministrazioneControllo extends ConMetadati {
  // "Organo amministrativo in carica" non è più qui (Correzione 04): è il
  // campo principale della sezione "Amministratori" del registro
  // campo-per-campo (vedi FieldState in lib/types/registro.ts), sostenuto
  // dal catalogo cat_organi_amministrativi. Si modifica solo da lì.
  numero_minimo_amministratori: number | null;
  numero_amministratori_in_carica: number | null;
  durata_in_carica_organo: string | null;
  numero_sindaci_organi_controllo: number | null;
  numero_titolari_cariche: number | null;
  sistemi_amministrazione: SistemaAmministrazione[];
}

export interface SoaCategoria {
  id: string;
  categoria: string;
  descrizione: string | null;
  classifica: string | null;
  limite_economico: string | null;
}

export interface Soa extends ConMetadati {
  numero_attestazione: string | null;
  organismo_denominazione: string | null;
  organismo_codice_identificativo: string | null;
  data_rilascio: string | null;
  data_scadenza: string | null;
  regolamento: string | null;
  categorie: SoaCategoria[];
}

export interface CertificazioneSettoreIaf {
  id: string;
  settore_iaf_id: string | null;
  codice_iaf: string | null;
  descrizione_iaf: string | null;
}

export interface Certificazione extends ConMetadati {
  certificazione_id: string | null;
  tipologia_certificazione: string | null;
  sigla: string | null;
  norma_riferimento: string | null;
  numero_certificato: string | null;
  data_prima_emissione: string | null;
  organismo_certificatore: string | null;
  codice_fiscale_organismo: string | null;
  fonte: string | null;
  data_ultimo_aggiornamento: string | null;
  settori_iaf: CertificazioneSettoreIaf[];
}

export type PeriodoRilevazione = "PRIMO_TRIMESTRE" | "SECONDO_TRIMESTRE" | "TERZO_TRIMESTRE" | "QUARTO_TRIMESTRE" | "MEDIA";

export const PERIODI_RILEVAZIONE: { value: PeriodoRilevazione; label: string }[] = [
  { value: "PRIMO_TRIMESTRE", label: "Primo trimestre" },
  { value: "SECONDO_TRIMESTRE", label: "Secondo trimestre" },
  { value: "TERZO_TRIMESTRE", label: "Terzo trimestre" },
  { value: "QUARTO_TRIMESTRE", label: "Quarto trimestre" },
  { value: "MEDIA", label: "Media annua" },
];

export interface AddettiVisuraPeriodo {
  id: string;
  periodo: PeriodoRilevazione;
  numero_dipendenti: number | null;
  numero_indipendenti: number | null;
  numero_collaboratori: number | null;
  numero_totale_addetti: number | null;
  percentuale_tempo_determinato: string | null;
  percentuale_tempo_indeterminato: string | null;
  percentuale_tempo_pieno: string | null;
  percentuale_tempo_parziale: string | null;
  percentuale_operai: string | null;
  percentuale_impiegati: string | null;
  percentuale_apprendisti: string | null;
}

export interface AddettiVisura extends ConMetadati {
  fonte: string | null;
  anno_riferimento: number | null;
  data_rilevazione: string | null;
  periodi: AddettiVisuraPeriodo[];
  // § "Addetti da visura" e "Addetti per comune" sono state messe insieme
  // su richiesta esplicita: il comune eventualmente collegato a questa
  // rilevazione viaggia annidato qui, compilato in fondo allo stesso form
  // (AddettiVisuraDialog) invece che in un dialog separato.
  comune: AddettiComune | null;
}

export interface AddettiComunePeriodo {
  id: string;
  periodo: PeriodoRilevazione;
  numero_dipendenti: number | null;
  numero_indipendenti: number | null;
  numero_totale_addetti: number | null;
}

export interface AddettiComune extends ConMetadati {
  rilevazione_addetti_id: string | null;
  comune: string;
  provincia: string | null;
  numero_sedi_unita_locali: number | null;
  periodi: AddettiComunePeriodo[];
}

// ===========================================================================
// Riepilogo "Personale e occupazione" (Correzione 22): presentazione
// calcolata della rilevazione di Addetti da visura più recente — vedi
// backend/app/schemas/personale_occupazione.py per il contratto sorgente.
// ===========================================================================

export interface GruppoCalcolato {
  completo: boolean;
  coerente: boolean;
  messaggio: string | null;
  percentuali: Record<string, string | null>;
  numeri: Record<string, number | null>;
}

export interface DatiTerritorialiRiepilogo {
  comune: string | null;
  provincia: string | null;
  dipendenti_nel_comune: number | null;
  indipendenti_nel_comune: number | null;
  addetti_totali_nel_comune: number | null;
  percentuale_dipendenti_nel_comune: string | null;
  percentuale_indipendenti_nel_comune: string | null;
}

export interface PersonaleOccupazioneRiepilogo {
  rilevazione_id: string | null;
  periodo_id: string | null;
  fonte: string | null;
  anno_riferimento: number | null;
  periodo: PeriodoRilevazione | null;
  data_rilevazione: string | null;
  addetti_totali: number | null;
  dipendenti: number | null;
  indipendenti: number | null;
  collaboratori: number | null;
  tipologia_contrattuale: GruppoCalcolato;
  orario_lavoro: GruppoCalcolato;
  inquadramento: GruppoCalcolato;
  territorio: DatiTerritorialiRiepilogo;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

// ===========================================================================
// Titoli abilitativi: tabella unificata "Albi, ruoli, licenze e
// certificazioni" (Correzione 20 + Correzione 21: campi specifici dei 4
// form, rimandati da Correzione 20)
// ===========================================================================

export type MacroTipologiaTitoloAbilitativo = "ALBO" | "RUOLO" | "LICENZA" | "CERTIFICAZIONE_ATTESTAZIONE";

/** Proiezione minima di una persona collegata (§ punto 2/3/4: "Soggetto
 * iscritto"/"Titolare del ruolo"/"Soggetto titolare" — azienda oppure
 * persona), identica a `PersonaSummary` lato backend. */
export interface TitoloAbilitativoPersona {
  id: string;
  nome: string;
  cognome: string;
  codice_fiscale: string;
  data_nascita: string | null;
}

/** Proiezione minima di una sede collegata (§ punto 4, "Sede o unità
 * locale interessata"): mai duplica indirizzo o altri dati della sede. */
export interface TitoloAbilitativoSede {
  id: string;
  denominazione_sede: string | null;
  comune: string | null;
}

export interface SettoreIafVoce {
  id: string;
  nome: string;
}

export interface TitoloAbilitativoSoaCategoriaVoce {
  id: string;
  categoria_soa_id: string;
  classifica_soa_id: string | null;
  categoria_soa: CatalogoVoce;
  classifica_soa: CatalogoVoce | null;
}

/** Riga della tabella riepilogativa (§ punto 3/4): "Categoria / norma" è
 * già risolta dal backend dal dettaglio specifico, mai una colonna propria
 * della tabella principale. Le informazioni non comprese qui (§ punto 8)
 * si caricano a parte, con `getTitoloAbilitativo`, all'apertura del form.
 * `riga_key` (§ punto 7): per un'attestazione SOA con più categorie/
 * classifiche più righe condividono lo stesso `id` ma hanno `riga_key`
 * diversa — usarla come React key, `id` per aprire il form. */
export interface TitoloAbilitativoSummary {
  id: string;
  riga_key: string;
  macro_tipologia_codice: MacroTipologiaTitoloAbilitativo;
  tipologia_label: string;
  categoria_norma: string | null;
  numero_attestazione: string | null;
  ente_rilascio: string | null;
  data_rilascio: string | null;
  data_scadenza: string | null;
  senza_scadenza: boolean;
  note: string | null;
  stato_titolo_label: string | null;
  created_at: string;
  updated_at: string;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

interface _TitoloAbilitativoComune extends ConMetadati {
  numero_attestazione: string | null;
  ente_rilascio: string | null;
  data_rilascio: string | null;
  data_scadenza: string | null;
  senza_scadenza: boolean;
  note: string | null;
  stato_titolo_id: string | null;
  stato_titolo: CatalogoVoce | null;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface TitoloAbilitativoAlbo extends _TitoloAbilitativoComune {
  macro_tipologia_codice: "ALBO";
  tipologia_albo_id: string | null;
  tipologia_albo: CatalogoVoce | null;
  categoria: string | null;
  denominazione_albo: string | null;
  sezione: string | null;
  persona_id: string | null;
  persona: TitoloAbilitativoPersona | null;
  provincia_ambito: string | null;
  attivita_abilitazioni: string | null;
}

export interface TitoloAbilitativoRuolo extends _TitoloAbilitativoComune {
  macro_tipologia_codice: "RUOLO";
  tipologia_ruolo_id: string | null;
  tipologia_ruolo: CatalogoVoce | null;
  denominazione_ruolo: string | null;
  sezione_categoria: string | null;
  persona_id: string | null;
  persona: TitoloAbilitativoPersona | null;
  provincia_ambito: string | null;
  attivita_abilitate: string | null;
}

export interface TitoloAbilitativoLicenza extends _TitoloAbilitativoComune {
  macro_tipologia_codice: "LICENZA";
  tipologia_licenza_id: string | null;
  tipologia_licenza: CatalogoVoce | null;
  denominazione_licenza: string | null;
  oggetto_attivita: string | null;
  persona_id: string | null;
  persona: TitoloAbilitativoPersona | null;
  sede_id: string | null;
  sede: TitoloAbilitativoSede | null;
  ambito_territoriale: string | null;
  data_efficacia: string | null;
  condizioni_prescrizioni: string | null;
  estremi_rinnovo: string | null;
}

export interface TitoloAbilitativoCertificazione extends _TitoloAbilitativoComune {
  macro_tipologia_codice: "CERTIFICAZIONE_ATTESTAZIONE";
  sotto_tipo_id: string | null;
  sotto_tipo: CatalogoVoce | null;
  categoria_norma: string | null;
  norma_id: string | null;
  norma: CatalogoVoce | null;
  edizione_anno: string | null;
  organismo_accreditamento: string | null;
  campo_applicazione: string | null;
  data_prima_emissione: string | null;
  settori_iaf: SettoreIafVoce[];
  categorie_soa: TitoloAbilitativoSoaCategoriaVoce[];
  denominazione: string | null;
  schema_norma: string | null;
}

/** Risposta di `getTitoloAbilitativo` (§ punto 8: "selezionando una riga
 * la piattaforma riconosce la tipologia e apre il form corretto") — unione
 * discriminata su `macro_tipologia_codice`. */
export type TitoloAbilitativoDetail =
  | TitoloAbilitativoAlbo
  | TitoloAbilitativoRuolo
  | TitoloAbilitativoLicenza
  | TitoloAbilitativoCertificazione;

// ===========================================================================
// Sedi secondarie e unità locali (Correzione 23): estende ana_sedi, la sede
// legale resta un'altra riga della stessa tabella, filtrata dal backend.
// ===========================================================================

/** Riga della tabella riepilogativa (§ punto 2): tipologie/attività
 * principale/codice ATECO sono già risolti dal backend dalle relazioni
 * molti-a-molti, mai colonne di testo con virgole. */
export interface UnitaLocaleSummary {
  id: string;
  riferimento_cciaa: string | null;
  tipologia_label: string | null;
  indirizzo_label: string | null;
  data_apertura: string | null;
  attivita_principale_label: string | null;
  ateco_label: string | null;
  data_chiusura: string | null;
  created_at: string;
  updated_at: string;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface UnitaLocaleAttivita {
  id: string;
  descrizione_attivita: string;
  data_inizio: string | null;
  data_fine: string | null;
  attivita_principale: boolean;
}

export interface UnitaLocaleCodiceAteco {
  id: string;
  codice_attivita_id: string;
  codice_attivita: CatalogoVoce;
  principale: boolean;
  data_inizio: string | null;
  data_fine: string | null;
}

export interface UnitaLocaleContatto {
  id: string;
  tipo_contatto: string;
  valore: string;
  descrizione: string | null;
  principale: boolean;
}

/** Risposta di `getUnitaLocale` (§ punto 8, form completo). */
export interface UnitaLocaleDetail extends ConMetadati {
  numero_unita_locale: string | null;
  denominazione_sede: string | null;
  data_apertura: string | null;
  data_chiusura: string | null;
  toponimo: string | null;
  indirizzo: string | null;
  numero_civico: string | null;
  cap: string | null;
  comune: string | null;
  provincia: string | null;
  frazione: string | null;
  nazione: string | null;
  stato_unita_id: string | null;
  stato_unita: CatalogoVoce | null;
  note: string | null;
  tipologie: CatalogoVoce[];
  attivita: UnitaLocaleAttivita[];
  codici_ateco: UnitaLocaleCodiceAteco[];
  contatti: UnitaLocaleContatto[];
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

// ===========================================================================
// Aggiornamento impresa (Correzione 24): 4 indicatori derivati + cronologia
// in sola lettura dalla vista vw_ana_cronologia_aggiornamenti_impresa.
// ===========================================================================

/** § punto 1/2: sempre calcolati dal backend, mai un numero fisso nel
 * frontend. */
export interface IndicatoriAggiornamentoImpresa {
  pratiche_ultimi_12_mesi: number;
  trasferimenti_quote: number;
  trasferimenti_sede: number;
  partecipazioni: number;
  ultimo_protocollo: string | null;
}

/** Riga della tabella "Cronologia aggiornamenti e protocolli" (§6). */
export interface CronologiaEvento {
  evento_id: string;
  tipologia: string;
  data: string | null;
  origine: string | null;
  esito: string | null;
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

/** Coppia label/valore già risolta dal backend (§9): il dettaglio dipende
 * dal tipo di evento, il frontend resta generico. */
export interface CampoDettaglioEvento {
  label: string;
  value: string | null;
}

export interface CronologiaEventoDettaglio {
  evento_id: string;
  tipologia: string;
  tabella_origine: string;
  record_origine_id: string;
  campi: CampoDettaglioEvento[];
  verificationStatus: VerificationStatus | null;
  verificationVersion: number | null;
  revisionNote: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}
