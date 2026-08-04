"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { PinnableFormField } from "@/components/pinnable-form-field";
import { SubmitButton } from "@/components/submit-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { AmministrazioneControllo } from "@/lib/types/anagrafica";

import { upsertAmministrazioneControllo, type FormState } from "./actions";
import { SistemiAmministrazioneField } from "./sistemi-amministrazione-field";

const SEZIONE_SLUG = "amministrazione-controllo";

export function AmministrazioneControlloForm({
  dati,
  campiInPanoramica,
}: {
  dati: AmministrazioneControllo | null;
  campiInPanoramica: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertAmministrazioneControllo, {});

  function pin(campo: string) {
    return { modulo: MODULO_ANAGRAFICA, sezioneSlug: SEZIONE_SLUG, campo, pinnedInitially: campiInPanoramica.includes(campo) };
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PinnableFormField
          label="Organo amministrativo in carica"
          name="organo_amministrativo_in_carica"
          defaultValue={dati?.organo_amministrativo_in_carica}
          {...pin("organo_amministrativo_in_carica")}
        />
        <PinnableFormField
          label="Durata in carica dell'organo"
          name="durata_in_carica_organo"
          defaultValue={dati?.durata_in_carica_organo}
          {...pin("durata_in_carica_organo")}
        />
        <PinnableFormField
          label="Numero minimo amministratori"
          name="numero_minimo_amministratori"
          type="number"
          defaultValue={dati?.numero_minimo_amministratori ?? undefined}
          {...pin("numero_minimo_amministratori")}
        />
        <PinnableFormField
          label="Numero amministratori in carica"
          name="numero_amministratori_in_carica"
          type="number"
          defaultValue={dati?.numero_amministratori_in_carica ?? undefined}
          {...pin("numero_amministratori_in_carica")}
        />
        <PinnableFormField
          label="Numero sindaci/organi di controllo"
          name="numero_sindaci_organi_controllo"
          type="number"
          defaultValue={dati?.numero_sindaci_organi_controllo ?? undefined}
          {...pin("numero_sindaci_organi_controllo")}
        />
        <PinnableFormField
          label="Numero titolari di cariche"
          name="numero_titolari_cariche"
          type="number"
          defaultValue={dati?.numero_titolari_cariche ?? undefined}
          {...pin("numero_titolari_cariche")}
        />
      </div>

      <SistemiAmministrazioneField dati={dati?.sistemi_amministrazione ?? []} />

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
