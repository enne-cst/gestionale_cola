"use client";

import { CheckCircle2Icon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/types/registro";

const ETICHETTA: Record<VerificationStatus, string> = {
  PENDING_VERIFICATION: "Da verificare",
  VERIFIED: "Verificata",
  REVISION_REQUIRED: "Da revisionare",
};

/** Indicatore di stato di verifica (§12.1), visibile solo al Consulente.
 * Solo lo stato "da verificare" è interattivo (apre il pop-up di verifica,
 * §12.3): verde e arancione mostrano solo tooltip/stato, come da mockup. */
export function VerificationIndicator({
  status,
  label,
  onOpen,
}: {
  status: VerificationStatus;
  label: string;
  onOpen?: () => void;
}) {
  const etichetta = label ? `${ETICHETTA[status]}: ${label}` : ETICHETTA[status];

  if (status === "PENDING_VERIFICATION") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={etichetta}
            onClick={onOpen}
            className="inline-flex size-5 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400"
          >
            <TriangleAlertIcon className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>{etichetta}</TooltipContent>
      </Tooltip>
    );
  }

  const stile =
    status === "VERIFIED"
      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      : "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400";
  const Icon = status === "VERIFIED" ? CheckCircle2Icon : RotateCcwIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={etichetta}
          className={cn("inline-flex size-5 items-center justify-center rounded-full", stile)}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>{etichetta}</TooltipContent>
    </Tooltip>
  );
}

export function VerificationLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <VerificationIndicator status="PENDING_VERIFICATION" label="" />
        Da verificare
      </span>
      <span className="flex items-center gap-1.5">
        <VerificationIndicator status="VERIFIED" label="" />
        Verificata
      </span>
      <span className="flex items-center gap-1.5">
        <VerificationIndicator status="REVISION_REQUIRED" label="" />
        Da revisionare
      </span>
    </div>
  );
}
