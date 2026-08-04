"use client";

import { PinIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function PinToggleButton({
  pinned,
  disabled,
  onToggle,
}: {
  pinned: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={pinned}
      title={pinned ? "Rimuovi dalla Panoramica" : "Aggiungi alla Panoramica"}
      className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
    >
      <PinIcon className={cn("size-3.5", pinned && "fill-primary text-primary")} />
    </button>
  );
}
