import { FormCheckboxField } from "@/components/form-checkbox-field";
import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";

import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { getCatalogoTitoloAbilitativo } from "./actions";

/** I campi comuni alle 4 macro-tipologie (§ Correzione 20 punto 6, esteso da
 * Correzione 21 punto 1 con "Stato del titolo"): numero/attestazione, ente
 * di rilascio, data di rilascio, data di scadenza, "nessuna scadenza",
 * stato del titolo, note. Ogni form personalizzato (Albo/Ruolo/Licenza/
 * Certificazione o attestazione) li include così, aggiungendo solo i
 * propri campi specifici — mai un unico form generico con tutti i campi
 * possibili. Le etichette di numero/ente/data di rilascio sono
 * personalizzabili per form (§ punto 2/3/4: "Numero di iscrizione"/"Numero
 * della licenza"...), lo stesso campo comune sottostante. "Documenti
 * collegati" non è ancora rappresentato: il modulo Documenti è oggi solo un
 * placeholder (§ CLAUDE.md), da collegare quando sarà progettato.
 *
 * "Data di scadenza" resta un campo normale anche quando "Nessuna
 * scadenza" è selezionato (nessuna disabilitazione client-side: la data
 * eventualmente ancora presente viene comunque ignorata e azzerata lato
 * server, § `campiComuniDaFormData` in actions.ts, "la data di scadenza
 * deve rimanere vuota quando è attivo senza_scadenza" — § punto 10). */
export function CampiComuniFields({
  dati,
  etichettaNumero = "Numero / attestazione",
  etichettaEnte = "Ente di rilascio",
  etichettaDataRilascio = "Data di rilascio",
}: {
  dati?: {
    numero_attestazione: string | null;
    ente_rilascio: string | null;
    data_rilascio: string | null;
    data_scadenza: string | null;
    senza_scadenza: boolean;
    note: string | null;
    stato_titolo_id: string | null;
  };
  etichettaNumero?: string;
  etichettaEnte?: string;
  etichettaDataRilascio?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={etichettaNumero} name="numero_attestazione" defaultValue={dati?.numero_attestazione} />
        <FormField label={etichettaEnte} name="ente_rilascio" defaultValue={dati?.ente_rilascio} />
        <FormField label={etichettaDataRilascio} name="data_rilascio" type="date" defaultValue={dati?.data_rilascio} />
        <FormField label="Data di scadenza" name="data_scadenza" type="date" defaultValue={dati?.data_scadenza} />
      </div>
      <FormCheckboxField label="Nessuna scadenza" name="senza_scadenza" defaultChecked={dati?.senza_scadenza} />
      <AsyncCatalogSelectField
        label="Stato del titolo"
        name="stato_titolo_id"
        defaultValue={dati?.stato_titolo_id}
        loader={() => getCatalogoTitoloAbilitativo("stati-titolo")}
      />
      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </>
  );
}
