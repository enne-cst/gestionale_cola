"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogoVoce, FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

import { createFornitore, updateFornitore, type FormState } from "./actions";
import { FornitoreFormFields } from "./fornitore-form-fields";

export function FornitoreDialog({
  trigger,
  dati,
  stati,
}: {
  trigger: ReactNode;
  dati?: FornitoreMateriali;
  stati: CatalogoVoce[];
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateFornitore.bind(null, dati.id) : createFornitore;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica fornitore" : "Nuovo fornitore"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <FornitoreFormFields dati={dati} stati={stati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
