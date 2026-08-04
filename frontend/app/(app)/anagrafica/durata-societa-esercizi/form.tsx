"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { PinnableFormField } from "@/components/pinnable-form-field";
import { SubmitButton } from "@/components/submit-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { DurataSocietaEsercizi } from "@/lib/types/anagrafica";

import { upsertDurataSocietaEsercizi, type FormState } from "./actions";

const SEZIONE_SLUG = "durata-societa-esercizi";

export function DurataSocietaEserciziForm({
  dati,
  campiInPanoramica,
}: {
  dati: DurataSocietaEsercizi | null;
  campiInPanoramica: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertDurataSocietaEsercizi, {});

  function pin(campo: string) {
    return { modulo: MODULO_ANAGRAFICA, sezioneSlug: SEZIONE_SLUG, campo, pinnedInitially: campiInPanoramica.includes(campo) };
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <PinnableFormField
        label="Data di termine della società"
        name="data_termine_societa"
        type="date"
        defaultValue={dati?.data_termine_societa}
        {...pin("data_termine_societa")}
      />
      <PinnableFormField
        label="Scadenza del primo esercizio"
        name="scadenza_primo_esercizio"
        type="date"
        defaultValue={dati?.scadenza_primo_esercizio}
        {...pin("scadenza_primo_esercizio")}
      />
      <PinnableFormField
        label="Scadenza degli esercizi successivi"
        name="scadenza_esercizi_successivi"
        defaultValue={dati?.scadenza_esercizi_successivi}
        {...pin("scadenza_esercizi_successivi")}
      />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
