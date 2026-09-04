"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { getApiResource } from "@/lib/actions/api-resource";
import type { CatalogoVoce } from "@/lib/types/personale-hr";
import type {
  CellaMonitoraggio,
  MonitoraggioRiga,
  PaginaMonitoraggio,
  RiepilogoMonitoraggio,
  StatoCellaMonitoraggio,
  StatoComplessivoPersona,
} from "@/lib/types/personale-monitoraggio";

import { PersonAvatar } from "./person-avatar";

// Scheda "Monitoraggio personale": cruscotto di sola lettura, calcolato in
// tempo reale dalle schede delle persone (§1 della specifica). Nessun dato
// autonomo qui: ogni numero/cella arriva da
// GET /api/personale/monitoraggio/{riepilogo,matrice}. Escluse
// esplicitamente: Conoscenza, Competenza, Consapevolezza, Titoli di studio,
// Esperienze rilevanti, Note (§1).

const CELLA_TONO: Record<StatoCellaMonitoraggio, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  VALIDO: "success",
  IN_SCADENZA: "warning",
  INCOMPLETO: "warning",
  SCADUTO: "destructive",
  PIANIFICATO: "default",
  NESSUN_DATO: "secondary",
};

const STATO_COMPLESSIVO_LABEL: Record<StatoComplessivoPersona, string> = {
  REGOLARE: "Regolare",
  IN_ATTENZIONE: "In attenzione",
  DA_GESTIRE: "Da gestire",
  NESSUN_DATO: "Nessun dato",
};

const STATO_COMPLESSIVO_TONO: Record<StatoComplessivoPersona, "success" | "warning" | "destructive" | "secondary"> = {
  REGOLARE: "success",
  IN_ATTENZIONE: "warning",
  DA_GESTIRE: "destructive",
  NESSUN_DATO: "secondary",
};

type Filtri = {
  q: string;
  repartoId: string;
  mansioneId: string;
  statoComplessivo: string;
  statoCella: string;
  soloAnomalie: boolean;
};

const FILTRI_VUOTI: Filtri = { q: "", repartoId: "", mansioneId: "", statoComplessivo: "", statoCella: "", soloAnomalie: false };

function queryMatrice(filtri: Filtri, page: number, pageSize: number): string {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filtri.q) params.set("q", filtri.q);
  if (filtri.repartoId) params.set("reparto_id", filtri.repartoId);
  if (filtri.mansioneId) params.set("mansione_id", filtri.mansioneId);
  if (filtri.statoComplessivo) params.set("stato_complessivo", filtri.statoComplessivo);
  if (filtri.statoCella) params.set("stato_cella", filtri.statoCella);
  if (filtri.soloAnomalie) params.set("solo_anomalie", "true");
  return params.toString();
}

function IndicatoreCard({
  valore,
  label,
  tono,
  onClick,
}: {
  valore: number;
  label: string;
  tono: "success" | "warning" | "destructive" | "default" | "secondary";
  onClick?: () => void;
}) {
  const coloreTesto =
    tono === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tono === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tono === "destructive"
          ? "text-destructive"
          : tono === "default"
            ? "text-primary"
            : "text-muted-foreground";
  const conteudo = (
    <>
      <span className={`text-2xl font-semibold ${coloreTesto}`}>{valore}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </>
  );
  if (!onClick) {
    return <div className="flex flex-col gap-1 rounded-lg border border-border p-3">{conteudo}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Apri il dettaglio"
      className="flex flex-col gap-1 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50"
    >
      {conteudo}
    </button>
  );
}

function CellaBottone({ cella, onClick }: { cella: CellaMonitoraggio; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={cella.dettaglio}
      className="inline-flex items-center gap-1.5 text-sm hover:underline"
    >
      <Badge variant={CELLA_TONO[cella.stato]}>{cella.etichetta}</Badge>
    </button>
  );
}

