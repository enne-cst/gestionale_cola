"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CertificazioneSettoreIaf } from "@/lib/types/anagrafica";

let nextKey = 0;

function rigaVuota() {
  return { key: nextKey++, codice_iaf: "", descrizione_iaf: "" };
}

export function SettoriIafField({ dati }: { dati: CertificazioneSettoreIaf[] }) {
  const [righe, setRighe] = useState(() =>
    dati.length > 0
      ? dati.map((s) => ({ key: nextKey++, codice_iaf: s.codice_iaf ?? "", descrizione_iaf: s.descrizione_iaf ?? "" }))
      : [rigaVuota()],
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>Settori IAF</Label>
      <div className="flex flex-col gap-2">
        {righe.map((riga) => (
          <div key={riga.key} className="flex items-center gap-2">
            <Input name="settore_codice_iaf" defaultValue={riga.codice_iaf} placeholder="Codice IAF" className="w-32" />
            <Input
              name="settore_descrizione_iaf"
              defaultValue={riga.descrizione_iaf}
              placeholder="Descrizione settore"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Rimuovi settore"
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
          Aggiungi settore
        </Button>
      </div>
    </div>
  );
}
