"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { VerificationLegend } from "@/components/registro/field-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";

import { RiepilogoPersonaleOccupazione } from "./riepilogo-personale-occupazione";
import { StoricoRilevazioni } from "./storico-rilevazioni";

/** Contenitore della sezione "Personale e occupazione": stesso aspetto
 * delle altre card CCIAA (banner con legenda + "Modifica dati" in fondo,
 * richiesta esplicita dell'utente per uniformità con Soci/Amministratori/
 * Attività economica) senza però passare dal motore campo-per-campo di
 * `app/core/registro_campi.py` — quel motore presuppone un record scalare
 * per azienda con colonne proprie (`model` + `CampoDef` su colonne reali),
 * mentre questa sezione è per natura uno storico di più rilevazioni (§
 * memoria "correzione22-personale-occupazione"): costruirne una versione
 * finta solo per ottenere il banner avrebbe introdotto un modello e una
 * migrazione senza scopo reale. Il banner qui è quindi un piccolo stato
 * locale (`editing`), condiviso via prop tra i due blocchi sotto invece che
 * tramite `useWorkspace().state.sections[...]` — stessa presentazione,
 * meccanismo più leggero e adatto alla sezione.
 *
 * A differenza del banner a registro, qui non c'è una bozza di sezione da
 * Annullare/Salvare: ogni azione (aggiungi/modifica/elimina rilevazione)
 * salva già subito tramite il proprio dialog. "Modifica dati" si limita a
 * mostrare o nascondere le azioni di modifica (coerente con come le tabelle
 * a registro mostrano "Aggiungi"/elimina solo in modalità modifica); una
 * volta dentro, "Annulla" e "Salva modifiche" hanno lo stesso effetto
 * (uscire dalla modalità modifica) perché non c'è nulla da annullare — la
 * coppia esiste per l'uniformità visiva con `SectionFooter`, richiesta
 * esplicitamente dall'utente. */
export function PersonaleOccupazionePanel() {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [editing, setEditing] = useState(false);

  return (
    <>
      <RiepilogoPersonaleOccupazione editing={editing} />
      <StoricoRilevazioni editing={editing} />

      {/* § "banner" nello stile di `SectionFooter`, ma contenuto nell'area
          scrollabile del pannello (non un vero sibling dopo lo scroll come
          per le sezioni a registro, § commento sopra) — stesso bordo
          superiore, stessa spaziatura, senza il "mt-2" ravvicinato usato
          per i footer annidati dentro un blocco.
          § "come per tutte le altre sezioni, dopo aver attivato la
          modalità modifica deve presentare i 2 tasti salva modifiche e
          annulla": qui non esiste una bozza di sezione da annullare/salvare
          (ogni azione — aggiungi/modifica/elimina rilevazione — salva già
          subito tramite il proprio dialog, § commento del componente sopra),
          quindi i due pulsanti condividono lo stesso effetto (uscire dalla
          modalità modifica); la coppia esiste per l'uniformità visiva e di
          comportamento con `SectionFooter`, non per introdurre un salvataggio
          fittizio. */}
      <div className="mt-4 border-t border-[var(--az-border)]">
        {editing ? (
          <div className="flex min-h-[72px] items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-[126px] rounded-[7px] border-[var(--az-blue)] text-[var(--az-blue)] hover:bg-[#f5f8ff]"
              onClick={() => setEditing(false)}
            >
              Annulla
            </Button>
            <Button
              type="button"
              className="h-11 min-w-[126px] rounded-[7px] bg-[var(--az-blue)] hover:bg-[var(--az-blue-dark)]"
              onClick={() => setEditing(false)}
            >
              Salva modifiche
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-4">
            <VerificationLegend />
            {consulente && (
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="h-11 w-[168px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold shadow-[0_5px_12px_rgba(7,94,255,0.18)] hover:bg-[var(--az-blue-dark)]"
                >
                  <PencilIcon className="size-4" />
                  Modifica dati
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
