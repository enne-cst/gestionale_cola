import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormField } from "@/components/form-field";
import type { Contatto } from "@/lib/types/anagrafica";

export function ContattoFormFields({ dati }: { dati?: Contatto }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Tipo (es. Telefono, Email, PEC, Sito web)"
          name="tipo_contatto"
          defaultValue={dati?.tipo_contatto}
          required
        />
        <FormField label="Valore" name="valore" defaultValue={dati?.valore} required />
      </div>
      <FormField label="Descrizione" name="descrizione" defaultValue={dati?.descrizione} />
      <FormCheckboxField label="Recapito principale" name="principale" defaultChecked={dati?.principale ?? false} />
    </div>
  );
}
