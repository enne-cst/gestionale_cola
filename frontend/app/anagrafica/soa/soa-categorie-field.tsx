"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SoaCategoria } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, categoria: "", descrizione: "", classifica: "", limite_economico: "" };
}

export function SoaCategorieField({ dati }: { dati: SoaCategoria[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((c) => ({
          key: nextKey++,
          categoria: c.categoria,
          descrizione: c.descrizione ?? "",
          classifica: c.classifica ?? "",
          limite_economico: c.limite_economico ?? "",
        }))
      : [rigaVuota()],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Categorie</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-5">
            <Input name="cat_categoria" defaultValue={riga.categoria} placeholder="Categoria (es. OG1)" />
            <Input name="cat_classifica" defaultValue={riga.classifica} placeholder="Classifica" />
            <Input
              name="cat_limite_economico"
              type="number"
              defaultValue={riga.limite_economico}
              placeholder="Limite economico"
            />
            <Input
              name="cat_descrizione"
              defaultValue={riga.descrizione}
              placeholder="Descrizione"
              className="sm:col-span-2"
            />
            <div className="flex justify-end sm:col-span-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rimuovi categoria"
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
          Aggiungi categoria
        </Button>
      </div>
    </div>
  );
}
