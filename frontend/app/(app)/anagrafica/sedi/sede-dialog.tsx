"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Sede } from "@/lib/types/anagrafica";

import { createSede, updateSede, type FormState } from "./actions";
import { SedeFormFields } from "./sede-form-fields";

export function SedeDialog({ trigger, dati }: { trigger: ReactNode; dati?: Sede }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateSede.bind(null, dati.id) : createSede;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica sede" : "Nuova sede"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <SedeFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
