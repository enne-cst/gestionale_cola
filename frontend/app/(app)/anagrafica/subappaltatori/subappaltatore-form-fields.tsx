import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, Subappaltatore } from "@/lib/types/anagrafica-iso9001";

export function SubappaltatoreFormFields({ dati, stati }: { dati?: Subappaltatore; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ragione sociale" name="ragione_sociale" defaultValue={dati?.ragione_sociale} required />
        <FormField
          label="Codice fiscale / Partita IVA"
          name="codice_fiscale_partita_iva"
          defaultValue={dati?.codice_fiscale_partita_iva}
          required
        />
        <FormField label="Categoria lavori" name="categoria_lavori" defaultValue={dati?.categoria_lavori} required />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
        <FormField label="Data di inizio" name="data_inizio" type="date" defaultValue={dati?.data_inizio} required />
        <FormField label="Data di fine" name="data_fine" type="date" defaultValue={dati?.data_fine} />
        <FormField label="Referente" name="referente" defaultValue={dati?.referente} required />
      </div>
      <FormTextareaField
        label="Documentazione associata"
        name="documentazione_associata"
        defaultValue={dati?.documentazione_associata}
      />
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
