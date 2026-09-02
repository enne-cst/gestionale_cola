import { PERIODI_RILEVAZIONE } from "@/lib/types/anagrafica";

import { formatDate } from "./format";

/** Formattazioni condivise tra "Rilevazione più recente" e lo storico delle
 * rilevazioni (§ correzione grafica dello storico): estratte qui per non
 * duplicarle tra `riepilogo-personale-occupazione.tsx` e
 * `storico-rilevazioni.tsx`. */

export function numeroPersone(valore: number | null): string {
  return valore === null ? "—" : new Intl.NumberFormat("it-IT").format(valore);
}

/** Percentuale senza decimali inutili ("93.00%" → "93%", "7.50%" → "7,5%"):
 * sola formattazione di visualizzazione, il valore salvato/calcolato resta
 * quello passato (stringa Decimal del backend). */
export function formatPercentualeVisiva(valore: string | null): string {
  if (valore === null) return "—";
  const numerico = Number(valore);
  if (Number.isNaN(numerico)) return valore;
  return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(numerico)}%`;
}

export function etichettaPeriodo(periodo: string | null): string {
  return PERIODI_RILEVAZIONE.find((p) => p.value === periodo)?.label ?? "—";
}

const ORDINALE_PERIODO: Record<string, string> = {
  PRIMO_TRIMESTRE: "1° trimestre",
  SECONDO_TRIMESTRE: "2° trimestre",
  TERZO_TRIMESTRE: "3° trimestre",
  QUARTO_TRIMESTRE: "4° trimestre",
  MEDIA: "Media annua",
};

/** Dicitura leggibile di una rilevazione (§ storico punto 6): combina
 * periodo e anno quando entrambi noti ("1° trimestre 2026"), altrimenti usa
 * quel che è realmente presente nel record — mai un valore inventato. */
export function etichettaRilevazione(periodo: string | null, anno: number | null, data: string | null): string {
  const periodoLabel = periodo ? ORDINALE_PERIODO[periodo] : null;
  if (periodoLabel && anno) return `${periodoLabel} ${anno}`;
  if (periodoLabel) return periodoLabel;
  if (anno) return `Anno ${anno}`;
  if (data) return `Rilevazione al ${formatDate(data)}`;
  return "Rilevazione";
}
