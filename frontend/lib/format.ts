export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT").format(date);
}

/** Data e ora locale italiana per l'audit di verifica (§29.2 del prompt
 * master: "mostra date nel formato locale italiano"), es. "22/08/2026, 10:42". */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(date);
}

/** Formattazione decimale italiana senza simbolo di valuta: usata per i
 * campi "importo" del registro campo-per-campo, dove la valuta è un campo
 * separato del gruppo e non è disponibile qui (§2.5 "separatori italiani in
 * visualizzazione", senza assumere una valuta specifica). */
export function formatDecimal(value?: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

export function formatCurrency(value?: string | null, currency = "EUR"): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(number);
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;

/** Formattazione "best effort" per un valore di cui si conosce solo il nome
 * campo (non il tipo), come nella scheda Panoramica: riconosce le date ISO
 * e i booleani, altrimenti mostra il valore così com'è. */
export function formatValoreGenerico(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "string" && DATA_ISO.test(value)) return formatDate(value);
  return String(value);
}
