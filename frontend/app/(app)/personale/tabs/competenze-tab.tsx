"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDate } from "@/lib/format";
import { getApiResource } from "@/lib/actions/api-resource";
import type {
  CatalogoVoce,
  CompetenzePersona,
  Conoscenza,
  Esperienza,
  LivelloValutazione,
  MacroareaCompetenze,
  MacroIndicatore,
  TitoloStudio,
} from "@/lib/types/personale-hr";

import { archiviaConoscenza, nascondiCompetenza, ripristinaCompetenza } from "../actions";
import { ConoscenzaDialog } from "../conoscenza-dialog";
import { EsperienzaDialog } from "../esperienza-dialog";
import { TitoloStudioDialog } from "../titolo-studio-dialog";
import { TitoloStudioVerifica } from "../titolo-studio-verifica";
import { ValutaIndicatoreDialog } from "../valuta-indicatore-dialog";
import { ValutaVociDialog } from "../valuta-voci-dialog";

const MACROAREA_LABEL: Record<MacroareaCompetenze, string> = {
  KNOWLEDGE: "Conoscenza",
  COMPETENCE: "Competenza",
  AWARENESS: "Consapevolezza",
};

const LIVELLO_LABEL: Record<LivelloValutazione, string> = {
  BASE: "Base",
  INTERMEDIO: "Intermedio",
  AVANZATO: "Avanzato",
};

const RILEVANZA_LABEL: Record<string, string> = {
  PROFESSIONALE: "Professionale",
  TECNICA: "Tecnica",
  ORGANIZZATIVA: "Organizzativa",
};

function livelloNumero(livello: LivelloValutazione | null): number {
  return livello === "AVANZATO" ? 3 : livello === "INTERMEDIO" ? 2 : livello === "BASE" ? 1 : 0;
}

