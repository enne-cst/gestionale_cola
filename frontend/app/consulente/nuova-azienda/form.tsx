"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { creaAzienda, type FormState } from "./actions";

export function NuovaAziendaForm() {
  const [state, formAction] = useActionState<FormState, FormData>(creaAzienda, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && (
        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Azienda &quot;{state.success.ragione_sociale}&quot; creata (account di accesso: {state.success.email}). In
          attesa di approvazione da parte del super admin prima di poter accedere.
        </p>
      )}

      <FormField label="Ragione sociale" name="ragione_sociale" required />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Partita IVA" name="partita_iva" />
        <FormField label="Codice fiscale" name="codice_fiscale" />
      </div>
      <p className="-mt-4 text-xs text-muted-foreground">Indicare almeno uno dei due.</p>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nome referente" name="nome_referente" required />
        <FormField label="Cognome referente" name="cognome_referente" required />
      </div>

      <FormField label="Email di accesso" name="email" type="email" required />
      <FormField label="Password iniziale" name="password" type="password" required />

      <SubmitButton>Crea azienda</SubmitButton>
    </form>
  );
}
