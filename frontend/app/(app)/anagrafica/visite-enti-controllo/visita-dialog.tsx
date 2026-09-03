"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

import { createVisita, updateVisita, type FormState } from "./actions";
import { VisitaFormFields } from "./visita-form-fields";

export function VisitaDialog({
  trigger,
  dati,
  onSaved,
}: {
  trigger: ReactNode;
  dati?: VisitaEnteControllo;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateVisita.bind(null, dati.id) : createVisita;
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
          <DialogTitle>{dati ? "Modifica visita" : "Nuova visita"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <VisitaFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
