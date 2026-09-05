import type { CciaaSectionCardStato } from "@/components/registro/cciaa-section-card";

/** Contatore compatto confermate/da verificare/da revisionare per una macro
 * sezione (§ richiesta esplicita 05/09/2026): stessa aggregazione mostrata
 * per esteso su ogni card sottostante, qui solo pallino + numero — sostituisce
 * la vecchia dicitura "N di N sezioni completate" nell'intestazione. */
export function MacroStatoBadge({ stato }: { stato: CciaaSectionCardStato }) {
  return (
    <span className="inline-flex items-center gap-3 text-xs font-semibold">
      <span className="inline-flex items-center gap-[5px] text-[#08a77e]">
        <span className="inline-block size-2 shrink-0 rounded-full bg-[#08a77e]" aria-hidden="true" />
        {stato.confermate}
      </span>
      <span className="inline-flex items-center gap-[5px] text-[#d7192d]">
        <span className="inline-block size-2 shrink-0 rounded-full bg-[#d7192d]" aria-hidden="true" />
        {stato.daVerificare}
      </span>
      <span className="inline-flex items-center gap-[5px] text-[#ee7203]">
        <span className="inline-block size-2 shrink-0 rounded-full bg-[#ee7203]" aria-hidden="true" />
        {stato.daRevisionare}
      </span>
    </span>
  );
}
