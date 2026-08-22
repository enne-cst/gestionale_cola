import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Anello di completamento/qualità (§7/§11 del prompt master Anagrafica
 * Aziendale): conic-gradient con foro centrale, stesse proporzioni e colori
 * del prototipo di riferimento. `tone` sceglie la tinta (blu per il
 * completamento, verde per la qualità dei dati); il valore resta sempre
 * quello calcolato dal backend, mai un calcolo lato client. */
export function CompletenessRing({
  percentuale,
  tone = "blue",
  size = 134,
}: {
  percentuale: number;
  tone?: "blue" | "green";
  size?: number;
}) {
  return (
    <div
      className={cn("az-progress-ring shrink-0", tone === "green" && "az-progress-ring--green")}
      style={{ width: size, height: size, "--az-progress": `${(percentuale / 100) * 360}deg` } as CSSProperties}
      role="img"
      aria-label={`${percentuale}%`}
    >
      <span className="az-progress-ring__inner text-[31px] font-extrabold tracking-tight text-[var(--az-ink)]">
        {percentuale}%
      </span>
    </div>
  );
}
