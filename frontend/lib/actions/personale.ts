"use server";

import { ApiError, apiFetch, apiFetchResult } from "@/lib/api";
import type {
  AnaPersona,
  AnaPersonaGiuridica,
  CaratteristicaRuolo,
  Incarico,
  IncaricoPayload,
  PersonaCreatePayload,
  PersonaGiuridicaCreatePayload,
  RuoloSummary,
} from "@/lib/types/personale";

export async function getPersone(): Promise<AnaPersona[]> {
  return apiFetch<AnaPersona[]>("/api/personale/persone");
}

export async function creaPersona(payload: PersonaCreatePayload): Promise<AnaPersona> {
  return apiFetch<AnaPersona>("/api/personale/persone", { method: "POST", body: JSON.stringify(payload) });
}

// § Correzione 16: come sopra, per il titolare persona giuridica.
export async function getPersoneGiuridiche(): Promise<AnaPersonaGiuridica[]> {
  return apiFetch<AnaPersonaGiuridica[]>("/api/personale/persone-giuridiche");
}

export async function creaPersonaGiuridica(payload: PersonaGiuridicaCreatePayload): Promise<AnaPersonaGiuridica> {
  return apiFetch<AnaPersonaGiuridica>("/api/personale/persone-giuridiche", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRuoli(codici: string[]): Promise<RuoloSummary[]> {
  return apiFetch<RuoloSummary[]>(`/api/personale/ruoli?codici=${encodeURIComponent(codici.join(","))}`);
}

export async function getCaratteristicheRuolo(ruoloId: string): Promise<CaratteristicaRuolo[]> {
  return apiFetch<CaratteristicaRuolo[]>(`/api/personale/ruoli/${ruoloId}/caratteristiche`);
}

export async function getIncarichi(ruoloCodice?: string): Promise<Incarico[]> {
  const query = ruoloCodice ? `?ruolo_codice=${encodeURIComponent(ruoloCodice)}` : "";
  return apiFetch<Incarico[]>(`/api/personale/incarichi${query}`);
}

// § sezione "Ruoli e responsabilità" del modulo Personale: la modifica di
// un'assegnazione riparte dal record completo (`valori` incluso), non
// disponibile nella riga sintetica della tabella "Ruoli registrati".
export async function getIncarico(id: string): Promise<Incarico> {
  return apiFetch<Incarico>(`/api/personale/incarichi/${id}`);
}

export type TitolareCaricaCollegio = { id: string; nome: string };

export type EsitoIncarico =
  | { esito: "ok"; incarico: Incarico }
  | { esito: "conferma_sostituzione_sindaco_unico"; messaggio: string }
  | { esito: "conferma_sostituzione_carica_collegio"; messaggio: string; titolari: TitolareCaricaCollegio[] }
  | { esito: "conferma_sostituzione_revisore_legale"; messaggio: string }
  | { esito: "conferma_sostituzione_societa_revisione"; messaggio: string }
  | { esito: "errore"; messaggio: string };

function messaggioGenerico(detail: unknown): string {
  return typeof detail === "string" ? detail : "Errore imprevisto. Riprova.";
}

/** `opts.confermaSostituzioneSindacoUnico` (§ Correzione 13): solo per un
 * incarico di ruolo SINDACO quando l'assetto di controllo in carica è
 * "Sindaco unico" e ne esiste già uno attivo — il backend segnala il
 * conflitto con un 409 a shape dedicata (`esito`
 * "conferma_sostituzione_sindaco_unico"), l'utente conferma nel dialogo
 * dedicato e questo secondo tentativo lo comunica al backend, che cessa il
 * precedente e crea il nuovo incarico nella stessa transazione. Ignorato
 * per ogni altro ruolo.
 *
 * `opts.sostituisciIncaricoId` (§ Correzione 14): solo per ruolo SINDACO
 * con assetto "Collegio sindacale" quando la carica scelta (`valori.A28`)
 * è già al completo — a differenza di "Sindaco unico" più persone possono
 * già occupare la stessa carica, quindi il primo tentativo torna un 409
 * "conferma_sostituzione_carica_collegio" con l'elenco `titolari` tra cui
 * l'utente sceglie chi sostituire (mai "il primo trovato"), e questo
 * secondo tentativo comunica l'id scelto al backend.
 *
 * `opts.confermaSostituzioneRevisoreLegale` (§ Correzione 15): stesso
 * identico pattern di `confermaSostituzioneSindacoUnico`, per ruolo
 * REVISORE_LEGALE quando l'assetto è "Revisore legale persona fisica" e ne
 * esiste già uno attivo.
 *
 * `opts.confermaSostituzioneSocietaRevisione` (§ Correzione 16): stesso
 * identico pattern, per ruolo REVISORE_LEGALE quando l'assetto è "Società
 * di revisione legale" e ne esiste già una attiva. */
export async function creaIncarico(
  payload: IncaricoPayload,
  opts?: {
    confermaSostituzioneSindacoUnico?: boolean;
    confermaSostituzioneRevisoreLegale?: boolean;
    confermaSostituzioneSocietaRevisione?: boolean;
    sostituisciIncaricoId?: string;
  },
): Promise<EsitoIncarico> {
  const params = new URLSearchParams();
  if (opts?.confermaSostituzioneSindacoUnico) params.set("confirm_sostituzione_sindaco_unico", "true");
  if (opts?.confermaSostituzioneRevisoreLegale) params.set("confirm_sostituzione_revisore_legale", "true");
  if (opts?.confermaSostituzioneSocietaRevisione) params.set("confirm_sostituzione_societa_revisione", "true");
  if (opts?.sostituisciIncaricoId) params.set("sostituisci_incarico_id", opts.sostituisciIncaricoId);
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const result = await apiFetchResult<Incarico>(`/api/personale/incarichi${query}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  if (result.status === 409 && result.detail !== null && typeof result.detail === "object" && !Array.isArray(result.detail)) {
    const detail = result.detail as { code?: string; message: string; titolari?: TitolareCaricaCollegio[] };
    if (detail.code === "SOSTITUZIONE_SINDACO_UNICO_RICHIESTA") {
      return { esito: "conferma_sostituzione_sindaco_unico", messaggio: detail.message };
    }
    if (detail.code === "SOSTITUZIONE_CARICA_COLLEGIO_RICHIESTA") {
      return {
        esito: "conferma_sostituzione_carica_collegio",
        messaggio: detail.message,
        titolari: detail.titolari ?? [],
      };
    }
    if (detail.code === "SOSTITUZIONE_REVISORE_LEGALE_RICHIESTA") {
      return { esito: "conferma_sostituzione_revisore_legale", messaggio: detail.message };
    }
    if (detail.code === "SOSTITUZIONE_SOCIETA_REVISIONE_RICHIESTA") {
      return { esito: "conferma_sostituzione_societa_revisione", messaggio: detail.message };
    }
  }
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export async function aggiornaIncarico(id: string, payload: Partial<IncaricoPayload>): Promise<EsitoIncarico> {
  const result = await apiFetchResult<Incarico>(`/api/personale/incarichi/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}

export async function eliminaIncarico(id: string): Promise<{ esito: "ok" } | { esito: "errore"; messaggio: string }> {
  try {
    await apiFetch<void>(`/api/personale/incarichi/${id}`, { method: "DELETE" });
    return { esito: "ok" };
  } catch (error) {
    return { esito: "errore", messaggio: error instanceof ApiError ? error.message : "Errore imprevisto" };
  }
}

export type EsitoVerificaIncarico =
  | { esito: "ok"; incarico: Incarico }
  | { esito: "conflitto" }
  | { esito: "errore"; messaggio: string };

export async function inviaVerificaIncarico(
  id: string,
  decision: "VERIFIED" | "REVISION_REQUIRED",
  note: string | null,
  expectedFieldVersion: number | null,
): Promise<EsitoVerificaIncarico> {
  const result = await apiFetchResult<Incarico>(`/api/personale/incarichi/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, note, expectedFieldVersion }),
  });
  if (result.ok) return { esito: "ok", incarico: result.data };
  if (result.status === 409) return { esito: "conflitto" };
  return { esito: "errore", messaggio: messaggioGenerico(result.detail) };
}
