"use client";

import { useEffect, type ReactNode } from "react";
import { Maximize2Icon, PanelRightIcon, SquareArrowOutUpRightIcon, XIcon } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CambioAssettoAffidatarioDialog } from "@/components/registro/cambio-assetto-affidatario-dialog";
import { CancellazioneConfigurazioneDialog } from "@/components/registro/cancellazione-configurazione-dialog";
import { CessazioneOrganoControlloDialog } from "@/components/registro/cessazione-organo-controllo-dialog";
import { DatiCameraliCompletiView } from "@/components/registro/dati-camerali-completi-view";
import { RiduzioneSindaciEffettiviDialog } from "@/components/registro/riduzione-sindaci-effettivi-dialog";
import { SectionOrCciaaPanel } from "@/components/registro/section-or-cciaa-panel";
import { UnsavedChangesDialog } from "@/components/registro/unsaved-changes-dialog";
import { isSectionDirty, useWorkspace } from "@/components/registro/workspace-provider";
import { TITOLO_VISTA_CCIAA } from "@/lib/cciaa-viste";
import { TITOLO_ELENCO_ISO9001 } from "@/lib/elenco-iso9001";
import { TITOLO_SEZIONE_REGISTRO } from "@/lib/registro-sezioni-meta";
import { cn } from "@/lib/utils";

const TITOLO_SEZIONE: Record<string, string> = {
  ...TITOLO_SEZIONE_REGISTRO,
  ...TITOLO_VISTA_CCIAA,
  ...TITOLO_ELENCO_ISO9001,
};

function ShellActionButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: typeof PanelRightIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#cedaf0] bg-white px-3 text-xs font-bold text-[var(--az-blue)] hover:bg-[#f6f9ff]"
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

