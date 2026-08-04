import { Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Modulo = {
  nome: string;
  href: string;
  /** Prefisso di route usato per capire se il modulo è quello attivo,
   * indipendentemente dalla sottopagina corrente. */
  basePath: string;
  icon: LucideIcon;
};

// Elenco dei moduli applicativi mostrati nella navbar laterale. Oggi solo
// Anagrafica Aziendale è sviluppato; i moduli futuri (Personale, Documenti,
// ...) si aggiungono qui, non ricreando la navbar.
export const MODULI: Modulo[] = [
  { nome: "Anagrafica Aziendale", href: "/anagrafica/panoramica", basePath: "/anagrafica", icon: Building2 },
];
