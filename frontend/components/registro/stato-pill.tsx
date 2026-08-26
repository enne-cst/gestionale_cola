import { cn } from "@/lib/utils";

const ETICHETTA_COMPLETAMENTO: Record<string, { testo: string; completa: boolean }> = {
  NOT_STARTED: { testo: "Da completare", completa: false },
  IN_PROGRESS: { testo: "Da completare", completa: false },
  COMPLETE: { testo: "Completa", completa: true },
};

/** Indicatore di completamento di una sezione — sempre inline col titolo
 * che lo precede (mai un elemento flex a fianco): deve seguire l'ultima
 * parola del titolo e andare a capo con essa se il titolo va a capo.
 * Condiviso da `SectionContent` (titolo della sezione pura o del blocco
 * embedded) e `CciaaSectionPanel` (titolo della card composita, quando la
 * sezione che rappresenta ha un solo gruppo omonimo — vedi
 * `sottotitoloDuplicato` in entrambi i file). */
export function StatoPill({ status }: { status: string }) {
  const meta = ETICHETTA_COMPLETAMENTO[status];
  return (
    <span
      className={cn(
        "ml-2 inline-flex min-h-[30px] items-center rounded-full px-3.5 align-middle text-xs font-semibold",
        meta.completa ? "bg-[var(--az-green-soft)] text-[#007d5d]" : "bg-[var(--az-orange-soft)] text-[#c35a00]",
      )}
    >
      {meta.testo}
    </span>
  );
}
