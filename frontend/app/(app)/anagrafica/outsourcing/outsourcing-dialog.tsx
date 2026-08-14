"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogoVoce, Outsourcing } from "@/lib/types/anagrafica-iso9001";

import { createOutsourcing, updateOutsourcing, type FormState } from "./actions";
import { OutsourcingFormFields } from "./outsourcing-form-fields";

export function OutsourcingDialog({
  trigger,
  dati,
  stati,
}: {
  trigger: ReactNode;
  dati?: Outsourcing;
  stati: CatalogoVoce[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateOutsourcing.bind(null, dati.id) : createOutsourcing;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica affidamento" : "Nuovo affidamento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <OutsourcingFormFields dati={dati} stati={stati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
