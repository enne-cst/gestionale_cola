"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { AlboRuoloLicenza } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    tipologia: formData.get("tipologia") as string,
    numero_iscrizione: textOrNull(formData.get("numero_iscrizione")),
    provincia: textOrNull(formData.get("provincia")),
    sezione: textOrNull(formData.get("sezione")),
    categoria: textOrNull(formData.get("categoria")),
    descrizione_categoria: textOrNull(formData.get("descrizione_categoria")),
    classe: textOrNull(formData.get("classe")),
    data_domanda_accertamento: textOrNull(formData.get("data_domanda_accertamento")),
    data_delibera: textOrNull(formData.get("data_delibera")),
    data_inizio: textOrNull(formData.get("data_inizio")),
    data_scadenza: textOrNull(formData.get("data_scadenza")),
    stato: textOrNull(formData.get("stato")),
    motivo_cancellazione: textOrNull(formData.get("motivo_cancellazione")),
    data_comunicazione: textOrNull(formData.get("data_comunicazione")),
    data_cessazione: textOrNull(formData.get("data_cessazione")),
    data_caricamento: textOrNull(formData.get("data_caricamento")),
    fonte: textOrNull(formData.get("fonte")),
    sede_id: textOrNull(formData.get("sede_id")),
  };
}

export async function createAlbo(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<AlboRuoloLicenza>("/api/anagrafica/albi-ruoli-licenze", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/albi-ruoli-licenze");
  return { success: true };
}

export async function updateAlbo(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<AlboRuoloLicenza>(`/api/anagrafica/albi-ruoli-licenze/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/albi-ruoli-licenze");
  return { success: true };
}

export async function deleteAlbo(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/albi-ruoli-licenze/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/albi-ruoli-licenze");
}
