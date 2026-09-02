import { FormField } from "@/components/form-field";
import type { TitoloAbilitativoRuolo } from "@/lib/types/anagrafica";

import { CampiComuniFields } from "./campi-comuni-fields";

export function RuoloFormFields({ dati }: { dati?: TitoloAbilitativoRuolo }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Denominazione del ruolo" name="denominazione_ruolo" defaultValue={dati?.denominazione_ruolo} />
      <CampiComuniFields dati={dati} />
    </div>
  );
}
