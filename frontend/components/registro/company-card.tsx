import { CheckIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CompanyCardStato = "verificato" | "completato" | "incompleto";

const STATO_META: Record<CompanyCardStato, { className: string; etichetta: string; icona: boolean }> = {
  verificato: { className: "bg-[var(--az-green)] text-white", etichetta: "Completato e verificato", icona: true },
  completato: { className: "bg-[var(--az-orange)] text-white", etichetta: "Completato, da verificare", icona: true },
  incompleto: { className: "bg-[var(--az-red)]", etichetta: "Da completare", icona: false },
};

/** Indicatore di stato della sezione: una sola spunta nell'angolo del
 * riquadro invece del badge testuale precedente (si sovrapponeva al
 * titolo quando questo andava a capo). Verde = completo e confermato dal
 * consulente, arancione = completo ma non ancora tutto verificato, rosso
 * (pallino pieno, senza spunta) = mancano informazioni o dati non validi. */
function StatoIndicator({ stato }: { stato: CompanyCardStato }) {
  const meta = STATO_META[stato];
  return (
    <span
      className={cn("grid size-5 shrink-0 place-items-center rounded-full", meta.className)}
      role="img"
      aria-label={meta.etichetta}
      title={meta.etichetta}
    >
      {meta.icona && <CheckIcon className="size-3" strokeWidth={3} />}
    </span>
  );
}

/** Card di anteprima nella griglia della macrosezione "Informazioni
 * societarie" (§8.1/§28.2 del prompt master): stessa card per la sezione
 * abilitata al registro campo-per-campo (Identificazione camerale, che apre
 * il workspace) e per le altre sezioni della stessa macrosezione (che
 * restano normali link di navigazione, invariati nel comportamento). */
export function CompanyCard({
  icon: Icon,
  title,
  stato,
  details,
  actionLabel,
  href,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  stato: CompanyCardStato;
  details: [string, ReactNode][] | null;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}) {
  const azioneClassName =
    "mt-auto inline-flex cursor-pointer items-center gap-3.5 self-start pt-2 text-[12.5px] font-bold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]";
  const azione = (
    <>
      <span>{actionLabel}</span>
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </svg>
    </>
  );

  return (
    <article className="relative flex min-h-[202px] flex-col rounded-[11px] border border-[var(--az-border)] bg-[rgba(255,255,255,0.94)] p-[15px_16px_14px] transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-[#ccdaef] hover:shadow-[0_8px_20px_rgba(26,46,94,0.07)]">
      <span className="absolute top-3 right-3">
        <StatoIndicator stato={stato} />
      </span>

      <div className="flex min-w-0 items-center gap-2.5 pr-7">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-[var(--az-blue-soft)] text-[var(--az-blue)]">
          <Icon className="size-[18px]" />
        </span>
        <h3 className="min-w-0 text-[12.5px] font-extrabold text-[var(--az-ink)]">{title}</h3>
      </div>

      {details ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="mb-1 text-[11.5px] text-[var(--az-muted)]">{label}</dt>
              <dd className="text-[11.5px] font-bold break-words text-[var(--az-ink)]">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-[26px] text-[12.5px] text-[var(--az-muted)]">Nessun dato inserito ancora.</p>
      )}

      {href ? (
        <Link href={href} className={azioneClassName}>
          {azione}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={azioneClassName}>
          {azione}
        </button>
      )}
    </article>
  );
}
