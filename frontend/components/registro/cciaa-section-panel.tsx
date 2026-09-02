"use client";

import type { ReactNode } from "react";

import { GavelIcon, HandshakeIcon, ShieldCheckIcon } from "lucide-react";

import { AddettiComuneTable } from "@/app/(app)/anagrafica/addetti-comune/addetti-comune-table";
import { AddettiVisuraTable } from "@/app/(app)/anagrafica/addetti-visura/addetti-visura-table";
import { SediTable } from "@/app/(app)/anagrafica/sedi/sedi-table";
import { TitoliAbilitativiTable } from "@/app/(app)/anagrafica/titoli-abilitativi/titoli-abilitativi-table";
import { EmbeddedResourceBlock } from "@/components/registro/embedded-resource-block";
import { IncaricoTable } from "@/components/registro/incarico-table";
import { SectionContent } from "@/components/registro/section-content";
import { SectionFooter } from "@/components/registro/section-footer";
import { SintesiPanel } from "@/components/registro/sintesi-panel";
import { StatoPill } from "@/components/registro/stato-pill";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { TITOLO_VISTA_CCIAA, type CciaaVistaKey } from "@/lib/cciaa-viste";
import type { AddettiComune, AddettiVisura, Sede } from "@/lib/types/anagrafica";

// Vista -> sectionKey il cui SectionFooter (legenda + banner di modifica)
// va montato in fondo al pannello, come sibling dopo l'area di scroll —
// mai tra i campi e una tabella annidata (Soci/Amministratori/Sindaci) né
// dentro il blocco embedded stesso. Le viste assenti da questa mappa non
// hanno un blocco a registro con footer (solo tabelle), o hanno un pannello
// del tutto diverso ("sintesi").
// § Correzione 11: "sindaci" ha ora una propria sezione a registro
// ("organi-controllo", `SEZIONE_ORGANI_CONTROLLO`), non più condivisa con
// "amministratori" — vedi anche `CAMPO_PRINCIPALE_VISTA` sotto.
// § Correzione 19 (prima parte): "attivita-albi" guadagna la propria
// sezione a registro ("attivita-economica"), montata sopra le tabelle
// ripetibili esistenti (Codici ATECO, Albi/ruoli/licenze, SOA,
// Certificazioni) — stesso pattern di "amministratori"/"sindaci".
const VISTA_FOOTER_SECTION_KEY: Partial<Record<CciaaVistaKey, string>> = {
  soci: "elenco-soci-estremi",
  amministratori: "amministrazione-controllo",
  sindaci: "organi-controllo",
  "attivita-albi": "attivita-economica",
  "aggiornamento-impresa": "informazioni-societarie",
};

