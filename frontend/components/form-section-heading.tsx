import type { LucideIcon } from "lucide-react";

import { IconAvatar } from "@/components/icon-avatar";

/** Intestazione di raggruppamento visivo dentro un form lungo (es. le
 * sottosezioni "Identificazione camerale" / "Iscrizione al Registro
 * Imprese" / "Date" della scheda anagrafica): solo presentazionale, non
 * introduce campi né passaggi di validazione nuovi. */
export function FormSectionHeading({ icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border pb-2">
      <IconAvatar icon={icon} size="sm" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}
