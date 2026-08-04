"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { unpinRecordPanoramica, unpinVocePanoramica } from "@/lib/actions/panoramica";

export function RimuoviVoceButton({
  modulo,
  sezioneSlug,
  campo,
  recordId,
}: {
  modulo: string;
  sezioneSlug: string;
  campo?: string | null;
  recordId?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function rimuovi() {
    startTransition(async () => {
      if (campo) await unpinVocePanoramica(modulo, sezioneSlug, campo);
      else if (recordId) await unpinRecordPanoramica(modulo, sezioneSlug, recordId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={rimuovi}
      disabled={isPending}
      aria-label="Rimuovi dalla Panoramica"
      title="Rimuovi dalla Panoramica"
      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
    >
      <XIcon className="size-4" />
    </button>
  );
}