// Vista -> chiave del campo principale della sua sezione a registro, usato
// da `CciaaSectionPanel` per nascondere la tabella degli incarichi finché
// nessuna scelta è stata fatta (§ Correzione 04 seguito, estesa dalla
// Correzione 11 a "sindaci" con il proprio campo "assetto_controllo_in_carica",
// invece del campo "organo_amministrativo_in_carica" di "amministratori").
const CAMPO_PRINCIPALE_VISTA: Partial<Record<CciaaVistaKey, string>> = {
  amministratori: "organo_amministrativo_in_carica",
  sindaci: "assetto_controllo_in_carica",
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

// Titolo della tabella incarichi della card "Amministratori", per codice
// del catalogo cat_organi_amministrativi (§ Correzione 05 punto 9,
// Correzione 06 punto 11, Correzione 07/08 punto sul titolo dinamico): con
// la Correzione 08 tutte e quattro le configurazioni dell'organo sono
// definite, quindi il fallback "Amministratori" sotto non è più
// raggiungibile in pratica — lasciato comunque come rete di sicurezza.
const TITOLO_TABELLA_AMMINISTRATORI: Partial<Record<string, string>> = {
  AMMINISTRATORE_UNICO: "Amministratore unico in carica",
  CONSIGLIO_AMMINISTRAZIONE: "Componenti del consiglio di amministrazione",
  AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA: "Amministratori in carica",
  AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA: "Amministratori in carica",
};

// § richiesta esplicita (31/08/2026): le 3 configurazioni la cui "Numero
// componenti" è un campo modificabile (non derivato, a differenza di
// "Amministratore unico" che vale sempre 1, § `IncaricoTable.
// capienzaAmministratori`) — stessi 3 codici di
// `_ORGANI_NUMERO_COMPONENTI_MODIFICABILE` in backend/app/core/incarichi.py.
const ORGANI_NUMERO_COMPONENTI_MODIFICABILE = new Set([
  "CONSIGLIO_AMMINISTRAZIONE",
  "AMMINISTRAZIONE_PLURIPERSONALE_CONGIUNTIVA",
  "AMMINISTRAZIONE_PLURIPERSONALE_DISGIUNTIVA",
]);

// Stesso pattern per la tabella incarichi della card "Sindaci", per codice
// del catalogo cat_assetti_controllo (§ Correzione 13 punto sul titolo
// "Sindaco unico in carica"): un solo assetto definito finora, il
// fallback "Sindaci e revisori" resta per gli altri 5 non ancora definiti
// (NESSUN_ORGANO_CONTROLLO non arriva qui, la tabella non è renderizzata).
const TITOLO_TABELLA_SINDACI: Partial<Record<string, string>> = {
  SINDACO_UNICO: "Sindaco unico in carica",
  // § Correzione 14 punto sul titolo dinamico: il conteggio (sindaci
  // effettivi + 2) viene dal prop `count` di `IncaricoTable`, non da
  // questa etichetta — vedi `collegioSindacale` in `ContenutoVista` sotto.
  COLLEGIO_SINDACALE: "Componenti del collegio sindacale",
  REVISORE_LEGALE_PERSONA_FISICA: "Revisore legale incaricato",
  SOCIETA_REVISIONE_LEGALE: "Società di revisione incaricata",
  // § Correzione 17: "Il titolo deve diventare: Organo di controllo e
  // revisione legale" (§ testo esplicito) — il conteggio "2 righe" viene
  // dal prop `count`, sempre 2 per questo assetto (vedi
  // `sindacoRevisoreEsterno` in `ContenutoVista` sotto).
  SINDACO_UNICO_REVISORE_ESTERNO: "Organo di controllo e revisione legale",
  // § Correzione 18: stesso identico titolo di Correzione 17 (§ testo
  // esplicito, letteralmente lo stesso) — il conteggio "6"/"8 righe" viene
  // dal prop `count`, calcolato da `collegioSindacale` esteso con
  // `revisoreEsterno` (vedi `ContenutoVista` sotto).
  COLLEGIO_SINDACALE_REVISORE_ESTERNO: "Organo di controllo e revisione legale",
};

// § Correzione 15/16: a differenza di Sindaco unico/Collegio sindacale
// (dove la tabella accetta sia SINDACO sia REVISORE_LEGALE — un
// sindaco/collegio può comunque avere un revisore esterno registrato come
// riga a parte), "Revisore legale persona fisica"/"Società di revisione
// legale" non hanno alcun organo interno: la riga "deve accettare
// esclusivamente... il ruolo di revisore legale" (§ testo esplicito),
// quindi qui SINDACO non è nemmeno un'opzione nel dialogo "Aggiungi riga".
// Le due configurazioni condividono lo stesso ruolo REVISORE_LEGALE (§
// Correzione 16: il Registro dei Revisori Legali italiano contiene sia
// singoli sia società) — è `TIPO_TITOLARE_TABELLA_SINDACI` sotto a
// distinguerle per tipo di titolare, non un ruolo diverso. Fallback
// invariato (`["SINDACO", "REVISORE_LEGALE"]`, definito dove usato) per
// ogni assetto non in questa mappa.
const RUOLI_TABELLA_SINDACI: Partial<Record<string, string[]>> = {
  REVISORE_LEGALE_PERSONA_FISICA: ["REVISORE_LEGALE"],
  SOCIETA_REVISIONE_LEGALE: ["REVISORE_LEGALE"],
};

// § Correzione 16: quale tipo di titolare (persona fisica o giuridica)
// questa tabella deve mostrare/accettare — vedi `IncaricoTable.tipoTitolare`.
// Necessario solo per i due assetti che condividono il ruolo REVISORE_LEGALE
// sopra; `undefined` per ogni altro assetto (nessun filtro).
const TIPO_TITOLARE_TABELLA_SINDACI: Partial<Record<string, "FISICA" | "GIURIDICA">> = {
  REVISORE_LEGALE_PERSONA_FISICA: "FISICA",
  SOCIETA_REVISIONE_LEGALE: "GIURIDICA",
};

// § Correzione 13, "assetti combinati": scegliere un revisore esterno
// (persona fisica o società) come "Revisione legale affidata a" mentre
// l'assetto è "Sindaco unico" produce una combinazione incoerente — quella
// combinazione ha già un proprio assetto dedicato
// (SINDACO_UNICO_REVISORE_ESTERNO). Codici che, scelti in questo campo
// mentre l'assetto è SINDACO_UNICO, fanno comparire il suggerimento di
// passaggio (§ "proporre", non bloccare: nessuna validazione backend).
const AFFIDATARI_REVISORE_ESTERNO = new Set(["REVISORE_LEGALE_PERSONA_FISICA", "SOCIETA_REVISIONE_LEGALE"]);

// § Correzione 14: stesso suggerimento "assetti combinati", esteso a
// "Collegio sindacale" (che ha il proprio assetto combinato dedicato,
// COLLEGIO_SINDACALE_REVISORE_ESTERNO) — mappa assetto attuale -> assetto
// combinato proposto, cosi' `ContenutoVista` non deve distinguere i due
// casi con logica duplicata.
const ASSETTO_COMBINATO_CON_REVISORE_ESTERNO: Partial<Record<string, string>> = {
  SINDACO_UNICO: "SINDACO_UNICO_REVISORE_ESTERNO",
  COLLEGIO_SINDACALE: "COLLEGIO_SINDACALE_REVISORE_ESTERNO",
};

function SediSecondarieTable({ sedi, recordIdsInPanoramica }: { sedi: Sede[]; recordIdsInPanoramica: string[] }) {
  const secondarie = sedi.filter((s) => !s.tipo_sede.toLowerCase().includes("legale"));
  return <SediTable sedi={secondarie} recordIdsInPanoramica={recordIdsInPanoramica} />;
}

function ContenutoVista({
  vistaKey,
  campoPrincipale,
}: {
  vistaKey: CciaaVistaKey;
  // Valore corrente del campo principale della sezione (§ Correzione 04
  // seguito, generalizzato dalla Correzione 11 a "sindaci"): finché è "Non
  // disponibile" (null), le card "Amministratori" e "Sindaci" non mostrano
  // nemmeno la tabella degli incarichi — nessuna scelta fatta significa
  // nessun'altra informazione applicabile, non solo i campi della sezione
  // (quelli già filtrati dal backend). Vedi `CAMPO_PRINCIPALE_VISTA` per
  // quale campo, di quale sezione, ciascuna vista legge.
  campoPrincipale?: string | null;
}) {
  const { state, updateField } = useWorkspace();
  switch (vistaKey) {
    case "sintesi":
      return <SintesiPanel />;
    case "soci": {
      // § richiesta esplicita (31/08/2026, seguito): stesso identico
      // meccanismo di "Numero componenti" per Amministratori (vedi sotto)
      // — valore CORRENTE (sempre quello salvato: "Numero dei soci" non
      // passa più dalla bozza, si scrive subito, vedi NumeroSociField) di
      // "Numero dei soci", per i posti liberi/il conteggio della tabella.
      const entrySoci = state.sections["elenco-soci-estremi"];
      const numeroSociRaw =
        entrySoci?.server?.groups.flatMap((g) => g.fields).find((f) => f.key === "numero_soci")?.value ?? null;
      const numeroSoci = numeroSociRaw ? Number(numeroSociRaw) : 0;
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
              variante="soci"
              capienzaSoci={{ target: numeroSoci }}
            />
          </section>
        </>
      );
    }
    case "amministratori": {
      // § richiesta esplicita (31/08/2026): valore CORRENTE (sempre quello
      // salvato — a differenza degli altri campi della sezione, "Numero
      // componenti" per queste 3 configurazioni non passa più dalla bozza,
      // si scrive subito, vedi NumeroComponentiOrganoField) di "Numero
      // componenti", per i posti liberi/il conteggio della tabella.
      const entryAmministrazione = state.sections["amministrazione-controllo"];
      const numeroComponentiRaw =
        entryAmministrazione?.server?.groups
          .flatMap((g) => g.fields)
          .find((f) => f.key === "numero_amministratori_in_carica")?.value ?? null;
      const numeroComponenti = numeroComponentiRaw ? Number(numeroComponentiRaw) : 0;
      return (
        <>
          <SectionContent
            sectionKey="amministrazione-controllo"
            embedded
            hideFooter
            groupTitleOverrides={{ "amministrazione-controllo": "Amministrazione" }}
          />
          {campoPrincipale && (
            <section className="py-2">
              <IncaricoTable
                // § Correzione 05/06 punto 9/11: titolo dedicato solo per le
                // configurazioni già definite, per ogni altra scelta resta
                // il titolo generico finché quella configurazione non lo è.
                titolo={TITOLO_TABELLA_AMMINISTRATORI[campoPrincipale] ?? "Amministratori"}
                icon={GavelIcon}
                ruoliCodici={["AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"]}
                etichettaVuoto="Nessun amministratore registrato."
                sectionKey="amministrazione-controllo"
                addRowLabel="Aggiungi riga"
                variante="cariche"
                capienzaAmministratori={
                  ORGANI_NUMERO_COMPONENTI_MODIFICABILE.has(campoPrincipale) ? { target: numeroComponenti } : undefined
                }
              />
            </section>
          )}
        </>
      );
    }
    case "sindaci": {
      // § Correzione 13/14, "assetti combinati": suggerimento di passaggio
      // all'assetto combinato dedicato (Sindaco unico o Collegio
      // sindacale + revisore esterno) quando il revisore scelto è esterno
      // — ha senso solo mentre si sta effettivamente scegliendo (bozza in
      // modifica), non un divieto lato backend (§ "proporre").
      const entryOrganiControllo = state.sections["organi-controllo"];
      const revisioneLegaleAffidataA = entryOrganiControllo?.editing
        ? (entryOrganiControllo.draft?.["revisione_legale_affidata_a"] ?? null)
        : null;
      const assettoCombinato = campoPrincipale ? ASSETTO_COMBINATO_CON_REVISORE_ESTERNO[campoPrincipale] : undefined;
      const proponiAssettoCombinato =
        entryOrganiControllo?.editing &&
        assettoCombinato !== undefined &&
        revisioneLegaleAffidataA !== null &&
        AFFIDATARI_REVISORE_ESTERNO.has(revisioneLegaleAffidataA);
      // § Correzione 14: "Sindaci effettivi" (3 o 5) determina la
      // composizione prescritta del collegio sindacale — letto dalla
      // bozza in modifica, dal salvato altrimenti, stessa reattività di
      // `campoPrincipale` sopra.
      const sindaciEffettiviRaw = entryOrganiControllo?.editing
        ? (entryOrganiControllo.draft?.["sindaci_effettivi"] ?? null)
        : (entryOrganiControllo?.server?.groups
            .flatMap((g) => g.fields)
            .find((f) => f.key === "sindaci_effettivi")?.value ?? null);
      const sindaciEffettivi = sindaciEffettiviRaw ? Number(sindaciEffettiviRaw) : null;
      // § Correzione 17: valore CORRENTE (bozza se in modifica, salvato
      // altrimenti — a differenza di `revisioneLegaleAffidataA` sopra, che
      // resta null fuori modifica perché serve solo al banner di
      // suggerimento) di "Revisione legale affidata a", per determinare se
      // la seconda riga della tabella "Sindaco unico + revisore esterno"
      // accetta una persona fisica o una società. Stessi 2 codici di
      // `TIPO_TITOLARE_TABELLA_SINDACI` sopra (catalogo condiviso, § nota
      // in quella mappa): riusata cosi' com'è, nessuna mappa nuova.
      const revisioneLegaleAffidataAAttuale = entryOrganiControllo?.editing
        ? (entryOrganiControllo.draft?.["revisione_legale_affidata_a"] ?? null)
        : (entryOrganiControllo?.server?.groups
            .flatMap((g) => g.fields)
            .find((f) => f.key === "revisione_legale_affidata_a")?.value ?? null);
      const tipoRevisoreEsterno = revisioneLegaleAffidataAAttuale
        ? (TIPO_TITOLARE_TABELLA_SINDACI[revisioneLegaleAffidataAAttuale] ?? null)
        : null;
      return (
        <>
          {/* § Correzione 11: sezione propria "organi-controllo" — il
           * gruppo unico si chiama già "Organi di controllo" come la
           * sezione stessa, nessun `groupTitleOverrides` necessario (vedi
           * `sottotitoloDuplicato` in section-content.tsx). */}
          <SectionContent sectionKey="organi-controllo" embedded hideFooter />
          {proponiAssettoCombinato && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[8px] border border-[#cedaf0] bg-[#f5f8ff] px-4 py-3 text-sm text-[var(--az-ink)]">
              <span>
                Un revisore esterno insieme a{" "}
                {campoPrincipale === "COLLEGIO_SINDACALE" ? "un collegio sindacale" : "un sindaco unico"} corrisponde
                all&apos;assetto combinato dedicato.
              </span>
              <button
                type="button"
                onClick={() => updateField("organi-controllo", "assetto_controllo_in_carica", assettoCombinato!)}
                className="shrink-0 rounded-[6px] bg-[var(--az-blue)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--az-blue-dark)]"
              >
                Passa a questo assetto
              </button>
            </div>
          )}
          {/* § Correzione 12: "Nessun organo di controllo o revisore" deve
           * mostrare ESCLUSIVAMENTE il campo principale — niente tabella,
           * niente conteggio righe, niente "Aggiungi riga" (i tre spariscono
           * insieme non renderizzando affatto il blocco). La cessazione
           * confermata di eventuali sindaci/revisori già registrati è
           * gestita dal backend al salvataggio (vedi
           * `CessazioneOrganoControlloDialog`), non qui. */}
          {campoPrincipale && campoPrincipale !== "NESSUN_ORGANO_CONTROLLO" && (
            <section className="py-2">
              <IncaricoTable
                // § Correzione 13 punto 9: titolo dedicato solo per
                // l'assetto già definito, per ogni altro resta il titolo
                // generico finché quell'assetto non lo è (stesso pattern di
                // TITOLO_TABELLA_AMMINISTRATORI).
                titolo={TITOLO_TABELLA_SINDACI[campoPrincipale] ?? "Sindaci e revisori"}
                icon={ShieldCheckIcon}
                ruoliCodici={RUOLI_TABELLA_SINDACI[campoPrincipale] ?? ["SINDACO", "REVISORE_LEGALE"]}
                etichettaVuoto="Nessun sindaco o revisore registrato."
                sectionKey="organi-controllo"
                addRowLabel="Aggiungi riga"
                variante="cariche"
                collegioSindacale={
                  campoPrincipale === "COLLEGIO_SINDACALE"
                    ? { sindaciEffettivi }
                    : campoPrincipale === "COLLEGIO_SINDACALE_REVISORE_ESTERNO"
                      ? { sindaciEffettivi, revisoreEsterno: { tipoRevisore: tipoRevisoreEsterno } }
                      : undefined
                }
                tipoTitolare={TIPO_TITOLARE_TABELLA_SINDACI[campoPrincipale]}
                sindacoRevisoreEsterno={
                  campoPrincipale === "SINDACO_UNICO_REVISORE_ESTERNO" ? { tipoRevisore: tipoRevisoreEsterno } : undefined
                }
              />
            </section>
          )}
        </>
      );
    }
    case "attivita-albi":
      return (
        <>
          <SectionContent sectionKey="attivita-economica" embedded hideFooter />
          {/* § richiesta esplicita: tabella "Codici ATECO" rimossa da
              questo pannello (§ convenzione "rimozione rimandata a
              decisione esplicita" — qui la decisione è stata esplicita).
              ana_codici_ateco/l'endpoint/la pagina standalone
              (/anagrafica/codici-ateco) restano intatti, non più
              referenziati da questa card, stesso trattamento già
              riservato ad Albi/SOA/Certificazioni nella Correzione 20. */}
          {/* § Correzione 20: tabella unificata "Albi, ruoli, licenze e
              certificazioni", sostituisce le 3 tabelle separate che
              c'erano qui (Albi/ruoli/licenze, Attestazioni SOA,
              Certificazioni possedute — ana_albi_ruoli_licenze/ana_soa/
              ana_certificazioni restano al loro posto, non più
              referenziate da questa card, § convenzione "rimozione
              rimandata a decisione esplicita"). Non usa
              EmbeddedResourceBlock (niente panoramicaSlug/PinRecordButton
              per questa risorsa, fuori scopo per questa correzione): la
              stessa fascia di spaziatura/bordo è replicata qui a mano. */}
          <section className="border-b border-[var(--az-border)] py-6 last:border-b-0">
            <TitoliAbilitativiTable sectionKey="attivita-economica" />
          </section>
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
  const entryPrincipale = footerSectionKey ? state.sections[footerSectionKey] : undefined;
  const sezionePrincipale = entryPrincipale?.server;
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
  // Solo per "amministratori"/"sindaci" (§ Correzione 11: ciascuna con la
  // propria sezione/campo, vedi `CAMPO_PRINCIPALE_VISTA`): valore corrente
  // del campo principale della sezione, per nascondere anche la tabella
  // degli incarichi finché non è stata fatta una scelta (vedi
  // `ContenutoVista`) — e per il titolo dedicato "Amministratore unico in
  // carica" (§ Correzione 05 punto 9). In modifica legge la bozza (non il
  // salvato): stessa reattività istantanea già applicata ai campi della
  // sezione, la tabella non deve restare un passo indietro rispetto a loro
  // finché non si salva.
  const campoPrincipaleChiave = CAMPO_PRINCIPALE_VISTA[vistaKey];
  const campoPrincipale = campoPrincipaleChiave
    ? (entryPrincipale?.editing
        ? (entryPrincipale.draft?.[campoPrincipaleChiave] ?? null)
        : (sezionePrincipale?.groups.flatMap((g) => g.fields).find((f) => f.key === campoPrincipaleChiave)
            ?.value ?? null))
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
        <ContenutoVista vistaKey={vistaKey} campoPrincipale={campoPrincipale} />
      </div>
      {footerSectionKey && <SectionFooter sectionKey={footerSectionKey} />}
    </div>
  );
}
