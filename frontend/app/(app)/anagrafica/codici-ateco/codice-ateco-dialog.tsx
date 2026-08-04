"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CodiceAteco } from "@/lib/types/anagrafica";

import { createCodiceAteco, updateCodiceAteco, type FormState } from "./actions";
import { CodiceAtecoFormFields } from "./codice-ateco-form-fields";

export function CodiceAtecoDialog({ trigger, dati }: { trigger: ReactNode; dati?: CodiceAteco }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateCodiceAteco.bind(null, dati.id) : createCodiceAteco;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica codice ATECO" : "Nuovo codice ATECO"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <CodiceAtecoFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
