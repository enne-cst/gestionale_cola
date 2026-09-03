"use client";

import type { ReactNode } from "react";

import { AssicurazioniPanel } from "@/app/(app)/anagrafica/assicurazioni/assicurazioni-panel";
import { CompliancePanel } from "@/app/(app)/anagrafica/compliance-trasparenza/compliance-panel";
import { ContrattiRetePanel } from "@/app/(app)/anagrafica/contratti-rete/contratti-rete-panel";
import { DatiGeneraliPanel } from "@/app/(app)/anagrafica/dati-generali/dati-generali-panel";
import { FondiPanel } from "@/app/(app)/anagrafica/fondi-interprofessionali/fondi-panel";
import { FornitoriPanel } from "@/app/(app)/anagrafica/fornitori-materiali/fornitori-panel";
import { IndicatoriPanel } from "@/app/(app)/anagrafica/indicatori-economici/indicatori-panel";
import { LavoratoriPanel } from "@/app/(app)/anagrafica/lavoratori-autonomi/lavoratori-panel";
import { OutsourcingPanel } from "@/app/(app)/anagrafica/outsourcing/outsourcing-panel";
import { ProcedimentiPanel } from "@/app/(app)/anagrafica/procedimenti-legali/procedimenti-panel";
import { RipartizioneOrganicoPanel } from "@/app/(app)/anagrafica/ripartizione-organico/ripartizione-organico-panel";
import { SubappaltatoriPanel } from "@/app/(app)/anagrafica/subappaltatori/subappaltatori-panel";
import { VariazioniPanel } from "@/app/(app)/anagrafica/variazioni-organico/variazioni-panel";
import { VisitePanel } from "@/app/(app)/anagrafica/visite-enti-controllo/visite-panel";
import type { ElencoIso9001Key } from "@/lib/elenco-iso9001";

/** Sceglie il pannello giusto per una delle 14 sezioni ISO 9001 "a elenco"
 * (§ "falle tutte"): stesso ruolo di dispatch di `SectionOrCciaaPanel`, ma
 * verso i 14 pannelli client-fetched di questo gruppo invece che verso
 * `SectionContent`/`CciaaSectionPanel`. */
export function ElencoIso9001Panel({
  sectionKey,
  headerActions,
  onClose,
}: {
  sectionKey: ElencoIso9001Key;
  headerActions?: ReactNode;
  onClose?: () => void;
}) {
  switch (sectionKey) {
    case "fondi-interprofessionali":
      return <FondiPanel headerActions={headerActions} onClose={onClose} />;
    case "dati-generali":
      return <DatiGeneraliPanel headerActions={headerActions} onClose={onClose} />;
    case "outsourcing":
      return <OutsourcingPanel headerActions={headerActions} onClose={onClose} />;
    case "subappaltatori":
      return <SubappaltatoriPanel headerActions={headerActions} onClose={onClose} />;
    case "fornitori-materiali":
      return <FornitoriPanel headerActions={headerActions} onClose={onClose} />;
    case "lavoratori-autonomi":
      return <LavoratoriPanel headerActions={headerActions} onClose={onClose} />;
    case "ripartizione-organico":
      return <RipartizioneOrganicoPanel headerActions={headerActions} onClose={onClose} />;
    case "indicatori-economici":
      return <IndicatoriPanel headerActions={headerActions} onClose={onClose} />;
    case "variazioni-organico":
      return <VariazioniPanel headerActions={headerActions} onClose={onClose} />;
    case "assicurazioni":
      return <AssicurazioniPanel headerActions={headerActions} onClose={onClose} />;
    case "contratti-rete":
      return <ContrattiRetePanel headerActions={headerActions} onClose={onClose} />;
    case "compliance-trasparenza":
      return <CompliancePanel headerActions={headerActions} onClose={onClose} />;
    case "procedimenti-legali":
      return <ProcedimentiPanel headerActions={headerActions} onClose={onClose} />;
    case "visite-enti-controllo":
      return <VisitePanel headerActions={headerActions} onClose={onClose} />;
  }
}
