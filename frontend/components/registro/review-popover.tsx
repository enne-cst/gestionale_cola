"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { VerificationIndicator } from "@/components/registro/verification-indicator";
import type { FieldState } from "@/lib/types/registro";

/** Pop-up di verifica ancorato al campo (§12.3): sfondo attenuato e non
 * interattivo (overlay portato su document.body, Popover in modalità
 * `modal` per il focus trap), posizionamento automatico a cura di Radix
 * Popover in base allo spazio disponibile. */
export function ReviewPopover({ sectionKey, field }: { sectionKey: string; field: FieldState }) {
  const { submitReview } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState("");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  function chiudi() {
    setOpen(false);
    setNota("");
    setErrore(null);
  }

  async function decidi(decision: "VERIFIED" | "REVISION_REQUIRED") {
    setInvio(true);
    setErrore(null);
    const esito = await submitReview(sectionKey, field.key, decision, nota.trim() || null, field.verificationVersion);
    setInvio(false);
    if (esito === "ok") {
      chiudi();
    } else if (esito === "conflict") {
      setErrore("Il campo è stato modificato nel frattempo: la sezione è stata ricaricata, riprova.");
    } else {
      setErrore("Impossibile salvare la decisione. Riprova.");
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setNota("");
          setErrore(null);
        }
      }}
      modal
    >
      <PopoverTrigger asChild>
        <span>
          <VerificationIndicator status="PENDING_VERIFICATION" label={field.label} onOpen={() => setOpen(true)} />
        </span>
      </PopoverTrigger>
      {open && typeof document !== "undefined"
        ? createPortal(<div className="fixed inset-0 z-40 bg-black/40" aria-hidden />, document.body)
        : null}
      <PopoverContent className="z-50 w-80" onEscapeKeyDown={chiudi}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Verifica {field.label}</h3>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={chiudi}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Valore attuale</span>
          <span className="text-sm text-foreground">{field.value ?? "—"}</span>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label htmlFor={`nota-${field.key}`} className="text-xs font-medium text-muted-foreground">
            Nota facoltativa
          </label>
          <Textarea
            id={`nota-${field.key}`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Aggiungi una nota per l'azienda"
            rows={3}
            disabled={invio}
          />
        </div>

        {errore && <p className="mt-2 text-xs text-destructive">{errore}</p>}

        <div className="mt-3 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={invio} onClick={() => decidi("REVISION_REQUIRED")}>
            Richiedi revisione
          </Button>
          <Button type="button" size="sm" disabled={invio} onClick={() => decidi("VERIFIED")}>
            Verifica
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
