"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewPopover } from "@/components/registro/review-popover";
import { VerificationIndicator } from "@/components/registro/verification-indicator";
import { VisibilityToggle } from "@/components/registro/visibility-toggle";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/lib/types/registro";
import { formatDate } from "@/lib/format";

function formattaValore(field: FieldState): string {
  if (field.value === null || field.value === "") return "—";
  if (field.dataType === "date") return formatDate(field.value);
  return field.value;
}

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

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-md p-1.5", nascosto && "bg-muted/60")}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={`campo-${sectionKey}-${field.key}`} className="text-xs font-medium text-muted-foreground">
          {field.label}
        </Label>
        {consulente && (
          <VisibilityToggle
            label={field.label}
            visible={field.visibleToCompany}
            onToggle={() => toggleVisibility(sectionKey, field.key, !field.visibleToCompany)}
          />
        )}
        {consulente && field.verificationStatus && field.verificationStatus !== "PENDING_VERIFICATION" && (
          <VerificationIndicator status={field.verificationStatus} label={field.label} />
        )}
        {consulente && field.verificationStatus === "PENDING_VERIFICATION" && (
          <ReviewPopover sectionKey={sectionKey} field={field} />
        )}
      </div>

      {mode === "VIEW" || !field.editable ? (
        <span className="text-sm text-foreground">{formattaValore(field)}</span>
      ) : (
        <div className="flex flex-col gap-1">
          <Input
            id={`campo-${sectionKey}-${field.key}`}
            type={field.dataType === "date" ? "date" : "text"}
            placeholder={field.dataType === "day-month" ? "GG/MM" : undefined}
            value={draftValue ?? ""}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `errore-${sectionKey}-${field.key}` : undefined}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {error && (
            <p id={`errore-${sectionKey}-${field.key}`} className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
      {mode === "EDIT" && !field.editable && (
        <p className="text-xs text-muted-foreground">
          Si modifica dalla sezione{" "}
          <Link href="/anagrafica/sedi" className="underline hover:text-foreground">
            Sedi
          </Link>
          .
        </p>
      )}

      {consulente && field.revisionNote && field.verificationStatus === "REVISION_REQUIRED" && (
        <p className="text-xs text-orange-600 dark:text-orange-400">Nota: {field.revisionNote}</p>
      )}
    </div>
  );
}
