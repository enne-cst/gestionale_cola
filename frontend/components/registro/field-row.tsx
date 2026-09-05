"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldVerificationPopover } from "@/components/registro/field-verification-popover";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { VisibilityToggle } from "@/components/registro/visibility-toggle";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/lib/types/registro";

// § richiesta esplicita 05/09/2026: spostata in `lib/registro-format.ts`
// (modulo non "use client") perché serve anche a codice server-only, ma
// riesportata qui per non cambiare l'import già usato da sintesi-panel.tsx.
import { formattaValore } from "@/lib/registro-format";
export { formattaValore };

/** Trova, nel testo del valore, la parola oltre la quale non si può più
 * stare sulla prima riga insieme all'indicatore di verifica — cosi' che
 * l'indicatore possa comparire subito dopo quella parola, alla stessa
 * distanza (`ml-[9px]`, testo normale) di un valore su una riga sola,
 * invece che ancorato al bordo della colonna (dove può cadere lontano
 * dall'ultima parola) o dopo l'ultima riga del valore. Misura nel DOM
 * reale con un elemento smontato (mai il nodo che React gestisce): niente
 * rischio di scarto tra il font usato per misurare e quello del CSS, e
 * nessun conflitto con la riconciliazione di React. Si aggiorna quando la
 * larghezza della colonna cambia (drawer/affiancamento/scheda intera). */
