"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SedeAttivita } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, descrizione_attivita: "", data_inizio: "", data_fine: "", ruolo_importanza: "" };
}

export function SediAttivitaField({ dati }: { dati: SedeAttivita[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((a) => ({
          key: nextKey++,
          descrizione_attivita: a.descrizione_attivita,
          data_inizio: a.data_inizio ?? "",
          data_fine: a.data_fine ?? "",
          ruolo_importanza: a.ruolo_importanza ?? "",
        }))
      : [],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Attività esercitate presso l&apos;unità</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-4">
            <Input
              name="att_descrizione"
              defaultValue={riga.descrizione_attivita}
              placeholder="Descrizione attività"
              className="sm:col-span-2"
            />
            <Input name="att_data_inizio" type="date" defaultValue={riga.data_inizio} />
            <Input name="att_data_fine" type="date" defaultValue={riga.data_fine} />
            <Input
              name="att_ruolo_importanza"
              defaultValue={riga.ruolo_importanza}
              placeholder="Primaria, secondaria, prevalente..."
              className="sm:col-span-3"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi attività"
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
          Aggiungi attività
        </Button>
      </div>
    </div>
  );
}
