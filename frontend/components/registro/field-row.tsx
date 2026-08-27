"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldVerificationPopover } from "@/components/registro/field-verification-popover";
import { VisibilityToggle } from "@/components/registro/visibility-toggle";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/lib/types/registro";
import { formatDate, formatDecimal } from "@/lib/format";

function formattaValore(field: FieldState): string {
  if (field.value === null || field.value === "") return "—";
  if (field.dataType === "date") return formatDate(field.value);
  if (field.dataType === "importo") return formatDecimal(field.value);
  if (field.dataType === "boolean") return field.value === "true" ? "Sì" : field.value === "false" ? "No" : "—";
  return field.value;
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
}: {
  sectionKey: string;
  field: FieldState;
  mode: "VIEW" | "EDIT";
  draftValue?: string | null;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const { ruolo, toggleVisibility } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const nascosto = consulente && !field.visibleToCompany;

  if (mode === "VIEW" || !field.editable) {
    const derivatoInModifica = mode === "EDIT" && !field.editable;
    return (
      <div
        className={cn(
          "relative -m-2 min-h-[62px] rounded-[7px] p-2",
          nascosto && "bg-[#f0f2f5]",
          derivatoInModifica && "opacity-60",
        )}
      >
        <dt className="flex items-center gap-[7px]">
          <span className="text-[13px] font-medium text-[#536a9f]">{field.label}</span>
          {consulente && <VisibilityToggle label={field.label} visible={field.visibleToCompany} onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)} />}
        </dt>
        <dd className="mt-[9px] flex min-h-5 items-center gap-[9px]">
          <span className="min-w-0 text-sm font-bold break-words text-[var(--az-ink)]">{formattaValore(field)}</span>
          {field.verificationStatus && (
            <FieldVerificationPopover sectionKey={sectionKey} field={field} disabled={mode === "EDIT"} />
          )}
        </dd>
        {derivatoInModifica && field.sourceLabel && (
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
        {(consulente || field.verificationStatus) && (
          <span className="ml-auto inline-flex items-center gap-[5px]">
            {consulente && (
              <VisibilityToggle label={field.label} visible={field.visibleToCompany} onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)} />
            )}
            {field.verificationStatus && (
            <FieldVerificationPopover sectionKey={sectionKey} field={field} disabled={mode === "EDIT"} />
          )}
          </span>
        )}
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
