import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, ProcedimentoLegale } from "@/lib/types/anagrafica-iso9001";

export function ProcedimentoFormFields({ dati, stati }: { dati?: ProcedimentoLegale; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Tipologia procedimento"
          name="tipologia_procedimento"
          defaultValue={dati?.tipologia_procedimento}
          required
        />
        <FormField label="Controparte" name="controparte" defaultValue={dati?.controparte} required />
        <FormField label="Data di inizio" name="data_inizio" type="date" defaultValue={dati?.data_inizio} required />
        <FormField label="Data di conclusione" name="data_conclusione" type="date" defaultValue={dati?.data_conclusione} />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
      </div>
      <FormTextareaField label="Esito" name="esito" defaultValue={dati?.esito} />
      <FormTextareaField
        label="Documentazione associata"
        name="documentazione_associata"
        defaultValue={dati?.documentazione_associata}
      />
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
