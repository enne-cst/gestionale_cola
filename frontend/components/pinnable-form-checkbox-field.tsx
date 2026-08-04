"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { usePanoramicaPin } from "@/lib/use-panoramica-pin";

export function PinnableFormCheckboxField({
  label,
  name,
  defaultChecked = false,
  modulo,
  sezioneSlug,
  campo,
  pinnedInitially,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  modulo: string;
  sezioneSlug: string;
  campo: string;
  pinnedInitially: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const { pinned, isPending, toggle } = usePanoramicaPin({
    modulo,
    sezioneSlug,
    campo,
    etichetta: label,
    pinnedInitially,
  });

  return (
    <div className="flex items-center gap-2">
      <Checkbox id={name} checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Label htmlFor={name}>{label}</Label>
      <PinToggleButton pinned={pinned} disabled={isPending} onToggle={toggle} />
    </div>
  );
}
