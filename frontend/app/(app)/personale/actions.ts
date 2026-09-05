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
  Competenza,
  CompetenzaNascosta,
  CompetenzaRuolo,
  CompetenzaRuoloPayload,
  CompetenzePersona,
  Conoscenza,
  ConoscenzaPayload,
  DocumentoPersonale,
  DocumentoPersonalePayload,
  Esperienza,
  EsperienzaPayload,
  GiudizioIdoneita,
  GiudizioIdoneitaPayload,
  MacroIndicatore,
  MacroIndicatoreValutaPayload,
  MacroareaCompetenze,
  Nota,
  NotaPayload,
  NuovaPersonaPayload,
  PersonaProfilo,
  PersonaProfiloUpdatePayload,
  PromemoriaVisita,
  PromemoriaVisitaPayload,
  RegistrazioneFormativa,
  RegistrazioneFormativaPayload,
  TitoloStudio,
  TitoloStudioPayload,
  ValutaVociPayload,
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

export async function valutaMacroIndicatore(
  personaId: string,
  macroarea: MacroareaCompetenze,
  payload: MacroIndicatoreValutaPayload,
) {
  return postApiResource<MacroIndicatore>(
    `/api/personale/persone/${personaId}/competenze/macro-indicatori/${macroarea}/valuta`,
    payload,
  );
}

export async function creaConoscenza(personaId: string, payload: ConoscenzaPayload) {
  return postApiResource<Conoscenza>(`/api/personale/persone/${personaId}/conoscenze`, payload);
}

export async function aggiornaConoscenza(conoscenzaId: string, payload: ConoscenzaPayload) {
  return putApiResourceResult<Conoscenza>(`/api/personale/conoscenze/${conoscenzaId}`, payload);
}

export async function archiviaConoscenza(conoscenzaId: string) {
  return deleteApiResource(`/api/personale/conoscenze/${conoscenzaId}`);
}

export async function valutaConoscenze(personaId: string, payload: ValutaVociPayload) {
  return postApiResource<Conoscenza[]>(`/api/personale/persone/${personaId}/conoscenze/valuta`, payload);
}

export async function valutaCompetenze(personaId: string, payload: ValutaVociPayload) {
  return postApiResource<CompetenzePersona>(`/api/personale/persone/${personaId}/competenze/valuta`, payload);
}

export async function nascondiCompetenza(personaId: string, voceId: string, motivo: string | null) {
  return postApiResource<CompetenzePersona>(`/api/personale/persone/${personaId}/competenze/${voceId}/nascondi`, {
    motivo,
  });
}

export async function ripristinaCompetenza(personaId: string, voceId: string) {
  return postApiResource<CompetenzePersona>(`/api/personale/persone/${personaId}/competenze/${voceId}/ripristina`, {});
}

export async function creaTitoloStudio(personaId: string, payload: TitoloStudioPayload) {
  return postApiResource<TitoloStudio>(`/api/personale/persone/${personaId}/titoli-studio`, payload);
}

export async function aggiornaTitoloStudio(titoloId: string, payload: TitoloStudioPayload) {
  return putApiResourceResult<TitoloStudio>(`/api/personale/titoli-studio/${titoloId}`, payload);
}

export async function eliminaTitoloStudio(titoloId: string) {
  return deleteApiResource(`/api/personale/titoli-studio/${titoloId}`);
}

export async function verificaTitoloStudio(
  titoloId: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
) {
  return postApiResource<TitoloStudio>(`/api/personale/titoli-studio/${titoloId}/review`, {
    decision,
    note,
    expectedFieldVersion,
  });
}

export async function creaEsperienza(personaId: string, payload: EsperienzaPayload) {
  return postApiResource<Esperienza>(`/api/personale/persone/${personaId}/esperienze`, payload);
}

export async function aggiornaEsperienza(esperienzaId: string, payload: EsperienzaPayload) {
  return putApiResourceResult<Esperienza>(`/api/personale/esperienze/${esperienzaId}`, payload);
}

export async function eliminaEsperienza(esperienzaId: string) {
  return deleteApiResource(`/api/personale/esperienze/${esperienzaId}`);
}

export async function verificaEsperienza(esperienzaId: string, verificata: boolean) {
  return postApiResource<Esperienza>(`/api/personale/esperienze/${esperienzaId}/verifica`, { verificata });
}

export async function creaNota(personaId: string, payload: NotaPayload) {
  return postApiResource<Nota>(`/api/personale/persone/${personaId}/note`, payload);
}

export async function aggiornaNota(notaId: string, payload: NotaPayload) {
  return putApiResourceResult<Nota>(`/api/personale/note/${notaId}`, payload);
}

export async function eliminaNota(notaId: string) {
  return deleteApiResource(`/api/personale/note/${notaId}`);
}
