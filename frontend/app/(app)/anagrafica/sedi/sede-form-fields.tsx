import { FormField } from "@/components/form-field";
import type { Sede } from "@/lib/types/anagrafica";

export function SedeFormFields({ dati }: { dati?: Sede }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Tipo sede" name="tipo_sede" defaultValue={dati?.tipo_sede} required />
      <FormField label="Denominazione" name="denominazione_sede" defaultValue={dati?.denominazione_sede} />
      <FormField
        label="Numero unità locale"
        name="numero_unita_locale"
        defaultValue={dati?.numero_unita_locale}
      />
      <FormField label="Data apertura" name="data_apertura" type="date" defaultValue={dati?.data_apertura} />
      <FormField label="Toponimo (Via, Piazza, Viale...)" name="toponimo" defaultValue={dati?.toponimo} />
      <FormField label="Indirizzo" name="indirizzo" defaultValue={dati?.indirizzo} />
      <FormField label="Numero civico" name="numero_civico" defaultValue={dati?.numero_civico} />
      <FormField label="CAP" name="cap" defaultValue={dati?.cap} />
      <FormField label="Comune" name="comune" defaultValue={dati?.comune} />
      <FormField label="Provincia" name="provincia" defaultValue={dati?.provincia} />
      <FormField label="Frazione" name="frazione" defaultValue={dati?.frazione} />
      <FormField label="Nazione" name="nazione" defaultValue={dati?.nazione} />
      <FormField
        label="Indirizzo originale (valore sorgente)"
        name="indirizzo_originale"
        defaultValue={dati?.indirizzo_originale}
      />
      <FormField label="Sigla territoriale (es. TV)" name="sigla_territoriale" defaultValue={dati?.sigla_territoriale} />
      <FormField label="Numero progressivo (es. 1)" name="numero_progressivo" defaultValue={dati?.numero_progressivo} />
      <FormField label="Numero REA unità" name="numero_rea_unita" defaultValue={dati?.numero_rea_unita} />
      <FormField label="Stato (attiva, inattiva, sospesa, cessata...)" name="stato" defaultValue={dati?.stato} />
      <FormField label="Data chiusura" name="data_chiusura" type="date" defaultValue={dati?.data_chiusura} />
    </div>
  );
}
