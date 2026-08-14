// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/schemas/abbonamenti.py.

export interface CertificazioneCatalogo {
  id: string;
  nome: string;
  codice: string;
}

export interface StatoCertificazioneCatalogo {
  id: string;
  nome: string;
}

export interface Abbonamento {
  certificazione_id: string;
  certificazione_nome: string;
  certificazione_codice: string;
  stato_codice: string;
  data_attivazione: string;
  data_scadenza: string;
  rinnovo_automatico: boolean;
  data_disattivazione: string | null;
  updated_at: string;
}
