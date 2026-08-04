// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/api/superadmin.py.

export interface Consulente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
}

export interface AziendaAmministrazione {
  id: string;
  ragione_sociale: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  stato_approvazione: "in_attesa" | "approvata" | "rifiutata";
  created_at: string;
  // Di norma uno solo (chi l'ha creata), ma può averne più d'uno.
  consulenti: Consulente[];
}

export interface AziendaSintesi {
  id: string;
  ragione_sociale: string;
  stato_approvazione: "in_attesa" | "approvata" | "rifiutata";
}

export interface ConsulenteAmministrazione extends Consulente {
  attivo: boolean;
  aziende: AziendaSintesi[];
}
