"use client";

import { useState } from "react";
import { ArrowRightIcon, HistoryIcon } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { getCronologiaRegistro } from "@/lib/actions/registro";
import type { RecentChange } from "@/lib/types/registro";

function tempoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minuti = Math.round(diffMs / 60000);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min fa`;
  const ore = Math.round(minuti / 60);
  if (ore < 24) return `${ore} ${ore === 1 ? "ora" : "ore"} fa`;
  const giorni = Math.round(ore / 24);
  return `${giorni} ${giorni === 1 ? "giorno" : "giorni"} fa`;
}

/** Una voce di "Ultime modifiche"/della cronologia estesa: link cliccabile
 * verso la card/il campo modificato quando il backend è riuscito a
 * risalirci (`sectionKey`), altrimenti testo semplice — mai un link
 * inventato verso una destinazione che non esiste più (§18 del
 * protocollo, es. una sezione ormai orfana). */
function RigaModifica({
  modifica,
  onNavigate,
}: {
  modifica: RecentChange;
  onNavigate: (sectionKey: string, fieldKey: string | null) => void;
}) {
  const contenuto = (
    <>
      <span className="mt-[3px] size-3 shrink-0 rounded-full bg-[var(--az-blue)] shadow-[0_0_0_4px_rgba(7,94,255,0.05)]" />
      <p className="flex min-w-0 flex-col gap-1">
        <strong className="text-[13px] leading-tight text-[var(--az-ink)] capitalize">{modifica.label}</strong>
        <small className="text-xs leading-tight text-[var(--az-muted)]">
          {tempoFa(modifica.timestamp)}
          {modifica.actor ? ` · ${modifica.actor}` : ""}
        </small>
      </p>
    </>
  );
  if (!modifica.sectionKey) {
    return <div className="flex items-start gap-4 p-1">{contenuto}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => onNavigate(modifica.sectionKey!, modifica.fieldKey)}
      className="-m-1 flex items-start gap-4 rounded-[7px] p-1 text-left transition-colors hover:bg-[#f3f7ff]"
    >
      {contenuto}
    </button>
  );
}

/** Card "Ultime modifiche" (§8.2 del prompt master): alimentata dall'audit
 * del registro campo-per-campo. Ogni voce apre la card/il campo modificato
 * (§ richiesta esplicita 05/09/2026); "Vedi cronologia" apre l'elenco esteso
 * in un dialogo invece delle sole 3 voci più recenti. */
export function RecentChangesCard() {
  const { state, openDrawer } = useWorkspace();
  const modifiche = state.overview.recentChanges;
  const [cronologiaAperta, setCronologiaAperta] = useState(false);
  const [cronologia, setCronologia] = useState<RecentChange[] | null>(null);
  const [caricamento, setCaricamento] = useState(false);

  function naviga(sectionKey: string, fieldKey: string | null) {
    setCronologiaAperta(false);
    openDrawer(sectionKey, fieldKey ?? undefined);
  }

  function apriCronologia() {
    setCronologiaAperta(true);
    if (cronologia !== null) return;
    setCaricamento(true);
    getCronologiaRegistro()
      .then(setCronologia)
      .catch(() => setCronologia([]))
      .finally(() => setCaricamento(false));
  }

  return (
    <article className="az-dashboard-card relative flex min-h-[276px] flex-col overflow-hidden pb-[50px]">
      <div className="flex min-h-14 items-center gap-2.5 px-[26px] pt-[18px] pb-2.5">
        <span className="grid place-items-center text-[var(--az-blue)]">
          <HistoryIcon className="size-6" />
        </span>
        <h2 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">Ultime modifiche</h2>
      </div>
      <div className="flex flex-col gap-3.5 px-[28px] py-[10px]">
        {modifiche.length === 0 ? (
          <p className="text-[13px] text-[var(--az-muted)]">Nessuna modifica registrata.</p>
        ) : (
          modifiche.slice(0, 3).map((m) => <RigaModifica key={m.id} modifica={m} onNavigate={naviga} />)
        )}
      </div>
      <button
        type="button"
        onClick={apriCronologia}
        className="absolute inset-x-0 bottom-0 flex min-h-[50px] items-center gap-3.5 border-t border-[var(--az-border)] bg-[#fbfdfff5] px-[26px] text-sm font-bold text-[var(--az-blue)] transition-colors hover:bg-[#f3f7ff] hover:text-[var(--az-blue-dark)]"
      >
        <HistoryIcon className="size-5" />
        <span className="mr-auto">Vedi cronologia</span>
        <ArrowRightIcon className="size-[18px]" />
      </button>

      <Dialog open={cronologiaAperta} onOpenChange={setCronologiaAperta}>
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cronologia modifiche</DialogTitle>
          </DialogHeader>
          <div className="az-scroll-thin flex flex-col gap-4 overflow-y-auto py-1">
            {caricamento ? (
              <p className="text-sm text-[var(--az-muted)]">Caricamento…</p>
            ) : !cronologia || cronologia.length === 0 ? (
              <p className="text-sm text-[var(--az-muted)]">Nessuna modifica registrata.</p>
            ) : (
              cronologia.map((m) => <RigaModifica key={m.id} modifica={m} onNavigate={naviga} />)
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
