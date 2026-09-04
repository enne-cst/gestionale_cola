"use server";

import { revalidatePath } from "next/cache";

import { deleteApiResource, patchApiResource, postApiResource, putApiResourceResult } from "@/lib/actions/api-resource";
import type {
  AppuntamentoVisita,
  AppuntamentoVisitaCreatePayload,
  AppuntamentoVisitaUpdatePayload,
  CatalogoCorso,
  CatalogoCorsoPayload,
  CatalogoCreatePayload,
  CatalogoVoce,
  CompetenzaRuolo,
  CompetenzaRuoloPayload,
  DocumentoPersonale,
  DocumentoPersonalePayload,
  GiudizioIdoneita,
  GiudizioIdoneitaPayload,
  NuovaPersonaPayload,
  PersonaProfilo,
  PersonaProfiloUpdatePayload,
  PromemoriaVisita,
  PromemoriaVisitaPayload,
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

export async function creaVisitaIdoneita(personaId: string, payload: GiudizioIdoneitaPayload) {
  return postApiResource<GiudizioIdoneita>(`/api/personale/persone/${personaId}/visite`, payload);
}

export async function aggiornaVisitaIdoneita(visitaId: string, payload: GiudizioIdoneitaPayload) {
  return putApiResourceResult<GiudizioIdoneita>(`/api/personale/visite/${visitaId}`, payload);
}

export async function creaAppuntamentoVisita(personaId: string, payload: AppuntamentoVisitaCreatePayload) {
  return postApiResource<AppuntamentoVisita>(`/api/personale/persone/${personaId}/appuntamenti-visita`, payload);
}

export async function aggiornaAppuntamentoVisita(appuntamentoId: string, payload: AppuntamentoVisitaUpdatePayload) {
  return putApiResourceResult<AppuntamentoVisita>(`/api/personale/appuntamenti-visita/${appuntamentoId}`, payload);
}

export async function creaPromemoriaVisita(personaId: string, payload: PromemoriaVisitaPayload) {
  return postApiResource<PromemoriaVisita>(`/api/personale/persone/${personaId}/promemoria-visita`, payload);
}
