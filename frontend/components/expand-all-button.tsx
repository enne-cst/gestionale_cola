"use client";

import { FoldVerticalIcon, UnfoldVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COMPRIMI_TUTTE_EVENT, ESPANDI_TUTTE_EVENT } from "@/lib/anagrafica-sezioni";

export function ExpandAllButton() {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => window.dispatchEvent(new Event(ESPANDI_TUTTE_EVENT))}
      >
        <UnfoldVerticalIcon className="size-4" />
        Espandi tutte
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => window.dispatchEvent(new Event(COMPRIMI_TUTTE_EVENT))}
      >
        <FoldVerticalIcon className="size-4" />
        Comprimi tutte
      </Button>
    </div>
  );
}
