import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, LavoratoreAutonomo } from "@/lib/types/anagrafica-iso9001";

export function LavoratoreFormFields({ dati, stati }: { dati?: LavoratoreAutonomo; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Nominativo / Ragione sociale"
          name="nominativo_ragione_sociale"
          defaultValue={dati?.nominativo_ragione_sociale}
          required
        />
        <FormField
          label="Codice fiscale / Partita IVA"
          name="codice_fiscale_partita_iva"
          defaultValue={dati?.codice_fiscale_partita_iva}
          required
        />
        <FormField label="Mansione" name="mansione" defaultValue={dati?.mansione} required />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
        <FormField
          label="Data inizio collaborazione"
          name="data_inizio_collaborazione"
          type="date"
          defaultValue={dati?.data_inizio_collaborazione}
          required
        />
        <FormField
          label="Data fine collaborazione"
          name="data_fine_collaborazione"
          type="date"
          defaultValue={dati?.data_fine_collaborazione}
        />
      </div>
      <FormTextareaField label="Attività svolta" name="attivita_svolta" defaultValue={dati?.attivita_svolta} />
      <FormTextareaField
        label="Documentazione associata"
        name="documentazione_associata"
        defaultValue={dati?.documentazione_associata}
      />
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
