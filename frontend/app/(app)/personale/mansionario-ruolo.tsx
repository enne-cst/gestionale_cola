"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApiResource } from "@/lib/actions/api-resource";
import type { CompetenzaRuolo } from "@/lib/types/personale-hr";

import { CompetenzaRuoloDialog } from "./competenza-ruolo-dialog";
import { EliminaCompetenzaDialog } from "./elimina-competenza-dialog";

const AMBITO_LABEL: Record<string, string> = {
  GOVERNANCE: "Governance",
  SICUREZZA: "Sicurezza",
  QUALITA: "Qualità",
  AMBIENTE: "Ambiente",
  ORGANIZZAZIONE: "Organizzazione",
  ALTRO: "Altro",
};

/** Dettaglio del ruolo aperto dalla tabella "Ruoli registrati" (correzione
 * "Mansionario e profilo standard delle competenze del ruolo"): un solo
 * blocco, senza le due schede interne "Mansionario"/"Conoscenza, competenza
 * e consapevolezza" del prototipo — qui il mansionario è esclusivamente
 * l'elenco delle competenze standard richieste dall'azienda per il ruolo
 * (Azienda + Ruolo, condiviso da tutte le persone che lo ricoprono; mai
 * legato alla singola assegnazione né alla fonte CCIAA). */
export function MansionarioRuolo({
  ruoloId,
  ruoloDenominazione,
  ambito,
  fonte,
  onClose,
}: {
  ruoloId: string;
  ruoloDenominazione: string;
  ambito: string | null;
  fonte: string;
  onClose: () => void;
}) {
  const [competenze, setCompetenze] = useState<CompetenzaRuolo[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  function ricarica() {
    setErrore(null);
    getApiResource<CompetenzaRuolo[]>(`/api/personale/ruoli/${ruoloId}/mansionario`)
      .then(setCompetenze)
      .catch(() => setErrore("Impossibile caricare il mansionario del ruolo."));
  }

  useEffect(() => {
    setCompetenze(null);
    ricarica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruoloId]);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{ruoloDenominazione}</h4>
            {ambito && <Badge variant="outline">{AMBITO_LABEL[ambito] ?? ambito}</Badge>}
            <Badge variant={fonte === "CCIAA" ? "outline" : "default"}>{fonte === "CCIAA" ? "CCIAA" : "Azienda"}</Badge>
          </div>
          {fonte === "CCIAA" && (
            <p className="mt-1 text-xs text-muted-foreground">
              L'incarico proviene dalla CCIAA e resta in sola lettura. Il mansionario è invece una configurazione
              aziendale, indipendente dalla fonte dell'incarico.
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Chiudi
        </Button>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-foreground">Mansionario del ruolo</h5>
            <p className="text-xs text-muted-foreground">
              Profilo standard delle competenze richieste a tutte le persone che ricoprono questo ruolo.
            </p>
          </div>
          <CompetenzaRuoloDialog
            ruoloId={ruoloId}
            onSaved={ricarica}
            trigger={
              <Button size="sm" variant="outline">
                + Aggiungi competenza
              </Button>
            }
          />
        </div>

        {errore && <p className="mt-3 text-sm text-destructive">{errore}</p>}

        {competenze === null ? (
          <p className="mt-3 text-sm text-muted-foreground">Caricamento…</p>
        ) : competenze.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nessuna competenza configurata per questo ruolo.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {competenze.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  {c.descrizione && <p className="text-sm text-muted-foreground">{c.descrizione}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <CompetenzaRuoloDialog
                    ruoloId={ruoloId}
                    competenza={c}
                    onSaved={ricarica}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    }
                  />
                  <EliminaCompetenzaDialog
                    competenza={c}
                    onRemoved={ricarica}
                    trigger={
                      <Button variant="outline" size="sm">
                        Rimuovi
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
