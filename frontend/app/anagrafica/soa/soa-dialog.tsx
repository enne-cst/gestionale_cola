"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Soa } from "@/lib/types/anagrafica";

import { createSoa, updateSoa, type FormState } from "./actions";
import { SoaCategorieField } from "./soa-categorie-field";

export function SoaDialog({ trigger, dati }: { trigger: ReactNode; dati?: Soa }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateSoa.bind(null, dati.id) : createSoa;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica attestazione SOA" : "Nuova attestazione SOA"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-6">
          <FormError message={state.error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Numero attestazione" name="numero_attestazione" defaultValue={dati?.numero_attestazione} />
            <FormField label="Regolamento" name="regolamento" defaultValue={dati?.regolamento} />
            <FormField
              label="Organismo di attestazione"
              name="organismo_denominazione"
              defaultValue={dati?.organismo_denominazione}
            />
            <FormField
              label="Codice identificativo organismo"
              name="organismo_codice_identificativo"
              defaultValue={dati?.organismo_codice_identificativo}
            />
            <FormField label="Data rilascio" name="data_rilascio" type="date" defaultValue={dati?.data_rilascio} />
            <FormField label="Data scadenza" name="data_scadenza" type="date" defaultValue={dati?.data_scadenza} />
          </div>

          <SoaCategorieField dati={dati?.categorie ?? []} />

          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
