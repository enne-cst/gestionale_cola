import { FormField } from "@/components/form-field";
import type { TitoloAbilitativoAlbo } from "@/lib/types/anagrafica";

import { CampiComuniFields } from "./campi-comuni-fields";

export function AlboFormFields({ dati }: { dati?: TitoloAbilitativoAlbo }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Categoria dell'albo" name="categoria" defaultValue={dati?.categoria} />
      <CampiComuniFields dati={dati} />
    </div>
  );
}
