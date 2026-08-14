"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, textOrNull } from "@/lib/api";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  return {
    ente: formData.get("ente") as string,
    tipologia_visita: formData.get("tipologia_visita") as string,
    data_visita: formData.get("data_visita") as string,
    esito: formData.get("esito") as string,
    prescrizioni: textOrNull(formData.get("prescrizioni")),
    verbale_documentazione: textOrNull(formData.get("verbale_documentazione")),
    note: textOrNull(formData.get("note")),
  };
}

export async function createVisita(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<VisitaEnteControllo>("/api/anagrafica/visite-enti-controllo", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/visite-enti-controllo");
  return { success: true };
}

export async function updateVisita(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<VisitaEnteControllo>(`/api/anagrafica/visite-enti-controllo/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/visite-enti-controllo");
  return { success: true };
}

export async function deleteVisita(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/visite-enti-controllo/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/visite-enti-controllo");
}
