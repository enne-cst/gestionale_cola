"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AlboRuoloLicenza, Sede } from "@/lib/types/anagrafica";

import { createAlbo, updateAlbo, type FormState } from "./actions";
import { AlboFormFields } from "./albo-form-fields";

export function AlboDialog({
  trigger,
  dati,
  sedi = [],
}: {
  trigger: ReactNode;
  dati?: AlboRuoloLicenza;
  sedi?: Sede[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateAlbo.bind(null, dati.id) : createAlbo;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica iscrizione" : "Nuova iscrizione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <AlboFormFields dati={dati} sedi={sedi} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
