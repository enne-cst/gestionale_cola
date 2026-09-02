"use client";

import { FormField } from "@/components/form-field";
import { FormTextareaField } from "@/components/form-textarea-field";
import type { UnitaLocaleDetail } from "@/lib/types/anagrafica";

import { getCatalogoUnitaLocali } from "./actions";
import { AsyncCatalogSelectField } from "./async-catalog-select-field";
import { AttivitaUnitaField } from "./attivita-unita-field";
import { CodiciAtecoUnitaField } from "./codici-ateco-unita-field";
import { ContattiUnitaField } from "./contatti-unita-field";
import { TipologieSelectField } from "./tipologie-select-field";

/** Form completo di un'unità locale (§ punto 8): riferimento CCIAA,
 * denominazione, tipologie multiple, indirizzo completo, apertura/
 * chiusura, stato amministrativo, attività, codici ATECO, contatti, note.
 * "Documenti collegati" non è ancora rappresentato: il modulo Documenti è
 * oggi solo un placeholder (§ CLAUDE.md), come già per Titoli abilitativi. */
export function UnitaLocaleFormFields({ dati }: { dati?: UnitaLocaleDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Riferimento CCIAA (es. TV/1)"
          name="numero_unita_locale"
          defaultValue={dati?.numero_unita_locale}
        />
        <FormField label="Denominazione" name="denominazione_sede" defaultValue={dati?.denominazione_sede} />
      </div>

      <TipologieSelectField dati={dati?.tipologie.map((t) => t.id)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Toponimo (Via, Piazza, Viale...)" name="toponimo" defaultValue={dati?.toponimo} />
        <FormField label="Indirizzo" name="indirizzo" defaultValue={dati?.indirizzo} />
        <FormField label="Numero civico" name="numero_civico" defaultValue={dati?.numero_civico} />
        <FormField label="CAP" name="cap" defaultValue={dati?.cap} />
        <FormField label="Comune" name="comune" defaultValue={dati?.comune} />
        <FormField label="Provincia" name="provincia" defaultValue={dati?.provincia} />
        <FormField label="Frazione" name="frazione" defaultValue={dati?.frazione} />
        <FormField label="Nazione" name="nazione" defaultValue={dati?.nazione} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Data di apertura" name="data_apertura" type="date" defaultValue={dati?.data_apertura} />
        <FormField label="Data di chiusura" name="data_chiusura" type="date" defaultValue={dati?.data_chiusura} />
      </div>

      <AsyncCatalogSelectField
        label="Stato amministrativo dell'unità"
        name="stato_unita_id"
        defaultValue={dati?.stato_unita_id}
        loader={() => getCatalogoUnitaLocali("stati")}
      />

      <AttivitaUnitaField dati={dati?.attivita} />
      <CodiciAtecoUnitaField dati={dati?.codici_ateco} />
      <ContattiUnitaField dati={dati?.contatti} />

      <FormTextareaField label="Note" name="note" defaultValue={dati?.note} />
    </div>
  );
}
