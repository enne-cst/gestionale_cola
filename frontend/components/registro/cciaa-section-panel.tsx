"use client";

import type { ReactNode } from "react";

import { AlbiTable } from "@/app/(app)/anagrafica/albi-ruoli-licenze/albi-table";
import { AddettiComuneTable } from "@/app/(app)/anagrafica/addetti-comune/addetti-comune-table";
import { AddettiVisuraTable } from "@/app/(app)/anagrafica/addetti-visura/addetti-visura-table";
import { CertificazioniTable } from "@/app/(app)/anagrafica/certificazioni/certificazioni-table";
import { CodiciAtecoTable } from "@/app/(app)/anagrafica/codici-ateco/codici-ateco-table";
import { ContattiTable } from "@/app/(app)/anagrafica/contatti/contatti-table";
import { IscrizioniTable } from "@/app/(app)/anagrafica/iscrizioni-registro-imprese/iscrizioni-table";
import { SediTable } from "@/app/(app)/anagrafica/sedi/sedi-table";
import { SoaTable } from "@/app/(app)/anagrafica/soa/soa-table";
import { EmbeddedResourceBlock } from "@/components/registro/embedded-resource-block";
import { IncaricoTable } from "@/components/registro/incarico-table";
import { SectionContent } from "@/components/registro/section-content";
import { SintesiPanel } from "@/components/registro/sintesi-panel";
import { SistemiAmministrazioneField } from "@/components/registro/sistemi-amministrazione-field";
import { TITOLO_VISTA_CCIAA, type CciaaVistaKey } from "@/lib/cciaa-viste";
import type {
  AddettiComune,
  AddettiVisura,
  AlboRuoloLicenza,
  Certificazione,
  CodiceAteco,
  Contatto,
  IscrizioneRegistroImprese,
  Sede,
  Soa,
} from "@/lib/types/anagrafica";

const SOTTOTITOLO_VISTA_CCIAA: Record<CciaaVistaKey, string> = {
  sintesi: "Indicatori non presenti nelle altre sezioni, in sola lettura",
  sede: "Sede legale e domicilio digitale dell'impresa",
  statuto: "Identificazione camerale, durata, amministrazione e iscrizioni al Registro Imprese",
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

function SedeLegaleTable({ sedi, recordIdsInPanoramica }: { sedi: Sede[]; recordIdsInPanoramica: string[] }) {
  const legali = sedi.filter((s) => s.tipo_sede.toLowerCase().includes("legale"));
  return <SediTable sedi={legali} recordIdsInPanoramica={recordIdsInPanoramica} />;
}

function ContenutoVista({ vistaKey }: { vistaKey: CciaaVistaKey }) {
  switch (vistaKey) {
    case "sintesi":
      return <SintesiPanel />;
    case "sede":
      return (
        <>
          <SectionContent sectionKey="informazioni-societarie" embedded />
          <EmbeddedResourceBlock<Sede> title="Sede legale" apiPath="/api/anagrafica/sedi" panoramicaSlug="sedi">
            {(items, recordIds) => <SedeLegaleTable sedi={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
          <EmbeddedResourceBlock<Contatto> title="Contatti e domicilio digitale" apiPath="/api/anagrafica/contatti" panoramicaSlug="contatti">
            {(items, recordIds) => <ContattiTable contatti={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
        </>
      );
    case "statuto":
      return (
        <>
          <SectionContent sectionKey="informazioni-societarie" embedded />
          <SectionContent sectionKey="durata-societa-esercizi" embedded />
          <SectionContent sectionKey="amministrazione-controllo" embedded />
          <SistemiAmministrazioneField />
          <EmbeddedResourceBlock<IscrizioneRegistroImprese>
            title="Iscrizioni registro imprese"
            apiPath="/api/anagrafica/iscrizioni-registro-imprese"
            panoramicaSlug="iscrizioni-registro-imprese"
          >
            {(items, recordIds) => <IscrizioniTable iscrizioni={items} recordIdsInPanoramica={recordIds} />}
          </EmbeddedResourceBlock>
        </>
      );
    case "soci":
      return (
        <>
          <SectionContent sectionKey="elenco-soci-estremi" embedded />
          <section className="py-2">
            <IncaricoTable ruoliCodici={["SOCIO"]} etichettaVuoto="Nessun socio registrato." />
          </section>
        </>
      );
    case "amministratori":
      return (
        <>
          <SectionContent sectionKey="amministrazione-controllo" embedded />
          <section className="py-2">
            <IncaricoTable
              ruoliCodici={["AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"]}
              etichettaVuoto="Nessun amministratore registrato."
            />
          </section>
        </>
      );
    case "sindaci":
      return (
        <>
          <SectionContent sectionKey="amministrazione-controllo" embedded />
          <section className="py-2">
            <IncaricoTable ruoliCodici={["SINDACO", "REVISORE_LEGALE"]} etichettaVuoto="Nessun sindaco o revisore registrato." />
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
      return <SectionContent sectionKey="informazioni-societarie" embedded />;
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
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-[30px] py-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--az-ink)]">{TITOLO_VISTA_CCIAA[vistaKey]}</h2>
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
    </div>
  );
}
