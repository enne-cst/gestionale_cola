"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { TitoloStudio } from "@/lib/types/personale-hr";

import { verificaTitoloStudio } from "./actions";

/** Stato "Dichiarato"/"Verificato" (§12.4): stesso motore verifica_riga
 * già usato per Titoli abilitativi/Soci/Amministratori/Sindaci, qui in
 * forma minimale (nessun restyling in questa fase). Il backend applica il
 * gate consulente indipendentemente da cosa mostra qui il frontend
 * (CLAUDE.md: "ogni regola che conta viene ri-verificata dalle API"). */
export function TitoloStudioVerifica({ titolo, onDecided }: { titolo: TitoloStudio; onDecided: () => void }) {
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState(titolo.revisionNote ?? "");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const stato = titolo.verificationStatus ?? "PENDING_VERIFICATION";
  const verificato = stato === "VERIFIED";
  const inRevisione = stato === "REVISION_REQUIRED";
  const etichetta = verificato ? "Verificato" : inRevisione ? "Da revisionare" : "Dichiarato";

  function apri(v: boolean) {
    setOpen(v);
    if (v) {
      setNota(titolo.revisionNote ?? "");
      setErrore(null);
    }
  }

  async function decidi(decision: "VERIFIED" | "REVISION_REQUIRED") {
    if (decision === "REVISION_REQUIRED" && !nota.trim()) {
      setErrore("Inserisci una nota per richiedere la revisione.");
      return;
    }
    setInvio(true);
    setErrore(null);
    const risultato = await verificaTitoloStudio(titolo.id, decision, nota.trim() || null, titolo.verificationVersion);
    setInvio(false);
    if (risultato.ok) {
      setOpen(false);
      onDecided();
    } else {
      setErrore(typeof risultato.detail === "string" ? risultato.detail : "Impossibile salvare la decisione.");
    }
  }

  return (
    <Popover open={open} onOpenChange={apri}>
      <PopoverTrigger asChild>
        <button type="button">
          <Badge variant={verificato ? "success" : inRevisione ? "warning" : "secondary"}>{etichetta}</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{etichetta}</p>
            {verificato && titolo.verifiedBy && (
              <p className="text-xs text-muted-foreground">
                Verificato da {titolo.verifiedBy}
                {titolo.verifiedAt ? ` il ${new Date(titolo.verifiedAt).toLocaleDateString("it-IT")}` : ""}
              </p>
            )}
          </div>
          {errore && <p className="text-xs text-destructive">{errore}</p>}
          <Textarea placeholder="Nota" value={nota} onChange={(e) => setNota(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={invio} onClick={() => decidi("REVISION_REQUIRED")}>
              Richiedi revisione
            </Button>
            <Button type="button" size="sm" disabled={invio} onClick={() => decidi("VERIFIED")}>
              {verificato ? "Salva nota" : "Verifica"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
