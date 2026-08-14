"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Controllo occhio per singolo campo (§13.1/§18): visibile solo al
 * Consulente, agisce sul campo, mai sui titoli di gruppo. */
export function VisibilityToggle({
  label,
  visible,
  onToggle,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const aria = visible ? `Nascondi ${label} all'azienda` : `Mostra ${label} all'azienda`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={aria}
          onClick={onToggle}
          className={cn("size-6", visible ? "text-primary" : "text-muted-foreground")}
        >
          {visible ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{aria}</TooltipContent>
    </Tooltip>
  );
}
