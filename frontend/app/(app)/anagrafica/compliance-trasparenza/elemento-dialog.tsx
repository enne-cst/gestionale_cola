"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

import { createElemento, updateElemento, type FormState } from "./actions";
import { ElementoFormFields } from "./elemento-form-fields";

export function ElementoDialog({ trigger, dati }: { trigger: ReactNode; dati?: ComplianceTrasparenza }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateElemento.bind(null, dati.id) : createElemento;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica elemento" : "Nuovo elemento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <ElementoFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
