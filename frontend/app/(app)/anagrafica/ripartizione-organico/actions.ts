"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

export type FormState = { error?: string; success?: boolean };

const CAMPI_NUMERICI = [
  "anno_riferimento",
  "numero_amministrativi",
  "numero_project_manager",
  "numero_tecnici",
  "numero_preposti",
  "numero_operativi",
  "numero_dirigenti_sicurezza",
  "numero_uomini",
  "numero_donne",
  "numero_italiani",
  "numero_stranieri",
  "numero_tempo_determinato",
  "numero_tempo_indeterminato",
  "numero_laureati",
  "numero_diplomati",
] as const;

function payloadFromFormData(formData: FormData) {
  return Object.fromEntries(CAMPI_NUMERICI.map((campo) => [campo, Number(formData.get(campo))]));
}

export async function createRipartizioneOrganico(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<RipartizioneOrganico>("/api/anagrafica/ripartizione-organico", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/ripartizione-organico");
  return { success: true };
}

export async function updateRipartizioneOrganico(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await apiFetch<RipartizioneOrganico>(`/api/anagrafica/ripartizione-organico/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/ripartizione-organico");
  return { success: true };
}

export async function deleteRipartizioneOrganico(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/ripartizione-organico/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/ripartizione-organico");
}
