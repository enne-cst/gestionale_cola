"use client";

import { ChevronRightIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CatalogoVoce, Page as ApiPage, PersonaListRow } from "@/lib/types/personale-hr";
import type { RuoloSummary } from "@/lib/types/personale";

import { NuovaPersonaDialog } from "./nuova-persona-dialog";
import { PersonAvatar } from "./person-avatar";

const TUTTI = "__tutti__";

export function PeopleList({
  persone,
  mansioni,
  reparti,
  tipiRapporto,
  ruoli,
  filtri,
}: {
  persone: ApiPage<PersonaListRow>;
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  tipiRapporto: CatalogoVoce[];
  ruoli: RuoloSummary[];
  filtri: { q: string; repartoId: string; mansioneId: string; statoRapporto: string; ruoloId: string; page: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filtri.q);

  function aggiornaFiltro(chiave: string, valore: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (valore && valore !== TUTTI) next.set(chiave, valore);
    else next.delete(chiave);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function apriPersona(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("personId", id);
    next.set("tab", "overview");
    router.push(`${pathname}?${next.toString()}`);
  }

  function cambiaPagina(pagina: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(pagina));
    router.push(`${pathname}?${next.toString()}`);
  }

  const totalePagine = Math.max(1, Math.ceil(persone.total / persone.page_size));

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Anagrafica persone</h2>
          <p className="text-sm text-muted-foreground">{persone.total} persone</p>
        </div>
        <NuovaPersonaDialog mansioni={mansioni} reparti={reparti} tipiRapporto={tipiRapporto}>
          <Button>
            <PlusIcon className="size-4" /> Nuova persona
          </Button>
        </NuovaPersonaDialog>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aggiornaFiltro("q", q)}
            onBlur={() => aggiornaFiltro("q", q)}
            placeholder="Cerca per nome, cognome..."
            className="pl-8"
          />
        </div>
        <Select value={filtri.repartoId || TUTTI} onValueChange={(v) => aggiornaFiltro("reparto_id", v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tutti i reparti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TUTTI}>Tutti i reparti</SelectItem>
            {reparti.map((r) => <SelectItem key={r.id} value={r.id}>{r.denominazione}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtri.mansioneId || TUTTI} onValueChange={(v) => aggiornaFiltro("mansione_id", v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tutte le mansioni" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TUTTI}>Tutte le mansioni</SelectItem>
            {mansioni.map((m) => <SelectItem key={m.id} value={m.id}>{m.denominazione}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtri.ruoloId || TUTTI} onValueChange={(v) => aggiornaFiltro("ruolo_id", v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tutti i ruoli" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TUTTI}>Tutti i ruoli</SelectItem>
            {ruoli.map((r) => <SelectItem key={r.id} value={r.id}>{r.denominazione}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtri.statoRapporto || TUTTI} onValueChange={(v) => aggiornaFiltro("stato_rapporto", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Stato rapporto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TUTTI}>Tutti gli stati</SelectItem>
            <SelectItem value="ATTIVO">Attivo</SelectItem>
            <SelectItem value="PIANIFICATO">Pianificato</SelectItem>
            <SelectItem value="CESSATO">Cessato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Persona</TableHead>
            <TableHead>Mansione / reparto</TableHead>
            <TableHead>Ruoli principali</TableHead>
            <TableHead>Stato rapporto</TableHead>
            <TableHead>Data assunzione</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {persone.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                Nessuna persona trovata.
              </TableCell>
            </TableRow>
          )}
          {persone.items.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => apriPersona(p.id)}
            >
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <PersonAvatar nome={p.nome} cognome={p.cognome} />
                  <span className="font-medium text-foreground">
                    {p.nome} {p.cognome}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-foreground">{p.rapporto?.mansione?.denominazione ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{p.rapporto?.reparto?.denominazione ?? ""}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {p.ruoli_principali.slice(0, 2).map((nome) => (
                    <Badge key={nome} variant="secondary">{nome}</Badge>
                  ))}
                  {p.ruoli_principali.length > 2 && (
                    <Badge variant="outline">+{p.ruoli_principali.length - 2}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {p.rapporto ? <Badge variant={p.rapporto.stato === "ATTIVO" ? "default" : "outline"}>{p.rapporto.stato}</Badge> : "—"}
              </TableCell>
              <TableCell>{p.rapporto ? new Date(p.rapporto.data_inizio).toLocaleDateString("it-IT") : "—"}</TableCell>
              <TableCell><ChevronRightIcon className="size-4 text-muted-foreground" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Pagina {persone.page} di {totalePagine}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={persone.page <= 1} onClick={() => cambiaPagina(persone.page - 1)}>
            Precedente
          </Button>
          <Button variant="outline" size="sm" disabled={persone.page >= totalePagine} onClick={() => cambiaPagina(persone.page + 1)}>
            Successiva
          </Button>
        </div>
      </div>
    </div>
  );
}
