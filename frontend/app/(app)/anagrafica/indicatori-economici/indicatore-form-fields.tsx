import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { IndicatoreEconomico } from "@/lib/types/anagrafica-iso9001";

export function IndicatoreFormFields({ dati }: { dati?: IndicatoreEconomico }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Anno di riferimento" name="anno_riferimento" type="number" defaultValue={dati?.anno_riferimento} required />
        <FormField label="Fatturato" name="fatturato" type="number" defaultValue={dati?.fatturato} required />
        <FormField label="Obiettivo" name="obiettivo" type="number" defaultValue={dati?.obiettivo} required />
      </div>
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
