// Tipi TypeScript allineati ai contratti Pydantic esposti da
// backend/app/api/consulente.py.

export interface AziendaCliente {
  id: string;
  ragione_sociale: string;
  stato_approvazione: "in_attesa" | "approvata" | "rifiutata";
}
