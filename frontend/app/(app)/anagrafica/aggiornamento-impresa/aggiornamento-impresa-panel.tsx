"use client";

import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { VerificationLegend } from "@/components/registro/field-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { Button } from "@/components/ui/button";

import { CronologiaAggiornamentoTable } from "./cronologia-aggiornamento-table";
import { IndicatoriAggiornamentoImpresaRow } from "./indicatori-aggiornamento-impresa";

/** Contenitore della card "Aggiornamento impresa" (Correzione 24):
 * cronologia automatica, non un form di inserimento manuale — nessun
 * campo scrivibile in questa sezione (§ punto 1, "i valori devono essere
 * non modificabili"), quindi non passa dal motore campo-per-campo di
 * `app/core/registro_campi.py` (che presuppone almeno un campo scrivibile
 * su un record scalare) né da `app.core.unita_locali`/`titoli_abilitativi`
 * (che permettono di creare righe: qui §10 vieta esplicitamente "Aggiungi
 * riga", anche in modalità modifica).
 *
 * Il banner "Modifica dati" in fondo resta comunque per uniformità visiva
 * con le altre card CCIAA (stessa scelta già motivata in
 * `PersonaleOccupazionePanel`): non sblocca nulla in questa card (nessuna
 * riga creabile, il click sulla riga della cronologia apre sempre il
 * dettaglio di sola lettura, la verifica per riga è sempre disponibile),
 * ma "Annulla"/"Salva modifiche" hanno lo stesso effetto di uscita dalla
 * modalità, coerente con come le altre card presentano quel pulsante. */
export function AggiornamentoImpresaPanel() {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [editing, setEditing] = useState(false);

  return (
    <>
      <section className="border-b border-[var(--az-border)] py-6">
        <h3 className="mb-4 text-[15px] font-bold text-[var(--az-ink)]">Indicatori riepilogativi</h3>
        <IndicatoriAggiornamentoImpresaRow />
      </section>

      <section className="border-b border-[var(--az-border)] py-6 last:border-b-0">
        <CronologiaAggiornamentoTable />
      </section>

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
