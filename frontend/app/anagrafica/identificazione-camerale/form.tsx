"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

import { upsertIdentificazioneCamerale, type FormState } from "./actions";

export function IdentificazioneCameraleForm({ dati }: { dati: IdentificazioneCamerale | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertIdentificazioneCamerale, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ragione sociale" name="ragione_sociale" defaultValue={dati?.ragione_sociale} />
        <FormField label="Forma giuridica" name="forma_giuridica" defaultValue={dati?.forma_giuridica} />
        <FormField label="Codice fiscale" name="codice_fiscale" defaultValue={dati?.codice_fiscale} />
        <FormField label="Partita IVA" name="partita_iva" defaultValue={dati?.partita_iva} />
        <FormField
          label="Camera di Commercio competente"
          name="camera_commercio_competente"
          defaultValue={dati?.camera_commercio_competente}
        />
        <FormField
          label="Ufficio Registro Imprese"
          name="ufficio_registro_imprese"
          defaultValue={dati?.ufficio_registro_imprese}
        />
        <FormField label="Numero REA" name="numero_rea" defaultValue={dati?.numero_rea} />
        <FormField label="Provincia REA" name="provincia_rea" defaultValue={dati?.provincia_rea} />
        <FormField label="Stato dell'attività" name="stato_attivita" defaultValue={dati?.stato_attivita} />
        <FormField
          label="Data atto costitutivo"
          name="data_atto_costitutivo"
          type="date"
          defaultValue={dati?.data_atto_costitutivo}
        />
        <FormField
          label="Data inizio attività"
          name="data_inizio_attivita"
          type="date"
          defaultValue={dati?.data_inizio_attivita}
        />
        <FormField
          label="Data ultimo protocollo"
          name="data_ultimo_protocollo"
          type="date"
          defaultValue={dati?.data_ultimo_protocollo}
        />
      </div>

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
