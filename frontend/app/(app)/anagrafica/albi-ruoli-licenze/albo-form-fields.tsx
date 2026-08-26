import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import { SedeSelectField } from "@/components/sede-select-field";
import type { AlboRuoloLicenza, Sede } from "@/lib/types/anagrafica";

export function AlboFormFields({ dati, sedi = [] }: { dati?: AlboRuoloLicenza; sedi?: Sede[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipologia" name="tipologia" defaultValue={dati?.tipologia} required />
        <SedeSelectField sedi={sedi} defaultValue={dati?.sede_id} />
        <FormField label="Numero iscrizione" name="numero_iscrizione" defaultValue={dati?.numero_iscrizione} />
        <FormField label="Provincia" name="provincia" defaultValue={dati?.provincia} />
        <FormField label="Sezione" name="sezione" defaultValue={dati?.sezione} />
        <FormField label="Categoria" name="categoria" defaultValue={dati?.categoria} />
        <FormField label="Classe" name="classe" defaultValue={dati?.classe} />
        <FormField label="Stato" name="stato" defaultValue={dati?.stato} />
        <FormField label="Fonte" name="fonte" defaultValue={dati?.fonte} />
        <FormField
          label="Data domanda/accertamento"
          name="data_domanda_accertamento"
          type="date"
          defaultValue={dati?.data_domanda_accertamento}
        />
        <FormField label="Data delibera" name="data_delibera" type="date" defaultValue={dati?.data_delibera} />
        <FormField label="Data inizio" name="data_inizio" type="date" defaultValue={dati?.data_inizio} />
        <FormField label="Data scadenza" name="data_scadenza" type="date" defaultValue={dati?.data_scadenza} />
        <FormField
          label="Data comunicazione"
          name="data_comunicazione"
          type="date"
          defaultValue={dati?.data_comunicazione}
        />
        <FormField label="Data cessazione" name="data_cessazione" type="date" defaultValue={dati?.data_cessazione} />
        <FormField label="Data caricamento" name="data_caricamento" type="date" defaultValue={dati?.data_caricamento} />
      </div>
      <FormTextareaField
        label="Descrizione categoria"
        name="descrizione_categoria"
        defaultValue={dati?.descrizione_categoria}
      />
      <FormTextareaField
        label="Motivo cancellazione"
        name="motivo_cancellazione"
        defaultValue={dati?.motivo_cancellazione}
      />
    </div>
  );
}
