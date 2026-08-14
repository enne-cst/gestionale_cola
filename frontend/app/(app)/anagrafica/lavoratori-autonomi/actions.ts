"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    nominativo_ragione_sociale: formData.get("nominativo_ragione_sociale") as string,
    codice_fiscale_partita_iva: formData.get("codice_fiscale_partita_iva") as string,
    mansione: formData.get("mansione") as string,
    attivita_svolta: formData.get("attivita_svolta") as string,
    data_inizio_collaborazione: formData.get("data_inizio_collaborazione") as string,
    data_fine_collaborazione: textOrNull(formData.get("data_fine_collaborazione")),
    stato_id: formData.get("stato_id") as string,
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
    note: textOrNull(formData.get("note")),
  };
}

export async function createLavoratore(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<LavoratoreAutonomo>("/api/anagrafica/lavoratori-autonomi", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/lavoratori-autonomi");
  return { success: true };
}

export async function updateLavoratore(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<LavoratoreAutonomo>(`/api/anagrafica/lavoratori-autonomi/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/lavoratori-autonomi");
  return { success: true };
}

export async function deleteLavoratore(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/lavoratori-autonomi/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/lavoratori-autonomi");
}
