"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { usePanoramicaPin } from "@/lib/use-panoramica-pin";

export function PinnableFormTextareaField({
  label,
  name,
  defaultValue,
  modulo,
  sezioneSlug,
  campo,
  pinnedInitially,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
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
        <Label htmlFor={name} className="text-muted-foreground">{label}</Label>
        <PinToggleButton pinned={pinned} disabled={isPending} onToggle={toggle} />
      </div>
      <Textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={4} />
    </div>
  );
}
