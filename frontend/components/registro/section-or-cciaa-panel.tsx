"use client";

import type { ReactNode } from "react";

import { CciaaSectionPanel } from "@/components/registro/cciaa-section-panel";
import { ElencoIso9001Panel } from "@/components/registro/elenco-iso9001-panel";
import { SectionContent } from "@/components/registro/section-content";
import { isCciaaVistaKey } from "@/lib/cciaa-viste";
import { isElencoIso9001Key } from "@/lib/elenco-iso9001";

/** Sceglie tra la sezione a registro "pura" (Informazioni societarie,
 * Capitale sociale, ...) e il pannello composito di una card CCIAA (Sede,
 * Statuto, Soci, ...): stesso `sectionKey` generico del workspace, la
 * differenza è tutta qui, non nello stato del provider. Estratto da
 * `workspace-shell.tsx` (§ Correzione 26) perché ora ha un secondo
 * chiamante, `DatiCameraliCompletiView` — tenerlo in `workspace-shell.tsx`
 * avrebbe creato un import circolare (quel file monta anche
 * `DatiCameraliCompletiView`). */
export function SectionOrCciaaPanel({
  sectionKey,
  headerActions,
  onClose,
  stackedMode = false,
}: {
  sectionKey: string;
  headerActions?: ReactNode;
  onClose?: () => void;
  // § Correzione 27: passato da `DatiCameraliCompletiView` — vedi
  // `CciaaSectionPanel`/`SectionContent` per cosa cambia quando è vero.
  stackedMode?: boolean;
}) {
  if (isCciaaVistaKey(sectionKey)) {
    return (
      <CciaaSectionPanel vistaKey={sectionKey} headerActions={headerActions} onClose={onClose} stackedMode={stackedMode} />
    );
  }
  if (isElencoIso9001Key(sectionKey)) {
    return <ElencoIso9001Panel sectionKey={sectionKey} headerActions={headerActions} onClose={onClose} />;
  }
  return (
    <SectionContent sectionKey={sectionKey} headerActions={headerActions} onClose={onClose} stackedMode={stackedMode} />
  );
}
