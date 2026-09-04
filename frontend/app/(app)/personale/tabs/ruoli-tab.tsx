"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RuoloSummary } from "@/lib/types/personale";
import type { PersonaProfilo, PersonaRuolo } from "@/lib/types/personale-hr";

import { AMBITO_LABEL, AssegnaRuoloDialog } from "../assegna-ruolo-dialog";
import { CessaRuoloDialog } from "../cessa-ruolo-dialog";

const STATO_LABEL: Record<string, string> = {
  PIANIFICATO: "Pianificato",
  ATTIVO: "Attivo",
  SOSPESO: "Sospeso",
  CESSATO: "Cessato",
};

const DOCUMENTAZIONE_LABEL: Record<string, string> = {
  PRESENTE: "Presente",
  DA_INTEGRARE: "Da integrare",
  NON_PRESENTE: "Non presente",
  IMPORTATO_CCIAA: "Importato dalla CCIAA",
  NON_RICHIESTO: "Non richiesto",
};

function formattaData(valore: string | null): string {
  if (!valore) return "—";
  const data = new Date(valore);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("it-IT");
}

/** Tab "Ruoli e responsabilità" (§3-§13 della correzione): elenco delle
 * assegnazioni reali della persona (incarichi societari importati dalla
 * CCIAA + ruoli assegnati manualmente dall'azienda), stesso motore
 * ruolo+incarico già in uso per Soci/Amministratori/Sindaci. Il mansionario
 * del ruolo e il relativo contenuto restano fuori da questa fase — ogni
 * riga mantiene solo il riferimento al ruolo di catalogo (`ruolo_id`) che
 * servirà a recuperarlo in seguito. */
export function RuoliTab({
  persona,
  ruoli,
  ruoliPersona,
}: {
  persona: PersonaProfilo;
  ruoli: RuoloSummary[];
  ruoliPersona: PersonaRuolo[];
}) {
  const router = useRouter();

  function onSaved() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Ruoli e responsabilità</h3>
          <p className="text-sm text-muted-foreground">Incarichi societari importati e ruoli assegnati dall'azienda</p>
        </div>
        <AssegnaRuoloDialog
          personaId={persona.id}
          ruoli={ruoli}
          onSaved={onSaved}
          trigger={<Button size="sm">Assegna ruolo</Button>}
        />
      </div>

      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-3">
          <h4 className="text-sm font-semibold text-foreground">Ruoli registrati</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Ruolo</th>
                <th className="p-3 font-medium">Ambito</th>
                <th className="p-3 font-medium">Fonte</th>
                <th className="p-3 font-medium">Data inizio</th>
                <th className="p-3 font-medium">Data fine</th>
                <th className="p-3 font-medium">Stato</th>
                <th className="p-3 font-medium">Documentazione</th>
                <th className="p-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {ruoliPersona.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Nessun ruolo registrato per questa persona.
                  </td>
                </tr>
              ) : (
                ruoliPersona.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-foreground">{r.ruolo_denominazione}</td>
                    <td className="p-3">{r.ambito ? (AMBITO_LABEL[r.ambito] ?? r.ambito) : "—"}</td>
                    <td className="p-3">
                      <Badge variant={r.fonte === "CCIAA" ? "outline" : "default"}>
                        {r.fonte === "CCIAA" ? "CCIAA" : "Azienda"}
                      </Badge>
                    </td>
                    <td className="p-3">{formattaData(r.data_inizio)}</td>
                    <td className="p-3">{formattaData(r.data_fine)}</td>
                    <td className="p-3">
                      <Badge variant={r.stato === "ATTIVO" ? "default" : "outline"}>{STATO_LABEL[r.stato] ?? r.stato}</Badge>
                    </td>
                    <td className="p-3">{DOCUMENTAZIONE_LABEL[r.documentazione] ?? r.documentazione}</td>
                    <td className="p-3">
                      {r.fonte === "AZIENDA" && r.stato !== "CESSATO" ? (
                        <div className="flex gap-2">
                          <AssegnaRuoloDialog
                            personaId={persona.id}
                            ruoli={ruoli}
                            incarico={r}
                            onSaved={onSaved}
                            trigger={
                              <Button variant="outline" size="sm">
                                Modifica
                              </Button>
                            }
                          />
                          <CessaRuoloDialog
                            ruolo={r}
                            onSaved={onSaved}
                            trigger={
                              <Button variant="outline" size="sm">
                                Cessa
                              </Button>
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.fonte === "CCIAA" ? "Sola lettura (CCIAA)" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
