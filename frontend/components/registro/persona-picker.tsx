"use client";

import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { creaPersona, getPersone } from "@/lib/actions/personale";
import { formatDate } from "@/lib/format";
import type { AnaPersona } from "@/lib/types/personale";

export type PersonaLike = Pick<AnaPersona, "id" | "cognome" | "nome" | "codice_fiscale" | "data_nascita">;

function etichettaPersona(p: PersonaLike): string {
  const parti = [`${p.cognome} ${p.nome}`, p.codice_fiscale];
  if (p.data_nascita) parti.push(formatDate(p.data_nascita));
  return parti.join(" — ");
}

/** Selettore ricercabile di persona (sezione N della specifica CCIAA):
 * cerca per nome/cognome/codice fiscale tra le persone già censite
 * (`ana_persone`), senza testo libero — se non trovata, permette di
 * censirne una nuova al volo. Niente duplicazione anagrafica: ogni incarico
 * riferisce sempre `ana_persone`, mai una copia dei suoi dati. */
export function PersonaPicker({
  value,
  onChange,
}: {
  value: PersonaLike | null;
  onChange: (persona: AnaPersona) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [persone, setPersone] = useState<AnaPersona[] | null>(null);
  const [creando, setCreando] = useState(false);
  const [erroreCreazione, setErroreCreazione] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open && persone === null) {
      getPersone()
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
        p.cognome.toLowerCase().includes(q) ||
        p.nome.toLowerCase().includes(q) ||
        p.codice_fiscale.toLowerCase().includes(q),
    );
  }, [persone, query]);

  async function onCreaPersona(formData: FormData) {
    setSalvando(true);
    setErroreCreazione(null);
    try {
      const nuova = await creaPersona({
        cognome: String(formData.get("cognome") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        codice_fiscale: String(formData.get("codice_fiscale") ?? ""),
        data_nascita: (formData.get("data_nascita") as string) || null,
        luogo_nascita: (formData.get("luogo_nascita") as string) || null,
        nazionalita: (formData.get("nazionalita") as string) || null,
        indirizzo_residenza: (formData.get("indirizzo_residenza") as string) || null,
      });
      setPersone((prev) => [...(prev ?? []), nuova]);
      onChange(nuova);
      setCreando(false);
      setOpen(false);
    } catch {
      setErroreCreazione("Impossibile creare la persona. Verifica i dati inseriti.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          {value ? etichettaPersona(value) : "Cerca una persona per nome, cognome o CF…"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        {creando ? (
          <form action={onCreaPersona} className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold text-foreground">Nuova persona</p>
            <FormField label="Cognome" name="cognome" required />
            <FormField label="Nome" name="nome" required />
            <FormField label="Codice fiscale" name="codice_fiscale" required />
            <FormField label="Data di nascita" name="data_nascita" type="date" />
            <FormField label="Luogo di nascita" name="luogo_nascita" />
            <FormField label="Cittadinanza" name="nazionalita" />
            <FormField label="Domicilio" name="indirizzo_residenza" />
            {erroreCreazione && <p className="text-xs text-destructive">{erroreCreazione}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreando(false)} disabled={salvando}>
                Annulla
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Creazione…" : "Crea persona"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="border-b p-2">
              <Input
                autoFocus
                placeholder="Nome, cognome o codice fiscale…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {persone === null ? (
                <p className="p-3 text-sm text-muted-foreground">Caricamento…</p>
              ) : risultati.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nessuna persona trovata.</p>
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
                    <span className="min-w-0 truncate">{etichettaPersona(p)}</span>
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
                Crea nuova persona
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
