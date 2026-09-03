"use client";

import { useActionState, useEffect } from "react";

import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContrattiRetePresenza } from "@/lib/types/anagrafica-iso9001";

import { upsertPresenza, type FormState } from "./actions";

export function PresenzaForm({ dati, onSaved }: { dati: ContrattiRetePresenza | null; onSaved?: () => void }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertPresenza, {});

  useEffect(() => {
    if (state.success) onSaved?.();
  }, [state.success, onSaved]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adesione a reti d&apos;impresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <FormCheckboxField label="L'azienda aderisce a reti d'impresa" name="presenza" defaultChecked={dati?.presenza ?? false} />
          <div>
            <SubmitButton>Salva</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
