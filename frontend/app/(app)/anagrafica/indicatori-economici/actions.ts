"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    anno_riferimento: Number(formData.get("anno_riferimento")),
    fatturato: formData.get("fatturato") as string,
    obiettivo: formData.get("obiettivo") as string,
    note: textOrNull(formData.get("note")),
  };
}

export async function createIndicatore(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<IndicatoreEconomico>("/api/anagrafica/indicatori-economici", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/indicatori-economici");
  return { success: true };
}

export async function updateIndicatore(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<IndicatoreEconomico>(`/api/anagrafica/indicatori-economici/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/indicatori-economici");
  return { success: true };
}

export async function deleteIndicatore(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/indicatori-economici/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/indicatori-economici");
}
