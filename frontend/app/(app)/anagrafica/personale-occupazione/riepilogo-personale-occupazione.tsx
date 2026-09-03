"use client";

import { PencilIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { useWorkspace } from "@/components/registro/workspace-provider";
import { getApiResource } from "@/lib/actions/api-resource";
import { formatDate } from "@/lib/format";
import { etichettaPeriodo, formatPercentualeVisiva, numeroPersone as numero } from "@/lib/personale-occupazione-format";
import type { AddettiVisura, GruppoCalcolato, PersonaleOccupazioneRiepilogo } from "@/lib/types/anagrafica";
import { cn } from "@/lib/utils";

import { AddettiVisuraDialog } from "../addetti-visura/addetti-visura-dialog";
import { getRiepilogoPersonaleOccupazione } from "./actions";

type Stato =
  | { fase: "loading" }
  | { fase: "error" }
  | {
      fase: "ok";
      riepilogo: PersonaleOccupazioneRiepilogo;
      rilevazione: AddettiVisura | null;
    };

/** Anello con contenuto libero al centro (§ Correzione 22 punto 16:
 * "indicatore circolare"): stessa classe CSS di `CompletenessRing`
 * (registro-theme.css), qui senza il suffisso "%" fisso perché alcune card
 * mostrano un numero di persone, non una percentuale. */
function AnelloIndicatore({
  percentuale: pct,
  tone = "blue",
  size = 84,
  children,
}: {
  percentuale: number;
  tone?: "blue" | "green";
  size?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("az-progress-ring shrink-0", tone === "green" && "az-progress-ring--green")}
      style={{ width: size, height: size, "--az-progress": `${Math.max(0, Math.min(100, pct)) * 3.6}deg` } as CSSProperties}
    >
      <span className="az-progress-ring__inner text-base font-extrabold text-[var(--az-ink)]">{children}</span>
    </div>
  );
}

function CardGrafica({
  titolo,
  ring,
  descrizione,
  className,
}: {
  titolo: string;
  ring: ReactNode;
  descrizione: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col gap-3.5 rounded-[9px] border border-[var(--az-border)] bg-white p-4", className)}>
      <span className="min-w-0 text-xs font-bold text-[var(--az-ink)]">{titolo}</span>
      <div className="flex flex-1 items-center gap-4">
        {ring}
        <div className="min-w-0 flex-1 text-xs leading-snug text-[var(--az-muted)]">{descrizione}</div>
      </div>
    </div>
  );
}

function CampoLettura({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full min-h-[58px] flex-col justify-center gap-1 rounded-md border border-[var(--az-border)] bg-white px-3.5 py-2.5">
      <span className="text-[10px] font-semibold text-[var(--az-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--az-ink)]">{value}</span>
    </div>
  );
}

/** Titolo di gruppo per le card quantitative (§ correzione grafica): meno
 * evidente del titolo di sezione "Rilevazione più recente", con un breve
 * divisore superiore per i gruppi successivi al primo — solo titolo +
 * spaziatura + griglia indipendente, mai una card avvolgente. */
function GruppoCard({
  titolo,
  primo = false,
  gridClassName,
  children,
}: {
  titolo: string;
  primo?: boolean;
  gridClassName: string;
  children: ReactNode;
}) {
  return (
    <div className={!primo ? "border-t border-[var(--az-border)] pt-6" : undefined}>
      <h4 className="mb-3 text-[11px] font-bold tracking-wide text-[var(--az-ink-soft)] uppercase">{titolo}</h4>
      <div className={cn("grid gap-3", gridClassName)}>{children}</div>
    </div>
  );
}

/** Riepilogo della rilevazione più recente di "Personale e occupazione" (§
 * Correzione 22, corretta più volte su richiesta esplicita dell'utente):
 * sola presentazione sopra i dati già scritti dal dialog "Addetti da
 * visura" — l'edizione vera e propria riusa quello stesso dialog (nessun
 * form parallelo, § punto 25). "Addetti da visura" e "Addetti per comune"
 * sono state messe insieme: il comune eventualmente collegato a una
 * rilevazione viaggia annidato in `AddettiVisura.comune` e si edita dallo
 * stesso "Modifica sezione", non più un dialog/pulsante separato.
 *
 * Anno di rilevazione/Periodo/Data/Fonte sono "esterni al form": un'unica
 * intestazione sempre visibile, mai trasformata in card grafica e mai legata
 * allo stato di conferma. Una volta che una rilevazione esiste (il form è
 * stato compilato), i dati quantitativi sono sempre rappresentati tramite
 * grafici, in sequenza — personale poi territorio — senza alcun indicatore
 * di stato: le card sono puramente presentazionali (§ "leva gli indicatori
 * di stato dalle card dei grafici"), nessun punto di verifica dedicato in
 * questa vista per ora. Lo storico delle rilevazioni precedenti vive nel
 * componente dedicato sotto (§ storico-rilevazioni.tsx), che distingue
 * esplicitamente le fotografie precedenti da questa e non viene mai
 * toccato da qui.
 *
 * `editing` arriva da `PersonaleOccupazionePanel` (§ banner in fondo alla
 * sezione, richiesto per uniformità con le altre card CCIAA): "Modifica
 * sezione" compare solo quando la sezione è in modalità modifica, mai un
 * toggle locale — stessa convenzione delle tabelle a registro altrove nel
 * progetto. */
