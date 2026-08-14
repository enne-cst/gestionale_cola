"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { Assicurazione } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    tipologia_polizza: formData.get("tipologia_polizza") as string,
    compagnia_assicurativa: formData.get("compagnia_assicurativa") as string,
    numero_polizza: formData.get("numero_polizza") as string,
    data_emissione: formData.get("data_emissione") as string,
    data_decorrenza: formData.get("data_decorrenza") as string,
    data_scadenza: formData.get("data_scadenza") as string,
    massimale: formData.get("massimale") as string,
    stato_id: formData.get("stato_id") as string,
    contraente: formData.get("contraente") as string,
    referente: formData.get("referente") as string,
    premio_assicurativo: formData.get("premio_assicurativo") as string,
    frequenza_rinnovo_id: formData.get("frequenza_rinnovo_id") as string,
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
    note: textOrNull(formData.get("note")),
  };
}

export async function createAssicurazione(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Assicurazione>("/api/anagrafica/assicurazioni", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/assicurazioni");
  return { success: true };
}

export async function updateAssicurazione(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Assicurazione>(`/api/anagrafica/assicurazioni/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/assicurazioni");
  return { success: true };
}

export async function deleteAssicurazione(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/assicurazioni/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/assicurazioni");
}
