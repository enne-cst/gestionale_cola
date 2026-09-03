"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { createVariazione, updateVariazione, type FormState } from "./actions";
import { VariazioneFormFields } from "./variazione-form-fields";

export function VariazioneDialog({
  trigger,
  dati,
  onSaved,
}: {
  trigger: ReactNode;
  dati?: VariazioneOrganico;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateVariazione.bind(null, dati.id) : createVariazione;
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica rilevazione" : "Nuova rilevazione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <VariazioneFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
