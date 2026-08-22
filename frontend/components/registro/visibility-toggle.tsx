"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Occhietto di visibilità per singolo campo (§9.3 del prompt master):
 * visibile solo al Consulente, agisce sul campo, mai sui titoli di gruppo. */
export function VisibilityToggle({
  label,
  visible,
  onToggle,
  size = 22,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
  size?: number;
}) {
  const aria = visible ? `Nascondi ${label} all'azienda` : `Mostra ${label} all'azienda`;
  return (
    <button
      type="button"
      aria-pressed={visible}
      aria-label={aria}
      title={visible ? "Nascondi all'azienda" : "Mostra all'azienda"}
      onClick={onToggle}
      className={cn(
        "grid shrink-0 place-items-center rounded-[5px] hover:bg-[#edf4ff]",
        visible ? "text-[var(--az-blue)]" : "text-[#53678f]",
      )}
      style={{ width: size, height: size }}
    >
      {visible ? <EyeIcon className="size-[15px]" /> : <EyeOffIcon className="size-[15px]" />}
    </button>
  );
}
