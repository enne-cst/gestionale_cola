"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangleIcon, CheckIcon, EyeOffIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FieldState } from "@/lib/types/registro";

const STATO_META = {
  VERIFIED: { icona: CheckIcon, colore: "bg-[var(--az-green)]", etichetta: "Confermato" },
  PENDING_VERIFICATION: { icona: AlertTriangleIcon, colore: "bg-[var(--az-red)]", etichetta: "Da verificare" },
  REVISION_REQUIRED: { icona: RotateCcwIcon, colore: "bg-[var(--az-orange)]", etichetta: "Da revisionare" },
} as const;

/** Indicatore/comando di stato del campo (§9/§10 del prompt master): cerchio
 * colorato + icona, sempre cliccabile per il Consulente nei tre stati (non
 * solo "Da verificare") — apre il popup di verifica ancorato al campo. */
export function FieldStatusButton({
  status,
  label,
  size = 21,
  className,
}: {
  status: keyof typeof STATO_META;
  label: string;
  size?: number;
  className?: string;
}) {
  const meta = STATO_META[status];
  const Icon = meta.icona;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-white transition-shadow hover:shadow-[0_0_0_4px_rgba(19,54,114,0.08)]",
        meta.colore,
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon className="size-[13px]" strokeWidth={2.6} />
      <span className="sr-only">{`${label}: ${meta.etichetta}`}</span>
    </span>
  );
}

/** Popup di verifica ancorato al campo (§9.4/§10): stesso componente nei
 * tre stati, nota sempre presente, azioni coerenti con lo stato corrente.
 * Sostituisce sia il vecchio indicatore non interattivo sia il popover
 * limitato al solo stato "Da verificare".
 *
 * Sola lettura per l'Azienda (§13 del prompt master: occhietto e decisioni
 * di verifica restano riservati al Consulente): l'Azienda vede comunque lo
 * stato e può aprire la nota, ma senza campo modificabile né azioni — le
 * serve soprattutto per capire cosa correggere quando un campo è "da
 * revisionare". */
