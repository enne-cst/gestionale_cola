"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch, numberOrNull, textOrNull } from "@/lib/api";
import type { Soa } from "@/lib/types/anagrafica";

export type FormState = { error?: string; success?: boolean };

function payloadFromFormData(formData: FormData) {
  const categorieCodici = formData.getAll("cat_categoria");
  const categorieDescrizioni = formData.getAll("cat_descrizione");
  const categorieClassifiche = formData.getAll("cat_classifica");
  const categorieLimiti = formData.getAll("cat_limite_economico");

  const categorie = categorieCodici
    .map((categoria, i) => ({
      categoria: typeof categoria === "string" ? categoria.trim() : "",
      descrizione: textOrNull(categorieDescrizioni[i]),
      classifica: textOrNull(categorieClassifiche[i]),
      limite_economico: numberOrNull(categorieLimiti[i]),
    }))
    .filter((c) => c.categoria !== "");

  return {
    numero_attestazione: textOrNull(formData.get("numero_attestazione")),
    organismo_denominazione: textOrNull(formData.get("organismo_denominazione")),
    organismo_codice_identificativo: textOrNull(formData.get("organismo_codice_identificativo")),
    data_rilascio: textOrNull(formData.get("data_rilascio")),
    data_scadenza: textOrNull(formData.get("data_scadenza")),
    regolamento: textOrNull(formData.get("regolamento")),
    categorie,
  };
}

export async function createSoa(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Soa>("/api/anagrafica/soa", {
      method: "POST",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/soa");
  return { success: true };
}

export async function updateSoa(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch<Soa>(`/api/anagrafica/soa/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFromFormData(formData)),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
  revalidatePath("/anagrafica/soa");
  return { success: true };
}

export async function deleteSoa(id: string, _formData: FormData): Promise<void> {
  await apiFetch<void>(`/api/anagrafica/soa/${id}`, { method: "DELETE" });
  revalidatePath("/anagrafica/soa");
}
