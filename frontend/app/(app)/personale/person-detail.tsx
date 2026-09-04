"use client";

import { ExpandIcon, ShrinkIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RuoloSummary } from "@/lib/types/personale";
import type { CatalogoVoce, DocumentoPersonale, PersonaListRow, PersonaProfilo, PersonaRuolo } from "@/lib/types/personale-hr";

import { PersonAvatar } from "./person-avatar";
import { PersonaRapportoTab } from "./tabs/persona-rapporto-tab";
import { PlaceholderTab } from "./tabs/placeholder-tab";
import { PanoramicaTab } from "./tabs/panoramica-tab";
import { RuoliTab } from "./tabs/ruoli-tab";

const TAB_ITEMS = [
  { value: "overview", label: "Panoramica" },
  { value: "profile", label: "Persona e rapporto" },
  { value: "roles", label: "Ruoli" },
  { value: "training", label: "Formazione e abilitazioni" },
  { value: "health", label: "Idoneità sanitaria" },
  { value: "skills", label: "Competenze" },
  { value: "notes", label: "Note" },
] as const;

// Guardia di navigazione condivisa dal tab "Persona e rapporto" con il
// resto della shell (§8.4): cambio tab/persona/chiusura mentre il form è
// sporco mostra "Continua a modificare / Esci senza salvare / Salva ed
// esci", mai una perdita silenziosa di modifiche.
type DirtyGuard = {
  isDirty: boolean;
  setDirty: (v: boolean) => void;
  registerSave: (fn: (() => Promise<boolean>) | null) => void;
  guardNavigation: (proceed: () => void) => void;
};

const DirtyGuardContext = createContext<DirtyGuard | null>(null);

export function useDirtyGuard(): DirtyGuard {
  const ctx = useContext(DirtyGuardContext);
  if (!ctx) throw new Error("useDirtyGuard usato fuori da PersonDetail");
  return ctx;
}

export function PersonDetail({
  persona,
  personeRail,
  tab,
  layout,
  mansioni,
  reparti,
  tipiRapporto,
  ruoli,
  ruoliPersona,
  tipiDocumento,
  documentiPersona,
}: {
  persona: PersonaProfilo;
  personeRail: PersonaListRow[];
  tab: string;
  layout: string;
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  tipiRapporto: CatalogoVoce[];
  ruoli: RuoloSummary[];
  ruoliPersona: PersonaRuolo[];
  tipiDocumento: CatalogoVoce[];
  documentiPersona: DocumentoPersonale[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ricerca, setRicerca] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [confermaAperta, setConfermaAperta] = useState(false);
  const saveRef = useRef<(() => Promise<boolean>) | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  const guardNavigation = useCallback(
    (proceed: () => void) => {
      if (!isDirty) {
        proceed();
        return;
      }
      pendingRef.current = proceed;
      setConfermaAperta(true);
    },
    [isDirty],
  );

  function href(overrides: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    return `${pathname}?${next.toString()}`;
  }

  function vaiA(overrides: Record<string, string | null>) {
    guardNavigation(() => router.push(href(overrides)));
  }

  const personeFiltrate = personeRail.filter((p) =>
    `${p.nome} ${p.cognome}`.toLowerCase().includes(ricerca.toLowerCase()),
  );

  return (
    <DirtyGuardContext.Provider
      value={{
        isDirty,
        setDirty: setIsDirty,
        registerSave: (fn) => {
          saveRef.current = fn;
        },
        guardNavigation,
      }}
    >
      <div className="flex min-h-0 flex-1 gap-4">
        {layout !== "full" && (
          <div className="flex w-64 shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Persone</h3>
            </div>
            <button
              type="button"
              onClick={() => vaiA({ personId: null, tab: null })}
              className="text-left text-xs text-primary hover:underline"
            >
              ← Torna all'anagrafica
            </button>
            <Input
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca persona..."
              className="h-8 text-sm"
            />
            <div className="flex flex-col gap-0.5 overflow-y-auto">
              {personeFiltrate.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => vaiA({ personId: p.id, tab: "overview" })}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
                    p.id === persona.id && "bg-secondary font-medium text-primary",
                  )}
                >
                  <PersonAvatar nome={p.nome} cognome={p.cognome} />
                  {p.nome} {p.cognome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PersonAvatar nome={persona.nome} cognome={persona.cognome} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {persona.nome} {persona.cognome}
                  </h2>
                  <Badge variant={persona.rapporto_corrente?.stato === "ATTIVO" ? "default" : "outline"}>
                    {persona.rapporto_corrente?.stato === "ATTIVO" ? "Rapporto attivo" : (persona.rapporto_corrente?.stato ?? "Nessun rapporto")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {persona.rapporto_corrente?.mansione?.denominazione ?? "—"} · {persona.rapporto_corrente?.reparto?.denominazione ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(href({ layout: layout === "full" ? "split" : "full" }))}>
                {layout === "full" ? <ShrinkIcon className="size-4" /> : <ExpandIcon className="size-4" />}
                {layout === "full" ? "Affianca elenco" : "A tutta larghezza"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => vaiA({ personId: null, tab: null })}>
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
            {TAB_ITEMS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => vaiA({ tab: t.value })}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "overview" && <PanoramicaTab persona={persona} />}
            {tab === "profile" && (
              <PersonaRapportoTab
                persona={persona}
                mansioni={mansioni}
                reparti={reparti}
                tipiRapporto={tipiRapporto}
                tipiDocumento={tipiDocumento}
                documentiPersona={documentiPersona}
              />
            )}
            {tab === "roles" && <RuoliTab persona={persona} ruoli={ruoli} ruoliPersona={ruoliPersona} />}
            {tab !== "overview" && tab !== "profile" && tab !== "roles" && <PlaceholderTab />}
          </div>
        </div>
      </div>

      <Dialog open={confermaAperta} onOpenChange={setConfermaAperta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifiche non salvate</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hai delle modifiche non salvate in questa scheda. Cosa vuoi fare?
          </p>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="outline" className="w-full" onClick={() => setConfermaAperta(false)}>
              Continua a modificare
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsDirty(false);
                setConfermaAperta(false);
                pendingRef.current?.();
              }}
            >
              Esci senza salvare
            </Button>
            <Button
              className="w-full"
              onClick={async () => {
                const ok = (await saveRef.current?.()) ?? false;
                if (ok) {
                  setIsDirty(false);
                  setConfermaAperta(false);
                  pendingRef.current?.();
                }
              }}
            >
              Salva ed esci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DirtyGuardContext.Provider>
  );
}
