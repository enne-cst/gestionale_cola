"use server";

// § "falle tutte" — verifica per riga sulle 14 sezioni ISO 9001 "a elenco"
// (Fondi interprofessionali, Dati generali, Outsourcing, Subappaltatori,
// Fornitori di materiali, Lavoratori autonomi, Ripartizione organico,
// Indicatori economici, Variazioni organico, Assicurazioni, Contratti di
// rete, Compliance e trasparenza, Procedimenti legali, Visite enti di
// controllo): un solo file generico invece di 14 quasi identici, stesso
// principio già seguito da `lib/actions/registro.ts` per le sezioni a
// campo. Il backend è altrettanto generico (`app/crud/generic.py`,
// parametro `verifica_sezione_codice`) — un solo endpoint
// `{resourcePath}/{id}/review` per ciascuna risorsa, stesso motore già
// usato da Soci/Amministratori/Sindaci e da "Sedi secondarie e unità
// locali" (`app.core.verifica_riga`), mai un secondo sistema di verifica.

import { apiFetch, apiFetchResult } from "@/lib/api";
import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

/** Elenco di una risorsa ISO 9001, caricato lato client dal pannello del
 * drawer (§ workspace-provider.tsx, stesso principio di
 * `getRegistroSezione`): `resourcePath` è lo slug della risorsa dopo
 * `/api/anagrafica/`, es. "fondi-interprofessionali". */
export async function getElencoIso9001<T>(resourcePath: string): Promise<T[]> {
  return apiFetch<T[]>(`/api/anagrafica/${resourcePath}`);
}

/** Come sopra, per una sotto-risorsa singleton (es. "contratti-rete/
 * presenza") caricata dallo stesso pannello client-fetched di un elenco
 * — "Contratti di rete" è l'unica delle 14 sezioni con questa forma. */
export async function getSingletonIso9001<T>(resourcePath: string): Promise<T> {
  return apiFetch<T>(`/api/anagrafica/${resourcePath}`);
}

export async function getCatalogoIso9001(nome: string): Promise<CatalogoVoce[]> {
  return apiFetch<CatalogoVoce[]>(`/api/anagrafica/cataloghi/${nome}`);
}

export type EsitoVerificaRigaIso9001<T> =
  | { esito: "ok"; riga: T }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

export async function inviaVerificaRigaIso9001<T>(
  resourcePath: string,
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaRigaIso9001<T>> {
  const result = await apiFetchResult<T>(`/api/anagrafica/${resourcePath}/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", riga: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
