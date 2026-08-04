"use client";

import { useActionState } from "react";

import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { SubmitButton } from "@/components/submit-button";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";

import { upsertAttivitaEsercitata, type FormState } from "./actions";

export function AttivitaEsercitataForm({ dati }: { dati: AttivitaEsercitata | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertAttivitaEsercitata, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <FormTextareaField
        label="Descrizione dell'attività esercitata"
        name="descrizione_attivita_esercitata"
        defaultValue={dati?.descrizione_attivita_esercitata}
      />
      <FormField
        label="Data di decorrenza dell'attività"
        name="data_decorrenza_attivita"
        type="date"
        defaultValue={dati?.data_decorrenza_attivita}
      />
      <FormCheckboxField
        label="Presenza di attività di import-export"
        name="presenza_attivita_import_export"
        defaultChecked={dati?.presenza_attivita_import_export ?? false}
      />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
