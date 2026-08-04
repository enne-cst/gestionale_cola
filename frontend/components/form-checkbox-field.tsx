"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function FormCheckboxField({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center gap-2">
      <Checkbox id={name} checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
      {/* Checkbox di shadcn non è un <input> nativo: serve un campo hidden
          per far arrivare il valore booleano alla Server Action via FormData. */}
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Label htmlFor={name}>{label}</Label>
    </div>
  );
}
