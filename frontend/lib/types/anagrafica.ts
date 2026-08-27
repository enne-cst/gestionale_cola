// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/schemas/anagrafica.py. Solo i campi delle sezioni già
// implementate nel frontend.

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
}

export interface AddettiVisura extends ConMetadati {
  fonte: string | null;
  anno_riferimento: number | null;
  data_rilevazione: string | null;
  periodi: AddettiVisuraPeriodo[];
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
