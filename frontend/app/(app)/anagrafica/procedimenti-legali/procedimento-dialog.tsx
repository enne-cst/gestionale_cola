"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

import { createProcedimento, updateProcedimento, type FormState } from "./actions";
import { ProcedimentoFormFields } from "./procedimento-form-fields";

export function ProcedimentoDialog({
  trigger,
  dati,
  stati,
  onSaved,
}: {
  trigger: ReactNode;
  dati?: ProcedimentoLegale;
  stati: CatalogoVoce[];
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateProcedimento.bind(null, dati.id) : createProcedimento;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      onSaved?.();
    }
  }, [state.success, onSaved]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica procedimento" : "Nuovo procedimento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <ProcedimentoFormFields dati={dati} stati={stati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