export function FieldVerificationPopover({
  sectionKey,
  field,
  disabled = false,
}: {
  sectionKey: string;
  field: FieldState;
  // true mentre la scheda è in modalità modifica: lo stato di verifica non
  // è selezionabile finché non si esce dalla modifica (Annulla/Salva), sia
  // per i campi editabili sia per quelli derivati mostrati in sola lettura.
  disabled?: boolean;
}) {
  const { submitReview, ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState(field.revisionNote ?? "");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const notaRef = useRef<HTMLTextAreaElement>(null);

  const status = field.verificationStatus ?? "PENDING_VERIFICATION";
  const meta = STATO_META[status];
  const isVerified = status === "VERIFIED";
  const isReview = status === "REVISION_REQUIRED";

  function apri(v: boolean) {
    setOpen(v);
    if (v) setNota(field.revisionNote ?? "");
    else {
      setErrore(null);
    }
  }

  // La richiesta di revisione richiede sempre una nota non vuota (vincolo
  // di dominio: CHECK chk_sys_registro_stato_campi_nota_se_in_revisione,
  // database_struttura/Sistema/021_sys_registro_stato_campi.sql) — a
  // differenza della nota su un campo verificato, che resta facoltativa.
  const notaMancante = nota.trim() === "";

  async function decidi(decision: "VERIFIED" | "REVISION_REQUIRED") {
    if (decision === "REVISION_REQUIRED" && notaMancante) {
      setErrore("Inserisci una nota per richiedere la revisione: spiega all'azienda cosa correggere.");
      notaRef.current?.focus();
      return;
    }
    setInvio(true);
    setErrore(null);
    const esito = await submitReview(sectionKey, field.key, decision, nota.trim() || null, field.verificationVersion);
    setInvio(false);
    if (esito === "ok") {
      setOpen(false);
    } else if (esito === "conflict") {
      setErrore("Il campo è stato modificato nel frattempo: la sezione è stata ricaricata, riprova.");
    } else {
      setErrore("Impossibile salvare la decisione. Riprova.");
    }
  }

  const titolo = !consulente
    ? `${field.label}: ${meta.etichetta}`
    : isVerified
      ? `${field.label} verificata`
      : isReview
        ? `Revisione ${field.label}`
        : `Verifica ${field.label}`;

  return (
    <Popover open={!disabled && open} onOpenChange={disabled ? undefined : apri} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={`${field.label}: ${meta.etichetta}.${disabled ? "" : ` ${consulente ? "Apri gestione verifica" : "Visualizza stato e nota"}`}`}
          className={disabled ? "cursor-default opacity-70" : undefined}
        >
          <FieldStatusButton status={status} label={field.label} />
        </button>
      </PopoverTrigger>
      {open && typeof document !== "undefined"
        ? createPortal(<div className="fixed inset-0 z-40 bg-[#1c2b4f8f]" aria-hidden />, document.body)
        : null}
      <PopoverContent
        className="z-50 w-[356px] rounded-[11px] border-[#e2e7f0] p-[21px] shadow-[0_20px_55px_rgba(13,29,67,0.28)]"
        onEscapeKeyDown={() => setOpen(false)}
      >
        <div className="mb-[22px] flex items-center justify-between gap-3.5">
          <h3 className="text-[17px] font-bold text-[var(--az-ink)]">{titolo}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Chiudi gestione verifica"
            className="grid size-8 shrink-0 place-items-center rounded-md text-[var(--az-ink)] hover:bg-[#f3f6fb]"
          >
            ×
          </button>
        </div>

        <div className="mb-6 grid gap-2">
          <span className="text-xs font-semibold text-[#526aa3]">Valore attuale</span>
          <strong className="text-sm leading-snug break-words text-[var(--az-ink)]">{field.value ?? "—"}</strong>
        </div>

        {isVerified && (
          <div className="mb-4 grid gap-[13px] rounded-lg border border-[#ccebdc] bg-[#f2fbf7] p-[13px]">
            <div className="flex items-start gap-[11px]">
              <span className="grid size-[23px] shrink-0 place-items-center rounded-full bg-[var(--az-green)] text-white">
                <CheckIcon className="size-[15px]" />
              </span>
              <div className="grid gap-[3px]">
                <strong className="text-[13px] text-[var(--az-ink)]">Informazione confermata</strong>
                <span className="text-[11px] leading-snug text-[#526a8f]">Questo dato è già stato verificato.</span>
              </div>
            </div>
            {(field.verifiedAt || field.verifiedBy) && (
              <p className="text-[11px] leading-snug text-[#526a8f]">
                Verificata il <strong className="font-bold text-[#263a68]">{formatDateTime(field.verifiedAt)}</strong>
                {field.verifiedBy && (
                  <>
                    {" "}
                    da <strong className="font-bold text-[#263a68]">{field.verifiedBy}</strong>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {isReview && (
          <div className="mb-4 flex items-start gap-[11px] rounded-lg border border-[#f6d3ad] bg-[#fff8ef] p-[13px]">
            <span className="grid size-[23px] shrink-0 place-items-center rounded-full bg-[var(--az-orange)] text-white">
              <RotateCcwIcon className="size-[15px]" />
            </span>
            <div className="grid gap-[3px]">
              <strong className="text-[13px] text-[var(--az-ink)]">Revisione richiesta</strong>
              <span className="text-[11px] leading-snug text-[#526a8f]">In attesa dell&apos;aggiornamento da parte dell&apos;azienda.</span>
            </div>
          </div>
        )}

        {consulente ? (
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-[#526aa3]">
              {isReview ? "Nota della revisione · obbligatoria" : isVerified ? "Nota facoltativa" : "Nota · obbligatoria per richiedere una revisione"}
            </span>
            <Textarea
              ref={notaRef}
              value={nota}
              onChange={(e) => {
                setNota(e.target.value);
                if (errore) setErrore(null);
              }}
              placeholder="Aggiungi una nota per l'azienda"
              rows={4}
              disabled={invio}
              className="min-h-[82px] rounded-[7px] border-[#c8d2e4] text-xs"
            />
          </label>
        ) : (
          <div className="grid gap-2">
            <span className="text-xs font-semibold text-[#526aa3]">Nota del consulente</span>
            <p className="min-h-[42px] rounded-[7px] border border-[#e6ebf3] bg-[#f8fafc] p-[13px] text-xs leading-snug text-[var(--az-ink)]">
              {field.revisionNote?.trim() ? field.revisionNote : "Nessuna nota."}
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

/** Legenda dei tre stati, visibile sia al Consulente sia all'Azienda,
 * uguale nel drawer, nell'affiancamento e nella scheda a tutta larghezza
 * (§8.6/§9.1). La nota sui campi oscurati resta invece solo per il
 * Consulente: spiega una sua azione (l'occhietto), l'Azienda i campi
 * oscurati non li vede proprio, quindi la frase non le direbbe nulla. */
export function VerificationLegend() {
  const { ruolo } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  return (
    <div className="flex flex-nowrap items-center gap-x-[22px] gap-y-[7px] overflow-x-auto text-[10px] text-[#42578d]">
      <span className="inline-flex shrink-0 items-center gap-[7px]">
        <FieldStatusButton status="PENDING_VERIFICATION" label="" size={18} />
        Da verificare
      </span>
      <span className="inline-flex shrink-0 items-center gap-[7px]">
        <FieldStatusButton status="VERIFIED" label="" size={18} />
        Confermato
      </span>
      <span className="inline-flex shrink-0 items-center gap-[7px]">
        <FieldStatusButton status="REVISION_REQUIRED" label="" size={18} />
        Da revisionare
      </span>
      {consulente && (
        <span className="inline-flex shrink-0 items-center gap-[7px] text-[#516798]">
          <EyeOffIcon className="size-[15px] text-[#52688f]" />
          I campi oscurati non sono visibili all&apos;azienda
        </span>
      )}
    </div>
  );
}
