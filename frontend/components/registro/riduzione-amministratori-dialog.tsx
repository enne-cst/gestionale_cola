"use client";

import { useEffect, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { TitolareAmministratore } from "@/lib/actions/registro";

/** Dialogo di riduzione di "Numero componenti" dell'organo amministrativo
 * pluripersonale (§ richiesta esplicita 31/08/2026), quando il nuovo valore
 * è inferiore agli amministratori già in carica: a differenza di
 * `RiduzioneSindaciEffettiviDialog` (che cessa automaticamente i più
 * recenti), qui l'utente sceglie ESPLICITAMENTE chi eliminare tra i
 * titolari attuali — la stessa identica cancellazione fisica del cestino
 * della tabella (mai una cessazione), eseguita in un'unica chiamata insieme
 * al nuovo valore. "Annulla" non ha nulla da disfare: finché non si conferma
 * qui, il backend non ha ancora scritto nulla. */
export function RiduzioneAmministratoriDialog({
  stato,
  salvando,
  errore,
  onAnnulla,
  onConferma,
}: {
  stato: { obiettivo: number; count: number; titolari: TitolareAmministratore[] } | null;
  salvando: boolean;
  errore: string | null;
  onAnnulla: () => void;
  onConferma: (incarichiDaEliminare: string[]) => void;
}) {
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelezionati(new Set());
  }, [stato]);

  function toggle(id: string, checked: boolean) {
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const count = stato?.count ?? 0;
  const pronto = selezionati.size === count;

  return (
    <Dialog open={stato !== null} onOpenChange={(open) => !open && onAnnulla()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Seleziona chi eliminare
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              Per ridurre il numero componenti a {stato?.obiettivo}, seleziona esattamente {count}{" "}
              {count === 1 ? "amministratore" : "amministratori"} da eliminare tra quelli attualmente in carica.
              L&apos;eliminazione è definitiva.
            </DialogDescription>
          </div>
        </div>

        <div className="flex max-h-[240px] flex-col gap-1 overflow-y-auto">
          {stato?.titolari.map((titolare) => (
            <label
              key={titolare.id}
              className="flex items-center gap-2.5 rounded-[7px] px-2 py-2 text-sm text-[var(--az-ink)] hover:bg-[#f6f9ff]"
            >
              <Checkbox
                checked={selezionati.has(titolare.id)}
                onCheckedChange={(checked) => toggle(titolare.id, checked === true)}
                disabled={salvando}
              />
              {titolare.nome}
            </label>
          ))}
        </div>

        {errore && <p className="text-sm text-destructive">{errore}</p>}

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={onAnnulla}
            disabled={salvando}
          >
            Annulla
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold hover:bg-[var(--az-blue-dark)]"
            onClick={() => onConferma([...selezionati])}
            disabled={salvando || !pronto}
          >
            {salvando ? "Eliminazione…" : "Conferma eliminazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
