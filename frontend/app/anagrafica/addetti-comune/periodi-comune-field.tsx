"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { PeriodoSelect } from "@/components/periodo-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddettiComunePeriodo } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, periodo: "", numero_dipendenti: "", numero_indipendenti: "", numero_totale_addetti: "" };
}

export function PeriodiComuneField({ dati }: { dati: AddettiComunePeriodo[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((p) => ({
          key: nextKey++,
          periodo: p.periodo,
          numero_dipendenti: p.numero_dipendenti ?? "",
          numero_indipendenti: p.numero_indipendenti ?? "",
          numero_totale_addetti: p.numero_totale_addetti ?? "",
        }))
      : [rigaVuota()],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Periodi di rilevazione</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <PeriodoSelect name="cp_periodo" defaultValue={riga.periodo} />
            <Input name="cp_numero_dipendenti" type="number" defaultValue={riga.numero_dipendenti} placeholder="Dipendenti" />
            <Input name="cp_numero_indipendenti" type="number" defaultValue={riga.numero_indipendenti} placeholder="Indipendenti" />
            <Input name="cp_numero_totale_addetti" type="number" defaultValue={riga.numero_totale_addetti} placeholder="Totale addetti" />
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
