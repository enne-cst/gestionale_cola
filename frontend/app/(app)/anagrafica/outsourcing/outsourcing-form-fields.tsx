import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, Outsourcing } from "@/lib/types/anagrafica-iso9001";

export function OutsourcingFormFields({ dati, stati }: { dati?: Outsourcing; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <FormTextareaField
        label="Processo / attività affidata"
        name="processo_attivita_affidata"
        defaultValue={dati?.processo_attivita_affidata}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Data di inizio" name="data_inizio" type="date" defaultValue={dati?.data_inizio} required />
        <FormField label="Data di fine" name="data_fine" type="date" defaultValue={dati?.data_fine} />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
        <FormField label="Referente interno" name="referente_interno" defaultValue={dati?.referente_interno} required />
        <FormField label="Contratto associato" name="contratto_associato" defaultValue={dati?.contratto_associato} required />
      </div>
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
