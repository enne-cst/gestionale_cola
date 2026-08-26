import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Sede } from "@/lib/types/anagrafica";

/** Selettore opzionale "Riferito a un'unità" (mappatura CCIAA §10.2): NULL
 * = il record resta riferito all'intera azienda (comportamento invariato),
 * valorizzato = riferito a una specifica unità locale. Usato dai form di
 * Codici ATECO e Albi/ruoli/licenze, che possono collegarsi a `ana_sedi`. */
export function SedeSelectField({ sedi, defaultValue }: { sedi: Sede[]; defaultValue?: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="sede_id" className="text-muted-foreground">
        Riferito a un&apos;unità
      </Label>
      <select
        id="sede_id"
        name="sede_id"
        defaultValue={defaultValue ?? ""}
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "md:text-sm dark:bg-input/30",
        )}
      >
        <option value="">Intera azienda</option>
        {sedi.map((sede) => (
          <option key={sede.id} value={sede.id}>
            {sede.denominazione_sede ?? sede.tipo_sede}
            {sede.numero_unita_locale ? ` (${sede.numero_unita_locale})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
