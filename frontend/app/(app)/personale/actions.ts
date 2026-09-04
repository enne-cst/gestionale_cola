"use server";

import { revalidatePath } from "next/cache";

import { deleteApiResource, patchApiResource, postApiResource, putApiResourceResult } from "@/lib/actions/api-resource";
import type {
  CatalogoCorso,
  CatalogoCorsoPayload,
  CatalogoCreatePayload,
  CatalogoVoce,
  CompetenzaRuolo,
  CompetenzaRuoloPayload,
  DocumentoPersonale,
  DocumentoPersonalePayload,
  NuovaPersonaPayload,
  PersonaProfilo,
  PersonaProfiloUpdatePayload,
  RegistrazioneFormativa,
  RegistrazioneFormativaPayload,
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

export async function creaDocumentoPersona(personaId: string, payload: DocumentoPersonalePayload) {
  const risultato = await postApiResource<DocumentoPersonale>(`/api/personale/persone/${personaId}/documenti`, payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function aggiornaDocumentoPersona(documentoId: string, payload: DocumentoPersonalePayload) {
  const risultato = await putApiResourceResult<DocumentoPersonale>(`/api/personale/documenti/${documentoId}`, payload);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function eliminaDocumentoPersona(documentoId: string) {
  const risultato = await deleteApiResource(`/api/personale/documenti/${documentoId}`);
  if (risultato.ok) revalidatePath("/personale");
  return risultato;
}

export async function creaCompetenzaRuolo(ruoloId: string, payload: CompetenzaRuoloPayload) {
  return postApiResource<CompetenzaRuolo>(`/api/personale/ruoli/${ruoloId}/mansionario`, payload);
}

export async function aggiornaCompetenzaRuolo(relazioneId: string, payload: CompetenzaRuoloPayload) {
  return putApiResourceResult<CompetenzaRuolo>(`/api/personale/mansionario/competenze/${relazioneId}`, payload);
}

export async function eliminaCompetenzaRuolo(relazioneId: string) {
  return deleteApiResource(`/api/personale/mansionario/competenze/${relazioneId}`);
}

export async function creaCorsoFormazione(payload: CatalogoCorsoPayload) {
  return postApiResource<CatalogoCorso>("/api/personale/corsi-formazione", payload);
}

export async function creaRegistrazioneFormativa(personaId: string, payload: RegistrazioneFormativaPayload) {
  return postApiResource<RegistrazioneFormativa>(`/api/personale/persone/${personaId}/formazione-abilitazioni`, payload);
}

export async function aggiornaRegistrazioneFormativa(
  registrazioneId: string,
  payload: RegistrazioneFormativaPayload,
) {
  return putApiResourceResult<RegistrazioneFormativa>(
    `/api/personale/formazione-abilitazioni/${payload.tipo}/${registrazioneId}`,
    payload,
  );
}