function RigaTabella({
  riga,
  mostraStatoComplessivo,
  onApriPersona,
}: {
  riga: MonitoraggioRiga;
  mostraStatoComplessivo: boolean;
  onApriPersona: (personaId: string, tab: string, focus?: string) => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <button
          type="button"
          onClick={() => onApriPersona(riga.persona_id, "overview")}
          className="flex items-center gap-2 text-left hover:underline"
        >
          <PersonAvatar nome={riga.nome} cognome={riga.cognome} />
          <span className="font-medium">
            {riga.nome} {riga.cognome}
          </span>
        </button>
      </td>
      <td className="p-3">
        <div className="flex flex-col text-sm">
          <span>{riga.mansione?.denominazione ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{riga.reparto?.denominazione ?? "—"}</span>
        </div>
      </td>
      <td className="p-3">
        <CellaBottone cella={riga.formazione} onClick={() => onApriPersona(riga.persona_id, "training")} />
      </td>
      <td className="p-3">
        <CellaBottone cella={riga.idoneita} onClick={() => onApriPersona(riga.persona_id, "health")} />
      </td>
      <td className="p-3">
        <CellaBottone cella={riga.ruoli} onClick={() => onApriPersona(riga.persona_id, "roles")} />
      </td>
      <td className="p-3">
        <CellaBottone cella={riga.documenti} onClick={() => onApriPersona(riga.persona_id, "profile", "documenti")} />
      </td>
      <td className="p-3">
        <span className={riga.prossima_data ? "" : "text-muted-foreground"} title={riga.prossima_data_origine ?? undefined}>
          {formatDate(riga.prossima_data)}
        </span>
      </td>
      {mostraStatoComplessivo && (
        <td className="p-3">
          <Badge variant={STATO_COMPLESSIVO_TONO[riga.stato_complessivo]}>{STATO_COMPLESSIVO_LABEL[riga.stato_complessivo]}</Badge>
        </td>
      )}
    </tr>
  );
}

function Toolbar({
  filtri,
  onFiltriChange,
  mansioni,
  reparti,
  mostraStato,
}: {
  filtri: Filtri;
  onFiltriChange: (f: Filtri) => void;
  mansioni: CatalogoVoce[];
  reparti: CatalogoVoce[];
  mostraStato: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={filtri.q}
        onChange={(e) => onFiltriChange({ ...filtri, q: e.target.value })}
        placeholder="Cerca per nome, mansione o reparto..."
        className="h-9 max-w-xs text-sm"
      />
      <Select value={filtri.repartoId || "TUTTI"} onValueChange={(v) => onFiltriChange({ ...filtri, repartoId: v === "TUTTI" ? "" : v })}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TUTTI">Reparto: Tutti</SelectItem>
          {reparti.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.denominazione}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filtri.mansioneId || "TUTTE"} onValueChange={(v) => onFiltriChange({ ...filtri, mansioneId: v === "TUTTE" ? "" : v })}>
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TUTTE">Mansione: Tutte</SelectItem>
          {mansioni.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.denominazione}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mostraStato && (
        <Select
          value={filtri.statoComplessivo || "TUTTI"}
          onValueChange={(v) => onFiltriChange({ ...filtri, statoComplessivo: v === "TUTTI" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TUTTI">Stato: Tutti</SelectItem>
            <SelectItem value="REGOLARE">Regolare</SelectItem>
            <SelectItem value="IN_ATTENZIONE">In attenzione</SelectItem>
            <SelectItem value="DA_GESTIRE">Da gestire</SelectItem>
            <SelectItem value="NESSUN_DATO">Nessun dato</SelectItem>
          </SelectContent>
        </Select>
      )}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch checked={filtri.soloAnomalie} onCheckedChange={(v) => onFiltriChange({ ...filtri, soloAnomalie: v })} />
        Solo anomalie
      </label>
      {filtri.statoCella && (
        <Badge variant="outline" className="cursor-pointer" onClick={() => onFiltriChange({ ...filtri, statoCella: "" })}>
          Filtro indicatore attivo · rimuovi ✕
        </Badge>
      )}
    </div>
  );
}

function Intestazione(props: { mostraStatoComplessivo: boolean }) {
  return (
    <thead>
      <tr className="border-b border-border text-left text-muted-foreground">
        <th className="p-3 font-medium">Persona</th>
        <th className="p-3 font-medium">Mansione / reparto</th>
        <th className="p-3 font-medium">Formazione e abilitazioni</th>
        <th className="p-3 font-medium">Idoneità</th>
        <th className="p-3 font-medium">Ruoli</th>
        <th className="p-3 font-medium">Documenti</th>
        <th className="p-3 font-medium">Prossima data</th>
        {props.mostraStatoComplessivo && <th className="p-3 font-medium">Stato complessivo</th>}
      </tr>
    </thead>
  );
}

export function MonitoraggioPersonale({ mansioni, reparti }: { mansioni: CatalogoVoce[]; reparti: CatalogoVoce[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const [riepilogo, setRiepilogo] = useState<RiepilogoMonitoraggio | null>(null);
  const [erroreRiepilogo, setErroreRiepilogo] = useState<string | null>(null);

  const [filtri, setFiltri] = useState<Filtri>(FILTRI_VUOTI);
  const [pagina, setPagina] = useState<PaginaMonitoraggio | null>(null);
  const [erroreMatrice, setErroreMatrice] = useState<string | null>(null);

  const [dettagliataAperta, setDettagliataAperta] = useState(false);
  const [filtriDettagliata, setFiltriDettagliata] = useState<Filtri>(FILTRI_VUOTI);
  const [paginaDettagliata, setPaginaDettagliata] = useState(1);
  const [datiDettagliata, setDatiDettagliata] = useState<PaginaMonitoraggio | null>(null);

  useEffect(() => {
    getApiResource<RiepilogoMonitoraggio>("/api/personale/monitoraggio/riepilogo")
      .then(setRiepilogo)
      .catch(() => setErroreRiepilogo("Impossibile caricare gli indicatori."));
  }, []);

  useEffect(() => {
    setErroreMatrice(null);
    getApiResource<PaginaMonitoraggio>(`/api/personale/monitoraggio/matrice?${queryMatrice(filtri, 1, 5)}`)
      .then(setPagina)
      .catch(() => setErroreMatrice("Impossibile caricare il quadro generale del personale."));
  }, [filtri]);

  useEffect(() => {
    if (!dettagliataAperta) return;
    getApiResource<PaginaMonitoraggio>(`/api/personale/monitoraggio/matrice?${queryMatrice(filtriDettagliata, paginaDettagliata, 20)}`).then(
      setDatiDettagliata,
    );
  }, [dettagliataAperta, filtriDettagliata, paginaDettagliata]);

  function apriPersona(personaId: string, tab: string, focus?: string) {
    const params = new URLSearchParams({ view: "people", personId: personaId, tab });
    if (focus) params.set("focus", focus);
    router.push(`${pathname}?${params.toString()}`);
  }

  function apriDettagliata() {
    setFiltriDettagliata(filtri);
    setPaginaDettagliata(1);
    setDettagliataAperta(true);
  }

  function filtraPerIndicatore(statoCella: string) {
    setFiltri({ ...FILTRI_VUOTI, statoCella });
  }

  if (erroreRiepilogo) {
    return <p className="text-sm text-destructive">{erroreRiepilogo}</p>;
  }
  if (!riepilogo) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>;
  }

  const { indicatori, conformita } = riepilogo;
  const totaleDettagliata = datiDettagliata ? Math.max(1, Math.ceil(datiDettagliata.total / datiDettagliata.page_size)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Situazione calcolata al {formatDate(indicatori.calcolato_al)}</strong> · sono considerate
        soltanto registrazioni, evidenze e date presenti in piattaforma. Non rappresenta una valutazione normativa o legale della
        persona.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <IndicatoreCard valore={indicatori.persone_attive} label="Persone attive" tono="success" onClick={() => setFiltri(FILTRI_VUOTI)} />
        <IndicatoreCard
          valore={indicatori.registrazioni_valide}
          label="Registrazioni valide"
          tono="success"
          onClick={() => filtraPerIndicatore("VALIDO")}
        />
        <IndicatoreCard valore={indicatori.in_scadenza} label="In scadenza" tono="warning" onClick={() => filtraPerIndicatore("IN_SCADENZA")} />
        <IndicatoreCard valore={indicatori.scadute} label="Scadute" tono="destructive" onClick={() => filtraPerIndicatore("SCADUTO")} />
        <IndicatoreCard
          valore={indicatori.registrazioni_incomplete}
          label="Registrazioni incomplete"
          tono="warning"
          onClick={() => filtraPerIndicatore("INCOMPLETO")}
        />
        <IndicatoreCard
          valore={indicatori.attivita_pianificate}
          label="Attività pianificate"
          tono="default"
          onClick={() => filtraPerIndicatore("PIANIFICATO")}
        />
      </div>

      <section className="flex items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-col items-center justify-center rounded-full border-4 border-emerald-500/40 px-4 py-3">
          <strong className="text-xl text-foreground">{conformita.percentuale_regolari}%</strong>
          <span className="text-[11px] text-muted-foreground">regolari</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Conformità complessiva del personale</h3>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              {conformita.persone_regolari} persone su {conformita.totale_persone_attive}
            </strong>{" "}
            non presentano registrazioni scadute o incomplete negli elementi monitorati.
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center justify-between gap-3">
            <Badge variant="success">Regolari</Badge>
            <strong>{conformita.distribuzione.regolari}</strong>
          </span>
          <span className="flex items-center justify-between gap-3">
            <Badge variant="warning">In attenzione</Badge>
            <strong>{conformita.distribuzione.in_attenzione}</strong>
          </span>
          <span className="flex items-center justify-between gap-3">
            <Badge variant="destructive">Da gestire</Badge>
            <strong>{conformita.distribuzione.da_gestire}</strong>
          </span>
          <span className="flex items-center justify-between gap-3">
            <Badge variant="secondary">Nessun dato</Badge>
            <strong>{conformita.distribuzione.nessun_dato}</strong>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quadro generale del personale</h3>
            <p className="text-xs text-muted-foreground">La matrice riepiloga esclusivamente dati già registrati; il grigio non indica una mancanza</p>
          </div>
          <Button variant="outline" size="sm" onClick={apriDettagliata}>
            Vista dettagliata
          </Button>
        </div>

        <Toolbar filtri={filtri} onFiltriChange={setFiltri} mansioni={mansioni} reparti={reparti} mostraStato={false} />

        {erroreMatrice && <p className="text-sm text-destructive">{erroreMatrice}</p>}
        {!erroreMatrice && !pagina && <p className="text-sm text-muted-foreground">Caricamento…</p>}
        {pagina && (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <Intestazione mostraStatoComplessivo={false} />
              <tbody>
                {pagina.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Nessuna persona corrisponde ai filtri selezionati.
                    </td>
                  </tr>
                ) : (
                  pagina.items.map((riga) => (
                    <RigaTabella key={riga.persona_id} riga={riga} mostraStatoComplessivo={false} onApriPersona={apriPersona} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {pagina && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {pagina.items.length === 0 ? 0 : 1}–{pagina.items.length} di {pagina.total} persone
            </span>
            <span>Legenda: Valido · In scadenza · Scaduto · Incompleto · Pianificato · Nessun dato — seleziona una cella per aprire le registrazioni.</span>
          </div>
        )}
      </section>

      <Dialog open={dettagliataAperta} onOpenChange={setDettagliataAperta}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista dettagliata del personale</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Quadro trasversale delle registrazioni presenti al {formatDate(indicatori.calcolato_al)}.
          </p>
          <Toolbar filtri={filtriDettagliata} onFiltriChange={(f) => { setFiltriDettagliata(f); setPaginaDettagliata(1); }} mansioni={mansioni} reparti={reparti} mostraStato />
          {!datiDettagliata ? (
            <p className="text-sm text-muted-foreground">Caricamento…</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <Intestazione mostraStatoComplessivo />
                  <tbody>
                    {datiDettagliata.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          Nessuna persona corrisponde ai filtri selezionati.
                        </td>
                      </tr>
                    ) : (
                      datiDettagliata.items.map((riga) => (
                        <RigaTabella
                          key={riga.persona_id}
                          riga={riga}
                          mostraStatoComplessivo
                          onApriPersona={(id, tab, focus) => {
                            setDettagliataAperta(false);
                            apriPersona(id, tab, focus);
                          }}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Pagina {datiDettagliata.page} di {totaleDettagliata} · {datiDettagliata.total} persone
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={paginaDettagliata <= 1} onClick={() => setPaginaDettagliata((p) => p - 1)}>
                    Precedente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaDettagliata >= totaleDettagliata}
                    onClick={() => setPaginaDettagliata((p) => p + 1)}
                  >
                    Successiva
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
