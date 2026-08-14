"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

import { createFondo, updateFondo, type FormState } from "./actions";
import { FondoFormFields } from "./fondo-form-fields";

export function FondoDialog({
  trigger,
  dati,
  statiIscrizione,
}: {
  trigger: ReactNode;
  dati?: FondoInterprofessionale;
  statiIscrizione: CatalogoVoce[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateFondo.bind(null, dati.id) : createFondo;
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
          <FondoFormFields dati={dati} statiIscrizione={statiIscrizione} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
