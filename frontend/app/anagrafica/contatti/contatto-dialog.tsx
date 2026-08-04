"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Contatto } from "@/lib/types/anagrafica";

import { createContatto, updateContatto, type FormState } from "./actions";
import { ContattoFormFields } from "./contatto-form-fields";

export function ContattoDialog({ trigger, dati }: { trigger: ReactNode; dati?: Contatto }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateContatto.bind(null, dati.id) : createContatto;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica contatto" : "Nuovo contatto"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <ContattoFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
