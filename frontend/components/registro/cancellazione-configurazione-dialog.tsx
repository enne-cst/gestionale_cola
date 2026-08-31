"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo di conferma richiesto esplicitamente dall'utente (31/08/2026):
 * a differenza del principio generale "il cambio di configurazione non
 * elimina dati" (§ Correzione 11/12), scegliere "Nessun organo di
 * controllo o revisore" per la sezione Organi di controllo CANCELLA per
 * davvero le informazioni della configurazione precedente — ma solo dopo
 * conferma esplicita, chiesta subito al momento della scelta (non solo al
 * salvataggio). Nessuna chiamata al backend qui: la conferma applica una
 * mutazione alla sola bozza (`confermaCancellazioneConfigurazione`), la
 * cancellazione diventa definitiva solo al successivo "Salva modifiche",
 * come per qualunque altro campo modificato. */
export function CancellazioneConfigurazioneDialog() {
  const { state, cancelCancellazioneConfigurazione, confermaCancellazioneConfigurazione } = useWorkspace();
  const { cancellazioneConfigurazione } = state;

  return (
    <Dialog open={cancellazioneConfigurazione !== null} onOpenChange={(open) => !open && cancelCancellazioneConfigurazione()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Eliminare le informazioni della configurazione?
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              Passando a &quot;Nessun organo di controllo o revisore&quot; le informazioni della configurazione
              attuale (funzioni dell&apos;organo interno, revisione legale affidata a, titolo della nomina, durata
              dell&apos;incarico, numero componenti) verranno cancellate al salvataggio. Vuoi continuare?
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={cancelCancellazioneConfigurazione}
          >
            Annulla
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#f12b34] text-[13px] font-bold text-[#f12b34] hover:bg-[#fff1f1]"
            onClick={confermaCancellazioneConfigurazione}
          >
            Sì, elimina e continua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
