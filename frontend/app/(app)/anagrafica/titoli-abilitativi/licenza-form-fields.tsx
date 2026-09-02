import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { TitoloAbilitativoLicenza } from "@/lib/types/anagrafica";

import { getCatalogoTitoloAbilitativo, getSediTitoliAbilitativi } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { CampiComuniFields } from "./campi-comuni-fields";
import { SoggettoField } from "./soggetto-field";

async function caricaSedi() {
  const sedi = await getSediTitoliAbilitativi();
  return sedi.map((s) => ({ id: s.id, denominazione: s.denominazione_sede ?? s.comune ?? "Sede senza denominazione" }));
}

export function LicenzaFormFields({ dati }: { dati?: TitoloAbilitativoLicenza }) {
  return (
    <div className="flex flex-col gap-4">
      <AsyncCatalogSelectField
        label="Tipologia di licenza"
        name="tipologia_licenza_id"
        defaultValue={dati?.tipologia_licenza_id}
        loader={() => getCatalogoTitoloAbilitativo("tipologie-licenza")}
      />
      <FormField label="Denominazione della licenza" name="denominazione_licenza" defaultValue={dati?.denominazione_licenza} />
      <FormTextareaField label="Oggetto o attività autorizzata" name="oggetto_attivita" defaultValue={dati?.oggetto_attivita} />
      <SoggettoField label="Soggetto titolare" dati={dati?.persona} />
      <AsyncCatalogSelectField
        label="Sede o unità locale interessata"
        name="sede_id"
        defaultValue={dati?.sede_id}
        loader={caricaSedi}
        placeholder="Nessuna sede specifica"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ambito territoriale" name="ambito_territoriale" defaultValue={dati?.ambito_territoriale} />
        <FormField label="Data di efficacia" name="data_efficacia" type="date" defaultValue={dati?.data_efficacia} />
        <FormField label="Estremi del rinnovo" name="estremi_rinnovo" defaultValue={dati?.estremi_rinnovo} />
      </div>
      <FormTextareaField
        label="Condizioni o prescrizioni"
        name="condizioni_prescrizioni"
        defaultValue={dati?.condizioni_prescrizioni}
      />
      <CampiComuniFields
        dati={dati}
        etichettaNumero="Numero della licenza / provvedimento"
        etichettaEnte="Autorità competente"
      />
    </div>
  );
}
