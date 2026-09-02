"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SettoreIafVoce } from "@/lib/types/anagrafica";

import { getSettoriIaf } from "./actions";

/** "Settori IAF" (§ punto 5.1): selezione multipla dal catalogo esistente
 * `cat_settori_iaf` (modulo Sistema), mai duplicato — stesso catalogo già
 * in uso da `AnaCertificazione`. Ogni voce selezionata invia un input
 * hidden `settore_iaf_id`, letto lato server con `formData.getAll`. */
export function SettoriIafSelectField({ dati }: { dati?: string[] }) {
  const [settori, setSettori] = useState<SettoreIafVoce[] | null>(null);
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set(dati ?? []));

  useEffect(() => {
    getSettoriIaf()
      .then(setSettori)
      .catch(() => setSettori([]));
  }, []);

  function toggle(id: string) {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground">Settori IAF</Label>
      {settori === null ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : settori.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun settore IAF in catalogo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {settori.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-[var(--az-ink)]">
              <Checkbox checked={selezionati.has(s.id)} onCheckedChange={() => toggle(s.id)} />
              {s.nome}
            </label>
          ))}
        </div>
      )}
      {Array.from(selezionati).map((id) => (
        <input key={id} type="hidden" name="settore_iaf_id" value={id} />
      ))}
    </div>
  );
}
