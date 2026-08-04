import { FormField } from "@/components/form-field";
import type { IscrizioneRegistroImprese } from "@/lib/types/anagrafica";

export function IscrizioneFormFields({ dati }: { dati?: IscrizioneRegistroImprese }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Tipo iscrizione" name="tipo_iscrizione" defaultValue={dati?.tipo_iscrizione} />
      <FormField label="Sezione" name="sezione" defaultValue={dati?.sezione} />
      <FormField
        label="Data iscrizione"
        name="data_iscrizione"
        type="date"
        defaultValue={dati?.data_iscrizione}
      />
    </div>
  );
}
