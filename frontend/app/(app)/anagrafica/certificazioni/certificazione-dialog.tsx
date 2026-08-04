"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Certificazione } from "@/lib/types/anagrafica";

import { createCertificazione, updateCertificazione, type FormState } from "./actions";
import { SettoriIafField } from "./settori-iaf-field";

export function CertificazioneDialog({ trigger, dati }: { trigger: ReactNode; dati?: Certificazione }) {
  const [open, setOpen] = useState(false);
  const action = dati ? updateCertificazione.bind(null, dati.id) : createCertificazione;
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dati ? "Modifica certificazione" : "Nuova certificazione"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-6">
          <FormError message={state.error} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Tipologia certificazione"
              name="tipologia_certificazione"
              defaultValue={dati?.tipologia_certificazione}
            />
            <FormField label="Sigla" name="sigla" defaultValue={dati?.sigla} />
            <FormField label="Norma di riferimento" name="norma_riferimento" defaultValue={dati?.norma_riferimento} />
            <FormField label="Numero certificato" name="numero_certificato" defaultValue={dati?.numero_certificato} />
            <FormField
              label="Organismo certificatore"
              name="organismo_certificatore"
              defaultValue={dati?.organismo_certificatore}
            />
            <FormField
              label="Codice fiscale organismo"
              name="codice_fiscale_organismo"
              defaultValue={dati?.codice_fiscale_organismo}
            />
            <FormField label="Fonte" name="fonte" defaultValue={dati?.fonte} />
            <FormField
              label="Data prima emissione"
              name="data_prima_emissione"
              type="date"
              defaultValue={dati?.data_prima_emissione}
            />
            <FormField
              label="Data ultimo aggiornamento"
              name="data_ultimo_aggiornamento"
              type="date"
              defaultValue={dati?.data_ultimo_aggiornamento}
            />
          </div>

          <SettoriIafField dati={dati?.settori_iaf ?? []} />

          <SubmitButton>Salva</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
