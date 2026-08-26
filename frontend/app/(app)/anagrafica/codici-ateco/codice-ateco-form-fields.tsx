import { FormField } from "@/components/form-field";
import { SedeSelectField } from "@/components/sede-select-field";
import type { CodiceAteco, Sede } from "@/lib/types/anagrafica";

export function CodiceAtecoFormFields({ dati, sedi = [] }: { dati?: CodiceAteco; sedi?: Sede[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Codice" name="codice" defaultValue={dati?.codice} required />
      <FormField label="Codice NACE" name="codice_nace" defaultValue={dati?.codice_nace} />
      <FormField label="Descrizione" name="descrizione" defaultValue={dati?.descrizione} />
      <FormField label="Classificazione" name="classificazione" defaultValue={dati?.classificazione} />
      <FormField
        label="Ruolo (prevalente/secondario)"
        name="ruolo_codice"
        defaultValue={dati?.ruolo_codice}
      />
      <FormField label="Origine codice" name="origine_codice" defaultValue={dati?.origine_codice} />
      <FormField label="Fonte" name="fonte" defaultValue={dati?.fonte} />
      <SedeSelectField sedi={sedi} defaultValue={dati?.sede_id} />
    </div>
  );
}
