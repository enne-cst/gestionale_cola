"use client";

import { GripVerticalIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { riordinaPanoramica } from "@/lib/actions/panoramica";

import { RimuoviVoceButton } from "./rimuovi-voce-button";
import type { PanoramicaItem } from "./types";

/** Elenco unico e trascinabile delle voci fissate in Panoramica, a
 * prescindere dalla sezione di provenienza (indicata da un'etichetta per
 * riga). Drag-and-drop nativo HTML5, senza librerie aggiuntive: per un
 * singolo elenco lineare come questo è sufficiente. */
export function PanoramicaLista({ modulo, iniziali }: { modulo: string; iniziali: PanoramicaItem[] }) {
  const [items, setItems] = useState(iniziali);
  const [trascinato, setTrascinato] = useState<string | null>(null);

  function sposta(sorgenteId: string, destinazioneId: string) {
    if (sorgenteId === destinazioneId) return;

    const indiceSorgente = items.findIndex((i) => i.id === sorgenteId);
    const indiceDestinazione = items.findIndex((i) => i.id === destinazioneId);
    if (indiceSorgente === -1 || indiceDestinazione === -1) return;

    const nuovi = [...items];
    const [spostato] = nuovi.splice(indiceSorgente, 1);
    nuovi.splice(indiceDestinazione, 0, spostato);

    setItems(nuovi);
    // Salvataggio "fire and forget": l'ordine visivo è già aggiornato
    // localmente, non serve attendere la risposta per continuare.
    void riordinaPanoramica(
      modulo,
      nuovi.map((i) => i.id),
    );
  }

  return (
    <div className="flex max-w-2xl flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setTrascinato(item.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (trascinato) sposta(trascinato, item.id);
            setTrascinato(null);
          }}
          onDragEnd={() => setTrascinato(null)}
          className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
          style={{ opacity: trascinato === item.id ? 0.4 : 1 }}
        >
          <GripVerticalIcon className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />

          <div className="flex flex-1 items-center justify-between gap-4">
            {item.disponibile ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{item.titolo}</span>
                <span className="text-xs text-muted-foreground">{item.sottotitolo}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground line-through">{item.titolo}</span>
                <span className="text-xs text-muted-foreground">Non più disponibile</span>
              </div>
            )}
            <Badge variant="secondary" className="shrink-0">
              {item.sezioneTitolo}
            </Badge>
          </div>

          <RimuoviVoceButton
            modulo={item.modulo}
            sezioneSlug={item.sezioneSlug}
            campo={item.campo}
            recordId={item.recordId}
          />
        </div>
      ))}
    </div>
  );
}
