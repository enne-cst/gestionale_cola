import { FormField } from "@/components/form-field";
import type { TitoloAbilitativoLicenza } from "@/lib/types/anagrafica";

import { CampiComuniFields } from "./campi-comuni-fields";

export function LicenzaFormFields({ dati }: { dati?: TitoloAbilitativoLicenza }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tipologia della licenza" name="tipologia_licenza" defaultValue={dati?.tipologia_licenza} />
      <CampiComuniFields dati={dati} />
    </div>
  );
}
