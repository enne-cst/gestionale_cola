"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

import { createRipartizioneOrganico, updateRipartizioneOrganico, type FormState } from "./actions";
import { RipartizioneOrganicoFormFields } from "./ripartizione-organico-form-fields";

export function RipartizioneOrganicoDialog({
  trigger,
  dati,
  onSaved,
}: {
  trigger: ReactNode;
  dati?: RipartizioneOrganico;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateRipartizioneOrganico.bind(null, dati.id) : createRipartizioneOrganico;
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica ripartizione" : "Nuova ripartizione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <RipartizioneOrganicoFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
