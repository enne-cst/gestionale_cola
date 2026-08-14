import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { CatalogoVoce, FornitoreMateriali } from "@/lib/types/anagrafica-iso9001";

export function FornitoreFormFields({ dati, stati }: { dati?: FornitoreMateriali; stati: CatalogoVoce[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ragione sociale" name="ragione_sociale" defaultValue={dati?.ragione_sociale} required />
        <FormField label="Referente" name="referente" defaultValue={dati?.referente} required />
        <FormField label="Telefono" name="telefono" defaultValue={dati?.telefono} required />
        <FormField label="Email" name="email" type="email" defaultValue={dati?.email} required />
        <FormField
          label="Categoria merceologica"
          name="categoria_merceologica"
          defaultValue={dati?.categoria_merceologica}
          required
        />
        <FormField
          label="Data inizio collaborazione"
          name="data_inizio_collaborazione"
          type="date"
          defaultValue={dati?.data_inizio_collaborazione}
          required
        />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
      </div>
      <FormTextareaField label="Materiali forniti" name="materiali_forniti" defaultValue={dati?.materiali_forniti} />
      <FormTextareaField label="Contratto" name="contratto" defaultValue={dati?.contratto} />
      <FormTextareaField label="Certificazioni" name="certificazioni" defaultValue={dati?.certificazioni} />
      <FormTextareaField
        label="Schede tecniche e di sicurezza"
        name="schede_tecniche_sicurezza"
        defaultValue={dati?.schede_tecniche_sicurezza}
      />
      <FormTextareaField label="Altri documenti" name="altri_documenti" defaultValue={dati?.altri_documenti} />
    </div>
  );
}
