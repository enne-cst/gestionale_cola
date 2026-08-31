"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo di conferma della Correzione 14 ("Collegio sindacale", riduzione
 * di "Sindaci effettivi" da 5 a 3): stesso pattern di
 * `CessazioneOrganoControlloDialog` — confermare NON scarta la bozza,
 * ripete lo stesso salvataggio con il flag di conferma (il backend cessa
 * gli incarichi eccedenti e salva la sezione nella stessa transazione). */
export function RiduzioneSindaciEffettiviDialog() {
  const { state, cancelRiduzioneSindaciEffettivi, confermaRiduzioneSindaciEffettivi } = useWorkspace();
  const { riduzioneSindaciEffettivi: riduzione } = state;

  return (
    <Dialog open={riduzione !== null} onOpenChange={(open) => !open && cancelRiduzioneSindaciEffettivi()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Cessare i sindaci effettivi eccedenti?
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              {riduzione?.messaggio}
            </DialogDescription>
          </div>
        </div>

        {riduzione?.error && <p className="text-sm text-destructive">{riduzione.error}</p>}

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={cancelRiduzioneSindaciEffettivi}
            disabled={riduzione?.saving}
          >
            Annulla
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold hover:bg-[var(--az-blue-dark)]"
            onClick={confermaRiduzioneSindaciEffettivi}
            disabled={riduzione?.saving}
          >
            {riduzione?.saving ? "Salvataggio…" : "Cessa e conferma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
