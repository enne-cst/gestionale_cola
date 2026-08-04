import { PERIODI_RILEVAZIONE } from "@/lib/types/anagrafica";
import { cn } from "@/lib/utils";

/** Select nativo (non il componente shadcn basato su Radix) perché deve
 * comparire più volte nella stessa form come riga ripetibile: un elemento
 * HTML nativo invia il proprio valore via FormData senza bisogno di stato
 * client o input nascosti sincronizzati, a differenza del Select di shadcn. */
export function PeriodoSelect({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <option value="" disabled>
        Periodo…
      </option>
      {PERIODI_RILEVAZIONE.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
