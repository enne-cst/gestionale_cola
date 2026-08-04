"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { CapitaleSociale } from "@/lib/types/anagrafica";

import { upsertCapitaleSociale, type FormState } from "./actions";

export function CapitaleSocialeForm({ dati }: { dati: CapitaleSociale | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertCapitaleSociale, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Valuta" name="valuta" defaultValue={dati?.valuta ?? "EUR"} />
        <FormField
          label="Capitale deliberato"
          name="capitale_deliberato"
          type="number"
          defaultValue={dati?.capitale_deliberato}
        />
        <FormField
          label="Capitale sottoscritto"
          name="capitale_sottoscritto"
          type="number"
          defaultValue={dati?.capitale_sottoscritto}
        />
        <FormField
          label="Capitale versato"
          name="capitale_versato"
          type="number"
          defaultValue={dati?.capitale_versato}
        />
      </div>

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
