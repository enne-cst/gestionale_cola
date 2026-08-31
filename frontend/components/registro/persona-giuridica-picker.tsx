"use client";

import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { creaPersonaGiuridica, getPersoneGiuridiche } from "@/lib/actions/personale";
import type { AnaPersonaGiuridica } from "@/lib/types/personale";

export type PersonaGiuridicaLike = Pick<AnaPersonaGiuridica, "id" | "denominazione" | "codice_fiscale" | "partita_iva">;

function etichettaPersonaGiuridica(p: PersonaGiuridicaLike): string {
  const parti = [p.denominazione, p.codice_fiscale];
  if (p.partita_iva) parti.push(`P.IVA ${p.partita_iva}`);
  return parti.join(" — ");
}

/** Come `PersonaPicker`, per un titolare persona giuridica (§ Correzione
 * 16): cerca per denominazione/codice fiscale/partita IVA tra le persone
 * giuridiche già censite (`ana_persone_giuridiche`), senza testo libero —
 * se non trovata, permette di censirne una nuova al volo. Nessun campo di
 * persona fisica nel form di creazione (nascita, cittadinanza): solo i
 * dati identificativi del soggetto giuridico. */
export function PersonaGiuridicaPicker({
  value,
  onChange,
}: {
  value: PersonaGiuridicaLike | null;
  onChange: (persona: AnaPersonaGiuridica) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [persone, setPersone] = useState<AnaPersonaGiuridica[] | null>(null);
  const [creando, setCreando] = useState(false);
  const [erroreCreazione, setErroreCreazione] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open && persone === null) {
      getPersoneGiuridiche()
        .then(setPersone)
        .catch(() => setPersone([]));
    }
  }, [open, persone]);

  const risultati = useMemo(() => {
    if (!persone) return [];
    const q = query.trim().toLowerCase();
    if (q === "") return persone;
    return persone.filter(
      (p) =>
        p.denominazione.toLowerCase().includes(q) ||
        p.codice_fiscale.toLowerCase().includes(q) ||
        (p.partita_iva ?? "").toLowerCase().includes(q),
    );
  }, [persone, query]);

  async function onCreaPersonaGiuridica(formData: FormData) {
    setSalvando(true);
    setErroreCreazione(null);
    try {
      const nuova = await creaPersonaGiuridica({
        denominazione: String(formData.get("denominazione") ?? ""),
        codice_fiscale: String(formData.get("codice_fiscale") ?? ""),
        partita_iva: (formData.get("partita_iva") as string) || null,
        sede: (formData.get("sede") as string) || null,
      });
      setPersone((prev) => [...(prev ?? []), nuova]);
      onChange(nuova);
      setCreando(false);
      setOpen(false);
    } catch {
      setErroreCreazione("Impossibile creare la persona giuridica. Verifica i dati inseriti.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          {value ? etichettaPersonaGiuridica(value) : "Cerca una società per denominazione, CF o P.IVA…"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        {creando ? (
          <form action={onCreaPersonaGiuridica} className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold text-foreground">Nuova società</p>
            <FormField label="Denominazione" name="denominazione" required />
            <FormField label="Codice fiscale" name="codice_fiscale" required />
            <FormField label="Partita IVA" name="partita_iva" />
            <FormField label="Sede" name="sede" />
            {erroreCreazione && <p className="text-xs text-destructive">{erroreCreazione}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreando(false)} disabled={salvando}>
                Annulla
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Creazione…" : "Crea società"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="border-b p-2">
              <Input
                autoFocus
                placeholder="Denominazione, codice fiscale o P.IVA…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {persone === null ? (
                <p className="p-3 text-sm text-muted-foreground">Caricamento…</p>
              ) : risultati.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nessuna società trovata.</p>
              ) : (
                risultati.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    {value?.id === p.id && <CheckIcon className="size-4 shrink-0 text-primary" />}
                    <span className="min-w-0 truncate">{etichettaPersonaGiuridica(p)}</span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => setCreando(true)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[var(--az-blue)] hover:bg-accent"
              >
                <PlusIcon className="size-4" />
                Crea nuova società
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
