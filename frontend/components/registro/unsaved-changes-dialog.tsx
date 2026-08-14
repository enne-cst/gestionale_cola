"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo globale e bloccante per le bozze non salvate (§10): stesse tre
 * azioni, nello stesso ordine, in ogni punto di uscita distruttiva. Il `×`
 * del dialogo (gestito da DialogContent) equivale a "Continua a modificare". */
export function UnsavedChangesDialog() {
  const { state, cancelConfirm, confirmDiscardAndExit, confirmSaveAndExit } = useWorkspace();
  const { confirm } = state;

  return (
    <Dialog open={confirm !== null} onOpenChange={(open) => !open && cancelConfirm()}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-orange-500" />
          <div className="flex flex-col gap-2">
            <DialogTitle>Modifiche non salvate</DialogTitle>
            <DialogDescription>
              Hai modificato questa sezione. Se chiudi senza salvare, le modifiche andranno perse.
            </DialogDescription>
          </div>
        </div>

        {confirm?.error && <p className="text-sm text-destructive">{confirm.error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={cancelConfirm} disabled={confirm?.saving}>
            Continua a modificare
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDiscardAndExit} disabled={confirm?.saving}>
            Esci senza salvare
          </Button>
          <Button type="button" onClick={confirmSaveAndExit} disabled={confirm?.saving}>
            {confirm?.saving ? "Salvataggio…" : "Salva ed esci"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
