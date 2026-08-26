"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { CodiceAteco } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    codice: formData.get("codice") as string,
    descrizione: textOrNull(formData.get("descrizione")),
    classificazione: textOrNull(formData.get("classificazione")),
    ruolo_codice: textOrNull(formData.get("ruolo_codice")),
    origine_codice: textOrNull(formData.get("origine_codice")),
    fonte: textOrNull(formData.get("fonte")),
    codice_nace: textOrNull(formData.get("codice_nace")),
    sede_id: textOrNull(formData.get("sede_id")),
  };
}

export async function createCodiceAteco(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<CodiceAteco>("/api/anagrafica/codici-ateco", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/codici-ateco");
  return { success: true };
}

export async function updateCodiceAteco(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<CodiceAteco>(`/api/anagrafica/codici-ateco/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/codici-ateco");
  return { success: true };
}

export async function deleteCodiceAteco(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/codici-ateco/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/codici-ateco");
}
