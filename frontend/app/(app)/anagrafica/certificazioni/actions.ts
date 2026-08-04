"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { Certificazione } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  const codiciIaf = formData.getAll("settore_codice_iaf");
  const descrizioniIaf = formData.getAll("settore_descrizione_iaf");

  const settori_iaf = codiciIaf
    .map((codice_iaf, i) => ({
      codice_iaf: textOrNull(codice_iaf),
      descrizione_iaf: textOrNull(descrizioniIaf[i]),
    }))
    .filter((s) => s.codice_iaf !== null);

  return {
    tipologia_certificazione: textOrNull(formData.get("tipologia_certificazione")),
    sigla: textOrNull(formData.get("sigla")),
    norma_riferimento: textOrNull(formData.get("norma_riferimento")),
    numero_certificato: textOrNull(formData.get("numero_certificato")),
    data_prima_emissione: textOrNull(formData.get("data_prima_emissione")),
    organismo_certificatore: textOrNull(formData.get("organismo_certificatore")),
    codice_fiscale_organismo: textOrNull(formData.get("codice_fiscale_organismo")),
    fonte: textOrNull(formData.get("fonte")),
    data_ultimo_aggiornamento: textOrNull(formData.get("data_ultimo_aggiornamento")),
    settori_iaf,
  };
}

export async function createCertificazione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Certificazione>("/api/anagrafica/certificazioni", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/certificazioni");
  return { success: true };
}

export async function updateCertificazione(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<Certificazione>(`/api/anagrafica/certificazioni/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/certificazioni");
  return { success: true };
}

export async function deleteCertificazione(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/certificazioni/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/certificazioni");
}
