"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { Subappaltatore } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    ragione_sociale: formData.get("ragione_sociale") as string,
    codice_fiscale_partita_iva: formData.get("codice_fiscale_partita_iva") as string,
    categoria_lavori: formData.get("categoria_lavori") as string,
    data_inizio: formData.get("data_inizio") as string,
    data_fine: textOrNull(formData.get("data_fine")),
    stato_id: formData.get("stato_id") as string,
    referente: formData.get("referente") as string,
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
    note: textOrNull(formData.get("note")),
  };
}

export async function createSubappaltatore(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Subappaltatore>("/api/anagrafica/subappaltatori", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/subappaltatori");
  return { success: true };
}

export async function updateSubappaltatore(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<Subappaltatore>(`/api/anagrafica/subappaltatori/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/subappaltatori");
  return { success: true };
}

export async function deleteSubappaltatore(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/subappaltatori/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/subappaltatori");
}
