"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { PinnableFormField } from "@/components/pinnable-form-field";
import { SubmitButton } from "@/components/submit-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { CapitaleSociale } from "@/lib/types/anagrafica";

import { upsertCapitaleSociale, type FormState } from "./actions";

const SEZIONE_SLUG = "capitale-sociale";

export function CapitaleSocialeForm({
  dati,
  campiInPanoramica,
}: {
  dati: CapitaleSociale | null;
  campiInPanoramica: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertCapitaleSociale, {});

  function pin(campo: string) {
    return { modulo: MODULO_ANAGRAFICA, sezioneSlug: SEZIONE_SLUG, campo, pinnedInitially: campiInPanoramica.includes(campo) };
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PinnableFormField label="Valuta" name="valuta" defaultValue={dati?.valuta ?? "EUR"} {...pin("valuta")} />
        <PinnableFormField
          label="Capitale deliberato"
          name="capitale_deliberato"
          type="number"
          defaultValue={dati?.capitale_deliberato}
          {...pin("capitale_deliberato")}
        />
        <PinnableFormField
          label="Capitale sottoscritto"
          name="capitale_sottoscritto"
          type="number"
          defaultValue={dati?.capitale_sottoscritto}
          {...pin("capitale_sottoscritto")}
        />
        <PinnableFormField
          label="Capitale versato"
          name="capitale_versato"
          type="number"
          defaultValue={dati?.capitale_versato}
          {...pin("capitale_versato")}
        />
      </div>

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
