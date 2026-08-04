// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/api/auth.py.

export interface Utente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
}

export interface Azienda {
  id: string;
  ragione_sociale: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  profilo: string;
  utente: Utente;
  azienda: Azienda | null;
}

export interface MeResponse {
  utente: Utente;
  profilo: string;
  azienda: Azienda | null;
  in_impersonificazione: boolean;
}
