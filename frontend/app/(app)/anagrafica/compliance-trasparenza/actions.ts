"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, checkboxToBool, textOrNull } from "@/lib/api";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    elemento: formData.get("elemento") as string,
    presenza: checkboxToBool(formData.get("presenza")),
    data_adozione: textOrNull(formData.get("data_adozione")),
    dettagli_note: textOrNull(formData.get("dettagli_note")),
    documentazione_associata: textOrNull(formData.get("documentazione_associata")),
  };
}

export async function createElemento(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ComplianceTrasparenza>("/api/anagrafica/compliance-trasparenza", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/compliance-trasparenza");
  return { success: true };
}

export async function updateElemento(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<ComplianceTrasparenza>(`/api/anagrafica/compliance-trasparenza/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/compliance-trasparenza");
  return { success: true };
}

export async function deleteElemento(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/compliance-trasparenza/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/compliance-trasparenza");
}
