"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool, textOrNull } from "@/lib/api";
import type { Contatto } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    tipo_contatto: formData.get("tipo_contatto") as string,
    valore: formData.get("valore") as string,
    descrizione: textOrNull(formData.get("descrizione")),
    principale: checkboxToBool(formData.get("principale")),
  };
}

export async function createContatto(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Contatto>("/api/anagrafica/contatti", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/contatti");
  return { success: true };
}

export async function updateContatto(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Contatto>(`/api/anagrafica/contatti/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/contatti");
  return { success: true };
}

export async function deleteContatto(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/contatti/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/contatti");
}
