"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    anno_riferimento: Number(formData.get("anno_riferimento")),
    numero_nuove_assunzioni: Number(formData.get("numero_nuove_assunzioni")),
    numero_cessazioni: Number(formData.get("numero_cessazioni")),
    obiettivo_variazione_percentuale: formData.get("obiettivo_variazione_percentuale") as string,
    note: textOrNull(formData.get("note")),
  };
}

export async function createVariazione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<VariazioneOrganico>("/api/anagrafica/variazioni-organico", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/variazioni-organico");
  return { success: true };
}

export async function updateVariazione(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<VariazioneOrganico>(`/api/anagrafica/variazioni-organico/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/variazioni-organico");
  return { success: true };
}

export async function deleteVariazione(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/variazioni-organico/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/variazioni-organico");
}
