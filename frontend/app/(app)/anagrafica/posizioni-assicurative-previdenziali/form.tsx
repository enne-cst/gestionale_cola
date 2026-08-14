"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { PosizioniAssicurativePrevidenziali } from "@/lib/types/anagrafica-iso9001";

import { upsertPosizioniAssicurativePrevidenziali, type FormState } from "./actions";

export function PosizioniAssicurativePrevidenzialiForm({
  dati,
}: {
  dati: PosizioniAssicurativePrevidenziali | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertPosizioniAssicurativePrevidenziali, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Posizione INPS</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Numero posizione INPS"
            name="numero_posizione_inps"
            defaultValue={dati?.numero_posizione_inps}
            required
          />
          <FormField
            label="Sede territoriale INPS"
            name="sede_territoriale_inps"
            defaultValue={dati?.sede_territoriale_inps}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Posizione INAIL</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Numero posizione INAIL"
            name="numero_posizione_inail"
            defaultValue={dati?.numero_posizione_inail}
            required
          />
          <FormField
            label="Sede territoriale INAIL"
            name="sede_territoriale_inail"
            defaultValue={dati?.sede_territoriale_inail}
            required
          />
        </div>
      </div>

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
