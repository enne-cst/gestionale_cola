// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/schemas/anagrafica_iso9001.py: le sezioni dell'Anagrafica
// Aziendale soggette all'abbonamento ISO 9001 (cap. 4.2.2/4.2.3).

interface ConMetadati {
  id: string;
  azienda_id: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogoVoce {
  id: string;
  codice: string;
  denominazione: string;
  ordine_visualizzazione: number;
  attivo: boolean;
}

// --- Contratto di lavoro (singleton) ---
export interface ContrattoLavoro extends ConMetadati {
  ccnl_applicato: string;
  settore_ccnl: string;
  data_applicazione: string;
  ccnl_precedente: string | null;
  note: string | null;
}

// --- Posizioni assicurative e previdenziali (singleton) ---
export interface PosizioniAssicurativePrevidenziali extends ConMetadati {
  numero_posizione_inps: string;
  sede_territoriale_inps: string;
  numero_posizione_inail: string;
  sede_territoriale_inail: string;
}

// --- Fondo interprofessionale (elenco) ---
export interface FondoInterprofessionale extends ConMetadati {
  fondo_interprofessionale: string;
  stato_iscrizione_id: string;
  data_adesione: string;
  codice_fondo: string | null;
  data_recesso: string | null;
  note: string | null;
}

// --- Dati generali (elenco, una riga per anno) ---
export interface DatiGenerali extends ConMetadati {
  anno_riferimento: number;
  numero_addetti: number;
  numero_dipendenti: number;
  numero_soci_lavoratori: number;
  organico_medio_annuo: string;
  eta_media: string;
}

// --- Ripartizione organico (elenco, una riga per anno) + percentuali ---
export interface RipartizioneOrganico extends ConMetadati {
  anno_riferimento: number;
  numero_amministrativi: number;
  numero_project_manager: number;
  numero_tecnici: number;
  numero_preposti: number;
  numero_operativi: number;
  numero_dirigenti_sicurezza: number;
  numero_uomini: number;
  numero_donne: number;
  numero_italiani: number;
  numero_stranieri: number;
  numero_tempo_determinato: number;
  numero_tempo_indeterminato: number;
  numero_laureati: number;
  numero_diplomati: number;
  percentuale_amministrativi: string | null;
  percentuale_project_manager: string | null;
  percentuale_tecnici: string | null;
  percentuale_preposti: string | null;
  percentuale_operativi: string | null;
  percentuale_dirigenti_sicurezza: string | null;
  percentuale_uomini: string | null;
  percentuale_donne: string | null;
  percentuale_italiani: string | null;
  percentuale_stranieri: string | null;
  percentuale_tempo_determinato: string | null;
  percentuale_tempo_indeterminato: string | null;
  percentuale_laureati: string | null;
  percentuale_diplomati: string | null;
}

// --- Turni di lavoro (singleton) ---
export interface TurniLavoro extends ConMetadati {
  presenza_turnazioni: boolean;
  tipologia_turno: string | null;
  numero_turni: number | null;
  fasce_orarie: string | null;
  rotazione_turni: string | null;
  lavoro_notturno: boolean;
  lavoro_festivo: boolean;
  lavoro_ciclo_continuo: boolean;
  note: string | null;
}

// --- Outsourcing (elenco) ---
export interface Outsourcing extends ConMetadati {
  processo_attivita_affidata: string;
  data_inizio: string;
  data_fine: string | null;
  stato_id: string;
  referente_interno: string;
  contratto_associato: string;
  note: string | null;
}

// --- Subappaltatori (elenco) ---
export interface Subappaltatore extends ConMetadati {
  ragione_sociale: string;
  codice_fiscale_partita_iva: string;
  categoria_lavori: string;
  data_inizio: string;
  data_fine: string | null;
  stato_id: string;
  referente: string;
  documentazione_associata: string | null;
  note: string | null;
}

// --- Fornitori di materiali (elenco) ---
export interface FornitoreMateriali extends ConMetadati {
  ragione_sociale: string;
  referente: string;
  telefono: string;
  email: string;
  categoria_merceologica: string;
  materiali_forniti: string;
  data_inizio_collaborazione: string;
  stato_id: string;
  contratto: string | null;
  certificazioni: string | null;
  schede_tecniche_sicurezza: string | null;
  altri_documenti: string | null;
}

// --- Lavoratori autonomi (elenco) ---
export interface LavoratoreAutonomo extends ConMetadati {
  nominativo_ragione_sociale: string;
  codice_fiscale_partita_iva: string;
  mansione: string;
  attivita_svolta: string;
  data_inizio_collaborazione: string;
  data_fine_collaborazione: string | null;
  stato_id: string;
  documentazione_associata: string | null;
  note: string | null;
}

// --- Indicatori economici (elenco, una riga per anno) + scostamento ---
export interface IndicatoreEconomico extends ConMetadati {
  anno_riferimento: number;
  fatturato: string;
  obiettivo: string;
  note: string | null;
  scostamento: string | null;
}

// --- Variazioni organico (elenco, una riga per anno) + calcoli ---
export interface VariazioneOrganico extends ConMetadati {
  anno_riferimento: number;
  numero_nuove_assunzioni: number;
  numero_cessazioni: number;
  obiettivo_variazione_percentuale: string;
  note: string | null;
  organico_medio_annuo: string | null;
  incremento_decremento_personale_percentuale: string | null;
  scostamento: string | null;
}

// --- Assicurazioni (elenco) ---
export interface Assicurazione extends ConMetadati {
  tipologia_polizza: string;
  compagnia_assicurativa: string;
  numero_polizza: string;
  data_emissione: string;
  data_decorrenza: string;
  data_scadenza: string;
  massimale: string;
  stato_id: string;
  contraente: string;
  referente: string;
  premio_assicurativo: string;
  frequenza_rinnovo_id: string;
  documentazione_associata: string | null;
  note: string | null;
}

// --- Contratti di rete: presenza (singleton) + contratti (elenco) ---
export interface ContrattiRetePresenza extends ConMetadati {
  presenza: boolean;
}

export interface ContrattoRete extends ConMetadati {
  numero_registrazione: string;
  numero_repertorio: string;
  nome_contratto: string;
  data_adesione: string;
  data_cessazione: string | null;
  note: string | null;
  documentazione_associata: string | null;
}

// --- Compliance e trasparenza (elenco) ---
export interface ComplianceTrasparenza extends ConMetadati {
  elemento: string;
  presenza: boolean;
  data_adozione: string | null;
  dettagli_note: string | null;
  documentazione_associata: string | null;
}

// --- Procedimenti legali (elenco) ---
export interface ProcedimentoLegale extends ConMetadati {
  tipologia_procedimento: string;
  controparte: string;
  data_inizio: string;
  data_conclusione: string | null;
  stato_id: string;
  esito: string | null;
  note: string | null;
  documentazione_associata: string | null;
}

// --- Visite enti di controllo (elenco) ---
export interface VisitaEnteControllo extends ConMetadati {
  ente: string;
  tipologia_visita: string;
  data_visita: string;
  esito: string;
  prescrizioni: string | null;
  verbale_documentazione: string | null;
  note: string | null;
}
