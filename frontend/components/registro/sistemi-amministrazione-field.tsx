"use client";

import { PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiResource, putApiResource } from "@/lib/actions/api-resource";
import { cn } from "@/lib/utils";
import type { AmministrazioneControllo, SistemaAmministrazione } from "@/lib/types/anagrafica";

let nextKey = 0;

type Riga = {
  key: number;
  sistema_amministrazione: string;
  in_carica: boolean;
  numero_minimo_componenti: string;
  numero_massimo_componenti: string;
  regole_decisionali: string;
  deleghe_previste: string;
  regime_rappresentanza: string;
  gestione_opposizione: string;
};

function daSistema(s: SistemaAmministrazione): Riga {
  return {
    key: nextKey++,
    sistema_amministrazione: s.sistema_amministrazione,
    in_carica: s.in_carica,
    numero_minimo_componenti: s.numero_minimo_componenti?.toString() ?? "",
    numero_massimo_componenti: s.numero_massimo_componenti?.toString() ?? "",
    regole_decisionali: s.regole_decisionali ?? "",
    deleghe_previste: s.deleghe_previste ?? "",
    regime_rappresentanza: s.regime_rappresentanza ?? "",
    gestione_opposizione: s.gestione_opposizione ?? "",
  };
}

function rigaVuota(): Riga {
  return {
    key: nextKey++,
    sistema_amministrazione: "",
    in_carica: false,
    numero_minimo_componenti: "",
    numero_massimo_componenti: "",
    regole_decisionali: "",
    deleghe_previste: "",
    regime_rappresentanza: "",
    gestione_opposizione: "",
  };
}

type Stato = { fase: "loading" } | { fase: "error" } | { fase: "ok" };

/** Organi amministrativi previsti dallo statuto (mappatura CCIAA §2.4.4):
 * blocco ripetibile, una riga per configurazione alternativa ammessa
 * dall'atto costitutivo (non la nomina effettiva di una persona, quella
 * vive nel motore incarichi). Legge/scrive direttamente
 * `sistemi_amministrazione` di `/api/anagrafica/amministrazione-controllo`
 * (children del singleton, non fa parte del registro campo-per-campo): il
 * PUT invia solo questo campo, i conteggi aggregati della stessa risorsa
 * restano intoccati (`exclude_unset` lato backend). */
export function SistemiAmministrazioneField() {
  const [stato, setStato] = useState<Stato>({ fase: "loading" });
  const [righe, setRighe] = useState<Riga[]>([]);
  const [salvataggio, setSalvataggio] = useState<"idle" | "saving" | "error">("idle");

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    getApiResource<AmministrazioneControllo | null>("/api/anagrafica/amministrazione-controllo")
      .then((dati) => {
        setRighe(dati?.sistemi_amministrazione.map(daSistema) ?? []);
        setStato({ fase: "ok" });
      })
      .catch(() => setStato({ fase: "error" }));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  async function salva() {
    setSalvataggio("saving");
    try {
      await putApiResource("/api/anagrafica/amministrazione-controllo", {
        sistemi_amministrazione: righe
          .filter((r) => r.sistema_amministrazione.trim() !== "")
          .map((r) => ({
            sistema_amministrazione: r.sistema_amministrazione.trim(),
            in_carica: r.in_carica,
            numero_minimo_componenti: r.numero_minimo_componenti === "" ? null : Number(r.numero_minimo_componenti),
            numero_massimo_componenti: r.numero_massimo_componenti === "" ? null : Number(r.numero_massimo_componenti),
            regole_decisionali: r.regole_decisionali.trim() === "" ? null : r.regole_decisionali,
            deleghe_previste: r.deleghe_previste.trim() === "" ? null : r.deleghe_previste,
            regime_rappresentanza: r.regime_rappresentanza.trim() === "" ? null : r.regime_rappresentanza,
            gestione_opposizione: r.gestione_opposizione.trim() === "" ? null : r.gestione_opposizione,
          })),
      });
      setSalvataggio("idle");
      carica();
    } catch {
      setSalvataggio("error");
    }
  }

  return (
    <section className="border-b border-[var(--az-border)] py-6 last:border-b-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-[var(--az-ink)]">Organi amministrativi previsti dallo statuto</h3>
        <button
          type="button"
          onClick={carica}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]",
            stato.fase === "loading" && "opacity-50",
          )}
          disabled={stato.fase === "loading"}
        >
          <RefreshCwIcon className={cn("size-3.5", stato.fase === "loading" && "animate-spin")} />
          Aggiorna
        </button>
      </div>

      {stato.fase === "loading" && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
          {[0, 1].map((i) => (
            <span key={i} className="az-skeleton h-9 w-full" />
          ))}
        </div>
      )}

      {stato.fase === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>Impossibile caricare i dati.</span>
          <button type="button" onClick={carica} className="font-semibold underline">
            Riprova
          </button>
        </div>
      )}

      {stato.fase === "ok" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {righe.map((riga) => (
              <div key={riga.key} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Tipologia organo previsto</Label>
                    <Input
                      value={riga.sistema_amministrazione}
                      placeholder="es. Consiglio di Amministrazione"
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, sistema_amministrazione: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Numero minimo componenti</Label>
                    <Input
                      type="number"
                      min={0}
                      value={riga.numero_minimo_componenti}
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, numero_minimo_componenti: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Numero massimo componenti</Label>
                    <Input
                      type="number"
                      min={0}
                      value={riga.numero_massimo_componenti}
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, numero_massimo_componenti: e.target.value } : r)))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`in-carica-${riga.key}`}
                    checked={riga.in_carica}
                    onCheckedChange={(checked) =>
                      setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, in_carica: checked === true } : r)))
                    }
                  />
                  <Label htmlFor={`in-carica-${riga.key}`}>Configurazione attualmente in carica</Label>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Regole decisionali</Label>
                    <Textarea
                      value={riga.regole_decisionali}
                      placeholder="Collegiali, congiuntive, disgiuntive..."
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, regole_decisionali: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Deleghe previste</Label>
                    <Textarea
                      value={riga.deleghe_previste}
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, deleghe_previste: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Regime di rappresentanza previsto</Label>
                    <Textarea
                      value={riga.regime_rappresentanza}
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, regime_rappresentanza: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Gestione dell&apos;opposizione</Label>
                    <Textarea
                      value={riga.gestione_opposizione}
                      placeholder="Se applicabile all'amministrazione disgiuntiva"
                      onChange={(e) =>
                        setRighe((rs) => rs.map((r) => (r.key === riga.key ? { ...r, gestione_opposizione: e.target.value } : r)))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Rimuovi organo previsto"
                    onClick={() => setRighe((rs) => rs.filter((r) => r.key !== riga.key))}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setRighe((rs) => [...rs, rigaVuota()])}>
              <PlusIcon className="size-4" />
              Aggiungi organo previsto
            </Button>
            <div className="flex items-center gap-2">
              {salvataggio === "error" && <span className="text-sm text-destructive">Salvataggio non riuscito.</span>}
              <Button type="button" onClick={salva} disabled={salvataggio === "saving"}>
                {salvataggio === "saving" ? "Salvataggio…" : "Salva"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
