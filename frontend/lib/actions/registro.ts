"use server";

import { apiFetch, apiFetchResult } from "@/lib/api";
import type { RegistryOverview, Section, SectionSummary } from "@/lib/types/registro";

export async function getRegistroOverview(): Promise<RegistryOverview> {
  return apiFetch<RegistryOverview>("/api/anagrafica/registro/overview");
}

/** Conteggi confermato/da verificare/da revisionare per ciascuna sezione a
 * registro (§6.4 del prototipo): alimenta la riga a tre pallini di ogni card
 * della griglia CCIAA senza che il frontend debba ricalcolare nulla. */
export async function getRiepilogoSezioni(): Promise<SectionSummary[]> {
  return apiFetch<SectionSummary[]>("/api/anagrafica/registro/sections/summary");
}

export async function getRegistroSezione(sectionKey: string): Promise<Section> {
  return apiFetch<Section>(`/api/anagrafica/registro/sections/${sectionKey}`);
}

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export type EsitoSalvaSezione =
  | { esito: "ok"; sezione: Section }
  | { esito: "validazione"; errori: Record<string, string> }
  | { esito: "conflitto"; sezione: Section }
  | { esito: "conferma_cessazione_organo_controllo"; messaggio: string; count: number }
  | { esito: "conferma_riduzione_sindaci_effettivi"; messaggio: string; count: number }
  | { esito: "errore"; messaggio: string };

/** Salvataggio a batch della sezione (§15.3): `version` e' il valore letto
 * dall'ultimo GET, inviato come If-Match per la concorrenza ottimistica
 * (§15.6). `null` solo per la primissima compilazione, quando la sezione
 * non ha ancora un record salvato.
 *
 * `opts.confermaCessazioneOrganoControllo` (§ Correzione 12): solo per la
 * sezione "organi-controllo", quando il backend ha già segnalato (esito
 * "conferma_cessazione_organo_controllo") che il passaggio a "Nessun
 * organo di controllo o revisore" cesserebbe sindaci/revisori ancora
 * attivi — l'utente ha confermato nel dialogo dedicato, questo secondo
 * tentativo lo comunica al backend, che cessa gli incarichi nella stessa
 * transazione del salvataggio. Ignorato da ogni altra sezione.
 *
 * `opts.confermaRiduzioneSindaciEffettivi` (§ Correzione 14): stesso
 * pattern a due tentativi, solo per la sezione "organi-controllo" quando
 * si riduce "Sindaci effettivi" (5 -> 3) e ci sono più titolari attivi di
 * quanti posti restano. */
export async function salvaSezioneRegistro(
  sectionKey: string,
  version: string | null,
  campi: Record<string, string | null>,
  opts?: { confermaCessazioneOrganoControllo?: boolean; confermaRiduzioneSindaciEffettivi?: boolean },
): Promise<EsitoSalvaSezione> {
  const params = new URLSearchParams();
  if (opts?.confermaCessazioneOrganoControllo) params.set("confirm_cessazione_organo_controllo", "true");
  if (opts?.confermaRiduzioneSindaciEffettivi) params.set("confirm_riduzione_sindaci_effettivi", "true");
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const result = await apiFetchResult<Section>(`/api/anagrafica/registro/sections/${sectionKey}${query}`, {
    method: "PATCH",
    headers: version ? { "If-Match": version } : undefined,
    body: JSON.stringify({ fields: campi }),
  });

  if (result.ok) return { esito: "ok", sezione: result.data };

  if (result.status === 422 && Array.isArray(result.detail)) {
    const errori: Record<string, string> = {};
    for (const issue of result.detail as { loc?: unknown[]; msg?: string }[]) {
      const campo = Array.isArray(issue.loc) ? issue.loc.at(-1) : undefined;
      if (typeof campo === "string" && issue.msg) errori[campo] = issue.msg;
    }
    return { esito: "validazione", errori };
  }

  if (result.status === 409 && result.detail !== null && typeof result.detail === "object" && !Array.isArray(result.detail)) {
    const detail = result.detail as { code?: string; message: string; count: number };
    if (detail.code === "CESSAZIONE_ORGANO_CONTROLLO_RICHIESTA") {
      return { esito: "conferma_cessazione_organo_controllo", messaggio: detail.message, count: detail.count };
    }
    if (detail.code === "RIDUZIONE_SINDACI_EFFETTIVI_RICHIESTA") {
      return { esito: "conferma_riduzione_sindaci_effettivi", messaggio: detail.message, count: detail.count };
    }
  }

  if (result.status === 409) {
    return { esito: "conflitto", sezione: await getRegistroSezione(sectionKey) };
  }

  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export type EsitoMutazioneSezione = { esito: "ok"; sezione: Section } | { esito: "errore"; messaggio: string };

/** Configurazione autonoma (§13.3), non tocca la bozza del modulo dati:
 * solo Consulente, applicata lato server. */
export async function impostaVisibilitaCampo(
  sectionKey: string,
  fieldKey: string,
  visibleToCompany: boolean,
): Promise<EsitoMutazioneSezione> {
  const result = await apiFetchResult<Section>(
    `/api/anagrafica/registro/sections/${sectionKey}/fields/${encodeURIComponent(fieldKey)}/visibility`,
    { method: "PATCH", body: JSON.stringify({ visibleToCompany }) },
  );
  if (result.ok) return { esito: "ok", sezione: result.data };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export type EsitoDecisioneVerifica =
  | { esito: "ok"; sezione: Section }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

export async function inviaDecisioneVerifica(
  sectionKey: string,
  fieldKey: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoDecisioneVerifica> {
  const result = await apiFetchResult<Section>(
    `/api/anagrafica/registro/sections/${sectionKey}/fields/${encodeURIComponent(fieldKey)}/review`,
    { method: "POST", body: JSON.stringify({ decision, note, expectedFieldVersion }) },
  );
  if (result.ok) return { esito: "ok", sezione: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
