"use client";

import { useEffect, type ReactNode } from "react";
import { Maximize2Icon, PanelRightIcon, SquareArrowOutUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SectionContent } from "@/components/registro/section-content";
import { UnsavedChangesDialog } from "@/components/registro/unsaved-changes-dialog";
import { isSectionDirty, useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";

const TITOLO_SEZIONE: Record<string, string> = {
  "informazioni-societarie": "Informazioni societarie",
};

/** Shell del workspace (§8): barra delle schede, pannello temporaneo al
 * 50%, scheda a tutta larghezza, vista affiancata 50/50. `children` è la
 * Panoramica (Server Component già renderizzato): la reflow reale in
 * affiancamento (§8.5) è ottenuta con container query sui suoi contenitori
 * `@container`, non da uno stato client duplicato qui. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { state, requestCloseDrawer, requestPromoteFull, requestPromoteSplit, requestCloseTab, activateTab } =
    useWorkspace();

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

  const mostraSchede = state.tabs.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {mostraSchede && (
        <nav className="-mt-2 flex items-center gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => activateTab("overview")}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              state.activeSurface === "overview" && "border-primary text-primary",
            )}
          >
            Panoramica
          </button>
          {state.tabs.map((key) => {
            const sporca = isSectionDirty(state.sections[key] ?? { draft: null, server: null });
            return (
              <span
                key={key}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
                  state.activeSurface === key && "border-primary text-primary",
                )}
              >
                <button type="button" onClick={() => activateTab(key)} className="hover:text-foreground">
                  {TITOLO_SEZIONE[key] ?? key}
                </button>
                {sporca && <span className="size-1.5 rounded-full bg-orange-500" aria-label="Modifiche non salvate" />}
                <button
                  type="button"
                  aria-label={`Chiudi ${TITOLO_SEZIONE[key] ?? key}`}
                  onClick={() => requestCloseTab(key)}
                  className="ml-0.5 text-muted-foreground/70 hover:text-foreground"
                >
                  ×
                </button>
              </span>
            );
          })}
        </nav>
      )}

      {state.mode === "SPLIT" && state.openSectionKey ? (
        <div className="grid grid-cols-2 gap-0 divide-x divide-border rounded-lg border border-border">
          <div className="overflow-y-auto">{children}</div>
          <div className="flex min-h-[32rem] flex-col">
            <SectionContent
              sectionKey={state.openSectionKey}
              headerActions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => requestPromoteFull(state.openSectionKey!)}
                >
                  <Maximize2Icon className="size-4" />A tutta larghezza
                </Button>
              }
              onClose={() => requestCloseTab(state.openSectionKey!)}
            />
          </div>
        </div>
      ) : state.mode === "FULL" && state.activeSurface !== "overview" ? (
        <div className="flex min-h-[32rem] flex-col rounded-lg border border-border">
          <SectionContent
            sectionKey={state.activeSurface}
            headerActions={
              <Button type="button" variant="outline" size="sm" onClick={() => requestPromoteSplit(state.activeSurface)}>
                <PanelRightIcon className="size-4" />
                Affianca
              </Button>
            }
          />
        </div>
      ) : (
        children
      )}

      {state.mode === "DRAWER" && state.openSectionKey && (
        <Sheet open onOpenChange={(open) => !open && requestCloseDrawer()}>
          <SheetContent className="w-1/2 gap-0 p-0 sm:max-w-none" showCloseButton={false}>
            <SectionContent
              sectionKey={state.openSectionKey}
              headerActions={
                <>
                  <Button type="button" variant="outline" size="sm" onClick={() => requestPromoteSplit(state.openSectionKey!)}>
                    <PanelRightIcon className="size-4" />
                    Affianca
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => requestPromoteFull(state.openSectionKey!)}>
                    <SquareArrowOutUpRightIcon className="size-4" />
                    Apri in scheda
                  </Button>
                </>
              }
              onClose={requestCloseDrawer}
            />
          </SheetContent>
        </Sheet>
      )}

      <UnsavedChangesDialog />
    </div>
  );
}