function useSplitPrimaRiga(testo: string, attivo: boolean) {
  const contenitoreRef = useRef<HTMLElement>(null);
  const [split, setSplit] = useState<{ prima: string; resto: string } | null>(null);

  useLayoutEffect(() => {
    if (!attivo) {
      setSplit(null);
      return;
    }
    const contenitore = contenitoreRef.current;
    if (!contenitore) return;

    function misura() {
      if (!contenitore) return;
      const larghezza = contenitore.clientWidth;
      if (larghezza === 0) return;

      const stile = getComputedStyle(contenitore);
      const misuratore = document.createElement("span");
      misuratore.style.cssText = `position:absolute; visibility:hidden; white-space:normal; left:-9999px; top:-9999px; width:${larghezza}px; font:${stile.font}; letter-spacing:${stile.letterSpacing};`;
      document.body.appendChild(misuratore);

      function suUnaRigaSola(valore: string): boolean {
        misuratore.textContent = valore;
        const range = document.createRange();
        range.selectNodeContents(misuratore);
        return range.getClientRects().length <= 1;
      }

      if (suUnaRigaSola(testo)) {
        document.body.removeChild(misuratore);
        setSplit({ prima: testo, resto: "" });
        return;
      }

      const parole = testo.split(" ");
      let lo = 1;
      let hi = parole.length;
      let migliore = 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (suUnaRigaSola(parole.slice(0, mid).join(" "))) {
          migliore = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      document.body.removeChild(misuratore);
      setSplit({ prima: parole.slice(0, migliore).join(" "), resto: parole.slice(migliore).join(" ") });
    }

    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(contenitore);
    return () => ro.disconnect();
  }, [testo, attivo]);

  return { contenitoreRef, split };
}

/** Riga di campo in sola lettura (§8.2/§9 del prompt master): occhietto e
 * indicatore di stato sempre presenti, identici in drawer, affiancamento e
 * scheda a tutta larghezza. */
export function FieldRow({
  sectionKey,
  field,
  mode,
  draftValue,
  error,
  disabled,
  onChange,
  multiline = false,
}: {
  sectionKey: string;
  field: FieldState;
  mode: "VIEW" | "EDIT";
  draftValue?: string | null;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  // § correzione grafica "Attività economica" (campo "Attività prevalente",
  // testuale e descrittivo): in modifica usa una Textarea invece di un
  // Input a riga singola. Opt-in, default false — nessun altro campo/
  // sezione della piattaforma è coinvolto senza passarlo esplicitamente.
  multiline?: boolean;
}) {
  const { ruolo, toggleVisibility, state, clearHighlightField, isCampoPinned, togglePinCampo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const nascosto = consulente && !field.visibleToCompany;
  // § richiesta esplicita 05/09/2026: link di "Ultime modifiche" — evidenzia
  // e scorre fino al campo appena aperta la sezione, poi consuma
  // l'evidenziazione (mai riattivarla scorrendo via e tornando indietro).
  const evidenziato = state.highlightField === field.key;
  const rigaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!evidenziato) return;
    rigaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(clearHighlightField, 2200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenziato]);
  // Chiamato sempre (mai dentro il ramo "sola lettura" qui sotto): le regole
  // degli Hook non permettono chiamate condizionali, e questo componente
  // cambia `mode`/`field.editable` da un render all'altro (Annulla/Salva).
  // `attivo` internamente decide se davvero misurare.
  const testoSolaLettura = formattaValore(field);
  const { contenitoreRef, split } = useSplitPrimaRiga(
    testoSolaLettura,
    (mode === "VIEW" || !field.editable) && Boolean(field.verificationStatus),
  );

  if (mode === "VIEW" || !field.editable) {
    const derivatoInModifica = mode === "EDIT" && !field.editable;
    const indicatore = field.verificationStatus && (
      <span className="ml-[9px] inline-flex translate-y-px">
        <FieldVerificationPopover sectionKey={sectionKey} field={field} disabled={mode === "EDIT"} />
      </span>
    );
    return (
      <div
        ref={rigaRef}
        id={`campo-${sectionKey}-${field.key}`}
        className={cn(
          "relative -m-2 min-h-[62px] rounded-[7px] p-2 transition-colors duration-1000",
          nascosto && "bg-[#f0f2f5]",
          derivatoInModifica && "opacity-60",
          evidenziato && "bg-[#fff2cf] ring-2 ring-[var(--az-blue)]",
        )}
      >
        <dt className="flex items-center gap-[7px]">
          <span className="text-[13px] font-medium text-[#536a9f]">{field.label}</span>
          <PinToggleButton
            pinned={isCampoPinned(sectionKey, field.key)}
            onToggle={() => togglePinCampo(sectionKey, field.key, field.label)}
          />
          {consulente && <VisibilityToggle label={field.label} visible={field.visibleToCompany} onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)} />}
        </dt>
        <dd ref={contenitoreRef} className="mt-[9px] min-h-5 text-sm font-bold break-words text-[var(--az-ink)]">
          {split ? (
            <>
              {split.prima}
              {indicatore}
              {split.resto && (
                <>
                  <br />
                  {split.resto}
                </>
              )}
            </>
          ) : (
            <>
              {testoSolaLettura}
              {indicatore}
            </>
          )}
        </dd>
        {derivatoInModifica && field.derivedNote && (
          <p className="mt-1.5 text-xs text-[var(--az-muted)]">{field.derivedNote}</p>
        )}
        {derivatoInModifica && !field.derivedNote && field.sourceLabel && (
          <p className="mt-1.5 text-xs text-[var(--az-muted)]">
            Si modifica{" "}
            {field.sourceHref ? (
              <Link href={field.sourceHref} className="underline hover:text-[var(--az-ink)]">
                {field.sourceLabel}
              </Link>
            ) : (
              <strong className="font-semibold text-[var(--az-ink)]">{field.sourceLabel}</strong>
            )}
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="mb-[7px] flex min-h-[23px] items-center gap-2">
        <Label htmlFor={`campo-${sectionKey}-${field.key}`} className="text-xs font-semibold text-[#43588e]">
          {field.label}
        </Label>
        <span className="ml-auto inline-flex items-center gap-[5px]">
          <PinToggleButton
            pinned={isCampoPinned(sectionKey, field.key)}
            onToggle={() => togglePinCampo(sectionKey, field.key, field.label)}
          />
          {consulente && (
            <VisibilityToggle label={field.label} visible={field.visibleToCompany} onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)} />
          )}
          {field.verificationStatus && (
            <FieldVerificationPopover sectionKey={sectionKey} field={field} disabled={mode === "EDIT"} />
          )}
        </span>
      </div>
      {field.dataType === "boolean" ? (
        <Select
          value={draftValue ? draftValue : "__non_disponibile__"}
          disabled={disabled}
          onValueChange={(value) => onChange?.(value === "__non_disponibile__" ? "" : value)}
        >
          <SelectTrigger id={`campo-${sectionKey}-${field.key}`} aria-invalid={Boolean(error)}>
            <SelectValue placeholder="Non disponibile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__non_disponibile__">Non disponibile</SelectItem>
            <SelectItem value="true">Sì</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      ) : field.dataType === "catalogo" || field.dataType === "scelta" ? (
        <Select
          value={draftValue ? draftValue : "__non_disponibile__"}
          disabled={disabled}
          onValueChange={(value) => onChange?.(value === "__non_disponibile__" ? "" : value)}
        >
          <SelectTrigger id={`campo-${sectionKey}-${field.key}`} aria-invalid={Boolean(error)} className="w-full">
            <SelectValue placeholder="Non disponibile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__non_disponibile__">Non disponibile</SelectItem>
            {field.options?.map((opzione) => (
              <SelectItem key={opzione.code} value={opzione.code}>
                {opzione.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : multiline ? (
        <Textarea
          id={`campo-${sectionKey}-${field.key}`}
          rows={2}
          value={draftValue ?? ""}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `errore-${sectionKey}-${field.key}` : undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <Input
          id={`campo-${sectionKey}-${field.key}`}
          type={field.dataType === "date" ? "date" : field.dataType === "importo" || field.dataType === "number" ? "number" : "text"}
          step={field.dataType === "importo" ? "0.01" : undefined}
          min={field.dataType === "importo" || field.dataType === "number" ? 0 : undefined}
          maxLength={field.dataType === "valuta" ? 3 : undefined}
          placeholder={field.dataType === "day-month" ? "GG/MM" : field.dataType === "valuta" ? "EUR" : undefined}
          value={draftValue ?? ""}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `errore-${sectionKey}-${field.key}` : undefined}
          onChange={(e) => onChange?.(field.dataType === "valuta" ? e.target.value.toUpperCase() : e.target.value)}
        />
      )}
      {error && (
        <p id={`errore-${sectionKey}-${field.key}`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
