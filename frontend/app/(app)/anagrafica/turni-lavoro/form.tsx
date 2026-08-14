"use client";

import { useActionState } from "react";

import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { SubmitButton } from "@/components/submit-button";
import type { TurniLavoro } from "@/lib/types/anagrafica-iso9001";

import { upsertTurniLavoro, type FormState } from "./actions";

export function TurniLavoroForm({ dati }: { dati: TurniLavoro | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertTurniLavoro, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <FormCheckboxField
        label="Sono presenti turnazioni"
        name="presenza_turnazioni"
        defaultChecked={dati?.presenza_turnazioni ?? false}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipologia di turno" name="tipologia_turno" defaultValue={dati?.tipologia_turno} />
        <FormField label="Numero di turni" name="numero_turni" type="number" defaultValue={dati?.numero_turni} />
      </div>
      <FormTextareaField label="Fasce orarie" name="fasce_orarie" defaultValue={dati?.fasce_orarie} />
      <FormTextareaField label="Rotazione dei turni" name="rotazione_turni" defaultValue={dati?.rotazione_turni} />

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
        <FormCheckboxField label="Lavoro notturno" name="lavoro_notturno" defaultChecked={dati?.lavoro_notturno ?? false} />
        <FormCheckboxField label="Lavoro festivo" name="lavoro_festivo" defaultChecked={dati?.lavoro_festivo ?? false} />
        <FormCheckboxField
          label="Lavoro a ciclo continuo"
          name="lavoro_ciclo_continuo"
          defaultChecked={dati?.lavoro_ciclo_continuo ?? false}
        />
      </div>

      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
