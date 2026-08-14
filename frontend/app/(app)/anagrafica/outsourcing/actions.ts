"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { Outsourcing } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    processo_attivita_affidata: formData.get("processo_attivita_affidata") as string,
    data_inizio: formData.get("data_inizio") as string,
    data_fine: textOrNull(formData.get("data_fine")),
    stato_id: formData.get("stato_id") as string,
    referente_interno: formData.get("referente_interno") as string,
    contratto_associato: formData.get("contratto_associato") as string,
    note: textOrNull(formData.get("note")),
  };
}

export async function createOutsourcing(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Outsourcing>("/api/anagrafica/outsourcing", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/outsourcing");
  return { success: true };
}

export async function updateOutsourcing(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Outsourcing>(`/api/anagrafica/outsourcing/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/outsourcing");
  return { success: true };
}

export async function deleteOutsourcing(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/outsourcing/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/outsourcing");
}
