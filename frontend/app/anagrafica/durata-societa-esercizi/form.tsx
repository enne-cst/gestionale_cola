"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { DurataSocietaEsercizi } from "@/lib/types/anagrafica";

import { upsertDurataSocietaEsercizi, type FormState } from "./actions";

export function DurataSocietaEserciziForm({ dati }: { dati: DurataSocietaEsercizi | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertDurataSocietaEsercizi, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <FormField
        label="Data di termine della società"
        name="data_termine_societa"
        type="date"
        defaultValue={dati?.data_termine_societa}
      />
      <FormField
        label="Scadenza del primo esercizio"
        name="scadenza_primo_esercizio"
        type="date"
        defaultValue={dati?.scadenza_primo_esercizio}
      />
      <FormField
        label="Scadenza degli esercizi successivi"
        name="scadenza_esercizi_successivi"
        defaultValue={dati?.scadenza_esercizi_successivi}
      />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
