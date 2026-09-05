"use client";

import { FieldVerificationPopover } from "@/components/registro/field-verification-popover";
import { PinToggleButton } from "@/components/pin-toggle-button";
import { VisibilityToggle } from "@/components/registro/visibility-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { FieldState } from "@/lib/types/registro";

/** Ricompone descrizione + data in un unico testo, identico al prototipo
 * HTML di riferimento (cciaaSections "activities", campo "Attività presso
 * la sede legale": un solo valore, es. "Lavori generali di costruzione
 * edifici dal 18/12/2007") — mai due valori troncati insieme senza nesso. */
function testoRicomposto(descrizione: string | null, data: string | null): string {
  if (descrizione && data) return `${descrizione} dal ${formatDate(data)}`;
  if (descrizione) return descrizione;
  if (data) return `Dal ${formatDate(data)}`;
  return "—";
}

/** "Attività presso la sede legale" + "Data inizio attività presso la
 * sede" (§ Correzione 19): due colonne separate in ana_attivita_esercitata
 * (mai un unico testo storicizzato, per poter interrogare/ordinare sulla
 * data), ma UN SOLO campo nell'interfaccia — identica al prototipo HTML di
 * riferimento per questa sezione, "una serie di campi compilabili" senza
 * righe aggiuntive rispetto ad esso. In sola lettura mostra il testo
 * ricomposto; in modifica espone comunque i due input separati (la
 * ricomposizione riguarda solo la lettura, § richiesta esplicita: "il
 * database" resta separato). Sostituisce, per questi 2 field.key e solo
 * per la sezione "attivita-economica", il FieldRow generico — vedi
 * `section-content.tsx`.
 *
 * § Correzione grafica (§3): reso un blocco composto a tutta larghezza,
 * distinto da un leggero sfondo azzurro (--az-blue-soft) e da un bordo
 * sottile — solo presentazione, nessun cambio di identificativo, valore,
 * visibilità o verifica. In modifica i due input sono affiancati 70/30
 * (descrizione/data) invece che impilati verticalmente. */
export function AttivitaSedeLegaleField({
  sectionKey,
  fieldDescrizione,
  fieldData,
  mode,
  draftDescrizione,
  draftData,
  erroreDescrizione,
  erroreData,
  disabled,
  onChangeDescrizione,
  onChangeData,
}: {
  sectionKey: string;
  fieldDescrizione: FieldState;
  fieldData: FieldState;
  mode: "VIEW" | "EDIT";
  draftDescrizione?: string | null;
  draftData?: string | null;
  erroreDescrizione?: string;
  erroreData?: string;
  disabled?: boolean;
  onChangeDescrizione?: (value: string) => void;
  onChangeData?: (value: string) => void;
}) {
  const { ruolo, toggleVisibility, isCampoPinned, togglePinCampo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const nascosto = consulente && !fieldDescrizione.visibleToCompany;

  const titolo = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-[#43588e]">{fieldDescrizione.label}</span>
      <span className="ml-auto inline-flex items-center gap-[5px]">
        <PinToggleButton
          pinned={isCampoPinned(sectionKey, fieldDescrizione.key)}
          onToggle={() => togglePinCampo(sectionKey, fieldDescrizione.key, fieldDescrizione.label)}
        />
        {consulente && (
          <VisibilityToggle
            label={fieldDescrizione.label}
            visible={fieldDescrizione.visibleToCompany}
            onToggle={() => toggleVisibility(sectionKey, fieldDescrizione.key, !fieldDescrizione.visibleToCompany)}
          />
        )}
        {fieldDescrizione.verificationStatus && (
          <FieldVerificationPopover sectionKey={sectionKey} field={fieldDescrizione} disabled={mode === "EDIT"} />
        )}
      </span>
    </div>
  );

  if (mode === "VIEW" || !fieldDescrizione.editable) {
    return (
      <div
        className={cn(
          "rounded-[9px] border border-[#cfe0fb] bg-[var(--az-blue-soft)] p-3",
          nascosto && "border-[#dde1e8] bg-[#f0f2f5]",
        )}
      >
        {titolo}
        <p className="mt-2 min-h-5 text-sm font-bold break-words text-[var(--az-ink)]">
          {testoRicomposto(fieldDescrizione.value, fieldData.value)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[9px] border border-[#cfe0fb] bg-[var(--az-blue-soft)] p-3">
      {titolo}
      <div className="mt-2 grid grid-cols-[7fr_3fr] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`campo-${sectionKey}-${fieldDescrizione.key}`} className="text-xs font-medium text-[#7285ab]">
            Descrizione dell&apos;attività
          </Label>
          <Input
            id={`campo-${sectionKey}-${fieldDescrizione.key}`}
            type="text"
            placeholder="Descrizione dell'attività"
            value={draftDescrizione ?? ""}
            disabled={disabled}
            aria-invalid={Boolean(erroreDescrizione)}
            onChange={(e) => onChangeDescrizione?.(e.target.value)}
          />
          {erroreDescrizione && <p className="text-xs text-destructive">{erroreDescrizione}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`campo-${sectionKey}-${fieldData.key}`} className="text-xs font-medium text-[#7285ab]">
            Data di inizio
          </Label>
          <Input
            id={`campo-${sectionKey}-${fieldData.key}`}
            type="date"
            value={draftData ?? ""}
            disabled={disabled}
            aria-invalid={Boolean(erroreData)}
            onChange={(e) => onChangeData?.(e.target.value)}
          />
          {erroreData && <p className="text-xs text-destructive">{erroreData}</p>}
        </div>
      </div>
    </div>
  );
}
