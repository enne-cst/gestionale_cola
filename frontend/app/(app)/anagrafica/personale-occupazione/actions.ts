"use server";

import { apiFetch, apiFetchResult } from "@/lib/api";
import type { PersonaleOccupazioneRiepilogo } from "@/lib/types/anagrafica";

const PATH = "/api/anagrafica/personale-occupazione";

/** Riepilogo calcolato della rilevazione di "Addetti da visura" più
 * recente (§ Correzione 22): sola lettura, i dati restano quelli di
 * `ana_addetti_visura`/`ana_addetti_comune` scritti dai dialog esistenti. */
export async function getRiepilogoPersonaleOccupazione(): Promise<PersonaleOccupazioneRiepilogo> {
  return apiFetch<PersonaleOccupazioneRiepilogo>(`${PATH}/riepilogo`);
}

/** Tutte le rilevazioni tranne la più recente (§ riorganizzazione dello
 * storico), stesso riepilogo calcolato usato sopra — il frontend lo riusa
 * sia per la riga sintetica sia per il dettaglio espanso, nessun secondo
 * fetch di dettaglio. */
export async function getStoricoRilevazioni(): Promise<PersonaleOccupazioneRiepilogo[]> {
  return apiFetch<PersonaleOccupazioneRiepilogo[]>(`${PATH}/storico`);
}

export type EsitoVerificaPersonaleOccupazione =
  | { esito: "ok"; riepilogo: PersonaleOccupazioneRiepilogo }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

export async function inviaVerificaPersonaleOccupazione(
  rilevazioneId: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaPersonaleOccupazione> {
  const result = await apiFetchResult<PersonaleOccupazioneRiepilogo>(`${PATH}/${rilevazioneId}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", riepilogo: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
