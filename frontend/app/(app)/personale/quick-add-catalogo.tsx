"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Mansioni e reparti sono cataloghi per azienda che partono vuoti (§22.4:
 * ogni azienda definisce il proprio elenco, nessun valore precaricato) —
 * senza questo, il form "Nuova persona" sarebbe inutilizzabile su
 * un'installazione nuova. Aggiunta rapida inline, non una pagina di
 * gestione catalogo dedicata (fuori scope Fase 1). */
export function QuickAddCatalogo({
  etichetta,
  onCreate,
}: {
  etichetta: string;
  onCreate: (denominazione: string) => Promise<boolean>;
}) {
  const [attivo, setAttivo] = useState(false);
  const [valore, setValore] = useState("");
  const [creando, setCreando] = useState(false);

  if (!attivo) {
    return (
      <button
        type="button"
        onClick={() => setAttivo(true)}
        className="flex items-center gap-1 self-start text-xs text-primary hover:underline"
      >
        <PlusIcon className="size-3" /> Nuova {etichetta}
      </button>
    );
  }

  return (
    <div className="flex gap-1.5">
      <Input
        autoFocus
        value={valore}
        onChange={(e) => setValore(e.target.value)}
        placeholder={`Nome ${etichetta}`}
        className="h-8 text-sm"
      />
      <Button
        type="button"
        size="sm"
        disabled={!valore.trim() || creando}
        onClick={async () => {
          setCreando(true);
          const ok = await onCreate(valore.trim());
          setCreando(false);
          if (ok) {
            setValore("");
            setAttivo(false);
          }
        }}
      >
        Aggiungi
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAttivo(false)}>
        Annulla
      </Button>
    </div>
  );
}
