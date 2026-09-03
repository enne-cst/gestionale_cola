"use client";

import type { ReactNode } from "react";

/** Cornice del pannello (titolo, sottotitolo, azioni, chiusura) per le
 * sezioni ISO 9001 "a elenco" aperte nel drawer/affiancamento/scheda del
 * workspace (§ "falle tutte" — stessa apertura al 50% già in uso per le
 * sezioni a registro campo-per-campo). Stesso identico markup dell'header
 * "non embedded" di `SectionContent`, estratto qui perché queste 14 sezioni
 * non passano dal motore campo-per-campo (righe multiple, non un singolo
 * record per azienda) — solo la cornice è condivisa, il contenuto
 * (tabella + form di ciascuna risorsa) resta quello già esistente. */
export function ElencoSectionPanel({
  title,
  subtitle,
  headerActions,
  onClose,
  loading,
  children,
}: {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  onClose?: () => void;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">{title}</h2>
          {subtitle && <p className="mt-[9px] text-sm text-[#354a89]">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerActions}
          {onClose && (
            <button
              type="button"
              aria-label="Chiudi"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-[7px] border border-[#cedaf0] text-[var(--az-ink)] hover:bg-[#f6f9ff]"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="az-scroll-thin flex-1 overflow-y-auto px-[30px] pb-6">
        {loading ? (
          <div className="flex items-center gap-2.5 py-6 text-[13px] font-medium text-[var(--az-ink)]" role="status" aria-live="polite" aria-busy="true">
            <span className="az-spinner size-[19px] shrink-0" aria-hidden="true" />
            Caricamento dati…
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
