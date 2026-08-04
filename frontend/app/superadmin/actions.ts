"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";

export async function approvaAzienda(aziendaId: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/superadmin/aziende/${aziendaId}/approva`, { method: "POST" });
  revalidatePath("/superadmin");
}

export async function rifiutaAzienda(aziendaId: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/superadmin/aziende/${aziendaId}/rifiuta`, { method: "POST" });
  revalidatePath("/superadmin");
}

export type AssociaConsulenteState = { error?: string; success?: boolean };

export async function associaConsulente(
  _prevState: AssociaConsulenteState,
  formData: FormData,
): Promise<AssociaConsulenteState> {
  const aziendaId = formData.get("azienda_id");
  const consulenteId = formData.get("consulente_id");

  try {
    await apiFetch<void>(`/api/superadmin/aziende/${aziendaId}/consulenti`, {
      method: "POST",
      body: JSON.stringify({ consulente_id: consulenteId }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }

  revalidatePath("/superadmin");
  return { success: true };
}
