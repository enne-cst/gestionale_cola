"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CatalogoVoce } from "@/lib/types/anagrafica-iso9001";

import { getCatalogoUnitaLocali } from "./actions";

/** Tipologie dell'unità locale (§ punto 4): selezione multipla — una stessa
 * unità può avere più tipologie (es. "Deposito, magazzino"), mai una
 * stringa con virgole. Ogni voce selezionata invia un input hidden
 * `tipologia_id`, letto lato server con `formData.getAll`. */
export function TipologieSelectField({ dati }: { dati?: string[] }) {
  const [tipologie, setTipologie] = useState<CatalogoVoce[] | null>(null);
  const [selezionate, setSelezionate] = useState<Set<string>>(new Set(dati ?? []));

  useEffect(() => {
    getCatalogoUnitaLocali("tipologie")
      .then(setTipologie)
      .catch(() => setTipologie([]));
  }, []);

  function toggle(id: string) {
    setSelezionate((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground">Tipologie</Label>
      {tipologie === null ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : tipologie.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna tipologia in catalogo.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tipologie.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm text-[var(--az-ink)]">
              <Checkbox checked={selezionate.has(t.id)} onCheckedChange={() => toggle(t.id)} />
              {t.denominazione}
            </label>
          ))}
        </div>
      )}
      {Array.from(selezionate).map((id) => (
        <input key={id} type="hidden" name="tipologia_id" value={id} />
      ))}
    </div>
  );
}
