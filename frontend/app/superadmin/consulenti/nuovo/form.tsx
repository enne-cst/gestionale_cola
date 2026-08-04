"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

import { creaConsulente, type FormState } from "./actions";

export function NuovoConsulenteForm() {
  const [state, formAction] = useActionState<FormState, FormData>(creaConsulente, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && (
        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Consulente &quot;{state.success.nome} {state.success.cognome}&quot; creato (email: {state.success.email}).
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nome" name="nome" required />
        <FormField label="Cognome" name="cognome" required />
      </div>

      <FormField label="Email di accesso" name="email" type="email" required />
      <FormField label="Password iniziale" name="password" type="password" required />

      <SubmitButton>Crea consulente</SubmitButton>
    </form>
  );
}
