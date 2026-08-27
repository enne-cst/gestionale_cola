"use client";

import { CheckIcon, PencilIcon, type LucideIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Contenitore grafico condiviso da tutte le tabelle dell'Anagrafica
 * Aziendale (Correzione 01 — uniformazione grafica): card bianca con bordo
 * azzurro-grigio, fascia superiore leggermente azzurrata con titolo,
 * conteggio righe e — solo in modalità modifica — il pulsante "Aggiungi"
 * (`addTrigger`). Lo stile di colonne/celle è applicato una sola volta in
 * `components/ui/table.tsx`, non qui, per non duplicarlo per ogni tabella.
 * Le tabelle che non permettono l'inserimento manuale di righe omettono
 * semplicemente `addTrigger`.
 *
 * La tabella NON ha una modalità di modifica propria: quando la card vive
 * dentro una scheda a registro (campi + tabella), la modalità modifica è
 * quella dell'intera scheda, attivata/disattivata dal pulsante "Modifica
 * dati" del banner in fondo alla scheda — passare `editing` (booleano
 * esplicito, letto da `useWorkspace().state.sections[sectionKey].editing`)
 * per collegarla a quello stato, senza montare qui nessun controllo
 * proprio. Solo le tabelle ancora prive di una scheda/banner di riferimento
 * (pagine standalone non ancora migrate) continuano a omettere `editing`
 * e usano il vecchio toggle locale "Modifica"/"Fine modifica" — stato
 * transitorio, da rimuovere quando anche quelle saranno agganciate a una
 * scheda con banner.
 */
export function DataTableCard({
  title,
  count,
  addTrigger,
  editing,
  children,
  className,
}: {
  title: string;
  count: number;
  addTrigger?: ReactNode;
  /** Passare per collegare la card al banner "Modifica dati" di una scheda
   * a registro (nessun toggle locale). Omettere per il vecchio
   * comportamento a toggle locale (solo pagine standalone non ancora
   * migrate). */
  editing?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const controllata = editing !== undefined;
  const [editingLocale, setEditingLocale] = useState(false);
  const inModifica = controllata ? editing : editingLocale;
  return (
    <div className={cn("overflow-hidden rounded-[9px] border border-[var(--az-border)] bg-white", className)}>
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-[var(--az-border)] bg-[#f7faff] px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate text-[13px] font-bold text-[var(--az-ink)]">{title}</h3>
          <span className="shrink-0 text-[10px] text-[var(--az-muted)]">
            {count} {count === 1 ? "riga" : "righe"}
          </span>
        </div>
        {addTrigger && (
          <div className="flex shrink-0 items-center gap-2">
            {inModifica && addTrigger}
            {!controllata && (
              <button
                type="button"
                aria-pressed={editingLocale}
                onClick={() => setEditingLocale((v) => !v)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-[7px] border px-2.5 text-[11px] font-bold transition-colors",
                  editingLocale
                    ? "border-[var(--az-blue)] bg-[var(--az-blue)] text-white hover:bg-[var(--az-blue-dark)]"
                    : "border-[var(--az-border)] bg-white text-[var(--az-ink-soft)] hover:bg-[#f3f6fb]",
                )}
              >
                {editingLocale ? <CheckIcon className="size-3.5" /> : <PencilIcon className="size-3.5" />}
                {editingLocale ? "Fine modifica" : "Modifica"}
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/** Pulsante "Aggiungi" dell'intestazione tabella (§ Correzione 01): va
 * passato come `trigger` del dialog di creazione già esistente, non
 * introduce una nuova azione. `label`/`icon` di default riproducono il
 * vecchio testo "Aggiungi riga" per le tabelle non ancora migrate al
 * banner della scheda (vedi `DataTableCard`); le tabelle agganciate al
 * banner passano `icon={PlusIcon}` `label="Aggiungi"`. */
export function AddRowButton({
  icon: Icon,
  label = "Aggiungi riga",
  ...props
}: { icon: LucideIcon; label?: string } & ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      className="h-8 gap-1.5 rounded-[7px] border-[#a9c4f2] bg-white px-2.5 text-[11px] font-bold text-[var(--az-blue)] hover:border-[var(--az-blue)] hover:bg-[#f1f6ff]"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

/** Messaggio di tabella vuota, stesso stile in tutta l'Anagrafica Aziendale. */
export function EmptyTableMessage({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-[12px] text-[var(--az-muted)]">{children}</p>;
}
