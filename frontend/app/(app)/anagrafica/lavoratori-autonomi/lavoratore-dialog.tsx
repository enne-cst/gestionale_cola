"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

import { createLavoratore, updateLavoratore, type FormState } from "./actions";
import { LavoratoreFormFields } from "./lavoratore-form-fields";

export function LavoratoreDialog({
  trigger,
  dati,
  stati,
}: {
  trigger: ReactNode;
  dati?: LavoratoreAutonomo;
  stati: CatalogoVoce[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateLavoratore.bind(null, dati.id) : createLavoratore;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica lavoratore autonomo" : "Nuovo lavoratore autonomo"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <LavoratoreFormFields dati={dati} stati={stati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
