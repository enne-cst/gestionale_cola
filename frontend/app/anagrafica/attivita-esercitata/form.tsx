"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { PinnableFormCheckboxField } from "@/components/pinnable-form-checkbox-field";
import { PinnableFormField } from "@/components/pinnable-form-field";
import { PinnableFormTextareaField } from "@/components/pinnable-form-textarea-field";
import { SubmitButton } from "@/components/submit-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { AttivitaEsercitata } from "@/lib/types/anagrafica";

import { upsertAttivitaEsercitata, type FormState } from "./actions";

const SEZIONE_SLUG = "attivita-esercitata";

export function AttivitaEsercitataForm({
  dati,
  campiInPanoramica,
}: {
  dati: AttivitaEsercitata | null;
  campiInPanoramica: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertAttivitaEsercitata, {});

  function pin(campo: string) {
    return { modulo: MODULO_ANAGRAFICA, sezioneSlug: SEZIONE_SLUG, campo, pinnedInitially: campiInPanoramica.includes(campo) };
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <PinnableFormTextareaField
        label="Descrizione dell'attività esercitata"
        name="descrizione_attivita_esercitata"
        defaultValue={dati?.descrizione_attivita_esercitata}
        {...pin("descrizione_attivita_esercitata")}
      />
      <PinnableFormField
        label="Data di decorrenza dell'attività"
        name="data_decorrenza_attivita"
        type="date"
        defaultValue={dati?.data_decorrenza_attivita}
        {...pin("data_decorrenza_attivita")}
      />
      <PinnableFormCheckboxField
        label="Presenza di attività di import-export"
        name="presenza_attivita_import_export"
        defaultChecked={dati?.presenza_attivita_import_export ?? false}
        {...pin("presenza_attivita_import_export")}
      />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
