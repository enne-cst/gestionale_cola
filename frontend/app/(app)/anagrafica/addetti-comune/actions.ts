"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, numberOrNull, textOrNull } from "@/lib/api";
import type { AddettiComune } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  const periodi = formData.getAll("cp_periodo");
  const dipendenti = formData.getAll("cp_numero_dipendenti");
  const indipendenti = formData.getAll("cp_numero_indipendenti");
  const totali = formData.getAll("cp_numero_totale_addetti");

  const periodiRilevazione = periodi
    .map((periodo, i) => ({
      periodo,
      numero_dipendenti: numberOrNull(dipendenti[i]),
      numero_indipendenti: numberOrNull(indipendenti[i]),
      numero_totale_addetti: numberOrNull(totali[i]),
    }))
    .filter((p) => typeof p.periodo === "string" && p.periodo !== "");

  return {
    comune: formData.get("comune") as string,
    provincia: textOrNull(formData.get("provincia")),
    numero_sedi_unita_locali: numberOrNull(formData.get("numero_sedi_unita_locali")),
    periodi: periodiRilevazione,
  };
}

export async function createAddettiComune(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<AddettiComune>("/api/anagrafica/addetti-comune", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/addetti-comune");
  revalidatePath("/anagrafica");
  return { success: true };
}

export async function updateAddettiComune(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<AddettiComune>(`/api/anagrafica/addetti-comune/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/addetti-comune");
  revalidatePath("/anagrafica");
  return { success: true };
}

export async function deleteAddettiComune(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/addetti-comune/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/addetti-comune");
  revalidatePath("/anagrafica");
}