export function RiepilogoPersonaleOccupazione({
  editing,
  stackedMode = false,
}: {
  editing: boolean;
  // § Correzione 27/28 ("Dati camerali completi" > elimina le righe di
  // separazione interne, tranne le 9 che separano le card impilate): vero
  // solo quando questa card è impilata lì (passato da
  // `PersonaleOccupazionePanel` come lo stesso `hideBanner` che riceve da
  // `CciaaSectionPanel`) — elimina il border-b di questa sezione, altrimenti
  // visibile subito sopra "Storico rilevazioni" sotto.
  stackedMode?: boolean;
}) {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [stato, setStato] = useState<Stato>({ fase: "loading" });
  const [dialogoRilevazione, setDialogoRilevazione] = useState(false);
  const [dialogoNuova, setDialogoNuova] = useState(false);

  const carica = useCallback(() => {
    setStato({ fase: "loading" });
    Promise.all([getRiepilogoPersonaleOccupazione(), getApiResource<AddettiVisura[]>("/api/anagrafica/addetti-visura")])
      .then(([riepilogo, rilevazioni]) => {
        setStato({
          fase: "ok",
          riepilogo,
          rilevazione: rilevazioni.find((r) => r.id === riepilogo.rilevazione_id) ?? null,
        });
      })
      .catch(() => setStato({ fase: "error" }));
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  if (stato.fase === "loading") {
    return (
      <section className={cn("py-6", !stackedMode && "border-b border-[var(--az-border)]")}>
        <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="az-skeleton h-9 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (stato.fase === "error") {
    return (
      <section className={cn("py-6", !stackedMode && "border-b border-[var(--az-border)]")}>
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>Impossibile caricare il riepilogo della rilevazione più recente.</span>
          <button type="button" onClick={carica} className="font-semibold underline">
            Riprova
          </button>
        </div>
      </section>
    );
  }

  const { riepilogo, rilevazione } = stato;

  if (!riepilogo.rilevazione_id) {
    return (
      <section className={cn("py-6", !stackedMode && "border-b border-[var(--az-border)]")}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-[var(--az-ink)]">Rilevazione più recente</h3>
          {consulente && (
            <button
              type="button"
              onClick={() => setDialogoNuova(true)}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
            >
              <PlusIcon className="size-3.5" />
              Nuova rilevazione
            </button>
          )}
        </div>
        <p className="text-sm text-[var(--az-muted)]">Nessuna rilevazione ancora registrata.</p>

        {consulente && (
          <AddettiVisuraDialog
            open={dialogoNuova}
            onOpenChange={setDialogoNuova}
            onSaved={carica}
            trigger={<span className="hidden" />}
          />
        )}
      </section>
    );
  }

  const ambitoTerritoriale =
    [riepilogo.territorio.comune, riepilogo.territorio.provincia].filter(Boolean).join(" (") +
    (riepilogo.territorio.provincia ? ")" : "");
  const haTerritorio = riepilogo.territorio.comune !== null;

  return (
    <section className={cn("py-6", !stackedMode && "border-b border-[var(--az-border)]")}>
      {/* § nessun indicatore di stato in questa vista: né accanto al
          titolo né sulle card grafiche (§ "leva gli indicatori di stato
          dalle card dei grafici") — le card sono puramente presentazionali.
          "+ Nuova rilevazione" è sempre visibile per il Consulente (non
          solo in modalità modifica); "Modifica sezione" resta invece
          riservato alla modalità modifica. */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="min-w-0 text-[15px] font-bold text-[var(--az-ink)]">Rilevazione più recente</h3>
        <div className="flex shrink-0 items-center gap-3">
          {consulente && (
            <button
              type="button"
              onClick={() => setDialogoNuova(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
            >
              <PlusIcon className="size-3.5" />
              Nuova rilevazione
            </button>
          )}
          {consulente && editing && rilevazione && (
            <button
              type="button"
              onClick={() => setDialogoRilevazione(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
            >
              <PencilIcon className="size-3.5" />
              Modifica sezione
            </button>
          )}
        </div>
      </div>

      {/* § Anno di rilevazione/Periodo/Data/Fonte sono "esterni al form":
          intestazione fissa, mai una card grafica, indipendente dallo stato
          di conferma — griglia 2×2 (§ correzione grafica), mai 4 in riga. */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <CampoLettura label="Anno di rilevazione" value={riepilogo.anno_riferimento?.toString() ?? "—"} />
        <CampoLettura label="Periodo" value={etichettaPeriodo(riepilogo.periodo)} />
        <CampoLettura label="Data di rilevazione" value={formatDate(riepilogo.data_rilevazione)} />
        <CampoLettura label="Fonte" value={riepilogo.fonte ?? "—"} />
      </div>

      <div className="flex flex-col gap-6">
        <GruppoCard titolo="Consistenza del personale" primo gridClassName="grid-cols-2">
          <CardGrafica
            titolo="Addetti totali"
            ring={
              <AnelloIndicatore percentuale={100} size={88}>
                {numero(riepilogo.addetti_totali)}
              </AnelloIndicatore>
            }
            descrizione="Totale degli addetti rilevati"
          />
          <CardGrafica
            titolo="Dipendenti"
            ring={
              <AnelloIndicatore
                percentuale={
                  riepilogo.addetti_totali && riepilogo.dipendenti !== null
                    ? (riepilogo.dipendenti / riepilogo.addetti_totali) * 100
                    : 0
                }
                size={88}
              >
                {numero(riepilogo.dipendenti)}
              </AnelloIndicatore>
            }
            descrizione={
              riepilogo.addetti_totali
                ? `${numero(riepilogo.dipendenti)} su ${numero(riepilogo.addetti_totali)} addetti totali`
                : "Base di calcolo non disponibile"
            }
          />
          <CardGrafica
            titolo="Indipendenti"
            ring={
              <AnelloIndicatore
                percentuale={
                  riepilogo.addetti_totali && riepilogo.indipendenti !== null
                    ? (riepilogo.indipendenti / riepilogo.addetti_totali) * 100
                    : 0
                }
                size={88}
              >
                {numero(riepilogo.indipendenti)}
              </AnelloIndicatore>
            }
            descrizione={
              riepilogo.addetti_totali
                ? `${numero(riepilogo.indipendenti)} su ${numero(riepilogo.addetti_totali)} addetti totali`
                : "Base di calcolo non disponibile"
            }
          />
          <CardGrafica
            titolo="Collaboratori"
            ring={
              <AnelloIndicatore
                percentuale={
                  riepilogo.addetti_totali && riepilogo.collaboratori !== null
                    ? (riepilogo.collaboratori / riepilogo.addetti_totali) * 100
                    : 0
                }
                size={88}
              >
                {numero(riepilogo.collaboratori)}
              </AnelloIndicatore>
            }
            descrizione={
              riepilogo.addetti_totali
                ? `${numero(riepilogo.collaboratori)} su ${numero(riepilogo.addetti_totali)} addetti totali`
                : "Base di calcolo non disponibile"
            }
          />
        </GruppoCard>

        <GruppoCard titolo="Distribuzione per tipologia contrattuale" gridClassName="grid-cols-2">
          {(
            [
              ["Tempo determinato", "tempo_determinato", riepilogo.tipologia_contrattuale],
              ["Tempo indeterminato", "tempo_indeterminato", riepilogo.tipologia_contrattuale],
            ] as [string, string, GruppoCalcolato][]
          ).map(([titolo, chiave, gruppo]) => {
            const pct = gruppo.percentuali[chiave];
            const num = gruppo.numeri[chiave];
            return (
              <CardGrafica
                key={chiave}
                titolo={titolo}
                ring={
                  <AnelloIndicatore percentuale={pct ? Number(pct) : 0} size={88}>
                    {formatPercentualeVisiva(pct)}
                  </AnelloIndicatore>
                }
                descrizione={
                  num !== null && riepilogo.dipendenti !== null
                    ? `${numero(num)} persone su ${numero(riepilogo.dipendenti)} dipendenti`
                    : (gruppo.messaggio ?? "Dato non disponibile")
                }
              />
            );
          })}
        </GruppoCard>

        <GruppoCard titolo="Distribuzione per orario di lavoro" gridClassName="grid-cols-2">
          {(
            [
              ["Tempo pieno", "tempo_pieno", riepilogo.orario_lavoro],
              ["Tempo parziale", "tempo_parziale", riepilogo.orario_lavoro],
            ] as [string, string, GruppoCalcolato][]
          ).map(([titolo, chiave, gruppo]) => {
            const pct = gruppo.percentuali[chiave];
            const num = gruppo.numeri[chiave];
            return (
              <CardGrafica
                key={chiave}
                titolo={titolo}
                ring={
                  <AnelloIndicatore percentuale={pct ? Number(pct) : 0} size={88}>
                    {formatPercentualeVisiva(pct)}
                  </AnelloIndicatore>
                }
                descrizione={
                  num !== null && riepilogo.dipendenti !== null
                    ? `${numero(num)} persone su ${numero(riepilogo.dipendenti)} dipendenti`
                    : (gruppo.messaggio ?? "Dato non disponibile")
                }
              />
            );
          })}
        </GruppoCard>

        <GruppoCard titolo="Distribuzione per inquadramento" gridClassName="grid-cols-2 sm:grid-cols-3">
          {(
            [
              ["Apprendisti", "apprendisti"],
              ["Operai", "operai"],
              ["Impiegati", "impiegati"],
            ] as [string, string][]
          ).map(([titolo, chiave], indice) => {
            const gruppo = riepilogo.inquadramento;
            const pct = gruppo.percentuali[chiave];
            const num = gruppo.numeri[chiave];
            return (
              <CardGrafica
                key={chiave}
                titolo={titolo}
                // § Impiegati (3° elemento) non deve restare isolato con
                // spazio vuoto accanto: occupa l'intera riga sotto le prime
                // due finché non c'è spazio per 3 colonne uguali.
                className={indice === 2 ? "col-span-2 sm:col-span-1" : undefined}
                ring={
                  <AnelloIndicatore percentuale={pct ? Number(pct) : 0} size={88}>
                    {formatPercentualeVisiva(pct)}
                  </AnelloIndicatore>
                }
                descrizione={
                  num !== null && riepilogo.dipendenti !== null
                    ? `${numero(num)} persone su ${numero(riepilogo.dipendenti)} dipendenti`
                    : (gruppo.messaggio ?? "Dato non disponibile")
                }
              />
            );
          })}
        </GruppoCard>

        {haTerritorio && (
          <div className="flex flex-col gap-3">
            {/* § "Addetti da visura" e "Addetti per comune" messe insieme:
                niente pulsante "Modifica" proprio qui — il dato territoriale
                si edita dallo stesso "Modifica sezione" in cima, che apre lo
                stesso AddettiVisuraDialog con il blocco territoriale in
                fondo (nessun form parallelo). */}
            <span className="text-xs font-bold text-[var(--az-ink)]">Distribuzione territoriale</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CardGrafica
                titolo="Totale nel comune"
                ring={
                  <AnelloIndicatore percentuale={100} size={88}>
                    {numero(riepilogo.territorio.addetti_totali_nel_comune)}
                  </AnelloIndicatore>
                }
                descrizione={ambitoTerritoriale || "Ambito territoriale non indicato"}
              />
              <CardGrafica
                titolo="Dipendenti nel comune"
                ring={
                  <AnelloIndicatore
                    percentuale={
                      riepilogo.territorio.percentuale_dipendenti_nel_comune
                        ? Number(riepilogo.territorio.percentuale_dipendenti_nel_comune)
                        : 0
                    }
                    size={88}
                  >
                    {numero(riepilogo.territorio.dipendenti_nel_comune)}
                  </AnelloIndicatore>
                }
                descrizione={
                  riepilogo.territorio.percentuale_dipendenti_nel_comune
                    ? `${riepilogo.territorio.percentuale_dipendenti_nel_comune}% del totale nel comune`
                    : "Percentuale non calcolabile"
                }
              />
              <CardGrafica
                titolo="Indipendenti nel comune"
                ring={
                  <AnelloIndicatore
                    percentuale={
                      riepilogo.territorio.percentuale_indipendenti_nel_comune
                        ? Number(riepilogo.territorio.percentuale_indipendenti_nel_comune)
                        : 0
                    }
                    size={88}
                  >
                    {numero(riepilogo.territorio.indipendenti_nel_comune)}
                  </AnelloIndicatore>
                }
                descrizione={
                  riepilogo.territorio.percentuale_indipendenti_nel_comune
                    ? `${riepilogo.territorio.percentuale_indipendenti_nel_comune}% del totale nel comune`
                    : "Percentuale non calcolabile"
                }
              />
            </div>
          </div>
        )}
      </div>

      {rilevazione && (
        <AddettiVisuraDialog
          dati={rilevazione}
          open={dialogoRilevazione}
          onOpenChange={setDialogoRilevazione}
          onSaved={carica}
          trigger={<span className="hidden" />}
        />
      )}
      {consulente && (
        <AddettiVisuraDialog
          open={dialogoNuova}
          onOpenChange={setDialogoNuova}
          onSaved={carica}
          trigger={<span className="hidden" />}
        />
      )}
    </section>
  );
}
