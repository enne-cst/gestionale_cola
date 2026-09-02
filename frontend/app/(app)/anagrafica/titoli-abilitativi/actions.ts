"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, apiFetchResult, checkboxToBool, textOrNull } from "@/lib/api";
import type {
  TitoloAbilitativoAlbo,
  TitoloAbilitativoCertificazione,
  TitoloAbilitativoDetail,
  TitoloAbilitativoLicenza,
  TitoloAbilitativoRuolo,
  TitoloAbilitativoSummary,
} from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

const PATH = "/api/anagrafica/titoli-abilitativi";
const REVALIDATE_PATH = "/anagrafica";

function campiComuniDaFormData(formData: FormData) {
  return {
    numero_attestazione: textOrNull(formData.get("numero_attestazione")),
    ente_rilascio: textOrNull(formData.get("ente_rilascio")),
    data_rilascio: textOrNull(formData.get("data_rilascio")),
    data_scadenza: checkboxToBool(formData.get("senza_scadenza")) ? null : textOrNull(formData.get("data_scadenza")),
    senza_scadenza: checkboxToBool(formData.get("senza_scadenza")),
    note: textOrNull(formData.get("note")),
  };
}

/** Vista riepilogativa per la tabella unificata (§ punto 3/4). */
export async function getTitoliAbilitativi(): Promise<TitoloAbilitativoSummary[]> {
  return apiFetch<TitoloAbilitativoSummary[]>(PATH);
}

/** Lettura del dettaglio tipizzato per l'apertura del form corretto
 * (§ punto 8: "selezionando una riga la piattaforma riconosce la tipologia
 * e apre il form corrispondente") — le informazioni non comprese nella
 * tabella riepilogativa vivono solo qui (§ punto 8, ultimo comma). */
export async function getTitoloAbilitativo(id: string): Promise<TitoloAbilitativoDetail> {
  return apiFetch<TitoloAbilitativoDetail>(`${PATH}/${id}`);
}

export async function eliminaTitoloAbilitativo(id: string): Promise<void> {
  await apiFetch<void>(`${PATH}/${id}`, { method: "DELETE" });
  revalidatePath(REVALIDATE_PATH);
}

export type EsitoVerificaTitolo =
  | { esito: "ok"; titolo: TitoloAbilitativoDetail }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function inviaVerificaTitoloAbilitativo(
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaTitolo> {
  const result = await apiFetchResult<TitoloAbilitativoDetail>(`${PATH}/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", titolo: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

// ---------------------------------------------------------------------------
// Form Albo
// ---------------------------------------------------------------------------

export async function creaAlbo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoAlbo>(`${PATH}/albo`, {
      method: "POST",
      body: JSON.stringify({ ...campiComuniDaFormData(formData), categoria: textOrNull(formData.get("categoria")) }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaAlbo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoAlbo>(`${PATH}/albo/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...campiComuniDaFormData(formData), categoria: textOrNull(formData.get("categoria")) }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Ruolo
// ---------------------------------------------------------------------------

export async function creaRuolo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoRuolo>(`${PATH}/ruolo`, {
      method: "POST",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        denominazione_ruolo: textOrNull(formData.get("denominazione_ruolo")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaRuolo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoRuolo>(`${PATH}/ruolo/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        denominazione_ruolo: textOrNull(formData.get("denominazione_ruolo")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Licenza
// ---------------------------------------------------------------------------

export async function creaLicenza(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoLicenza>(`${PATH}/licenza`, {
      method: "POST",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        tipologia_licenza: textOrNull(formData.get("tipologia_licenza")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaLicenza(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoLicenza>(`${PATH}/licenza/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        tipologia_licenza: textOrNull(formData.get("tipologia_licenza")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Form Certificazione o attestazione
// ---------------------------------------------------------------------------

export async function creaCertificazione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoCertificazione>(`${PATH}/certificazione`, {
      method: "POST",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        sotto_tipo: formData.get("sotto_tipo") as string,
        categoria_norma: textOrNull(formData.get("categoria_norma")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function aggiornaCertificazione(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<TitoloAbilitativoCertificazione>(`${PATH}/certificazione/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...campiComuniDaFormData(formData),
        sotto_tipo: formData.get("sotto_tipo") as string,
        categoria_norma: textOrNull(formData.get("categoria_norma")),
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}
