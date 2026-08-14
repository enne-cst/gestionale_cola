"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    ragione_sociale: formData.get("ragione_sociale") as string,
    referente: formData.get("referente") as string,
    telefono: formData.get("telefono") as string,
    email: formData.get("email") as string,
    categoria_merceologica: formData.get("categoria_merceologica") as string,
    materiali_forniti: formData.get("materiali_forniti") as string,
    data_inizio_collaborazione: formData.get("data_inizio_collaborazione") as string,
    stato_id: formData.get("stato_id") as string,
    contratto: textOrNull(formData.get("contratto")),
    certificazioni: textOrNull(formData.get("certificazioni")),
    schede_tecniche_sicurezza: textOrNull(formData.get("schede_tecniche_sicurezza")),
    altri_documenti: textOrNull(formData.get("altri_documenti")),
  };
}

export async function createFornitore(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<FornitoreMateriali>("/api/anagrafica/fornitori-materiali", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/fornitori-materiali");
  return { success: true };
}

export async function updateFornitore(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<FornitoreMateriali>(`/api/anagrafica/fornitori-materiali/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/fornitori-materiali");
  return { success: true };
}

export async function deleteFornitore(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/fornitori-materiali/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/fornitori-materiali");
}
