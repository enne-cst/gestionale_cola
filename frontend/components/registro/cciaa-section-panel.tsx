"use client";

import type { ReactNode } from "react";

import { GavelIcon, HandshakeIcon, ShieldCheckIcon } from "lucide-react";

import { AlbiTable } from "@/app/(app)/anagrafica/albi-ruoli-licenze/albi-table";
import { AddettiComuneTable } from "@/app/(app)/anagrafica/addetti-comune/addetti-comune-table";
import { AddettiVisuraTable } from "@/app/(app)/anagrafica/addetti-visura/addetti-visura-table";
import { CertificazioniTable } from "@/app/(app)/anagrafica/certificazioni/certificazioni-table";
import { CodiciAtecoTable } from "@/app/(app)/anagrafica/codici-ateco/codici-ateco-table";
import { SediTable } from "@/app/(app)/anagrafica/sedi/sedi-table";
import { SoaTable } from "@/app/(app)/anagrafica/soa/soa-table";
import { EmbeddedResourceBlock } from "@/components/registro/embedded-resource-block";
import { IncaricoTable } from "@/components/registro/incarico-table";
import { SectionContent } from "@/components/registro/section-content";
import { SectionFooter } from "@/components/registro/section-footer";
import { SintesiPanel } from "@/components/registro/sintesi-panel";
import { StatoPill } from "@/components/registro/stato-pill";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { TITOLO_VISTA_CCIAA, type CciaaVistaKey } from "@/lib/cciaa-viste";
import type {
  AddettiComune,
  AddettiVisura,
  AlboRuoloLicenza,
  Certificazione,
  CodiceAteco,
  Sede,
  Soa,
} from "@/lib/types/anagrafica";

// Vista -> sectionKey il cui SectionFooter (legenda + banner di modifica)
// va montato in fondo al pannello, come sibling dopo l'area di scroll —
// mai tra i campi e una tabella annidata (Soci/Amministratori/Sindaci) né
// dentro il blocco embedded stesso. Le viste assenti da questa mappa non
// hanno un blocco a registro con footer (solo tabelle, es. "attivita-albi"),
// o hanno un pannello del tutto diverso ("sintesi").
const VISTA_FOOTER_SECTION_KEY: Partial<Record<CciaaVistaKey, string>> = {
  soci: "elenco-soci-estremi",
  amministratori: "amministrazione-controllo",
  sindaci: "amministrazione-controllo",
  "aggiornamento-impresa": "informazioni-societarie",
};

const SOTTOTITOLO_VISTA_CCIAA: Record<CciaaVistaKey, string> = {
  sintesi: "Indicatori non presenti nelle altre sezioni, in sola lettura",
  soci: "Elenco dei soci e titolari di diritti su azioni e quote",
  amministratori: "Organo amministrativo in carica ed elenco degli amministratori",
  sindaci: "Organo di controllo ed elenco di sindaci e revisori",
  "attivita-albi": "Attività esercitata, classificazioni, albi, attestazioni e certificazioni",
  "personale-occupazione": "Rilevazioni degli addetti da visura e per comune",
  "sedi-secondarie": "Unità locali diverse dalla sede legale",
  "aggiornamento-impresa": "Ultimo aggiornamento dei dati camerali",
};

function SediSecondarieTable({ sedi, recordIdsInPanoramica }: { sedi: Sede[]; recordIdsInPanoramica: string[] }) {
  const secondarie = sedi.filter((s) => !s.tipo_sede.toLowerCase().includes("legale"));
  return <SediTable sedi={secondarie} recordIdsInPanoramica={recordIdsInPanoramica} />;
}

