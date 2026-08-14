import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { VisitaEnteControllo } from "@/lib/types/anagrafica-iso9001";

export function VisitaFormFields({ dati }: { dati?: VisitaEnteControllo }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ente" name="ente" defaultValue={dati?.ente} required />
        <FormField label="Tipologia visita" name="tipologia_visita" defaultValue={dati?.tipologia_visita} required />
        <FormField label="Data visita" name="data_visita" type="date" defaultValue={dati?.data_visita} required />
      </div>
      <FormTextareaField label="Esito" name="esito" defaultValue={dati?.esito} />
      <FormTextareaField label="Prescrizioni" name="prescrizioni" defaultValue={dati?.prescrizioni} />
      <FormTextareaField
        label="Verbale / documentazione"
        name="verbale_documentazione"
        defaultValue={dati?.verbale_documentazione}
      />
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
