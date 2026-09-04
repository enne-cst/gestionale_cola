"use server";

import { revalidatePath } from "next/cache";

import { patchApiResource, postApiResource } from "@/lib/actions/api-resource";
import type {
  CatalogoCreatePayload,
  CatalogoVoce,
  NuovaPersonaPayload,
  PersonaProfilo,
  PersonaProfiloUpdatePayload,
} from "@/lib/types/personale-hr";

export async function creaPersona(payload: NuovaPersonaPayload) {
  const risultato = await postApiResource<PersonaProfilo>("/api/personale/schede-persona", payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function aggiornaProfiloPersona(personaId: string, payload: PersonaProfiloUpdatePayload) {
  const risultato = await patchApiResource<PersonaProfilo>(`/api/personale/persone/${personaId}/profilo`, payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function creaMansione(payload: CatalogoCreatePayload) {
  const risultato = await postApiResource<CatalogoVoce>("/api/personale/mansioni", payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function creaReparto(payload: CatalogoCreatePayload) {
  const risultato = await postApiResource<CatalogoVoce>("/api/personale/reparti", payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}
