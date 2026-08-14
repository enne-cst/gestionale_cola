import { FormField } from "@/components/form-field";
import type { DatiGenerali } from "@/lib/types/anagrafica-iso9001";

export function DatiGeneraliFormFields({ dati }: { dati?: DatiGenerali }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Anno di riferimento" name="anno_riferimento" type="number" defaultValue={dati?.anno_riferimento} required />
      <FormField label="Numero addetti" name="numero_addetti" type="number" defaultValue={dati?.numero_addetti} required />
      <FormField label="Numero dipendenti" name="numero_dipendenti" type="number" defaultValue={dati?.numero_dipendenti} required />
      <FormField
        label="Numero soci lavoratori"
        name="numero_soci_lavoratori"
        type="number"
        defaultValue={dati?.numero_soci_lavoratori}
        required
      />
      <FormField
        label="Organico medio annuo"
        name="organico_medio_annuo"
        type="number"
        defaultValue={dati?.organico_medio_annuo}
        required
      />
      <FormField label="Età media" name="eta_media" type="number" defaultValue={dati?.eta_media} required />
    </div>
  );
}
