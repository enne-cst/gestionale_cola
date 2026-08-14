"use client";

import { ArrowRightIcon, CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";

import { CompletenessRing } from "@/components/completeness-ring";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** KPI "Qualità dei dati" (§8.2/§12.2): solo per il Consulente, calcolata
 * lato server su tutte le sezioni che adottano il registro campo-per-campo
 * (nel pilota, solo Informazioni societarie). */
export function QualityCard() {
  const { state } = useWorkspace();
  const quality = state.overview.quality;
  if (!quality) return null;

  return (
    <Card className="gap-4 overflow-hidden py-0 pt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldCheckIcon className="size-4" />
          Qualità dei dati
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <CompletenessRing percentuale={quality.percentage} />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <CheckCircle2Icon className="size-4 text-green-600" />
            {quality.verified} element{quality.verified === 1 ? "o" : "i"} verificat{quality.verified === 1 ? "o" : "i"}
          </span>
          <span className="text-xs text-muted-foreground">
            {quality.pending} da verificare · {quality.revisionRequired} da revisionare
          </span>
        </div>
      </CardContent>
      <CardFooter className="mt-2 border-t border-primary/15 bg-primary/5 py-3">
        <span className="flex w-full items-center justify-between text-sm font-medium text-primary">
          Visualizza verifiche
          <ArrowRightIcon className="size-4 shrink-0" />
        </span>
      </CardFooter>
    </Card>
  );
}
