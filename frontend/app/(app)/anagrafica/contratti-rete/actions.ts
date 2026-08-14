"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool, textOrNull } from "@/lib/api";
import type { ContrattiRetePresenza, ContrattoRete } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

export async function upsertPresenza(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ContrattiRetePresenza>("/api/anagrafica/contratti-rete/presenza", {
      method: "PUT",
      body: JSON.stringify({ presenza: checkboxToBool(formData.get("presenza")) }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/contratti-rete");
  return { success: true };
}

function payloadFromFormData(formData: FormData) {
  return {
    numero_registrazione: formData.get("numero_registrazione") as string,
    numero_repertorio: formData.get("numero_repertorio") as string,
    nome_contratto: formData.get("nome_contratto") as string,
    data_adesione: formData.get("data_adesione") as string,
    data_cessazione: textOrNull(formData.get("data_cessazione")),
    note: textOrNull(formData.get("note")),
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
  };
}

export async function createContratto(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ContrattoRete>("/api/anagrafica/contratti-rete", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/contratti-rete");
  return { success: true };
}

export async function updateContratto(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ContrattoRete>(`/api/anagrafica/contratti-rete/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/contratti-rete");
  return { success: true };
}

export async function deleteContratto(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/contratti-rete/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/contratti-rete");
}
