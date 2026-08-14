"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ContrattoRete } from "@/lib/types/anagrafica-iso9001";

import { createContratto, updateContratto, type FormState } from "./actions";
import { ContrattoFormFields } from "./contratto-form-fields";

export function ContrattoDialog({ trigger, dati }: { trigger: ReactNode; dati?: ContrattoRete }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateContratto.bind(null, dati.id) : createContratto;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica contratto di rete" : "Nuovo contratto di rete"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <ContrattoFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
