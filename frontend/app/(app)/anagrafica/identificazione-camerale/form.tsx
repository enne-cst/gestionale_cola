"use client";

import { useActionState } from "react";

import { FormError } from "@/components/form-error";
import { PinnableFormField } from "@/components/pinnable-form-field";
import { SubmitButton } from "@/components/submit-button";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { IdentificazioneCamerale } from "@/lib/types/anagrafica";

import { upsertIdentificazioneCamerale, type FormState } from "./actions";

const SEZIONE_SLUG = "identificazione-camerale";

export function IdentificazioneCameraleForm({
  dati,
  campiInPanoramica,
}: {
  dati: IdentificazioneCamerale | null;
  campiInPanoramica: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertIdentificazioneCamerale, {});

  function pin(campo: string) {
    return { modulo: MODULO_ANAGRAFICA, sezioneSlug: SEZIONE_SLUG, campo, pinnedInitially: campiInPanoramica.includes(campo) };
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-muted-foreground">Salvato.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PinnableFormField label="Ragione sociale" name="ragione_sociale" defaultValue={dati?.ragione_sociale} {...pin("ragione_sociale")} />
        <PinnableFormField label="Forma giuridica" name="forma_giuridica" defaultValue={dati?.forma_giuridica} {...pin("forma_giuridica")} />
        <PinnableFormField label="Codice fiscale" name="codice_fiscale" defaultValue={dati?.codice_fiscale} {...pin("codice_fiscale")} />
        <PinnableFormField label="Partita IVA" name="partita_iva" defaultValue={dati?.partita_iva} {...pin("partita_iva")} />
        <PinnableFormField
          label="Camera di Commercio competente"
          name="camera_commercio_competente"
          defaultValue={dati?.camera_commercio_competente}
          {...pin("camera_commercio_competente")}
        />
        <PinnableFormField
          label="Ufficio Registro Imprese"
          name="ufficio_registro_imprese"
          defaultValue={dati?.ufficio_registro_imprese}
          {...pin("ufficio_registro_imprese")}
        />
        <PinnableFormField label="Numero REA" name="numero_rea" defaultValue={dati?.numero_rea} {...pin("numero_rea")} />
        <PinnableFormField label="Provincia REA" name="provincia_rea" defaultValue={dati?.provincia_rea} {...pin("provincia_rea")} />
        <PinnableFormField label="Stato dell'attività" name="stato_attivita" defaultValue={dati?.stato_attivita} {...pin("stato_attivita")} />
        <PinnableFormField
          label="Data atto costitutivo"
          name="data_atto_costitutivo"
          type="date"
          defaultValue={dati?.data_atto_costitutivo}
          {...pin("data_atto_costitutivo")}
        />
        <PinnableFormField
          label="Data inizio attività"
          name="data_inizio_attivita"
          type="date"
          defaultValue={dati?.data_inizio_attivita}
          {...pin("data_inizio_attivita")}
        />
        <PinnableFormField
          label="Data ultimo protocollo"
          name="data_ultimo_protocollo"
          type="date"
          defaultValue={dati?.data_ultimo_protocollo}
          {...pin("data_ultimo_protocollo")}
        />
      </div>

      <div>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
