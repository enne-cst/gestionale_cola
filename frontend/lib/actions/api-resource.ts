"use server";

import { apiFetch } from "@/lib/api";

/** Lettura generica di una risorsa REST già autorizzata e isolata per
 * azienda dal backend (§2.3 CLAUDE.md): usata dal pannello CCIAA per
 * caricare client-side i dati delle tabelle incorporate, riusando gli stessi
 * endpoint già chiamati dalle pagine standalone corrispondenti invece di
 * duplicare una server action di lettura per ciascuna risorsa. */
export async function getApiResource<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

/** Scrittura generica (PUT) di una risorsa REST, controparte di
 * `getApiResource`: usata dai blocchi incorporati del pannello CCIAA che
 * salvano direttamente sull'endpoint esistente invece di duplicare una
 * server action di scrittura per ciascuna risorsa. */
export async function putApiResource<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}
