"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

import { createIndicatore, updateIndicatore, type FormState } from "./actions";
import { IndicatoreFormFields } from "./indicatore-form-fields";

export function IndicatoreDialog({ trigger, dati }: { trigger: ReactNode; dati?: IndicatoreEconomico }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateIndicatore.bind(null, dati.id) : createIndicatore;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica rilevazione" : "Nuova rilevazione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <IndicatoreFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
