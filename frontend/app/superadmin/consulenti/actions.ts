"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api";

export async function disattivaConsulente(consulenteId: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/superadmin/consulenti/${consulenteId}/disattiva`, { method: "POST" });
  revalidatePath("/superadmin/consulenti");
}

export async function attivaConsulente(consulenteId: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/superadmin/consulenti/${consulenteId}/attiva`, { method: "POST" });
  revalidatePath("/superadmin/consulenti");
}

export async function rimuoviAssociazione(
  aziendaId: string,
  consulenteId: string,
  _formData: FormData,
): Promise<void> {
  await apiFetch<void>(`/api/superadmin/aziende/${aziendaId}/consulenti/${consulenteId}`, { method: "DELETE" });
  revalidatePath("/superadmin/consulenti");
  revalidatePath("/superadmin");
}
