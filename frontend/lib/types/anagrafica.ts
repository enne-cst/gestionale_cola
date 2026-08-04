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
}

export interface Contatto extends ConMetadati {
  tipo_contatto: string;
  valore: string;
  descrizione: string | null;
  principale: boolean;
}
