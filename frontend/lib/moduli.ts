import { Building2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Modulo = {
  nome: string;
  href: string;
  /** Prefisso di route usato per capire se il modulo è quello attivo,
   * indipendentemente dalla sottopagina corrente. */
  basePath: string;
  icon: LucideIcon;
};

// Elenco dei moduli applicativi mostrati nella navbar laterale. I moduli
// futuri (Documenti, ...) si aggiungono qui, non ricreando la navbar.
//
// NOTA: qui non c'è ancora nessun controllo sull'abbonamento (il backend
// gating `require_modulo` esiste, ma questa lista è statica e mostra
// sempre entrambe le voci a prescindere da cfg_moduli) — gap preesistente,
// non introdotto né risolto da questa aggiunta.
export const MODULI: Modulo[] = [
  { nome: "Anagrafica Aziendale", href: "/anagrafica/panoramica", basePath: "/anagrafica", icon: Building2 },
  { nome: "Personale", href: "/personale?view=people", basePath: "/personale", icon: Users },
];