function ContenutoVista({ vistaKey }: { vistaKey: CciaaVistaKey }) {
  switch (vistaKey) {
    case "sintesi":
      return <SintesiPanel />;
    case "soci":
      return (
        <>
          <SectionContent sectionKey="elenco-soci-estremi" embedded hideFooter />
          <section className="py-2">
            <IncaricoTable
              titolo="Soci"
              icon={HandshakeIcon}
              ruoliCodici={["SOCIO"]}
              etichettaVuoto="Nessun socio registrato."
              sectionKey="elenco-soci-estremi"
            />
          </section>
        </>
      );
    case "amministratori":
      return (
        <>
          <SectionContent sectionKey="amministrazione-controllo" embedded hideFooter />
          <section className="py-2">
            <IncaricoTable
              titolo="Amministratori"
              icon={GavelIcon}
              ruoliCodici={["AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"]}
              etichettaVuoto="Nessun amministratore registrato."
            />
          </section>
        </>
      );
    case "sindaci":
      return (
        <>
          <SectionContent sectionKey="amministrazione-controllo" embedded hideFooter />
          <section className="py-2">
            <IncaricoTable
              titolo="Sindaci e revisori"
              icon={ShieldCheckIcon}
              ruoliCodici={["SINDACO", "REVISORE_LEGALE"]}
              etichettaVuoto="Nessun sindaco o revisore registrato."
            />
          </section>
        </>
      );
    case "attivita-albi":
      return (
        <>
          <EmbeddedResourceBlock<CodiceAteco> title="Codici ATECO" apiPath="/api/anagrafica/codici-ateco" panoramicaSlug="codici-ateco">
            {(items, recordIds) => <CodiciAtecoTable codici={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
          <EmbeddedResourceBlock<AlboRuoloLicenza> title="Albi, ruoli e licenze" apiPath="/api/anagrafica/albi-ruoli-licenze" panoramicaSlug="albi-ruoli-licenze">
            {(items, recordIds) => <AlbiTable albi={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
          <EmbeddedResourceBlock<Soa> title="Attestazioni SOA" apiPath="/api/anagrafica/soa" panoramicaSlug="soa">
            {(items, recordIds) => <SoaTable attestazioni={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
          <EmbeddedResourceBlock<Certificazione> title="Certificazioni possedute" apiPath="/api/anagrafica/certificazioni" panoramicaSlug="certificazioni">
            {(items, recordIds) => <CertificazioniTable certificazioni={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
        </>
      );
    case "personale-occupazione":
      return (
        <>
          <EmbeddedResourceBlock<AddettiVisura> title="Addetti da visura" apiPath="/api/anagrafica/addetti-visura" panoramicaSlug="addetti-visura">
            {(items, recordIds) => <AddettiVisuraTable rilevazioni={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
          <EmbeddedResourceBlock<AddettiComune> title="Addetti per comune" apiPath="/api/anagrafica/addetti-comune" panoramicaSlug="addetti-comune">
            {(items, recordIds) => <AddettiComuneTable distribuzioni={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
        </>
      );
    case "sedi-secondarie":
      return (
        <EmbeddedResourceBlock<Sede> title="Sedi secondarie e unità locali" apiPath="/api/anagrafica/sedi" panoramicaSlug="sedi">
          {(items, recordIds) => <SediSecondarieTable sedi={items} recordIdsInPanoramica={recordIds} />}
        </EmbeddedResourceBlock>
      );
    case "aggiornamento-impresa":
      return <SectionContent sectionKey="informazioni-societarie" embedded hideFooter />;
  }
}

/** Pannello di una card composita della griglia CCIAA (§9 del protocollo):
 * compone i gruppi di campi già a registro (embedded) e le tabelle delle
 * pagine esistenti (via `EmbeddedResourceBlock`), senza duplicarne il
 * codice — stesso pattern di apertura (drawer/affiancamento/tutta
 * larghezza) delle sezioni singole, gestito da `WorkspaceShell`. */
export function CciaaSectionPanel({
  vistaKey,
  headerActions,
  onClose,
}: {
  vistaKey: CciaaVistaKey;
  headerActions?: ReactNode;
  onClose?: () => void;
}) {
  const footerSectionKey = VISTA_FOOTER_SECTION_KEY[vistaKey];
  const { state } = useWorkspace();
  const sezionePrincipale = footerSectionKey ? state.sections[footerSectionKey]?.server : undefined;
  // Quando il blocco embedded principale del pannello ha un solo gruppo
  // omonimo (Estremi dell'elenco soci in "soci", Amministrazione e
  // controllo in "amministratori"/"sindaci"), il suo header viene
  // soppresso da `SectionContent` per non duplicare il titolo del gruppo:
  // l'indicatore di stato di quella sezione va invece qui, sul titolone
  // del pannello, di seguito alla sua ultima parola.
  const statoNelTitolo =
    sezionePrincipale != null &&
    sezionePrincipale.groups.length === 1 &&
    sezionePrincipale.groups[0].title === sezionePrincipale.title
      ? sezionePrincipale.completionStatus
      : null;
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">
            {TITOLO_VISTA_CCIAA[vistaKey]}
            {statoNelTitolo && <StatoPill status={statoNelTitolo} />}
          </h2>
          <p className="mt-[9px] text-sm text-[#354a89]">{SOTTOTITOLO_VISTA_CCIAA[vistaKey]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerActions}
          {onClose && (
            <button
              type="button"
              aria-label="Chiudi"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-[7px] border border-[#cedaf0] text-[var(--az-ink)] hover:bg-[#f6f9ff]"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="az-scroll-thin flex-1 overflow-y-auto px-[30px] pb-6">
        <ContenutoVista vistaKey={vistaKey} />
      </div>
      {footerSectionKey && <SectionFooter sectionKey={footerSectionKey} />}
    </div>
  );
}
