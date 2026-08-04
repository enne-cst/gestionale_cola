"use client";

import { useState, useTransition } from "react";

import {
  pinRecordPanoramica,
  pinVocePanoramica,
  unpinRecordPanoramica,
  unpinVocePanoramica,
} from "@/lib/actions/panoramica";

/** Stato e toggle condivisi da tutte le varianti di campo/riga "fissabile"
 * in Panoramica, per non ripetere la stessa logica di pin/unpin ovunque.
 * Va indicato esattamente uno tra `campo` (campo di una sezione singleton)
 * e `recordId` (intero record di una sezione a elenco). */
export function usePanoramicaPin({
  modulo,
  sezioneSlug,
  campo,
  recordId,
  etichetta,
  pinnedInitially,
}: {
  modulo: string;
  sezioneSlug: string;
  campo?: string;
  recordId?: string;
  etichetta: string;
  pinnedInitially: boolean;
}) {
  const [pinned, setPinned] = useState(pinnedInitially);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (pinned) {
        if (campo) await unpinVocePanoramica(modulo, sezioneSlug, campo);
        else if (recordId) await unpinRecordPanoramica(modulo, sezioneSlug, recordId);
      } else {
        if (campo) await pinVocePanoramica(modulo, sezioneSlug, campo, etichetta);
        else if (recordId) await pinRecordPanoramica(modulo, sezioneSlug, recordId, etichetta);
      }
      setPinned((p) => !p);
    });
  }

  return { pinned, isPending, toggle };
}
