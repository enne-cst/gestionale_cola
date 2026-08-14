"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    fondo_interprofessionale: formData.get("fondo_interprofessionale") as string,
    stato_iscrizione_id: formData.get("stato_iscrizione_id") as string,
    data_adesione: formData.get("data_adesione") as string,
    codice_fondo: textOrNull(formData.get("codice_fondo")),
    data_recesso: textOrNull(formData.get("data_recesso")),
    note: textOrNull(formData.get("note")),
  };
}

export async function createFondo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<FondoInterprofessionale>("/api/anagrafica/fondi-interprofessionali", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/fondi-interprofessionali");
  return { success: true };
}

export async function updateFondo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<FondoInterprofessionale>(`/api/anagrafica/fondi-interprofessionali/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/fondi-interprofessionali");
  return { success: true };
}

export async function deleteFondo(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/fondi-interprofessionali/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/fondi-interprofessionali");
}
