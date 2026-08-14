"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    anno_riferimento: Number(formData.get("anno_riferimento")),
    numero_addetti: Number(formData.get("numero_addetti")),
    numero_dipendenti: Number(formData.get("numero_dipendenti")),
    numero_soci_lavoratori: Number(formData.get("numero_soci_lavoratori")),
    organico_medio_annuo: formData.get("organico_medio_annuo") as string,
    eta_media: formData.get("eta_media") as string,
  };
}

export async function createDatiGenerali(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<DatiGenerali>("/api/anagrafica/dati-generali", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/dati-generali");
  return { success: true };
}

export async function updateDatiGenerali(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<DatiGenerali>(`/api/anagrafica/dati-generali/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/dati-generali");
  return { success: true };
}

export async function deleteDatiGenerali(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/dati-generali/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/dati-generali");
}