/** Shell del workspace (§8 del prompt master): barra delle schede solo nella
 * scheda a tutta larghezza (§8.4 — mai nel semplice affiancamento home +
 * dettaglio), pannello temporaneo, scheda a tutta larghezza, affiancamento
 * 50/50. `children` è la Panoramica (Server Component già renderizzato): la
 * reflow reale in affiancamento (§8.5) è ottenuta con container query sui
 * suoi contenitori `@container`, non da uno stato client duplicato qui.
 *
 * Adattamento dichiarato rispetto al prototipo: qui l'affiancamento e la
 * scheda a tutta larghezza restano nel flusso della pagina (grid inline /
 * card quasi a piena altezza) invece di un pannello fisso in overlay a
 * 100vh, perché la piattaforma reale ha già una propria intestazione e
 * barra laterale fisse che un overlay a viewport pieno romperebbe. Stessi
 * comportamenti, stessi colori/spaziature/etichette del prototipo. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const {
    state,
    requestCloseDrawer,
    requestPromoteFull,
    requestPromoteSplit,
    requestCloseTab,
    activateTab,
    requestCloseSintesi,
    expandSintesi,
    collapseSintesi,
    requestCloseDatiCompleti,
  } = useWorkspace();

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      const sporca = Object.values(state.sections).some((entry) => isSectionDirty(entry));
      if (sporca) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.sections]);

  // § Correzione 25: quando la sintesi è a tutta larghezza deve restare
  // l'unico riquadro visibile (niente barra schede, niente elenco delle
  // sezioni affiancato) — vedi il blocco `state.sintesi.full` più sotto,
  // che sostituisce l'intero contenuto normale invece di affiancarlo.
  const mostraSchede = state.mode === "FULL" && state.tabs.length > 0 && !state.sintesi.full && !state.datiCompletiOpen;

  if (state.datiCompletiOpen) {
    // § Correzione 26 §15: pagina dedicata, sostituisce tutto il resto —
    // stesso principio del blocco `state.sintesi.full` qui sotto (unico
    // riquadro visibile), ma qui non c'è nulla "sotto" da poter riaprire
    // con un semplice toggle: la chiusura riporta sempre alla Panoramica.
    return (
      <div className="flex flex-col gap-4">
        <DatiCameraliCompletiView onClose={requestCloseDatiCompleti} />
        <UnsavedChangesDialog />
        <CessazioneOrganoControlloDialog />
        <RiduzioneSindaciEffettiviDialog />
        <CancellazioneConfigurazioneDialog />
        <CambioAssettoAffidatarioDialog />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mostraSchede && (
        <nav className="-mt-2 flex items-stretch border-b border-[#cbd6eb]" aria-label="Schede anagrafica aperte">
          <button
            type="button"
            onClick={() => activateTab("overview")}
            className={cn(
              "border-r border-[#cbd6eb] px-6 text-[15px] text-[#111837] hover:bg-[#f8faff]",
              state.activeSurface === "overview" && "font-bold text-[var(--az-blue)]",
            )}
          >
            Panoramica
          </button>
          {state.tabs.map((key) => (
            <span
              key={key}
              className={cn(
                "relative flex items-center border-r border-[#b9c9e5] pl-6 pr-2 text-[15px] font-bold",
                state.activeSurface === key ? "text-[var(--az-blue)] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[var(--az-blue)]" : "text-[#111837]",
              )}
            >
              <button type="button" onClick={() => activateTab(key)} className="py-2">
                {TITOLO_SEZIONE[key] ?? key}
              </button>
              <button
                type="button"
                aria-label={`Chiudi ${TITOLO_SEZIONE[key] ?? key}`}
                onClick={() => requestCloseTab(key)}
                className="ml-auto grid size-8 place-items-center rounded-md text-[var(--az-ink)] hover:bg-[#f3f7ff]"
              >
                <XIcon className="size-4" />
              </button>
            </span>
          ))}
        </nav>
      )}

      {state.sintesi.full ? (
        // § Correzione 25 §5: "deve essere mostrato soltanto il riquadro
        // della sintesi, senza affiancare l'elenco completo delle sezioni"
        // — sostituisce l'intero contenuto normale (Panoramica o sezione
        // aperta), che riappare invariato non appena si torna al pannello
        // laterale o si chiude, perché nessuno stato di sezione è stato
        // toccato per aprire questo blocco.
        <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-[12px] border border-[var(--az-border)] bg-white">
          <SectionOrCciaaPanel
            sectionKey="sintesi"
            headerActions={
              <ShellActionButton icon={PanelRightIcon} onClick={collapseSintesi}>
                Affianca
              </ShellActionButton>
            }
            onClose={requestCloseSintesi}
          />
        </div>
      ) : state.mode === "SPLIT" && state.openSectionKey ? (
        <div className="grid grid-cols-2 gap-0 divide-x divide-[var(--az-border)] overflow-hidden rounded-[12px] border border-[var(--az-border)] bg-white shadow-[0_4px_15px_rgba(25,46,98,0.05)]">
          <div className="az-scroll-thin overflow-y-auto p-1">{children}</div>
          <div className="flex min-h-[34rem] flex-col">
            <SectionOrCciaaPanel
              sectionKey={state.openSectionKey}
              headerActions={
                <ShellActionButton icon={Maximize2Icon} onClick={() => requestPromoteFull(state.openSectionKey!)}>
                  A tutta larghezza
                </ShellActionButton>
              }
              onClose={() => requestCloseTab(state.openSectionKey!)}
            />
          </div>
        </div>
      ) : state.mode === "FULL" && state.activeSurface !== "overview" ? (
        <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-[12px] border border-[var(--az-border)] bg-white">
          <SectionOrCciaaPanel
            sectionKey={state.activeSurface}
            headerActions={
              <ShellActionButton icon={PanelRightIcon} onClick={() => requestPromoteSplit(state.activeSurface)}>
                Affianca
              </ShellActionButton>
            }
          />
        </div>
      ) : (
        children
      )}

      {state.sintesi.open && !state.sintesi.full && (
        // § Correzione 25 §5: pannello laterale, indipendente dal drawer di
        // sezione qui sotto — apre/chiude senza toccare `mode`/
        // `openSectionKey`, quindi non interferisce con un'eventuale
        // sezione CCIAA già aperta (drawer, affiancamento o scheda).
        <Sheet open onOpenChange={(open) => !open && requestCloseSintesi()}>
          <SheetContent className="w-[50vw] min-w-[720px] gap-0 border-l-0 p-0 shadow-[-18px_0_45px_rgba(10,25,66,0.16)] sm:max-w-none" showCloseButton={false}>
            <SectionOrCciaaPanel
              sectionKey="sintesi"
              headerActions={
                <ShellActionButton icon={Maximize2Icon} onClick={expandSintesi}>
                  A tutta larghezza
                </ShellActionButton>
              }
              onClose={requestCloseSintesi}
            />
          </SheetContent>
        </Sheet>
      )}

      {state.mode === "DRAWER" && state.openSectionKey && !state.sintesi.full && (
        <Sheet open onOpenChange={(open) => !open && requestCloseDrawer()}>
          <SheetContent className="w-[50vw] min-w-[720px] gap-0 border-l-0 p-0 shadow-[-18px_0_45px_rgba(10,25,66,0.16)] sm:max-w-none" showCloseButton={false}>
            <SectionOrCciaaPanel
              sectionKey={state.openSectionKey}
              headerActions={
                <>
                  <ShellActionButton icon={PanelRightIcon} onClick={() => requestPromoteSplit(state.openSectionKey!)}>
                    Affianca
                  </ShellActionButton>
                  <ShellActionButton icon={SquareArrowOutUpRightIcon} onClick={() => requestPromoteFull(state.openSectionKey!)}>
                    Apri in scheda
                  </ShellActionButton>
                  <button
                    type="button"
                    aria-label={`Chiudi ${TITOLO_SEZIONE[state.openSectionKey] ?? state.openSectionKey}`}
                    onClick={requestCloseDrawer}
                    className="grid size-9 place-items-center rounded-[7px] border border-[#cedaf0] text-[var(--az-ink)] hover:bg-[#f6f9ff]"
                  >
                    <XIcon className="size-[18px]" />
                  </button>
                </>
              }
            />
          </SheetContent>
        </Sheet>
      )}

      <UnsavedChangesDialog />
      <CessazioneOrganoControlloDialog />
      <RiduzioneSindaciEffettiviDialog />
      <CancellazioneConfigurazioneDialog />
      <CambioAssettoAffidatarioDialog />
    </div>
  );
}