function LivelloBars({ livello }: { livello: LivelloValutazione | null }) {
  const n = livelloNumero(livello);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-2 w-4 rounded-sm ${i <= n ? "bg-primary" : "bg-muted"}`} />
      ))}
    </span>
  );
}

/** Tab "Competenze" (specificazione "Costruzione completa della scheda
 * 'Competenze'"). Tre macro-indicatori valutabili in modo indipendente
 * dalle voci analitiche (§5), pannelli Conoscenza/Competenza mutuamente
 * esclusivi (§7), Titoli di studio ed Esperienze rilevanti come sezioni
 * indipendenti. Ogni sotto-sezione carica i propri dati al bisogno per
 * tenere il caricamento iniziale leggero (solo i macro-indicatori sono
 * sempre presenti). */
export function CompetenzeTab({ personaId }: { personaId: string }) {
  const [indicatori, setIndicatori] = useState<MacroIndicatore[] | null>(null);
  const [erroreIndicatori, setErroreIndicatori] = useState<string | null>(null);
  const [pannelloAperto, setPannelloAperto] = useState<"KNOWLEDGE" | "COMPETENCE" | null>(null);

  const [conoscenze, setConoscenze] = useState<Conoscenza[] | null>(null);
  const [competenze, setCompetenze] = useState<CompetenzePersona | null>(null);
  const [nascosteAperte, setNascosteAperte] = useState(false);

  const [catalogoTitoli, setCatalogoTitoli] = useState<CatalogoVoce[]>([]);
  const [titoli, setTitoli] = useState<TitoloStudio[] | null>(null);
  const [esperienze, setEsperienze] = useState<Esperienza[] | null>(null);
  const [esperienzeAperte, setEsperienzeAperte] = useState(false);

  function ricaricaIndicatori() {
    setErroreIndicatori(null);
    getApiResource<MacroIndicatore[]>(`/api/personale/persone/${personaId}/competenze/macro-indicatori`)
      .then(setIndicatori)
      .catch(() => setErroreIndicatori("Impossibile caricare i macro-indicatori."));
  }

  function ricaricaConoscenze() {
    getApiResource<Conoscenza[]>(`/api/personale/persone/${personaId}/conoscenze`).then(setConoscenze);
  }

  function ricaricaCompetenze() {
    getApiResource<CompetenzePersona>(`/api/personale/persone/${personaId}/competenze`).then(setCompetenze);
  }

  function ricaricaTitoli() {
    getApiResource<TitoloStudio[]>(`/api/personale/persone/${personaId}/titoli-studio`).then(setTitoli);
  }

  function ricaricaEsperienze() {
    getApiResource<Esperienza[]>(`/api/personale/persone/${personaId}/esperienze`).then(setEsperienze);
  }

  function ricaricaTutto() {
    ricaricaIndicatori();
    if (pannelloAperto === "KNOWLEDGE") ricaricaConoscenze();
    if (pannelloAperto === "COMPETENCE") ricaricaCompetenze();
  }

  useEffect(() => {
    setIndicatori(null);
    setConoscenze(null);
    setCompetenze(null);
    setTitoli(null);
    setEsperienze(null);
    setPannelloAperto(null);
    setNascosteAperte(false);
    setEsperienzeAperte(false);
    ricaricaIndicatori();
    getApiResource<CatalogoVoce[]>("/api/personale/catalogo-titoli-studio").then(setCatalogoTitoli);
    ricaricaTitoli();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  function togglePannello(macroarea: "KNOWLEDGE" | "COMPETENCE") {
    const prossimo = pannelloAperto === macroarea ? null : macroarea;
    setPannelloAperto(prossimo);
    if (prossimo === "KNOWLEDGE" && conoscenze === null) ricaricaConoscenze();
    if (prossimo === "COMPETENCE" && competenze === null) ricaricaCompetenze();
  }

  async function onNascondi(voceId: string) {
    await nascondiCompetenza(personaId, voceId, null);
    ricaricaTutto();
  }

  async function onRipristina(voceId: string) {
    await ripristinaCompetenza(personaId, voceId);
    ricaricaTutto();
  }

  async function onArchiviaConoscenza(id: string) {
    await archiviaConoscenza(id);
    ricaricaTutto();
  }

  if (erroreIndicatori) {
    return <p className="text-sm text-destructive">{erroreIndicatori}</p>;
  }

  if (indicatori === null) {
    return <p className="text-sm text-muted-foreground">Caricamento…</p>;
  }

  const conoscenzaIndicatore = indicatori.find((i) => i.macroarea === "KNOWLEDGE")!;
  const competenzaIndicatore = indicatori.find((i) => i.macroarea === "COMPETENCE")!;
  const consapevolezzaIndicatore = indicatori.find((i) => i.macroarea === "AWARENESS")!;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-foreground">Conoscenza, competenza e consapevolezza</h3>
        <p className="text-sm text-muted-foreground">
          La valutazione individuale distingue le conoscenze personali, le competenze richieste dai ruoli e il livello
          complessivo di consapevolezza.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MacroIndicatoreCard
          indicatore={conoscenzaIndicatore}
          espanso={pannelloAperto === "KNOWLEDGE"}
          onToggle={() => togglePannello("KNOWLEDGE")}
          personaId={personaId}
          onValutato={ricaricaIndicatori}
        />
        <MacroIndicatoreCard
          indicatore={competenzaIndicatore}
          espanso={pannelloAperto === "COMPETENCE"}
          onToggle={() => togglePannello("COMPETENCE")}
          personaId={personaId}
          onValutato={ricaricaIndicatori}
        />
        <MacroIndicatoreCard indicatore={consapevolezzaIndicatore} personaId={personaId} onValutato={ricaricaIndicatori} />
      </div>

      {pannelloAperto === "KNOWLEDGE" && (
        <PannelloConoscenza
          personaId={personaId}
          conoscenze={conoscenze}
          onRicarica={ricaricaTutto}
          onArchivia={onArchiviaConoscenza}
        />
      )}

      {pannelloAperto === "COMPETENCE" && (
        <PannelloCompetenza
          personaId={personaId}
          competenze={competenze}
          nascosteAperte={nascosteAperte}
          onToggleNascoste={() => setNascosteAperte((v) => !v)}
          onRicarica={ricaricaTutto}
          onNascondi={onNascondi}
          onRipristina={onRipristina}
        />
      )}

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Titoli di studio</h4>
            <p className="text-xs text-muted-foreground">Titoli dichiarati e relative evidenze documentali</p>
          </div>
          <TitoloStudioDialog
            personaId={personaId}
            catalogo={catalogoTitoli}
            onSaved={ricaricaTitoli}
            trigger={<Button size="sm">+ Aggiungi titolo</Button>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Titolo</th>
                <th className="p-3 font-medium">Indirizzo/specializzazione</th>
                <th className="p-3 font-medium">Istituto o ateneo</th>
                <th className="p-3 font-medium">Anno</th>
                <th className="p-3 font-medium">Documento</th>
                <th className="p-3 font-medium">Stato</th>
                <th className="p-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {titoli === null ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Caricamento…
                  </td>
                </tr>
              ) : titoli.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Nessun titolo di studio registrato.
                  </td>
                </tr>
              ) : (
                titoli.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{t.tipologia.denominazione}</td>
                    <td className="p-3">{t.indirizzo_specializzazione ?? "—"}</td>
                    <td className="p-3">{t.istituto ?? "—"}</td>
                    <td className="p-3">{t.anno ?? "—"}</td>
                    <td className="p-3">
                      {t.documento_presente ? (
                        <span className="text-primary">Presente</span>
                      ) : (
                        <span className="text-muted-foreground">Non allegato</span>
                      )}
                    </td>
                    <td className="p-3">
                      <TitoloStudioVerifica titolo={t} onDecided={ricaricaTitoli} />
                    </td>
                    <td className="p-3">
                      <TitoloStudioDialog
                        personaId={personaId}
                        catalogo={catalogoTitoli}
                        titolo={t}
                        onSaved={ricaricaTitoli}
                        trigger={
                          <Button variant="outline" size="sm">
                            Modifica
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Collapsible
        open={esperienzeAperte}
        onOpenChange={(v) => {
          setEsperienzeAperte(v);
          if (v && esperienze === null) ricaricaEsperienze();
        }}
        className="rounded-lg border border-border"
      >
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between p-3 text-left">
            <span className="text-sm font-semibold text-foreground">
              Esperienze rilevanti {esperienze !== null && <span className="font-normal text-muted-foreground">— {esperienze.length} esperienze registrate</span>}
            </span>
            <span className="text-xs text-muted-foreground">{esperienzeAperte ? "Nascondi" : "Mostra"}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-3">
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <EsperienzaDialog
                personaId={personaId}
                onSaved={ricaricaEsperienze}
                trigger={<Button size="sm">+ Aggiungi esperienza</Button>}
              />
            </div>
            {esperienze === null ? (
              <p className="text-sm text-muted-foreground">Caricamento…</p>
            ) : esperienze.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna esperienza rilevante registrata.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {esperienze.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.attivita_ruolo}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.organizzazione ?? "—"} · {formatDate(e.data_inizio)} – {e.data_fine ? formatDate(e.data_fine) : "Oggi"} ·{" "}
                        {RILEVANZA_LABEL[e.rilevanza]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={e.verificata ? "success" : "secondary"}>{e.verificata ? "Verificata" : "Dichiarata"}</Badge>
                      <EsperienzaDialog
                        personaId={personaId}
                        esperienza={e}
                        onSaved={ricaricaEsperienze}
                        trigger={
                          <Button variant="outline" size="sm">
                            Modifica
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function MacroIndicatoreCard({
  indicatore,
  espanso,
  onToggle,
  personaId,
  onValutato,
}: {
  indicatore: MacroIndicatore;
  espanso?: boolean;
  onToggle?: () => void;
  personaId: string;
  onValutato: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{MACROAREA_LABEL[indicatore.macroarea]}</span>
        <LivelloBars livello={indicatore.livello} />
      </div>
      <span className="text-lg font-semibold text-foreground">
        {indicatore.livello ? LIVELLO_LABEL[indicatore.livello] : "Da valutare"}
      </span>
      <span className="text-xs text-muted-foreground">
        {indicatore.data_valutazione ? `Valutato il ${formatDate(indicatore.data_valutazione)}` : "Nessuna valutazione registrata"}
      </span>
      {(indicatore.voci_attive !== null || indicatore.voci_nascoste !== null) && (
        <span className="text-xs text-muted-foreground">
          {indicatore.voci_attive ?? 0} voci attive
          {!!indicatore.voci_nascoste && ` · ${indicatore.voci_nascoste} nascoste`}
        </span>
      )}
      <div className="mt-1 flex gap-2">
        {onToggle && (
          <Button variant="outline" size="sm" onClick={onToggle}>
            {espanso ? "Chiudi" : "Apri"}
          </Button>
        )}
        <ValutaIndicatoreDialog
          personaId={personaId}
          macroarea={indicatore.macroarea}
          onSaved={onValutato}
          trigger={
            <Button size="sm" variant={onToggle ? "outline" : "default"}>
              Valuta
            </Button>
          }
        />
      </div>
    </div>
  );
}

function PannelloConoscenza({
  personaId,
  conoscenze,
  onRicarica,
  onArchivia,
}: {
  personaId: string;
  conoscenze: Conoscenza[] | null;
  onRicarica: () => void;
  onArchivia: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Conoscenza</h4>
          <p className="text-xs text-muted-foreground">Conoscenze personali della persona, non ereditate da altre fonti</p>
        </div>
        <div className="flex gap-2">
          {conoscenze && conoscenze.length > 0 && (
            <ValutaVociDialog
              personaId={personaId}
              tipo="conoscenze"
              voci={conoscenze.map((c) => ({ voce_id: c.id, nome: c.nome, livello_attuale: c.livello }))}
              onSaved={onRicarica}
              trigger={
                <Button size="sm" variant="outline">
                  Valuta conoscenze
                </Button>
              }
            />
          )}
          <ConoscenzaDialog personaId={personaId} onSaved={onRicarica} trigger={<Button size="sm">+ Aggiungi conoscenza</Button>} />
        </div>
      </div>

      {conoscenze === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Caricamento…</p>
      ) : conoscenze.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nessuna conoscenza personale registrata.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2 font-medium">Nome</th>
                <th className="p-2 font-medium">Descrizione</th>
                <th className="p-2 font-medium">Valutazione</th>
                <th className="p-2 font-medium">Ultimo aggiornamento</th>
                <th className="p-2 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {conoscenze.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-2 font-medium">{c.nome}</td>
                  <td className="p-2">{c.descrizione ?? "—"}</td>
                  <td className="p-2">
                    {c.livello ? <Badge variant="secondary">{LIVELLO_LABEL[c.livello]}</Badge> : <Badge variant="outline">Da valutare</Badge>}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {c.data_valutazione ? `${formatDate(c.data_valutazione)} · ${c.valutatore ?? "—"}` : "—"}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <ValutaVociDialog
                        personaId={personaId}
                        tipo="conoscenze"
                        voci={[{ voce_id: c.id, nome: c.nome, livello_attuale: c.livello }]}
                        onSaved={onRicarica}
                        trigger={
                          <Button variant="outline" size="sm">
                            Valuta
                          </Button>
                        }
                      />
                      <ConoscenzaDialog
                        personaId={personaId}
                        conoscenza={c}
                        onSaved={onRicarica}
                        trigger={
                          <Button variant="outline" size="sm">
                            Modifica
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="sm" onClick={() => onArchivia(c.id)}>
                        Rimuovi
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PannelloCompetenza({
  personaId,
  competenze,
  nascosteAperte,
  onToggleNascoste,
  onRicarica,
  onNascondi,
  onRipristina,
}: {
  personaId: string;
  competenze: CompetenzePersona | null;
  nascosteAperte: boolean;
  onToggleNascoste: () => void;
  onRicarica: () => void;
  onNascondi: (voceId: string) => void;
  onRipristina: (voceId: string) => void;
}) {
  const attive = competenze?.attive ?? [];
  const nascoste = competenze?.nascoste ?? [];

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Competenza</h4>
          <p className="text-xs text-muted-foreground">
            Competenze richieste dai mansionari dei ruoli attivi assegnati alla persona. Si aggiungono o modificano dal
            mansionario del ruolo.
          </p>
        </div>
        {attive.length > 0 && (
          <ValutaVociDialog
            personaId={personaId}
            tipo="competenze"
            voci={attive.map((c) => ({ voce_id: c.voce_id, nome: c.nome, livello_attuale: c.livello }))}
            onSaved={onRicarica}
            trigger={
              <Button size="sm" variant="outline">
                Valuta competenze
              </Button>
            }
          />
        )}
      </div>

      {competenze === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Caricamento…</p>
      ) : attive.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nessuna competenza derivata dai ruoli attivi.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2 font-medium">Nome</th>
                <th className="p-2 font-medium">Descrizione</th>
                <th className="p-2 font-medium">Ruoli di origine</th>
                <th className="p-2 font-medium">Valutazione</th>
                <th className="p-2 font-medium">Ultimo aggiornamento</th>
                <th className="p-2 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {attive.map((c) => (
                <tr key={c.voce_id} className="border-b border-border last:border-0">
                  <td className="p-2 font-medium">{c.nome}</td>
                  <td className="p-2">{c.descrizione ?? "—"}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {c.ruoli_origine.map((r) => (
                        <Badge key={r} variant="outline">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    {c.livello ? <Badge variant="secondary">{LIVELLO_LABEL[c.livello]}</Badge> : <Badge variant="outline">Da valutare</Badge>}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {c.data_valutazione ? `${formatDate(c.data_valutazione)} · ${c.valutatore ?? "—"}` : "—"}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <ValutaVociDialog
                        personaId={personaId}
                        tipo="competenze"
                        voci={[{ voce_id: c.voce_id, nome: c.nome, livello_attuale: c.livello }]}
                        onSaved={onRicarica}
                        trigger={
                          <Button variant="outline" size="sm">
                            Valuta
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="sm" onClick={() => onNascondi(c.voce_id)}>
                        Nascondi per questa persona
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Collapsible open={nascosteAperte} onOpenChange={onToggleNascoste} className="mt-3">
        <CollapsibleTrigger asChild>
          <button type="button" className="text-sm text-primary hover:underline">
            Competenze nascoste ({nascoste.length})
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 flex flex-col gap-2">
          {nascoste.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna competenza nascosta.</p>
          ) : (
            nascoste.map((c) => (
              <div key={c.voce_id} className="flex items-center justify-between rounded-md border border-border p-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.ruoli_origine.join(", ")}
                    {c.livello ? ` · ultima valutazione: ${LIVELLO_LABEL[c.livello]}` : ""}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onRipristina(c.voce_id)}>
                  Ripristina
                </Button>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
