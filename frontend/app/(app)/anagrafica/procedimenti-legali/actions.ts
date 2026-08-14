"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    tipologia_procedimento: formData.get("tipologia_procedimento") as string,
    controparte: formData.get("controparte") as string,
    data_inizio: formData.get("data_inizio") as string,
    data_conclusione: textOrNull(formData.get("data_conclusione")),
    stato_id: formData.get("stato_id") as string,
    esito: textOrNull(formData.get("esito")),
    note: textOrNull(formData.get("note")),
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
  };
}

export async function createProcedimento(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ProcedimentoLegale>("/api/anagrafica/procedimenti-legali", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/procedimenti-legali");
  return { success: true };
}

export async function updateProcedimento(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<ProcedimentoLegale>(`/api/anagrafica/procedimenti-legali/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/procedimenti-legali");
  return { success: true };
}

export async function deleteProcedimento(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/procedimenti-legali/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/procedimenti-legali");
}
