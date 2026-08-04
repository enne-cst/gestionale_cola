"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AddettiComune } from "@/lib/types/anagrafica";

import { createAddettiComune, updateAddettiComune, type FormState } from "./actions";
import { PeriodiComuneField } from "./periodi-comune-field";

export function AddettiComuneDialog({ trigger, dati }: { trigger: ReactNode; dati?: AddettiComune }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateAddettiComune.bind(null, dati.id) : createAddettiComune;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica distribuzione" : "Nuova distribuzione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-6">
          <FormError message={state.error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Comune" name="comune" defaultValue={dati?.comune} required />
            <FormField label="Provincia" name="provincia" defaultValue={dati?.provincia} />
            <FormField
              label="Numero sedi/unità locali"
              name="numero_sedi_unita_locali"
              type="number"
              defaultValue={dati?.numero_sedi_unita_locali ?? undefined}
            />
          </div>

          <PeriodiComuneField dati={dati?.periodi ?? []} />

          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
