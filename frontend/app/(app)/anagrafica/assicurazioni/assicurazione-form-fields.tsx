import { FormField } from "@/components/form-field";
import { FormSelectField } from "@/components/form-select-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { catalogoOptions } from "@/lib/catalogo-helpers";
import type { Assicurazione, CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

export function AssicurazioneFormFields({
  dati,
  stati,
  frequenze,
}: {
  dati?: Assicurazione;
  stati: CatalogoVoce[];
  frequenze: CatalogoVoce[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipologia polizza" name="tipologia_polizza" defaultValue={dati?.tipologia_polizza} required />
        <FormField
          label="Compagnia assicurativa"
          name="compagnia_assicurativa"
          defaultValue={dati?.compagnia_assicurativa}
          required
        />
        <FormField label="Numero polizza" name="numero_polizza" defaultValue={dati?.numero_polizza} required />
        <FormField label="Massimale" name="massimale" type="number" defaultValue={dati?.massimale} required />
        <FormField label="Data emissione" name="data_emissione" type="date" defaultValue={dati?.data_emissione} required />
        <FormField label="Data decorrenza" name="data_decorrenza" type="date" defaultValue={dati?.data_decorrenza} required />
        <FormField label="Data scadenza" name="data_scadenza" type="date" defaultValue={dati?.data_scadenza} required />
        <FormSelectField
          label="Stato"
          name="stato_id"
          options={catalogoOptions(stati)}
          defaultValue={dati?.stato_id}
          required
        />
        <FormSelectField
          label="Frequenza di rinnovo"
          name="frequenza_rinnovo_id"
          options={catalogoOptions(frequenze)}
          defaultValue={dati?.frequenza_rinnovo_id}
          required
        />
        <FormField label="Contraente" name="contraente" defaultValue={dati?.contraente} required />
        <FormField label="Referente" name="referente" defaultValue={dati?.referente} required />
        <FormField
          label="Premio assicurativo"
          name="premio_assicurativo"
          type="number"
          defaultValue={dati?.premio_assicurativo}
          required
        />
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
