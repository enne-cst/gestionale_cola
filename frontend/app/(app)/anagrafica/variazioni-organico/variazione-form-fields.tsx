import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { VariazioneOrganico } from "@/lib/types/anagrafica-iso9001";

export function VariazioneFormFields({ dati }: { dati?: VariazioneOrganico }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Anno di riferimento" name="anno_riferimento" type="number" defaultValue={dati?.anno_riferimento} required />
        <FormField
          label="Nuove assunzioni"
          name="numero_nuove_assunzioni"
          type="number"
          defaultValue={dati?.numero_nuove_assunzioni}
          required
        />
        <FormField label="Cessazioni" name="numero_cessazioni" type="number" defaultValue={dati?.numero_cessazioni} required />
        <FormField
          label="Obiettivo variazione (%)"
          name="obiettivo_variazione_percentuale"
          type="number"
          defaultValue={dati?.obiettivo_variazione_percentuale}
          required
        />
      </div>
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
