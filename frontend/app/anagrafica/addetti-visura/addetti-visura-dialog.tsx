"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AddettiVisura } from "@/lib/types/anagrafica";

import { createAddettiVisura, updateAddettiVisura, type FormState } from "./actions";
import { PeriodiField } from "./periodi-field";

export function AddettiVisuraDialog({ trigger, dati }: { trigger: ReactNode; dati?: AddettiVisura }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateAddettiVisura.bind(null, dati.id) : createAddettiVisura;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica rilevazione" : "Nuova rilevazione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-6">
          <FormError message={state.error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Fonte" name="fonte" defaultValue={dati?.fonte} />
            <FormField
              label="Anno di riferimento"
              name="anno_riferimento"
              type="number"
              defaultValue={dati?.anno_riferimento ?? undefined}
            />
            <FormField
              label="Data rilevazione"
              name="data_rilevazione"
              type="date"
              defaultValue={dati?.data_rilevazione}
            />
          </div>

          <PeriodiField dati={dati?.periodi ?? []} />

          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
