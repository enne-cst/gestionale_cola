"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { TitoloAbilitativoCertificazione } from "@/lib/types/anagrafica";

import { aggiornaCertificazione, creaCertificazione, type FormState } from "./actions";
import { CertificazioneFormFields } from "./certificazione-form-fields";

export function CertificazioneDialog({
  trigger,
  dati,
  open,
  onOpenChange,
  onSaved,
}: {
  trigger?: ReactNode;
  dati?: TitoloAbilitativoCertificazione;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [openLocale, setOpenLocale] = useState(false);
  const isOpen = open ?? openLocale;
  const setOpen = onOpenChange ?? setOpenLocale;
  const action = dati ? aggiornaCertificazione.bind(null, dati.id) : creaCertificazione;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      onSaved?.();
    }
  }, [state.success]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica certificazione o attestazione" : "Aggiungi certificazione o attestazione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <CertificazioneFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
