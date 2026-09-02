"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { FieldStatusButton } from "@/components/registro/field-verification-popover";
import { inviaVerificaPersonaleOccupazione } from "@/app/(app)/anagrafica/personale-occupazione/actions";
import { formatDateTime } from "@/lib/format";
import type { PersonaleOccupazioneRiepilogo } from "@/lib/types/anagrafica";

/** Popup di conferma della rilevazione più recente di "Personale e
 * occupazione" (§ Correzione 22 punto 21): stesso trattamento —
 * "conferma un intero record, non un valore" — di
 * `TitoloAbilitativoVerificationPopover`/`IncaricoVerificationPopover`,
 * riusando `app.core.verifica_riga` lato backend (nessun secondo sistema di
 * verifica). */
export function PersonaleOccupazioneVerificationPopover({
  riepilogo,
  consulente,
  onDecided,
  disabled = false,
}: {
  riepilogo: PersonaleOccupazioneRiepilogo;
  consulente: boolean;
  onDecided: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState(riepilogo.revisionNote ?? "");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const notaRef = useRef<HTMLTextAreaElement>(null);

  const status = riepilogo.verificationStatus ?? "PENDING_VERIFICATION";
  const isVerified = status === "VERIFIED";
  const isReview = status === "REVISION_REQUIRED";
  const etichettaStato = isVerified ? "Confermato" : isReview ? "Da revisionare" : "Da verificare";
  const nome = "Rilevazione più recente";

  function apri(v: boolean) {
    setOpen(v);
    if (v) setNota(riepilogo.revisionNote ?? "");
    else setErrore(null);
  }

  const notaMancante = nota.trim() === "";

  async function decidi(decision: "VERIFIED" | "REVISION_REQUIRED") {
    if (!riepilogo.rilevazione_id) return;
    if (decision === "REVISION_REQUIRED" && notaMancante) {
      setErrore("Inserisci una nota per richiedere la revisione: spiega cosa correggere.");
      notaRef.current?.focus();
      return;
    }
    setInvio(true);
    setErrore(null);
    const esito = await inviaVerificaPersonaleOccupazione(
      riepilogo.rilevazione_id,
      decision,
      nota.trim() || null,
      riepilogo.verificationVersion,
    );
    setInvio(false);
    if (esito.esito === "ok") {
      setOpen(false);
      onDecided();
    } else if (esito.esito === "conflitto") {
      setErrore("Il record è stato modificato nel frattempo: ricarica e riprova.");
    } else {
      setErrore("Impossibile salvare la decisione. Riprova.");
    }
  }

  const titoloPopup = !consulente
    ? `${nome}: ${etichettaStato}`
    : isVerified
      ? `${nome} confermata`
      : isReview
        ? `Revisione ${nome.toLowerCase()}`
        : `Verifica ${nome.toLowerCase()}`;

  return (
    <Popover open={!disabled && open} onOpenChange={disabled ? undefined : apri} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={`${nome}: ${etichettaStato}.${disabled ? "" : ` ${consulente ? "Apri gestione verifica" : "Visualizza stato e nota"}`}`}
          className={disabled ? "cursor-default opacity-70" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <FieldStatusButton status={status} label={nome} />
        </button>
      </PopoverTrigger>
      {open && typeof document !== "undefined"
        ? createPortal(<div className="fixed inset-0 z-40 bg-[#1c2b4f8f]" aria-hidden />, document.body)
        : null}
      <PopoverContent
        className="z-50 w-[356px] rounded-[11px] border-[#e2e7f0] p-[21px] shadow-[0_20px_55px_rgba(13,29,67,0.28)]"
        onEscapeKeyDown={() => setOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-[22px] flex items-center justify-between gap-3.5">
          <h3 className="text-[17px] font-bold text-[var(--az-ink)]">{titoloPopup}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Chiudi gestione verifica"
            className="grid size-8 shrink-0 place-items-center rounded-md text-[var(--az-ink)] hover:bg-[#f3f6fb]"
          >
            ×
          </button>
        </div>

        {isVerified && (
          <div className="mb-4 grid gap-[13px] rounded-lg border border-[#ccebdc] bg-[#f2fbf7] p-[13px]">
            <strong className="text-[13px] text-[var(--az-ink)]">Rilevazione confermata</strong>
            {(riepilogo.verifiedAt || riepilogo.verifiedBy) && (
              <p className="text-[11px] leading-snug text-[#526a8f]">
                Verificata il <strong className="font-bold text-[#263a68]">{formatDateTime(riepilogo.verifiedAt)}</strong>
                {riepilogo.verifiedBy && (
                  <>
                    {" "}
                    da <strong className="font-bold text-[#263a68]">{riepilogo.verifiedBy}</strong>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {isReview && (
          <div className="mb-4 rounded-lg border border-[#f6d3ad] bg-[#fff8ef] p-[13px]">
            <strong className="text-[13px] text-[var(--az-ink)]">Revisione richiesta</strong>
            <p className="mt-[3px] text-[11px] leading-snug text-[#526a8f]">In attesa dell&apos;aggiornamento.</p>
          </div>
        )}

        {consulente ? (
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-[#526aa3]">
              {isReview
                ? "Nota della revisione · obbligatoria"
                : isVerified
                  ? "Nota facoltativa"
                  : "Nota · obbligatoria per richiedere una revisione"}
            </span>
            <Textarea
              ref={notaRef}
              value={nota}
              onChange={(e) => {
                setNota(e.target.value);
                if (errore) setErrore(null);
              }}
              placeholder="Aggiungi una nota"
              rows={4}
              disabled={invio}
              className="min-h-[82px] rounded-[7px] border-[#c8d2e4] text-xs"
            />
          </label>
        ) : (
          <div className="grid gap-2">
            <span className="text-xs font-semibold text-[#526aa3]">Nota del consulente</span>
            <p className="min-h-[42px] rounded-[7px] border border-[#e6ebf3] bg-[#f8fafc] p-[13px] text-xs leading-snug text-[var(--az-ink)]">
              {riepilogo.revisionNote?.trim() ? riepilogo.revisionNote : "Nessuna nota."}
            </p>
          </div>
        )}

        {errore && <p className="mt-2 text-xs text-destructive">{errore}</p>}

        {consulente && (
          <div className="mt-[18px] grid grid-cols-2 gap-[11px]">
            <Button
              type="button"
              variant="outline"
              disabled={invio}
              onClick={() => decidi("REVISION_REQUIRED")}
              className="h-10 rounded-[7px] border-[#a9c2f5] text-xs font-bold text-[var(--az-blue)] hover:bg-[#f4f8ff]"
            >
              {isReview ? "Aggiorna richiesta" : "Richiedi revisione"}
            </Button>
            <Button
              type="button"
              disabled={invio}
              onClick={() => decidi("VERIFIED")}
              className="h-10 rounded-[7px] bg-[var(--az-blue)] text-xs font-bold shadow-[0_5px_14px_rgba(7,94,255,0.18)] hover:bg-[var(--az-blue-dark)]"
            >
              {isVerified ? "Salva nota" : isReview ? "Conferma correzione" : "Verifica"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
