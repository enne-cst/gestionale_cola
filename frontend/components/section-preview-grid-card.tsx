import type { ReactNode } from "react";
import Link from "next/link";

/** Riquadro della griglia di una macro sezione soggetta ad abbonamento
 * (Organizzazione/Trend/Assicurazioni/Altre informazioni): stessa
 * visualizzazione delle card "Dati CCIAA" (icona, titolo, "N di N
 * informazioni presenti", "Visualizza dettagli") — vedi
 * `components/registro/cciaa-section-card.tsx`, di cui questa è la
 * controparte per le sezioni non ancora migrate al motore registro
 * campo-per-campo: apre la pagina dedicata della sezione con un link
 * invece del drawer del workspace (nessuno stato in `useWorkspace()` da
 * caricare per queste sezioni), e non mostra mai la riga a tre pallini
 * confermato/da verificare/da revisionare (nessuna verifica per campo
 * tracciata qui, §18 del protocollo — niente stati inventati). */
export function SectionPreviewGridCard({
  icon,
  title,
  presenti,
  totale,
  href,
}: {
  icon: ReactNode;
  title: string;
  presenti: number;
  totale: number;
  href: string;
}) {
  return (
    <article className="flex min-h-[164px] flex-col gap-3 rounded-[11px] border border-[#dce5f3] bg-white p-[15px_16px_14px] transition-[transform,box-shadow,border-color] hover:-translate-y-px hover:border-[#ccdaef] hover:shadow-[0_8px_20px_rgba(26,46,94,0.07)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-[var(--az-blue-soft)] text-[var(--az-blue)]">
          {icon}
        </span>
        <h3 className="min-w-0 text-[12.5px] font-extrabold text-[var(--az-ink)]">{title}</h3>
      </div>

      <div className="flex flex-col">
        <strong className="text-sm leading-none text-[var(--az-ink)]">
          {presenti} di {totale}
        </strong>
        <span className="mt-1 text-[11px] text-[var(--az-muted)]">informazioni presenti</span>
      </div>

      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-3.5 self-start pt-2 text-[12.5px] font-bold text-[var(--az-blue)] hover:text-[var(--az-blue-dark)]"
      >
        <span>Visualizza dettagli</span>
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m14 7 5 5-5 5" />
        </svg>
      </Link>
    </article>
  );
}
