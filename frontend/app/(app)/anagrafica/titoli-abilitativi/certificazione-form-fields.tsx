import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { TitoloAbilitativoCertificazione } from "@/lib/types/anagrafica";

import { CampiComuniFields } from "./campi-comuni-fields";

// § Correzione 20 punto 7: "la SOA non deve essere classificata
// impropriamente come certificazione" — due sole opzioni fisse (non un
// catalogo), determinano l'etichetta mostrata nella colonna "Tipologia"
// della tabella riepilogativa.
const OPZIONI_SOTTO_TIPO = [
  { value: "CERTIFICAZIONE", label: "Certificazione (es. ISO 9001)" },
  { value: "ATTESTAZIONE_SOA", label: "Attestazione SOA" },
];

export function CertificazioneFormFields({ dati }: { dati?: TitoloAbilitativoCertificazione }) {
  return (
    <div className="flex flex-col gap-4">
      <FormSelectField
        label="Tipo"
        name="sotto_tipo"
        options={OPZIONI_SOTTO_TIPO}
        defaultValue={dati?.sotto_tipo ?? "CERTIFICAZIONE"}
        required
      />
      <FormTextareaField
        label="Norma (certificazione) o categoria/classifica (attestazione SOA)"
        name="categoria_norma"
        defaultValue={dati?.categoria_norma}
      />
      <CampiComuniFields dati={dati} />
    </div>
  );
}
