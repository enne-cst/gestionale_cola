import { UserCog } from "lucide-react";

import { EsciAziendaButton } from "@/components/esci-azienda-button";

/** Avviso permanente quando un consulente sta operando dentro i dati di
 * un'azienda cliente: non deve poter essere scambiata per l'azienda propria
 * dell'utente, quindi resta visibile in ogni pagina del modulo, non solo
 * nella barra superiore. */
export function ImpersonificazioneBanner({ ragioneSociale }: { ragioneSociale: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-amber-500/10 px-6 py-2 text-sm text-amber-900 dark:text-amber-200">
      <span className="flex items-center gap-2">
        <UserCog className="size-4" />
        Stai operando come <strong className="font-semibold">{ragioneSociale}</strong>
      </span>
      <EsciAziendaButton />
    </div>
  );
}
