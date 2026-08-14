"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { createAssicurazione, updateAssicurazione, type FormState } from "./actions";
import { AssicurazioneFormFields } from "./assicurazione-form-fields";

export function AssicurazioneDialog({
  trigger,
  dati,
  stati,
  frequenze,
}: {
  trigger: ReactNode;
  dati?: Assicurazione;
  stati: CatalogoVoce[];
  frequenze: CatalogoVoce[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateAssicurazione.bind(null, dati.id) : createAssicurazione;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica polizza" : "Nuova polizza"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <AssicurazioneFormFields dati={dati} stati={stati} frequenze={frequenze} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
