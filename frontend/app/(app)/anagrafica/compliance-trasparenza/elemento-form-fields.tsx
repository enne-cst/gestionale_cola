import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { ComplianceTrasparenza } from "@/lib/types/anagrafica-iso9001";

export function ElementoFormFields({ dati }: { dati?: ComplianceTrasparenza }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Elemento" name="elemento" defaultValue={dati?.elemento} required />
      <FormCheckboxField label="Presente" name="presenza" defaultChecked={dati?.presenza ?? false} />
      <FormField label="Data di adozione" name="data_adozione" type="date" defaultValue={dati?.data_adozione} />
      <FormTextareaField label="Dettagli / note" name="dettagli_note" defaultValue={dati?.dettagli_note} />
      <FormTextareaField
        label="Documentazione associata"
        name="documentazione_associata"
        defaultValue={dati?.documentazione_associata}
      />
    </div>
  );
}
