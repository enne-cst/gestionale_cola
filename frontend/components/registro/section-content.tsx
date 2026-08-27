"use client";

import { useEffect, type ReactNode } from "react";

import { FieldRow } from "@/components/registro/field-row";
import { SectionFooter } from "@/components/registro/section-footer";
import { StatoPill } from "@/components/registro/stato-pill";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { SOTTOTITOLO_SEZIONE_REGISTRO, TITOLO_SEZIONE_REGISTRO } from "@/lib/registro-sezioni-meta";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/lib/types/registro";

/** Sottoinsieme di `campi` applicabile ai `valori` correnti (§ Correzione
 * 04/05: `dependsOn`/`dependsOnValues`), risolto in modo transitivo — un
 * campo il cui "genitore" non è a sua volta applicabile resta nascosto
 * anche se il SUO valore diretto soddisferebbe la condizione (es. se
 * l'organo cambia, i campi condizionali alla durata scompaiono insieme al
 * campo durata, non solo quando la durata stessa viene svuotata). Usata
 * sia in sola lettura (con i valori salvati) sia in modifica (con la
 * bozza corrente): stessa regola, valutata contro valori diversi, per
 * ottenere comparsa/scomparsa istantanea durante la selezione. */
function campiApplicabili(campi: FieldState[], valori: Record<string, string | null | undefined>): FieldState[] {
  const perChiave = new Map(campi.map((c) => [c.key, c]));
  const cache = new Map<string, boolean>();
  function applicabile(chiave: string): boolean {
    const nota = cache.get(chiave);
    if (nota !== undefined) return nota;
    const campo = perChiave.get(chiave);
    if (!campo?.dependsOn) {
      cache.set(chiave, true);
      return true;
    }
    if (!applicabile(campo.dependsOn)) {
      cache.set(chiave, false);
      return false;
    }
    const valoreControllo = valori[campo.dependsOn];
    const esito = Boolean(valoreControllo) && (!campo.dependsOnValues || campo.dependsOnValues.includes(valoreControllo!));
    cache.set(chiave, esito);
    return esito;
  }
  return campi.filter((c) => applicabile(c.key));
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
  hideFooter = false,
  groupTitleOverrides,
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
  // true quando il pannello che ospita questo blocco monta da sé un
  // `SectionFooter` più in basso (dopo una tabella annidata, es. Soci/
  // Amministratori/Sindaci): banner di modifica e legenda vanno in fondo
  // alla pagina, non tra i campi e la tabella (vedi CciaaSectionPanel).
  hideFooter?: boolean;
  // Testo alternativo, solo di visualizzazione, per il titolo di un gruppo
  // (chiave = `group.key`). Non tocca i dati né la sezione condivisa: serve
  // quando lo stesso gruppo compare in più card composite con un'etichetta
  // diversa da quella per cui è correttamente titolato altrove (vedi
  // "amministratori" in CciaaSectionPanel, che non deve toccare "sindaci").
  groupTitleOverrides?: Partial<Record<string, string>>;
}) {
  const { state, ruolo, ensureLoaded, reload, updateField, toggleGroupVisibility } = useWorkspace();
  const entry = state.sections[sectionKey];
  const consulente = ruolo === "CONSULENTE";

  useEffect(() => {
    ensureLoaded(sectionKey);
  }, [sectionKey, ensureLoaded]);

  const wrapperCls = embedded ? "flex flex-col" : "flex flex-1 flex-col overflow-hidden";
  const titolo = entry?.server?.title ?? TITOLO_SEZIONE_REGISTRO[sectionKey] ?? sectionKey;
  // Sezioni a gruppo singolo il cui unico gruppo si chiama come la sezione
  // (Sede, Capitale sociale, Informazioni da statuto/atto costitutivo,
  // Estremi dell'elenco soci, ...) mostravano due sottotitoli identici: il
  // testo descrittivo qui sotto e il titolo del gruppo (con l'occhietto)
  // subito sopra i campi. Tenere solo quello con l'occhietto — è anche
  // l'unico dei due con una funzione, non solo descrittivo.
  const sottotitoloDuplicato =
    entry?.server?.groups.length === 1 && entry.server.groups[0].title === entry.server.title;
  const header = embedded ? (
    // Quando il gruppo unico si chiama come la sezione, questo header
    // duplicherebbe esattamente il titolo del gruppo (con l'occhietto) che
    // segue subito sotto tra i campi — niente da mostrare qui in quel caso:
    // l'indicatore di stato passa al titolo del pannello che ospita questo
    // blocco (vedi CciaaSectionPanel), il titolo del gruppo resta l'unica
    // intestazione.
    sottotitoloDuplicato ? null : (
      <div className="flex items-center justify-between gap-3 pb-4">
        <h3 className="text-base font-extrabold tracking-tight text-[var(--az-ink)]">
          {titolo}
          {entry?.server && <StatoPill status={entry.server.completionStatus} />}
        </h3>
      </div>
    )
  ) : (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
      <div className="min-w-0">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">
          {titolo}
          {entry?.server && <StatoPill status={entry.server.completionStatus} />}
        </h2>
        {!sottotitoloDuplicato && (
          <p className="mt-[9px] text-sm text-[#354a89]">
            {SOTTOTITOLO_SEZIONE_REGISTRO[sectionKey] ?? "Dati della sezione"}
          </p>
        )}
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
          // Applicabilità valutata due volte con la STESSA regola
          // (`campiApplicabili`), contro valori diversi: quelli salvati per
          // la vista di sola lettura (e per l'occhietto "nascondi tutta la
          // sezione", che opera sui campi realmente mostrati), la bozza
          // corrente per la modifica — cosi' un campo compare/scompare
          // subito mentre si sceglie, senza aspettare il salvataggio.
          const valoriVista = Object.fromEntries(group.fields.map((f) => [f.key, f.value]));
          const campiVisibili = campiApplicabili(group.fields, valoriVista);
          const campiModificabili = campiApplicabili(group.fields, entry.draft ?? {});
          const tuttiNascosti = campiVisibili.length > 0 && campiVisibili.every((f) => !f.visibleToCompany);
          return (
            <section key={group.key} className={cn("border-b border-[var(--az-border)] py-6", modificando && "border-0 py-[22px]")}>
              <h3 className="mb-6 flex items-center gap-3 text-[15px] font-bold text-[var(--az-ink)]">
                <span>{groupTitleOverrides?.[group.key] ?? group.title}</span>
                {consulente && !modificando && (
                  <button
                    type="button"
                    onClick={() => toggleGroupVisibility(sectionKey, campiVisibili.map((f) => f.key), tuttiNascosti)}
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
                  {campiModificabili.map((field) => (
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
                  {campiVisibili.map((field) => (
                    <FieldRow key={field.key} sectionKey={sectionKey} field={field} mode="VIEW" />
                  ))}
                </dl>
              )}
            </section>
          );
        })}
      </div>

      {!hideFooter && <SectionFooter sectionKey={sectionKey} embedded={embedded} />}
    </div>
  );
}
