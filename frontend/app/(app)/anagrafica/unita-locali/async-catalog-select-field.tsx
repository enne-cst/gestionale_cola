"use client";

import { useEffect, useState } from "react";

import { FormSelectField } from "@/components/form-select-field";

/** Select da catalogo caricato lato client — stesso pattern di
 * `AsyncCatalogSelectField` in `anagrafica/titoli-abilitativi/` (duplicato
 * qui invece di condiviso: stesso trattamento già accettato nel progetto
 * per componenti minimi specifici di una card). */
export function AsyncCatalogSelectField({
  label,
  name,
  defaultValue,
  required = false,
  placeholder,
  loader,
  onValueChange,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  loader: () => Promise<{ id: string; denominazione: string }[]>;
  onValueChange?: (value: string, denominazione: string | null) => void;
}) {
  const [voci, setVoci] = useState<{ id: string; denominazione: string }[] | null>(null);

  useEffect(() => {
    let annullato = false;
    loader()
      .then((v) => {
        if (!annullato) setVoci(v);
      })
      .catch(() => {
        if (!annullato) setVoci([]);
      });
    return () => {
      annullato = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (voci === null) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">Caricamento…</span>
      </div>
    );
  }

  return (
    <FormSelectField
      label={label}
      name={name}
      options={voci.map((v) => ({ value: v.id, label: v.denominazione }))}
      defaultValue={defaultValue}
      required={required}
      placeholder={placeholder ?? (voci.length === 0 ? "Nessuna voce in catalogo" : "Seleziona...")}
      onValueChange={(value) => onValueChange?.(value, voci.find((v) => v.id === value)?.denominazione ?? null)}
    />
  );
}
