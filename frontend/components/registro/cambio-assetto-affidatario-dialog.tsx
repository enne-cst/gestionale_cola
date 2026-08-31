"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/registro/workspace-provider";

/** Dialogo di conferma della Correzione 15: cambiare "Revisione legale
 * affidata a" mentre l'assetto di controllo in carica è "Revisore legale
 * persona fisica" (o, in futuro, un'altra configurazione "revisore esterno
 * standalone") aggiorna anche "Assetto di controllo in carica" per restare
 * coerente — SENZA cancellare nessun altro campo della bozza, a differenza
 * di `CancellazioneConfigurazioneDialog` (che invece azzera tutto verso
 * "Nessun organo di controllo"). Nessuna chiamata al backend qui: la
 * conferma applica una mutazione alla sola bozza
 * (`confermaCambioAssettoAffidatario`), il cambiamento diventa definitivo
 * solo al successivo "Salva modifiche". */
export function CambioAssettoAffidatarioDialog() {
  const { state, cancelCambioAssettoAffidatario, confermaCambioAssettoAffidatario } = useWorkspace();
  const { cambioAssettoAffidatario } = state;

  return (
    <Dialog open={cambioAssettoAffidatario !== null} onOpenChange={(open) => !open && cancelCambioAssettoAffidatario()}>
      <DialogContent showCloseButton className="rounded-[10px] border-[#dbe3f0] p-[31px_34px_32px] shadow-[0_22px_70px_rgba(7,20,57,0.24)] sm:max-w-[594px]">
        <div className="flex items-start gap-3">
          <TriangleAlertIcon className="mt-0.5 size-[25px] shrink-0 text-[#f59a08]" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-[21px] font-extrabold tracking-tight text-[var(--az-ink)]">
              Cambiare l&apos;assetto di controllo?
            </DialogTitle>
            <DialogDescription className="text-sm leading-[1.7] text-[#41558c]">
              Selezionando questo affidatario, &quot;Assetto di controllo in carica&quot; verrà aggiornato a &quot;
              {cambioAssettoAffidatario?.nuovoAssettoLabel}&quot;. I dati già inseriti non andranno persi.
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-[46px] rounded-[7px] border-[#cbd6e8] text-[13px] font-bold text-[var(--az-ink)]"
            onClick={cancelCambioAssettoAffidatario}
          >
            Annulla
          </Button>
          <Button
            type="button"
            className="h-[46px] rounded-[7px] bg-[var(--az-blue)] text-[13px] font-bold hover:bg-[var(--az-blue-dark)]"
            onClick={confermaCambioAssettoAffidatario}
          >
            Cambia assetto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
