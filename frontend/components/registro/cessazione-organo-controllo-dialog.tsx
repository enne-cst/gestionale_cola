"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo di conferma della Correzione 12 ("Nessun organo di controllo o
 * revisore"): il passaggio a questo assetto non deve mai cessare
 * silenziosamente sindaci/revisori ancora attivi (§ vincoli). Distinto da
 * `UnsavedChangesDialog` — qui confermare NON scarta la bozza, ripete lo
 * stesso salvataggio con il flag di conferma (il backend cessa gli
 * incarichi e salva la sezione nella stessa transazione). */
export function CessazioneOrganoControlloDialog() {
  const { state, cancelCessazioneOrganoControllo, confermaCessazioneOrganoControllo } = useWorkspace();
  const { cessazioneOrganoControllo: cessazione } = state;

  return (
    <Dialog open={cessazione !== null} onOpenChange={(open) => !open && cancelCessazioneOrganoControllo()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Cessare gli incarichi esistenti?
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              {cessazione?.messaggio}
            </DialogDescription>
          </div>
        </div>

        {cessazione?.error && <p className="text-sm text-destructive">{cessazione.error}</p>}

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={cancelCessazioneOrganoControllo}
            disabled={cessazione?.saving}
          >
            Annulla
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold hover:bg-[var(--az-blue-dark)]"
            onClick={confermaCessazioneOrganoControllo}
            disabled={cessazione?.saving}
          >
            {cessazione?.saving ? "Salvataggio…" : "Cessa e conferma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
