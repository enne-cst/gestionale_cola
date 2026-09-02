"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { TitoloAbilitativoAlbo } from "@/lib/types/anagrafica";

import { aggiornaAlbo, creaAlbo, type FormState } from "./actions";
import { AlboFormFields } from "./albo-form-fields";

export function AlboDialog({
  trigger,
  dati,
  open,
  onOpenChange,
  onSaved,
}: {
  trigger?: ReactNode;
  dati?: TitoloAbilitativoAlbo;
  // Controllato dall'esterno quando aperto dal click sulla riga (§ punto 8)
  // invece che dal proprio trigger interno (menu "Aggiungi").
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // La tabella unificata non ha un pulsante "Aggiorna" proprio (a
  // differenza dei blocchi incorporati esistenti): si aggiorna da sola
  // dopo un salvataggio riuscito, invece di richiedere un refresh manuale.
  onSaved?: () => void;
}) {
  const [openLocale, setOpenLocale] = useState(false);
  const isOpen = open ?? openLocale;
  const setOpen = onOpenChange ?? setOpenLocale;
  const action = dati ? aggiornaAlbo.bind(null, dati.id) : creaAlbo;
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
          <DialogTitle>{dati ? "Modifica albo" : "Aggiungi albo"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <AlboFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
