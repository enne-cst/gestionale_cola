"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SistemaAmministrazione } from "@/lib/types/anagrafica";

let nextKey = 0;

export function SistemiAmministrazioneField({ dati }: { dati: SistemaAmministrazione[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((s) => ({ key: nextKey++, valore: s.sistema_amministrazione }))
      : [{ key: nextKey++, valore: "" }],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Sistemi di amministrazione</Label>
      <p className="text-xs text-muted-foreground">
        Es. Consiglio di Amministrazione, Amministratore Unico. È possibile registrarne più di uno.
      </p>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="flex items-center gap-2">
            <Input
              name="sistema_amministrazione"
              defaultValue={riga.valore}
              placeholder="Es. Consiglio di Amministrazione"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Rimuovi"
              onClick={() => setRighe((r) => r.filter((x) => x.key !== riga.key))}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRighe((r) => [...r, { key: nextKey++, valore: "" }])}
        >
          <PlusIcon className="size-4" />
          Aggiungi sistema
        </Button>
      </div>
    </div>
  );
}
