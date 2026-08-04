"use client";

import { PinToggleButton } from "@/components/pin-toggle-button";
import { usePanoramicaPin } from "@/lib/use-panoramica-pin";

/** Icona di riga per fissare/rimuovere un intero record (una sede, un
 * contatto...) dalla Panoramica del modulo, da usare nella colonna azioni
 * delle tabelle degli elenchi. */
export function PinRecordButton({
  modulo,
  sezioneSlug,
  recordId,
  etichetta,
  pinnedInitially,
}: {
  modulo: string;
  sezioneSlug: string;
  recordId: string;
  etichetta: string;
  pinnedInitially: boolean;
}) {
  const { pinned, isPending, toggle } = usePanoramicaPin({
    modulo,
    sezioneSlug,
    recordId,
    etichetta,
    pinnedInitially,
  });

  return <PinToggleButton pinned={pinned} disabled={isPending} onToggle={toggle} />;
}
