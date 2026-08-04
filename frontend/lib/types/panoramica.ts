// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/schemas/panoramica.py.

export interface PanoramicaVoce {
  id: string;
  azienda_id: string;
  modulo: string;
  sezione_slug: string;
  // Esattamente uno dei due è valorizzato: campo per le sezioni singleton,
  // record_id per un intero record di una sezione a elenco.
  campo: string | null;
  record_id: string | null;
  etichetta: string;
  ordine: number;
  created_at: string;
  updated_at: string;
}
