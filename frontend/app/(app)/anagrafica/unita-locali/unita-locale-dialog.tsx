"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { UnitaLocaleDetail } from "@/lib/types/anagrafica";

import { aggiornaUnitaLocale, creaUnitaLocale, type FormState } from "./actions";
import { UnitaLocaleFormFields } from "./unita-locale-form-fields";

/** § punto 9: il record nasce solo al salvataggio — nessuna riga vuota se
 * il form viene annullato (nessuna chiamata al server finché non si invia
 * il form). Stesso pattern controllato/non controllato di `AlboDialog`. */
export function UnitaLocaleDialog({
  trigger,
  dati,
  open,
  onOpenChange,
  onSaved,
}: {
  trigger?: ReactNode;
  dati?: UnitaLocaleDetail;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [openLocale, setOpenLocale] = useState(false);
  const isOpen = open ?? openLocale;
  const setOpen = onOpenChange ?? setOpenLocale;
  const action = dati ? aggiornaUnitaLocale.bind(null, dati.id) : creaUnitaLocale;
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
          <DialogTitle>{dati ? "Modifica unità locale" : "Aggiungi unità locale"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError message={state.error} />
          <UnitaLocaleFormFields dati={dati} />
          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
