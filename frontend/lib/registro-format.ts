import { formatDate, formatDecimal } from "@/lib/format";
import type { FieldState } from "@/lib/types/registro";

// Estratta da `components/registro/field-row.tsx` (§ richiesta esplicita
// 05/09/2026): quel file è "use client" e non può essere importato da
// codice server-only (es. la risoluzione dei campi pinnati in Panoramica,
// un Server Component) — una funzione pura come questa non ha invece
// alcun bisogno di vivere in un modulo client, e un'unica sorgente evita di
// duplicarla per il terzo chiamante (dopo FieldRow e la sintesi).
export function formattaValore(field: FieldState): string {
  if (field.value === null || field.value === "") return "—";
  if (field.dataType === "date") return formatDate(field.value);
  if (field.dataType === "importo") return formatDecimal(field.value);
  if (field.dataType === "boolean") return field.value === "true" ? "Sì" : field.value === "false" ? "No" : "—";
  if (field.dataType === "catalogo" || field.dataType === "scelta")
    return field.options?.find((o) => o.code === field.value)?.label ?? field.value;
  return field.value;
}
