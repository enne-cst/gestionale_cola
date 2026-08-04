"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { PeriodoSelect } from "@/components/periodo-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddettiVisuraPeriodo } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return {
    key: nextKey++,
    periodo: "",
    numero_dipendenti: "",
    numero_indipendenti: "",
    numero_collaboratori: "",
    numero_totale_addetti: "",
    percentuale_tempo_determinato: "",
    percentuale_tempo_indeterminato: "",
    percentuale_tempo_pieno: "",
    percentuale_tempo_parziale: "",
    percentuale_operai: "",
    percentuale_impiegati: "",
  };
}

export function PeriodiField({ dati }: { dati: AddettiVisuraPeriodo[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((p) => ({
          key: nextKey++,
          periodo: p.periodo,
          numero_dipendenti: p.numero_dipendenti ?? "",
          numero_indipendenti: p.numero_indipendenti ?? "",
          numero_collaboratori: p.numero_collaboratori ?? "",
          numero_totale_addetti: p.numero_totale_addetti ?? "",
          percentuale_tempo_determinato: p.percentuale_tempo_determinato ?? "",
          percentuale_tempo_indeterminato: p.percentuale_tempo_indeterminato ?? "",
          percentuale_tempo_pieno: p.percentuale_tempo_pieno ?? "",
          percentuale_tempo_parziale: p.percentuale_tempo_parziale ?? "",
          percentuale_operai: p.percentuale_operai ?? "",
          percentuale_impiegati: p.percentuale_impiegati ?? "",
        }))
      : [rigaVuota()],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Periodi di rilevazione</Label>
      <div className="flex flex-col gap-3">
        {righe.map((riga) => (
          <div key={riga.key} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <PeriodoSelect name="vp_periodo" defaultValue={riga.periodo} />
              <Input name="vp_numero_dipendenti" type="number" defaultValue={riga.numero_dipendenti} placeholder="Dipendenti" />
              <Input name="vp_numero_indipendenti" type="number" defaultValue={riga.numero_indipendenti} placeholder="Indipendenti" />
              <Input name="vp_numero_collaboratori" type="number" defaultValue={riga.numero_collaboratori} placeholder="Collaboratori" />
              <Input name="vp_numero_totale_addetti" type="number" defaultValue={riga.numero_totale_addetti} placeholder="Totale addetti" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <Input name="vp_pct_determinato" type="number" defaultValue={riga.percentuale_tempo_determinato} placeholder="% tempo det." />
              <Input name="vp_pct_indeterminato" type="number" defaultValue={riga.percentuale_tempo_indeterminato} placeholder="% tempo indet." />
              <Input name="vp_pct_pieno" type="number" defaultValue={riga.percentuale_tempo_pieno} placeholder="% tempo pieno" />
              <Input name="vp_pct_parziale" type="number" defaultValue={riga.percentuale_tempo_parziale} placeholder="% tempo parziale" />
              <Input name="vp_pct_operai" type="number" defaultValue={riga.percentuale_operai} placeholder="% operai" />
              <Input name="vp_pct_impiegati" type="number" defaultValue={riga.percentuale_impiegati} placeholder="% impiegati" />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi periodo"
                onClick={() => setRighe((r) => r.filter((x) => x.key !== riga.key))}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setRighe((r) => [...r, rigaVuota()])}>
          <PlusIcon className="size-4" />
          Aggiungi periodo
        </Button>
      </div>
    </div>
  );
}
