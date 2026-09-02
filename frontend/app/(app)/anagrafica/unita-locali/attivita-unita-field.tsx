"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UnitaLocaleAttivita } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, descrizione_attivita: "", data_inizio: "", data_fine: "", attivita_principale: false };
}

/** Attività esercitate presso l'unità (§ punto 5): righe ripetibili, al più
 * una principale — applicato anche lato server
 * (`app/core/unita_locali.py::_normalizza_principale_unica`), mostrata da
 * sola nella tabella riepilogativa, le altre solo nel form completo. Il
 * flag "principale" usa uno shadcn `Checkbox` (non un input nativo) più un
 * hidden mirror per riga, così `formData.getAll` resta allineato per
 * indice anche quando una riga non è spuntata (un checkbox nativo non
 * spuntato non verrebbe inviato affatto). */
export function AttivitaUnitaField({ dati }: { dati?: UnitaLocaleAttivita[] }) {
  const [righe, setRighe] = useState(() =>
    dati && dati.length > 0
      ? dati.map((a) => ({
          key: nextKey++,
          descrizione_attivita: a.descrizione_attivita,
          data_inizio: a.data_inizio ?? "",
          data_fine: a.data_fine ?? "",
          attivita_principale: a.attivita_principale,
        }))
      : [rigaVuota()],
  );

  function impostaPrincipale(key: number, valore: boolean) {
    setRighe((r) => r.map((riga) => (riga.key === key ? { ...riga, attivita_principale: valore } : riga)));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground">Attività esercitate presso l&apos;unità</Label>
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
            <label className="flex items-center gap-2 text-sm text-[var(--az-ink)] sm:col-span-3">
              <Checkbox
                checked={riga.attivita_principale}
                onCheckedChange={(v) => impostaPrincipale(riga.key, v === true)}
              />
              Attività principale
              <input type="hidden" name="att_principale" value={riga.attivita_principale ? "true" : "false"} />
            </label>
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
