"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { IscrizioneRegistroImprese } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    tipo_iscrizione: textOrNull(formData.get("tipo_iscrizione")),
    sezione: textOrNull(formData.get("sezione")),
    data_iscrizione: textOrNull(formData.get("data_iscrizione")),
  };
}

export async function createIscrizione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<IscrizioneRegistroImprese>("/api/anagrafica/iscrizioni-registro-imprese", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/iscrizioni-registro-imprese");
  return { success: true };
}

export async function updateIscrizione(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<IscrizioneRegistroImprese>(`/api/anagrafica/iscrizioni-registro-imprese/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/iscrizioni-registro-imprese");
  return { success: true };
}

export async function deleteIscrizione(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/iscrizioni-registro-imprese/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/iscrizioni-registro-imprese");
}
