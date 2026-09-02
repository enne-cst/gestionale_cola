"use client";

import { PeriodoSelect } from "@/components/periodo-select";
import { FormField } from "@/components/form-field";
import { Label } from "@/components/ui/label";
import type { AddettiComune } from "@/lib/types/anagrafica";

/** Dati territoriali della rilevazione, in fondo al form (§ "Addetti da
 * visura" e "Addetti per comune" messe insieme, richiesta esplicita
 * dell'utente): un solo ambito per rilevazione, non un repeater come i
 * periodi sopra — coerente con il riepilogo, che mostra un solo blocco
 * "Distribuzione territoriale". Un comune lasciato vuoto al salvataggio non
 * cancella un dato territoriale già presente (§ app/core/addetti_visura.py). */
export function TerritorioField({ dati }: { dati?: AddettiComune | null }) {
  const primoPeriodo = dati?.periodi?.[0];
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3.5">
      <Label>Dati territoriali della rilevazione</Label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label="Comune" name="terr_comune" defaultValue={dati?.comune} />
        <FormField label="Provincia" name="terr_provincia" defaultValue={dati?.provincia} />
        <FormField
          label="Numero sedi/unità locali"
          name="terr_numero_sedi"
          type="number"
          defaultValue={dati?.numero_sedi_unita_locali ?? undefined}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Periodo</Label>
          <PeriodoSelect name="terr_periodo" defaultValue={primoPeriodo?.periodo} className="h-9" />
        </div>
        <FormField
          label="Dipendenti nel comune"
          name="terr_numero_dipendenti"
          type="number"
          defaultValue={primoPeriodo?.numero_dipendenti ?? undefined}
        />
        <FormField
          label="Indipendenti nel comune"
          name="terr_numero_indipendenti"
          type="number"
          defaultValue={primoPeriodo?.numero_indipendenti ?? undefined}
        />
        <FormField
          label="Addetti totali nel comune"
          name="terr_numero_totale_addetti"
          type="number"
          defaultValue={primoPeriodo?.numero_totale_addetti ?? undefined}
        />
      </div>
    </div>
  );
}
