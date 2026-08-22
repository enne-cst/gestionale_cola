"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo globale e bloccante per le bozze non salvate (§8.7 del prompt
 * master): stesse tre azioni, nello stesso ordine, in ogni punto di uscita
 * distruttiva. Il `×` del dialogo (gestito da DialogContent) equivale a
 * "Continua a modificare". */
export function UnsavedChangesDialog() {
  const { state, cancelConfirm, confirmDiscardAndExit, confirmSaveAndExit } = useWorkspace();
  const { confirm } = state;

  return (
    <Dialog open={confirm !== null} onOpenChange={(open) => !open && cancelConfirm()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Modifiche non salvate
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              Hai modificato questa sezione. Se chiudi senza salvare, le modifiche andranno perse.
            </DialogDescription>
          </div>
        </div>

        {confirm?.error && <p className="text-sm text-destructive">{confirm.error}</p>}

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1.2fr_1.05fr_0.88fr]">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={cancelConfirm}
            disabled={confirm?.saving}
          >
            Continua a modificare
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#f12b34] text-[13px] font-bold text-[#f12b34] hover:bg-[#fff1f1]"
            onClick={confirmDiscardAndExit}
            disabled={confirm?.saving}
          >
            Esci senza salvare
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold hover:bg-[var(--az-blue-dark)]"
            onClick={confirmSaveAndExit}
            disabled={confirm?.saving}
          >
            {confirm?.saving ? "Salvataggio…" : "Salva ed esci"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
