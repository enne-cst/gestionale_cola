"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UnitaLocaleContatto } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, tipo_contatto: "", valore: "", descrizione: "", principale: false };
}

/** Contatti dell'unità (§ punto 8, "eventuali contatti della sede"): righe
 * ripetibili collegate a `ana_contatti.sede_id` (§ migrazione 049). */
export function ContattiUnitaField({ dati }: { dati?: UnitaLocaleContatto[] }) {
  const [righe, setRighe] = useState(() =>
    dati && dati.length > 0
      ? dati.map((c) => ({
          key: nextKey++,
          tipo_contatto: c.tipo_contatto,
          valore: c.valore,
          descrizione: c.descrizione ?? "",
          principale: c.principale,
        }))
      : [],
  );

  function impostaPrincipale(key: number, valore: boolean) {
    setRighe((r) => r.map((riga) => (riga.key === key ? { ...riga, principale: valore } : riga)));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground">Contatti della sede</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-4">
            <Input name="contatto_tipo" defaultValue={riga.tipo_contatto} placeholder="Telefono, email..." />
            <Input name="contatto_valore" defaultValue={riga.valore} placeholder="Valore" className="sm:col-span-2" />
            <Input name="contatto_descrizione" defaultValue={riga.descrizione} placeholder="Descrizione" />
            <label className="flex items-center gap-2 text-sm text-[var(--az-ink)] sm:col-span-3">
              <Checkbox checked={riga.principale} onCheckedChange={(v) => impostaPrincipale(riga.key, v === true)} />
              Contatto principale
              <input type="hidden" name="contatto_principale" value={riga.principale ? "true" : "false"} />
            </label>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi contatto"
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
          Aggiungi contatto
        </Button>
      </div>
    </div>
  );
}
