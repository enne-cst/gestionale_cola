"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { usePanoramicaPin } from "@/lib/use-panoramica-pin";

/** Come FormField, con in più l'icona che fissa/rimuove il campo dalla
 * scheda Panoramica del modulo. Usato solo nelle sezioni "singleton" (un
 * solo record per azienda), dove ha senso puntare a un campo specifico:
 * nelle liste (sedi, contatti...) un campo da solo non identifica quale
 * record si intende. */
export function PinnableFormField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  modulo,
  sezioneSlug,
  campo,
  pinnedInitially,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  modulo: string;
  sezioneSlug: string;
  campo: string;
  pinnedInitially: boolean;
}) {
  const { pinned, isPending, toggle } = usePanoramicaPin({
    modulo,
    sezioneSlug,
    campo,
    etichetta: label,
    pinnedInitially,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        <PinToggleButton pinned={pinned} disabled={isPending} onToggle={toggle} />
      </div>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </div>
  );
}
