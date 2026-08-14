"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { SubmitButton } from "@/components/submit-button";
import type { ContrattoLavoro } from "@/lib/types/anagrafica-iso9001";

import { upsertContrattoLavoro, type FormState } from "./actions";

export function ContrattoLavoroForm({ dati }: { dati: ContrattoLavoro | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertContrattoLavoro, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="CCNL applicato" name="ccnl_applicato" defaultValue={dati?.ccnl_applicato} required />
        <FormField label="Settore CCNL" name="settore_ccnl" defaultValue={dati?.settore_ccnl} required />
        <FormField
          label="Data di applicazione"
          name="data_applicazione"
          type="date"
          defaultValue={dati?.data_applicazione}
          required
        />
        <FormField label="Eventuale CCNL precedente" name="ccnl_precedente" defaultValue={dati?.ccnl_precedente} />
      </div>
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
