import { FormField } from "@/components/form-field";
import type { RipartizioneOrganico } from "@/lib/types/anagrafica-iso9001";

export function RipartizioneOrganicoFormFields({ dati }: { dati?: RipartizioneOrganico }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormField label="Anno di riferimento" name="anno_riferimento" type="number" defaultValue={dati?.anno_riferimento} required />
      <FormField label="Amministrativi" name="numero_amministrativi" type="number" defaultValue={dati?.numero_amministrativi} required />
      <FormField label="Project manager" name="numero_project_manager" type="number" defaultValue={dati?.numero_project_manager} required />
      <FormField label="Tecnici" name="numero_tecnici" type="number" defaultValue={dati?.numero_tecnici} required />
      <FormField label="Preposti" name="numero_preposti" type="number" defaultValue={dati?.numero_preposti} required />
      <FormField label="Operativi" name="numero_operativi" type="number" defaultValue={dati?.numero_operativi} required />
      <FormField
        label="Dirigenti della sicurezza"
        name="numero_dirigenti_sicurezza"
        type="number"
        defaultValue={dati?.numero_dirigenti_sicurezza}
        required
      />
      <FormField label="Uomini" name="numero_uomini" type="number" defaultValue={dati?.numero_uomini} required />
      <FormField label="Donne" name="numero_donne" type="number" defaultValue={dati?.numero_donne} required />
      <FormField label="Italiani" name="numero_italiani" type="number" defaultValue={dati?.numero_italiani} required />
      <FormField label="Stranieri" name="numero_stranieri" type="number" defaultValue={dati?.numero_stranieri} required />
      <FormField
        label="Tempo determinato"
        name="numero_tempo_determinato"
        type="number"
        defaultValue={dati?.numero_tempo_determinato}
        required
      />
      <FormField
        label="Tempo indeterminato"
        name="numero_tempo_indeterminato"
        type="number"
        defaultValue={dati?.numero_tempo_indeterminato}
        required
      />
      <FormField label="Laureati" name="numero_laureati" type="number" defaultValue={dati?.numero_laureati} required />
      <FormField label="Diplomati" name="numero_diplomati" type="number" defaultValue={dati?.numero_diplomati} required />
    </div>
  );
}
