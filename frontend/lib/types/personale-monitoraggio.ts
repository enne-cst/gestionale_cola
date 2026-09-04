// Tipi TypeScript allineati a backend/app/schemas/personale_monitoraggio.py
// (scheda "Monitoraggio personale": cruscotto di sola lettura, nessun dato
// autonomo — vedi backend/app/core/personale_monitoraggio.py per il calcolo).

import type { CatalogoVoce } from "./personale-hr";

export type StatoCellaMonitoraggio = "VALIDO" | "IN_SCADENZA" | "SCADUTO" | "INCOMPLETO" | "PIANIFICATO" | "NESSUN_DATO";

export type StatoComplessivoPersona = "REGOLARE" | "IN_ATTENZIONE" | "DA_GESTIRE" | "NESSUN_DATO";

export interface CellaMonitoraggio {
  stato: StatoCellaMonitoraggio;
  etichetta: string;
  dettaglio: string;
}

export interface IndicatoriMonitoraggio {
  persone_attive: number;
  registrazioni_valide: number;
  in_scadenza: number;
  scadute: number;
  registrazioni_incomplete: number;
  attivita_pianificate: number;
  calcolato_al: string;
}

export interface DistribuzioneConformita {
  regolari: number;
  in_attenzione: number;
  da_gestire: number;
  nessun_dato: number;
}

export interface ConformitaComplessiva {
  percentuale_regolari: number;
  persone_regolari: number;
  totale_persone_attive: number;
  distribuzione: DistribuzioneConformita;
}

export interface RiepilogoMonitoraggio {
  indicatori: IndicatoriMonitoraggio;
  conformita: ConformitaComplessiva;
}

export interface MonitoraggioRiga {
  persona_id: string;
  nome: string;
  cognome: string;
  mansione: CatalogoVoce | null;
  reparto: CatalogoVoce | null;
  formazione: CellaMonitoraggio;
  idoneita: CellaMonitoraggio;
  ruoli: CellaMonitoraggio;
  documenti: CellaMonitoraggio;
  prossima_data: string | null;
  prossima_data_origine: string | null;
  stato_complessivo: StatoComplessivoPersona;
}

export interface PaginaMonitoraggio {
  items: MonitoraggioRiga[];
  total: number;
  page: number;
  page_size: number;
}
