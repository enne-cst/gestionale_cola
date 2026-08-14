import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, FondoInterprofessionale } from "@/lib/types/anagrafica-iso9001";

export function FondoFormFields({
  dati,
  statiIscrizione,
}: {
  dati?: FondoInterprofessionale;
  statiIscrizione: CatalogoVoce[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Fondo interprofessionale"
          name="fondo_interprofessionale"
          defaultValue={dati?.fondo_interprofessionale}
          required
        />
        <FormSelectField
          label="Stato dell'iscrizione"
          name="stato_iscrizione_id"
          options={catalogoOptions(statiIscrizione)}
          defaultValue={dati?.stato_iscrizione_id}
          required
        />
        <FormField label="Data di adesione" name="data_adesione" type="date" defaultValue={dati?.data_adesione} required />
        <FormField label="Codice fondo" name="codice_fondo" defaultValue={dati?.codice_fondo} />
        <FormField label="Data di recesso" name="data_recesso" type="date" defaultValue={dati?.data_recesso} />
      </div>
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
