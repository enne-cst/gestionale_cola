"use client";

import { ClockIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/components/registro/workspace-provider";

function tempoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minuti = Math.round(diffMs / 60000);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min fa`;
  const ore = Math.round(minuti / 60);
  if (ore < 24) return `${ore} ${ore === 1 ? "ora" : "ore"} fa`;
  const giorni = Math.round(ore / 24);
  return `${giorni} ${giorni === 1 ? "giorno" : "giorni"} fa`;
}

/** Card "Ultime modifiche" (§8.2): alimentata dall'audit del registro
 * campo-per-campo (nel pilota, solo Informazioni societarie). */
export function RecentChangesCard() {
  const { state } = useWorkspace();
  const modifiche = state.overview.recentChanges;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ClockIcon className="size-4" />
          Ultime modifiche
        </CardTitle>
      </CardHeader>
      <CardContent>
        {modifiche.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna modifica registrata.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {modifiche.slice(0, 3).map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="flex flex-col">
                  <span className="font-medium text-foreground capitalize">{m.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {tempoFa(m.timestamp)}
                    {m.actor ? ` · ${m.actor}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
