import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { ContrattoRete } from "@/lib/types/anagrafica-iso9001";

export function ContrattoFormFields({ dati }: { dati?: ContrattoRete }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nome del contratto" name="nome_contratto" defaultValue={dati?.nome_contratto} required />
        <FormField
          label="Numero di registrazione"
          name="numero_registrazione"
          defaultValue={dati?.numero_registrazione}
          required
        />
        <FormField label="Numero di repertorio" name="numero_repertorio" defaultValue={dati?.numero_repertorio} required />
        <FormField label="Data di adesione" name="data_adesione" type="date" defaultValue={dati?.data_adesione} required />
        <FormField label="Data di cessazione" name="data_cessazione" type="date" defaultValue={dati?.data_cessazione} />
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
