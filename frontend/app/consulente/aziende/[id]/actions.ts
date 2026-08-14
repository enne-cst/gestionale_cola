"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool } from "@/lib/api";
import type { Abbonamento } from "@/lib/types/abbonamenti";

export type FormState = { error?: string; success?: boolean };

export async function aggiornaAbbonamento(
  aziendaId: string,
  certificazioneId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    stato_codice: formData.get("stato_codice") as string,
    data_attivazione: formData.get("data_attivazione") as string,
    data_scadenza: formData.get("data_scadenza") as string,
    rinnovo_automatico: checkboxToBool(formData.get("rinnovo_automatico")),
  };

  try {
    await apiFetch<Abbonamento>(`/api/consulente/aziende/${aziendaId}/abbonamenti/${certificazioneId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath(`/consulente/aziende/${aziendaId}`);
  return { success: true };
}

export async function disattivaAbbonamento(
  aziendaId: string,
  certificazioneId: string,
  _formData: FormData,
): Promise<void> {
  await apiFetch<Abbonamento>(`/api/consulente/aziende/${aziendaId}/abbonamenti/${certificazioneId}/disattiva`, {
    method: "POST",
  });
  revalidatePath(`/consulente/aziende/${aziendaId}`);
}
