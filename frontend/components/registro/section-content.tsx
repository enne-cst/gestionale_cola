"use client";

import { useEffect, type ReactNode } from "react";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldRow } from "@/components/registro/field-row";
import { VerificationLegend } from "@/components/registro/field-verification-popover";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { SOTTOTITOLO_SEZIONE_REGISTRO, TITOLO_SEZIONE_REGISTRO } from "@/lib/registro-sezioni-meta";
import { cn } from "@/lib/utils";

const ETICHETTA_COMPLETAMENTO: Record<string, { testo: string; completa: boolean }> = {
  NOT_STARTED: { testo: "Da completare", completa: false },
  IN_PROGRESS: { testo: "Da completare", completa: false },
  COMPLETE: { testo: "Completa", completa: true },
};

function StatoPill({ status }: { status: string }) {
  const meta = ETICHETTA_COMPLETAMENTO[status];
  return (
    <span
      className={cn(
        "inline-flex min-h-[30px] items-center rounded-full px-3.5 text-xs font-semibold",
        meta.completa ? "bg-[var(--az-green-soft)] text-[#007d5d]" : "bg-[var(--az-orange-soft)] text-[#c35a00]",
      )}
    >
      {meta.testo}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden" role="status" aria-live="polite" aria-busy="true">
      <div className="flex h-[66px] shrink-0 items-center gap-3 px-6 text-[13px] font-medium text-[var(--az-ink)]">
        <span className="az-spinner size-[19px] shrink-0" aria-hidden="true" />
        Caricamento dati…
      </div>
      <div className="flex-1 overflow-hidden px-6">
        {[4, 6, 4].map((righe, i) => (
          <section key={i} className={cn("border-b border-[var(--az-border)] py-6", i === 0 && "pt-1")}>
            <div className="mb-[22px] flex items-center gap-[15px]">
              <span className="az-skeleton size-[31px] shrink-0 rounded-[6px]" />
              <span className="az-skeleton h-[17px] w-[200px] max-w-[38%]" />
            </div>
            <div className="grid grid-cols-2 gap-x-[40px] gap-y-[21px]">
              {Array.from({ length: righe }).map((_, j) => (
                <span key={j} className={cn("az-skeleton h-3", j % 3 === 0 ? "w-[72%]" : "w-[58%]")} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-6 border-t border-[var(--az-border)] bg-white px-6 py-0">
        {[0, 1].map((i) => (
          <span key={i} className="az-skeleton-button my-3.5 h-[42px] w-full" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-9" role="alert" aria-live="assertive">
      <div className="flex max-w-[430px] flex-col items-center text-center">
        <span className="mb-[17px] grid place-items-center text-[#ff4438]">
          <svg viewBox="0 0 24 24" className="size-[66px]" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.2 2.7h7.6l5.5 5.5v7.6l-5.5 5.5H8.2l-5.5-5.5V8.2Z" />
            <path d="M12 7.5v6M12 17h.01" />
          </svg>
        </span>
        <h3 className="mb-3 text-lg font-extrabold text-[var(--az-ink)]">Impossibile caricare i dati</h3>
        <p className="mb-[25px] text-[13px] leading-snug text-[#435b95]">
          Si è verificato un problema durante il caricamento. Riprova.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="h-11 min-w-24 rounded-[7px] border border-[var(--az-blue)] px-[19px] text-[13px] font-bold text-[var(--az-blue)] transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-[#f5f8ff] hover:shadow-[0_4px_12px_rgba(7,94,255,0.12)]"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}

export function SectionContent({
  sectionKey,
  headerActions,
  onClose,
  embedded = false,
}: {
  sectionKey: string;
  headerActions?: ReactNode;
  onClose?: () => void;
  // true quando questo blocco è annidato dentro `CciaaSectionPanel` insieme
  // ad altri gruppi/tabelle di una card composita (§9 del prototipo): niente
  // colonna a piena altezza con scroll proprio, un solo header più leggero,
  // nessuna azione di apertura/promozione (quelle restano sul pannello
  // esterno che lo ospita, non per singolo blocco).
  embedded?: boolean;
}) {
  const { state, ruolo, ensureLoaded, reload, enterEdit, updateField, requestDiscard, save, toggleGroupVisibility } =
    useWorkspace();
  const entry = state.sections[sectionKey];
  const consulente = ruolo === "CONSULENTE";

  useEffect(() => {
    ensureLoaded(sectionKey);
  }, [sectionKey, ensureLoaded]);

  const wrapperCls = embedded ? "flex flex-col" : "flex flex-1 flex-col overflow-hidden";
  const header = embedded ? (
    <div className="flex items-center justify-between gap-3 pb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">
          {entry?.server?.title ?? TITOLO_SEZIONE_REGISTRO[sectionKey] ?? sectionKey}
        </h3>
        {entry?.server && <StatoPill status={entry.server.completionStatus} />}
      </div>
    </div>
  ) : (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3.5">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">
            {entry?.server?.title ?? TITOLO_SEZIONE_REGISTRO[sectionKey] ?? sectionKey}
          </h2>
          {entry?.server && <StatoPill status={entry.server.completionStatus} />}
        </div>
        <p className="mt-[9px] text-sm text-[#354a89]">
          {SOTTOTITOLO_SEZIONE_REGISTRO[sectionKey] ?? "Dati della sezione"}
        </p>
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
  );

  if (!entry || (entry.loading && !entry.server)) {
    return (
      <div className={wrapperCls}>
        {header}
        <LoadingSkeleton />
      </div>
    );
  }

  if (entry.error && !entry.server) {
    return (
      <div className={wrapperCls}>
        {header}
        <ErrorState onRetry={() => reload(sectionKey)} />
      </div>
    );
  }

  const section = entry.server;
  if (!section) return null;

  const modificando = entry.editing;

  async function onSalva() {
    await save(sectionKey);
  }

  return (
    <div className={wrapperCls}>
      {header}

      {entry.error && (
        <p className={cn("mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive", !embedded && "mx-[30px]")}>
          {entry.error}
        </p>
      )}

      <div className={embedded ? "" : "az-scroll-thin flex-1 overflow-y-auto px-[30px] pb-6"}>
        {section.groups.map((group) => {
          const tuttiNascosti = group.fields.length > 0 && group.fields.every((f) => !f.visibleToCompany);
          return (
            <section key={group.key} className={cn("border-b border-[var(--az-border)] py-6", modificando && "border-0 py-[22px]")}>
              <h3 className="mb-6 flex items-center gap-3 text-[15px] font-bold text-[var(--az-ink)]">
                <span>{group.title}</span>
                {consulente && !modificando && (
                  <button
                    type="button"
                    onClick={() => toggleGroupVisibility(sectionKey, group.fields.map((f) => f.key), tuttiNascosti)}
                    aria-label={`${tuttiNascosti ? "Mostra" : "Nascondi"} la sezione ${group.title} all'azienda`}
                    title={tuttiNascosti ? "Mostra tutta la sezione" : "Nascondi tutta la sezione"}
                    className="ml-0.5 grid size-[26px] shrink-0 place-items-center rounded-[6px] text-[var(--az-blue)] hover:bg-[#edf4ff]"
                  >
                    {tuttiNascosti ? (
                      <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15.5 15.5 0 0 1-2.2 2.9M6.5 6.6C4 8.2 2.5 12 2.5 12s3.5 6 9.5 6a9.7 9.7 0 0 0 2.7-.4" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-[17px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                )}
              </h3>
              {modificando ? (
                <div className="grid grid-cols-1 gap-x-5 gap-y-[15px] sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <FieldRow
                      key={field.key}
                      sectionKey={sectionKey}
                      field={field}
                      mode="EDIT"
                      draftValue={entry.draft?.[field.key] ?? null}
                      error={entry.fieldErrors[field.key]}
                      disabled={entry.saving}
                      onChange={(value) => updateField(sectionKey, field.key, value)}
                    />
                  ))}
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-x-[54px] gap-y-6 sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <FieldRow key={field.key} sectionKey={sectionKey} field={field} mode="VIEW" />
                  ))}
                </dl>
              )}
            </section>
          );
        })}
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-[var(--az-border)] py-0",
          embedded ? "mt-2" : "bg-[#fffffffa] px-[30px] shadow-[0_-7px_22px_rgba(31,50,94,0.04)]",
        )}
      >
        {modificando ? (
          <div className="flex min-h-[72px] items-center justify-between gap-4">
            <span className="text-xs text-[var(--az-muted)]">
              {Object.keys(entry.fieldErrors).length > 0 ? "Modifica i campi evidenziati" : ""}
            </span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-[126px] rounded-[7px] border-[var(--az-blue)] text-[var(--az-blue)] hover:bg-[#f5f8ff]"
                onClick={() => requestDiscard(sectionKey)}
                disabled={entry.saving}
              >
                Annulla
              </Button>
              <Button
                type="button"
                className="h-11 min-w-[126px] rounded-[7px] bg-[var(--az-blue)] hover:bg-[var(--az-blue-dark)]"
                onClick={onSalva}
                disabled={entry.saving || Object.keys(entry.fieldErrors).length > 0}
              >
                {entry.saving ? "Salvataggio…" : "Salva modifiche"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-4">
            <VerificationLegend />
            <div className="flex items-center gap-4">
              <Button
                type="button"
                className="h-11 w-[168px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold shadow-[0_5px_12px_rgba(7,94,255,0.18)] hover:bg-[var(--az-blue-dark)]"
                onClick={() => enterEdit(sectionKey)}
              >
                <PencilIcon className="size-4" />
                Modifica dati
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
