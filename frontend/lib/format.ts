export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT").format(date);
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
