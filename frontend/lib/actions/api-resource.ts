"use server";

import { apiFetch, apiFetchResult, type ApiResult } from "@/lib/api";

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

/** POST generico, variante di `apiFetchResult` che non lancia: usata dai
 * form di creazione del modulo Personale per distinguere un 422/409 di
 * validazione (mostrato per campo) da un errore imprevisto. */
export async function postApiResource<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiFetchResult<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** PATCH generico, stessa logica di `postApiResource` sopra. */
export async function patchApiResource<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiFetchResult<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

/** PUT generico che non lancia (variante di `putApiResource` sopra, la cui
 * firma lancia in caso di errore): usata dai form di modifica del modulo
 * Personale che devono distinguere un 422 di validazione da un errore
 * imprevisto, come già fatto per `postApiResource`/`patchApiResource`. */
export async function putApiResourceResult<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiFetchResult<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

/** DELETE generico: usato dalle azioni di rimozione del modulo Personale
 * che riusano un endpoint REST già esistente invece di duplicarne uno. */
export async function deleteApiResource(path: string): Promise<ApiResult<null>> {
  return apiFetchResult<null>(path, { method: "DELETE" });
}
