"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getRegistroOverview,
  getRegistroSezione,
  impostaVisibilitaCampo,
  inviaDecisioneVerifica,
  salvaSezioneRegistro,
} from "@/lib/actions/registro";
import {
  getVociPanoramica,
  pinRecordPanoramica,
  pinVocePanoramica,
  unpinRecordPanoramica,
  unpinVocePanoramica,
} from "@/lib/actions/panoramica";
import { MODULO_ANAGRAFICA } from "@/lib/anagrafica-sezioni";
import type { PanoramicaVoce } from "@/lib/types/panoramica";
import type { RegistryOverview, Section } from "@/lib/types/registro";

export type WorkspaceMode = "OVERVIEW" | "DRAWER" | "FULL" | "SPLIT";

type SectionEntry = {
  loading: boolean;
  error: string | null;
  server: Section | null;
  editing: boolean;
  draft: Record<string, string | null> | null;
  fieldErrors: Record<string, string>;
  saving: boolean;
};

type ConfirmState = {
  sectionKey: string;
  saving: boolean;
  error: string | null;
  onDiscard: () => void;
  onSaved: () => void;
} | null;

// § Correzione 12: dialogo dedicato, distinto da `ConfirmState` sopra (che
// significa "modifiche non salvate, esci comunque?", un'azione di
// abbandono). Qui il significato è opposto — "procedere cesserebbe dei
// dati esistenti, confermi?" — e la conseguenza di confermare non è
// scartare la bozza ma ripetere lo stesso salvataggio con il flag di
// conferma, mai riusare la stessa struttura per due semantiche diverse.
type CessazioneOrganoControlloState = {
  sectionKey: string;
  messaggio: string;
  count: number;
  saving: boolean;
  error: string | null;
} | null;

// § Correzione 14: stesso pattern e stesso significato di
// `CessazioneOrganoControlloState` sopra ("procedere cesserebbe degli
// incarichi attivi, confermi?"), ma per la riduzione di "Sindaci
// effettivi" nella configurazione "Collegio sindacale" invece che per il
// passaggio a "Nessun organo di controllo". Duplicato apposta invece di
// generalizzare i due in un unico stato: evita di rischiare una
// regressione della Correzione 12 già verificata per estendere un
// meccanismo a un caso quasi identico ma non uguale.
type RiduzioneSindaciEffettiviState = {
  sectionKey: string;
  messaggio: string;
  count: number;
  saving: boolean;
  error: string | null;
} | null;

// Richiesta esplicita dell'utente (31/08/2026): a differenza del principio
// generale "il cambio di configurazione non elimina dati" (§ Correzione
// 11/12, i valori restano nelle colonne nascoste), il passaggio a "Nessun
// organo di controllo o revisore" deve invece CANCELLARE per davvero le
// informazioni della configurazione precedente — ma solo dopo una conferma
// esplicita, chiesta subito al momento della scelta nel menu (non solo al
// salvataggio, a differenza di `CessazioneOrganoControlloState` sopra che
// riguarda gli incarichi, non i campi). Nessun round-trip al backend qui:
// è una mutazione della sola bozza, "Annulla" non deve annullare nulla
// perché il cambiamento non è ancora stato applicato quando compare il
// dialogo (si applica solo alla conferma, vedi `confermaCancellazioneConfigurazione`).
type CancellazioneConfigurazioneState = { sectionKey: string } | null;

// § Correzione 15/16: assetti "revisore esterno standalone" — nessun
// organo interno (il revisore è l'intero assetto), quindi "Revisione
// legale affidata a" deve restare coerente con l'assetto stesso: non un
// suggerimento facoltativo come per Sindaco unico/Collegio sindacale (§
// Correzione 13/14, `AFFIDATARI_REVISORE_ESTERNO` in
// `cciaa-section-panel.tsx`, un insieme diverso con un significato
// diverso), ma un vincolo bidirezionale applicato qui.
const ASSETTI_REVISORE_ESTERNO_STANDALONE = new Set(["REVISORE_LEGALE_PERSONA_FISICA", "SOCIETA_REVISIONE_LEGALE"]);

// § Correzione 15: i codici di cat_affidatari_revisione_legale che hanno
// un assetto corrispondente in cat_assetti_controllo — stesso codice in
// entrambi i cataloghi per costruzione (vedi
// 023_cat_affidatari_revisione_legale.sql). Esclude solo "Non attribuita",
// che non corrisponde a nessun assetto: sceglierlo mentre l'assetto è
// "revisore esterno standalone" lascia una combinazione temporaneamente
// incoerente, bloccata solo al salvataggio (§ "non deve essere possibile
// salvare una combinazione incoerente", verificato lato backend), senza un
// dialogo di conferma qui — non c'è una destinazione sensata a cui
// proporre di passare.
const AFFIDATARI_CON_ASSETTO_CORRISPONDENTE = new Set([
  "SINDACO_UNICO",
  "COLLEGIO_SINDACALE",
  "REVISORE_LEGALE_PERSONA_FISICA",
  "SOCIETA_REVISIONE_LEGALE",
]);

// Come `CancellazioneConfigurazioneState` sopra (nessun round-trip al
// backend: mutazione della sola bozza, "Annulla" non deve annullare nulla
// perché il cambiamento non è ancora stato applicato quando compare il
// dialogo) — ma nella direzione OPPOSTA e con una conseguenza opposta:
// cambiare "Revisione legale affidata a" mentre l'assetto è uno di
// `ASSETTI_REVISORE_ESTERNO_STANDALONE` aggiorna anche "Assetto di
// controllo in carica" per restare coerente (§ testo esplicito "dopo aver
// richiesto conferma e senza perdere i dati già inseriti") SENZA
// cancellare nessun altro campo — la cancellazione verso "Nessun organo di
// controllo" resta un caso a parte, mai la stessa struttura.
type CambioAssettoAffidatarioState = {
  sectionKey: string;
  nuovoAssetto: string;
  nuovoAssettoLabel: string;
} | null;

// § Correzione 25: "Visualizza sintesi" è una funzione del banner "Dati
// CCIAA", non una sezione — il suo pannello deve poter aprirsi/espandersi
// senza toccare `mode`/`openSectionKey`/`tabs`/`activeSurface` (che
// restano quelli dell'eventuale sezione CCIAA già selezionata). Stato
// interamente separato apposta: chiudere la sintesi deve riportare
// l'utente esattamente alla situazione precedente, il che è automatico se
// aprirla non ha mai modificato nient'altro.
//
// § Correzione 26: la sintesi guadagna una propria modalità modifica, ma
// SOLO per i 4 campi booleani di "ATTIVITA'" (§8.2) — non una bozza
// dell'intera sezione "attivita-economica" (che resta indipendente, mai
// aperta in `enterEdit`/`state.sections["attivita-economica"].draft` da
// qui: scriverebbe un'intera sezione quando la sintesi ne cambia solo 4
// campi). `draft` contiene solo le chiavi dei 4 campi effettivamente
// toccati dall'utente in questa sessione di modifica — mai le altre 8
// chiavi della sezione, così `saveSintesiEdit` può inviarle come PATCH
// parziale (§16, `applica_modifiche_sezione` applica solo i campi
// presenti nel payload, non li sostituisce tutti).
type SintesiState = { open: boolean; full: boolean; editing: boolean; draft: Record<string, string | null>; saving: boolean };

// § richiesta esplicita (03/09/2026): sectionKey REALI (`state.sections`,
// non i vistaKey delle card) delle sezioni di "Dati camerali completi" che
// hanno davvero una bozza da poter perdere — esclude "personale-occupazione"
// e "aggiornamento-impresa" (nessuna bozza di sezione lì: ogni azione salva
// già subito tramite il proprio dialog, § i rispettivi pannelli). Duplica
// apposta la mappatura vistaKey→sectionKey di `VISTA_FOOTER_SECTION_KEY` in
// cciaa-section-panel.tsx (soci→elenco-soci-estremi,
// amministratori→amministrazione-controllo, sindaci→organi-controllo,
// attivita-albi→attivita-economica, sedi-secondarie→unita-locali): questo
// file non importa da `cciaa-section-panel.tsx` per evitare un ciclo,
// stesso principio già seguito da `SEZIONI_DATI_COMPLETI` in
// `dati-camerali-completi-view.tsx`.
const SEZIONI_DATI_COMPLETI_CON_BOZZA = [
  "sede",
  "statuto",
  "capitale-sociale",
  "elenco-soci-estremi",
  "amministrazione-controllo",
  "organi-controllo",
  "attivita-economica",
  "unita-locali",
];

type State = {
  mode: WorkspaceMode;
  openSectionKey: string | null;
  tabs: string[];
  activeSurface: "overview" | string;
  sections: Record<string, SectionEntry>;
  overview: RegistryOverview;
  confirm: ConfirmState;
  cessazioneOrganoControllo: CessazioneOrganoControlloState;
  riduzioneSindaciEffettivi: RiduzioneSindaciEffettiviState;
  cancellazioneConfigurazione: CancellazioneConfigurazioneState;
  cambioAssettoAffidatario: CambioAssettoAffidatarioState;
  sintesi: SintesiState;
  // § richiesta esplicita 05/09/2026: campo da evidenziare dopo l'apertura
  // di una sezione da un link di "Ultime modifiche" — null quando non è
  // stato aperto nessun link, o quando l'evidenziazione è già stata
  // consumata (vedi `openDrawer`/`clearHighlightField`). Un solo campo alla
  // volta, per chiave (non per coppia sezione/campo, § commento su
  // `openDrawer` sotto): abbastanza per il caso reale (un solo drawer alla
  // volta), evita di dover far viaggiare la sectionKey "vista" fino al
  // `FieldRow` annidato nelle card composite, che usa invece la sectionKey
  // "vera" del registro (es. "amministrazione-controllo" dentro la card
  // "Amministratori").
  highlightField: string | null;
  // § Correzione 26 §15: "Apri dati camerali completi", nel footer della
  // sintesi — pagina dedicata che impila tutte le sezioni CCIAA una sotto
  // l'altra (nessuna vista del genere esisteva prima). Booleano semplice,
  // stesso principio di indipendenza di `sintesi`: aprirla chiude sempre
  // prima la sintesi (mai le due insieme, § "non deve aprire la Sintesi e
  // i dati completi contemporaneamente"), ma non tocca `mode`/`tabs`.
  datiCompletiOpen: boolean;
};

function sectionValues(section: Section): Record<string, string | null> {
  const values: Record<string, string | null> = {};
  for (const group of section.groups) {
    for (const field of group.fields) values[field.key] = field.value;
  }
  return values;
}

function normalizza(valore: string | null | undefined): string | null {
  if (valore === undefined || valore === null) return null;
  const trimmed = valore.trim();
  return trimmed === "" ? null : trimmed;
}

export function isSectionDirty(entry: Pick<SectionEntry, "draft" | "server">): boolean {
  if (!entry.draft || !entry.server) return false;
  const attuali = sectionValues(entry.server);
  return Object.keys(entry.draft).some((chiave) => normalizza(entry.draft?.[chiave]) !== normalizza(attuali[chiave]));
}

function nuovaSectionEntry(): SectionEntry {
  return { loading: false, error: null, server: null, editing: false, draft: null, fieldErrors: {}, saving: false };
}

type Action =
  | { type: "OPEN_DRAWER"; sectionKey: string; fieldKey?: string }
  | { type: "CLOSE_DRAWER" }
  | { type: "CLEAR_HIGHLIGHT_FIELD" }
  | { type: "PROMOTE_FULL"; sectionKey: string }
  | { type: "PROMOTE_SPLIT"; sectionKey: string }
  | { type: "CLOSE_TAB"; sectionKey: string }
  | { type: "ACTIVATE_TAB"; key: string }
  | { type: "SECTION_LOAD_START"; sectionKey: string }
  | { type: "SECTION_LOAD_SUCCESS"; sectionKey: string; section: Section }
  | { type: "SECTION_LOAD_ERROR"; sectionKey: string; message: string }
  | { type: "ENTER_EDIT"; sectionKey: string }
  | { type: "UPDATE_FIELD"; sectionKey: string; field: string; value: string | null }
  | { type: "BULK_UPDATE_FIELDS"; sectionKey: string; values: Record<string, string | null> }
  | { type: "DISCARD_DRAFT"; sectionKey: string }
  | { type: "SAVE_START"; sectionKey: string }
  | { type: "SAVE_SUCCESS"; sectionKey: string; section: Section }
  | { type: "SAVE_VALIDATION_ERROR"; sectionKey: string; errors: Record<string, string> }
  | { type: "SAVE_CONFLICT"; sectionKey: string; section: Section }
  | { type: "SAVE_ERROR"; sectionKey: string; message: string }
  | { type: "FIELD_SNAPSHOT"; sectionKey: string; section: Section }
  | { type: "SET_OVERVIEW"; overview: RegistryOverview }
  | { type: "REQUEST_CONFIRM"; confirm: NonNullable<ConfirmState> }
  | { type: "CANCEL_CONFIRM" }
  | { type: "CONFIRM_SAVE_START" }
  | { type: "CONFIRM_SAVE_ERROR"; message: string }
  | { type: "REQUEST_CESSAZIONE_CONFIRM"; cessazione: NonNullable<CessazioneOrganoControlloState> }
  | { type: "CANCEL_CESSAZIONE_CONFIRM" }
  | { type: "CESSAZIONE_CONFIRM_START" }
  | { type: "CESSAZIONE_CONFIRM_ERROR"; message: string }
  | { type: "REQUEST_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM"; riduzione: NonNullable<RiduzioneSindaciEffettiviState> }
  | { type: "CANCEL_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM" }
  | { type: "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_START" }
  | { type: "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_ERROR"; message: string }
  | { type: "REQUEST_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM"; sectionKey: string }
  | { type: "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM" }
  | { type: "REQUEST_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM"; cambio: NonNullable<CambioAssettoAffidatarioState> }
  | { type: "CANCEL_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM" }
  | { type: "OPEN_SINTESI" }
  | { type: "CLOSE_SINTESI" }
  | { type: "EXPAND_SINTESI" }
  | { type: "COLLAPSE_SINTESI" }
  | { type: "ENTER_SINTESI_EDIT" }
  | { type: "UPDATE_SINTESI_FIELD"; fieldKey: string; value: string | null }
  | { type: "DISCARD_SINTESI_DRAFT" }
  | { type: "SINTESI_SAVE_START" }
  | { type: "SINTESI_SAVE_ERROR" }
  | { type: "OPEN_DATI_COMPLETI" }
  | { type: "CLOSE_DATI_COMPLETI" };

function withSection(state: State, sectionKey: string, patch: Partial<SectionEntry>): State {
  const attuale = state.sections[sectionKey] ?? nuovaSectionEntry();
  return { ...state, sections: { ...state.sections, [sectionKey]: { ...attuale, ...patch } } };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN_DRAWER":
      return {
        ...state,
        mode: "DRAWER",
        openSectionKey: action.sectionKey,
        highlightField: action.fieldKey ?? null,
      };
    case "CLOSE_DRAWER":
      return { ...state, mode: "OVERVIEW", openSectionKey: null, highlightField: null };
    case "CLEAR_HIGHLIGHT_FIELD":
      return { ...state, highlightField: null };
    case "PROMOTE_FULL": {
      const tabs = state.tabs.includes(action.sectionKey) ? state.tabs : [...state.tabs, action.sectionKey];
      return { ...state, mode: "FULL", openSectionKey: action.sectionKey, activeSurface: action.sectionKey, tabs };
    }
    case "PROMOTE_SPLIT": {
      const tabs = state.tabs.includes(action.sectionKey) ? state.tabs : [...state.tabs, action.sectionKey];
      return { ...state, mode: "SPLIT", openSectionKey: action.sectionKey, activeSurface: action.sectionKey, tabs };
    }
    case "CLOSE_TAB": {
      const tabs = state.tabs.filter((t) => t !== action.sectionKey);
      const eraAperta = state.openSectionKey === action.sectionKey;
      return {
        ...state,
        tabs,
        mode: tabs.length === 0 && eraAperta ? "OVERVIEW" : state.mode,
        openSectionKey: eraAperta ? (tabs.at(-1) ?? null) : state.openSectionKey,
        activeSurface: eraAperta ? "overview" : state.activeSurface,
      };
    }
    case "ACTIVATE_TAB":
      return { ...state, activeSurface: action.key, mode: action.key === "overview" ? state.mode : "FULL" };
    case "SECTION_LOAD_START":
      return withSection(state, action.sectionKey, { loading: true, error: null });
    case "SECTION_LOAD_SUCCESS":
      return withSection(state, action.sectionKey, { loading: false, error: null, server: action.section });
    case "SECTION_LOAD_ERROR":
      return withSection(state, action.sectionKey, { loading: false, error: action.message });
    case "ENTER_EDIT": {
      const entry = state.sections[action.sectionKey];
      if (!entry?.server) return state;
      return withSection(state, action.sectionKey, { editing: true, draft: sectionValues(entry.server), fieldErrors: {} });
    }
    case "UPDATE_FIELD": {
      const entry = state.sections[action.sectionKey];
      if (!entry?.draft) return state;
      return withSection(state, action.sectionKey, {
        draft: { ...entry.draft, [action.field]: action.value },
        fieldErrors: Object.fromEntries(Object.entries(entry.fieldErrors).filter(([k]) => k !== action.field)),
      });
    }
    case "BULK_UPDATE_FIELDS": {
      const entry = state.sections[action.sectionKey];
      if (!entry?.draft) return state;
      const chiaviAggiornate = new Set(Object.keys(action.values));
      return withSection(state, action.sectionKey, {
        draft: { ...entry.draft, ...action.values },
        fieldErrors: Object.fromEntries(Object.entries(entry.fieldErrors).filter(([k]) => !chiaviAggiornate.has(k))),
      });
    }
    case "DISCARD_DRAFT":
      return withSection(state, action.sectionKey, { editing: false, draft: null, fieldErrors: {}, saving: false });
    case "SAVE_START":
      return withSection(state, action.sectionKey, { saving: true });
    case "SAVE_SUCCESS":
      return withSection(state, action.sectionKey, {
        saving: false,
        editing: false,
        draft: null,
        fieldErrors: {},
        server: action.section,
      });
    case "SAVE_VALIDATION_ERROR":
      return withSection(state, action.sectionKey, { saving: false, fieldErrors: action.errors });
    case "SAVE_CONFLICT":
      return withSection(state, action.sectionKey, {
        saving: false,
        server: action.section,
        error: "I dati sono stati modificati nel frattempo: la sezione è stata ricaricata.",
      });
    case "SAVE_ERROR":
      return withSection(state, action.sectionKey, { saving: false });
    case "FIELD_SNAPSHOT":
      return withSection(state, action.sectionKey, { server: action.section });
    case "SET_OVERVIEW":
      return { ...state, overview: action.overview };
    case "REQUEST_CONFIRM":
      return { ...state, confirm: action.confirm };
    case "CANCEL_CONFIRM":
      return { ...state, confirm: null };
    case "CONFIRM_SAVE_START":
      return state.confirm ? { ...state, confirm: { ...state.confirm, saving: true, error: null } } : state;
    case "CONFIRM_SAVE_ERROR":
      return state.confirm ? { ...state, confirm: { ...state.confirm, saving: false, error: action.message } } : state;
    case "REQUEST_CESSAZIONE_CONFIRM":
      return { ...state, cessazioneOrganoControllo: action.cessazione };
    case "CANCEL_CESSAZIONE_CONFIRM":
      return { ...state, cessazioneOrganoControllo: null };
    case "CESSAZIONE_CONFIRM_START":
      return state.cessazioneOrganoControllo
        ? { ...state, cessazioneOrganoControllo: { ...state.cessazioneOrganoControllo, saving: true, error: null } }
        : state;
    case "CESSAZIONE_CONFIRM_ERROR":
      return state.cessazioneOrganoControllo
        ? { ...state, cessazioneOrganoControllo: { ...state.cessazioneOrganoControllo, saving: false, error: action.message } }
        : state;
    case "REQUEST_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM":
      return { ...state, riduzioneSindaciEffettivi: action.riduzione };
    case "CANCEL_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM":
      return { ...state, riduzioneSindaciEffettivi: null };
    case "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_START":
      return state.riduzioneSindaciEffettivi
        ? { ...state, riduzioneSindaciEffettivi: { ...state.riduzioneSindaciEffettivi, saving: true, error: null } }
        : state;
    case "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_ERROR":
      return state.riduzioneSindaciEffettivi
        ? { ...state, riduzioneSindaciEffettivi: { ...state.riduzioneSindaciEffettivi, saving: false, error: action.message } }
        : state;
    case "REQUEST_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM":
      return { ...state, cancellazioneConfigurazione: { sectionKey: action.sectionKey } };
    case "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM":
      return { ...state, cancellazioneConfigurazione: null };
    case "REQUEST_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM":
      return { ...state, cambioAssettoAffidatario: action.cambio };
    case "CANCEL_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM":
      return { ...state, cambioAssettoAffidatario: null };
    case "OPEN_SINTESI":
      return { ...state, sintesi: { open: true, full: false, editing: false, draft: {}, saving: false } };
    case "CLOSE_SINTESI":
      return { ...state, sintesi: { open: false, full: false, editing: false, draft: {}, saving: false } };
    case "EXPAND_SINTESI":
      // § Correzione 26 §3: il passaggio 50%/100% conserva modalità
      // modifica e valori non salvati — mai un CLOSE_SINTESI/OPEN_SINTESI
      // travestito, solo il flag `full`.
      return state.sintesi.open ? { ...state, sintesi: { ...state.sintesi, full: true } } : state;
    case "COLLAPSE_SINTESI":
      return state.sintesi.open ? { ...state, sintesi: { ...state.sintesi, full: false } } : state;
    case "ENTER_SINTESI_EDIT":
      return state.sintesi.open ? { ...state, sintesi: { ...state.sintesi, editing: true, draft: {} } } : state;
    case "UPDATE_SINTESI_FIELD":
      return state.sintesi.editing
        ? { ...state, sintesi: { ...state.sintesi, draft: { ...state.sintesi.draft, [action.fieldKey]: action.value } } }
        : state;
    case "DISCARD_SINTESI_DRAFT":
      return { ...state, sintesi: { ...state.sintesi, editing: false, draft: {}, saving: false } };
    case "SINTESI_SAVE_START":
      return { ...state, sintesi: { ...state.sintesi, saving: true } };
    case "SINTESI_SAVE_ERROR":
      return { ...state, sintesi: { ...state.sintesi, saving: false } };
    case "OPEN_DATI_COMPLETI": {
      // § richiesta esplicita (03/09/2026): "alla riapertura della pagina
      // non deve esserci nessuna sezione con la modalità modifica già
      // aperta" — `state.sections` è condiviso con il resto del workspace
      // (le stesse sezioni si aprono anche da una card della griglia), quindi
      // una modifica lasciata a metà altrove resterebbe visibile qui se non
      // resettata esplicitamente all'apertura.
      let sections = state.sections;
      for (const sectionKey of SEZIONI_DATI_COMPLETI_CON_BOZZA) {
        const entry = sections[sectionKey];
        if (entry?.editing) {
          sections = { ...sections, [sectionKey]: { ...entry, editing: false, draft: null, fieldErrors: {}, saving: false } };
        }
      }
      return {
        ...state,
        datiCompletiOpen: true,
        sections,
        sintesi: { open: false, full: false, editing: false, draft: {}, saving: false },
      };
    }
    case "CLOSE_DATI_COMPLETI":
      return { ...state, datiCompletiOpen: false };
    default:
      return state;
  }
}

type WorkspaceApi = {
  state: State;
  ruolo: "AZIENDA" | "CONSULENTE";
  ensureLoaded: (sectionKey: string) => void;
  reload: (sectionKey: string) => void;
  // `fieldKey` (§ richiesta esplicita 05/09/2026, link di "Ultime
  // modifiche"): evidenzia quel campo dopo l'apertura, vedi `highlightField`.
  openDrawer: (sectionKey: string, fieldKey?: string) => void;
  clearHighlightField: () => void;
  requestCloseDrawer: () => void;
  requestPromoteFull: (sectionKey: string) => void;
  requestPromoteSplit: (sectionKey: string) => void;
  requestCloseTab: (sectionKey: string) => void;
  activateTab: (key: string) => void;
  enterEdit: (sectionKey: string) => void;
  updateField: (sectionKey: string, field: string, value: string | null) => void;
  requestDiscard: (sectionKey: string) => void;
  save: (
    sectionKey: string,
    opts?: { confermaCessazioneOrganoControllo?: boolean; confermaRiduzioneSindaciEffettivi?: boolean },
  ) => Promise<boolean>;
  toggleVisibility: (sectionKey: string, fieldKey: string, visible: boolean) => void;
  toggleGroupVisibility: (sectionKey: string, fieldKeys: string[], visible: boolean) => void;
  // § richiesta esplicita 05/09/2026: pin/unpin di un campo (sezioni
  // singleton, es. Sede/Statuto/Capitale sociale) o di una riga intera
  // (tabelle annidate come Soci/Amministratori/Sindaci/Titoli abilitativi/
  // Unità locali) nella scheda Panoramica personalizzata — unica fonte
  // condivisa da `FieldRow` e da quelle tabelle, invece di ripetere in
  // ognuna il proprio fetch/stato locale.
  isCampoPinned: (sectionKey: string, campo: string) => boolean;
  isRecordPinned: (sectionKey: string, recordId: string) => boolean;
  togglePinCampo: (sectionKey: string, campo: string, etichetta: string) => void;
  togglePinRecord: (sectionKey: string, recordId: string, etichetta: string) => void;
  // § "Numero componenti" dell'organo amministrativo pluripersonale (31/08/2026):
  // si scrive subito con un endpoint dedicato, fuori dal ciclo bozza/"Salva
  // modifiche" (vedi NumeroComponentiOrganoField) — questo metodo rimpiazza
  // la copia server-side della sezione con quella appena tornata dall'API,
  // stesso identico meccanismo (FIELD_SNAPSHOT) già usato internamente da
  // `toggleVisibility` per un aggiornamento immediato, esposto qui per un
  // chiamante esterno al provider.
  refreshSectionSnapshot: (sectionKey: string, section: Section) => void;
  submitReview: (
    sectionKey: string,
    fieldKey: string,
    decision: "VERIFIED" | "REVISION_REQUIRED",
    note: string | null,
    expectedFieldVersion: number | null,
  ) => Promise<"ok" | "conflict" | "error">;
  cancelConfirm: () => void;
  confirmSaveAndExit: () => void;
  confirmDiscardAndExit: () => void;
  cancelCessazioneOrganoControllo: () => void;
  confermaCessazioneOrganoControllo: () => void;
  cancelRiduzioneSindaciEffettivi: () => void;
  confermaRiduzioneSindaciEffettivi: () => void;
  cancelCancellazioneConfigurazione: () => void;
  confermaCancellazioneConfigurazione: () => void;
  cancelCambioAssettoAffidatario: () => void;
  confermaCambioAssettoAffidatario: () => void;
  // § Correzione 25: "Visualizza sintesi" del banner CCIAA — vedi `SintesiState`.
  openSintesi: () => void;
  // § Correzione 26: chiusura "guardata" (mostra il dialogo di modifiche
  // non salvate se editing+dirty, stesso dialogo delle sezioni normali,
  // vedi `requestCloseSintesi` sotto) — a differenza di `expandSintesi`/
  // `collapseSintesi`, che non perdono mai nulla e restano dirette.
  requestCloseSintesi: () => void;
  expandSintesi: () => void;
  collapseSintesi: () => void;
  enterSintesiEdit: () => void;
  updateSintesiField: (fieldKey: string, value: string | null) => void;
  cancelSintesiEdit: () => void;
  saveSintesiEdit: () => Promise<boolean>;
  // § Correzione 26 §15: "Apri dati camerali completi" — vedi commento su
  // `datiCompletiOpen`.
  openDatiCompleti: () => void;
  // § richiesta esplicita (03/09/2026): chiusura guardata (mostra il
  // dialogo di modifiche non salvate se una o più sezioni della pagina sono
  // dirty) — a differenza della vecchia `closeDatiCompleti` diretta, non più
  // esposta apposta (stesso principio di `requestCloseSintesi`, che non
  // espone nemmeno una `closeSintesi` diretta bypassabile).
  requestCloseDatiCompleti: () => void;
};

const WorkspaceContext = createContext<WorkspaceApi | null>(null);

export function WorkspaceProvider({
  children,
  ruolo,
  overviewIniziale,
}: {
  children: ReactNode;
  ruolo: "AZIENDA" | "CONSULENTE";
  overviewIniziale: RegistryOverview;
}) {
  const [state, dispatch] = useReducer(reducer, {
    mode: "OVERVIEW",
    openSectionKey: null,
    tabs: [],
    activeSurface: "overview",
    sections: {},
    highlightField: null,
    overview: overviewIniziale,
    confirm: null,
    cessazioneOrganoControllo: null,
    riduzioneSindaciEffettivi: null,
    cancellazioneConfigurazione: null,
    cambioAssettoAffidatario: null,
    sintesi: { open: false, full: false, editing: false, draft: {}, saving: false },
    datiCompletiOpen: false,
  });

  const router = useRouter();

  // Evita richieste duplicate quando piu' componenti montano nello stesso
  // tick (drawer + card di anteprima che richiedono la stessa sezione).
  const richiesteInCorso = useRef<Set<string>>(new Set());

  const rinfrescaOverview = useCallback(() => {
    getRegistroOverview()
      .then((overview) => dispatch({ type: "SET_OVERVIEW", overview }))
      .catch(() => undefined);
  }, []);

  // § richiesta esplicita 05/09/2026: "Completamento scheda", le card della
  // griglia (presenti/totale/pallini) e le macro sezioni sono calcolate lato
  // server in `page.tsx` (Server Component) e passate come `children` — un
  // salvataggio/una riga aggiunta/una verifica dentro un drawer non tocca
  // mai quell'albero React, quindi restavano visibilmente non aggiornate
  // finché non si ricaricava tutta la pagina (anche per le mutazioni che non
  // passano da questo provider, es. le tabelle di Soci/Titoli abilitativi/
  // Unità locali/Personale e occupazione/Aggiornamento impresa, ciascuna con
  // le proprie server action). `router.refresh()` a ogni ritorno alla
  // panoramica (drawer/tab/"Dati camerali completi" chiusi) rilancia il
  // Server Component con i dati freschi, qualunque sia stata la mutazione;
  // `rinfrescaOverview()` allo stesso momento copre "Qualità dei dati"/
  // "Ultime modifiche" (stato React di questo provider, che un
  // `router.refresh()` da solo non aggiorna perché non fa ripartire da zero
  // lo `useReducer` già inizializzato).
  const eraApertoRef = useRef(false);
  useEffect(() => {
    const aperto = state.mode !== "OVERVIEW" || state.datiCompletiOpen;
    if (eraApertoRef.current && !aperto) {
      router.refresh();
      rinfrescaOverview();
    }
    eraApertoRef.current = aperto;
  }, [state.mode, state.datiCompletiOpen, router, rinfrescaOverview]);

  // § richiesta esplicita 05/09/2026 ("ogni campo di ogni sezione deve
  // poter essere pinnato nella panoramica"): un solo caricamento per tutto
  // il workspace, condiviso da `FieldRow` (pin di un campo) e dalle
  // tabelle annidate come Soci/Amministratori/Sindaci/Titoli abilitativi/
  // Unità locali (pin di una riga) — evita a ciascuno di rifare la stessa
  // fetch. Stato locale, non nel reducer sopra: indipendente dal resto
  // della macchina a stati del workspace, aggiornato in modo ottimistico
  // ad ogni toggle invece di dipendere da `router.refresh()`.
  const [panoramica, setPanoramica] = useState<PanoramicaVoce[]>([]);
  useEffect(() => {
    getVociPanoramica(MODULO_ANAGRAFICA)
      .then(setPanoramica)
      .catch(() => undefined);
  }, []);

  const isCampoPinned = useCallback(
    (sectionKey: string, campo: string) =>
      panoramica.some((v) => v.sezione_slug === sectionKey && v.campo === campo),
    [panoramica],
  );
  const isRecordPinned = useCallback(
    (sectionKey: string, recordId: string) =>
      panoramica.some((v) => v.sezione_slug === sectionKey && v.record_id === recordId),
    [panoramica],
  );
  const togglePinCampo = useCallback(
    (sectionKey: string, campo: string, etichetta: string) => {
      const pinned = panoramica.some((v) => v.sezione_slug === sectionKey && v.campo === campo);
      setPanoramica((voci) =>
        pinned ? voci.filter((v) => !(v.sezione_slug === sectionKey && v.campo === campo)) : voci,
      );
      if (pinned) {
        unpinVocePanoramica(MODULO_ANAGRAFICA, sectionKey, campo).catch(() => undefined);
      } else {
        pinVocePanoramica(MODULO_ANAGRAFICA, sectionKey, campo, etichetta)
          .then((voce) => setPanoramica((voci) => [...voci, voce]))
          .catch(() => undefined);
      }
    },
    [panoramica],
  );
  const togglePinRecord = useCallback(
    (sectionKey: string, recordId: string, etichetta: string) => {
      const pinned = panoramica.some((v) => v.sezione_slug === sectionKey && v.record_id === recordId);
      setPanoramica((voci) =>
        pinned ? voci.filter((v) => !(v.sezione_slug === sectionKey && v.record_id === recordId)) : voci,
      );
      if (pinned) {
        unpinRecordPanoramica(MODULO_ANAGRAFICA, sectionKey, recordId).catch(() => undefined);
      } else {
        pinRecordPanoramica(MODULO_ANAGRAFICA, sectionKey, recordId, etichetta)
          .then((voce) => setPanoramica((voci) => [...voci, voce]))
          .catch(() => undefined);
      }
    },
    [panoramica],
  );

  const caricaSezione = useCallback((sectionKey: string) => {
    if (richiesteInCorso.current.has(sectionKey)) return;
    richiesteInCorso.current.add(sectionKey);
    dispatch({ type: "SECTION_LOAD_START", sectionKey });
    getRegistroSezione(sectionKey)
      .then((section) => dispatch({ type: "SECTION_LOAD_SUCCESS", sectionKey, section }))
      .catch(() => dispatch({ type: "SECTION_LOAD_ERROR", sectionKey, message: "Impossibile caricare i dati" }))
      .finally(() => richiesteInCorso.current.delete(sectionKey));
  }, []);

  const ensureLoaded = useCallback(
    (sectionKey: string) => {
      const entry = state.sections[sectionKey];
      if (!entry || (!entry.loading && !entry.server && !entry.error)) caricaSezione(sectionKey);
    },
    [state.sections, caricaSezione],
  );

  const reload = useCallback((sectionKey: string) => caricaSezione(sectionKey), [caricaSezione]);

  const chiudiSeNonSporca = useCallback(
    (sectionKey: string, azioneChiusura: () => void) => {
      const entry = state.sections[sectionKey];
      if (entry && isSectionDirty(entry)) {
        dispatch({
          type: "REQUEST_CONFIRM",
          confirm: {
            sectionKey,
            saving: false,
            error: null,
            onDiscard: () => {
              dispatch({ type: "DISCARD_DRAFT", sectionKey });
              azioneChiusura();
            },
            onSaved: azioneChiusura,
          },
        });
        return;
      }
      azioneChiusura();
    },
    [state.sections],
  );

  const requestCloseDrawer = useCallback(() => {
    if (!state.openSectionKey) return;
    chiudiSeNonSporca(state.openSectionKey, () => dispatch({ type: "CLOSE_DRAWER" }));
  }, [state.openSectionKey, chiudiSeNonSporca]);

  const requestCloseTab = useCallback(
    (sectionKey: string) => {
      chiudiSeNonSporca(sectionKey, () => dispatch({ type: "CLOSE_TAB", sectionKey }));
    },
    [chiudiSeNonSporca],
  );

  const requestDiscard = useCallback(
    (sectionKey: string) => {
      const entry = state.sections[sectionKey];
      if (entry && isSectionDirty(entry)) {
        dispatch({
          type: "REQUEST_CONFIRM",
          confirm: {
            sectionKey,
            saving: false,
            error: null,
            onDiscard: () => dispatch({ type: "DISCARD_DRAFT", sectionKey }),
            onSaved: () => undefined,
          },
        });
        return;
      }
      dispatch({ type: "DISCARD_DRAFT", sectionKey });
    },
    [state.sections],
  );

  // § Richiesta esplicita dell'utente (31/08/2026): il passaggio della
  // sezione "organi-controllo" a "Nessun organo di controllo o revisore"
  // deve chiedere conferma SUBITO, al momento della scelta nel menu (non
  // solo al salvataggio) e — a differenza del principio generale "il
  // cambio di configurazione non elimina dati" (§ Correzione 11/12) —
  // deve poi cancellare per davvero le informazioni della configurazione
  // precedente. Intercettato qui, il punto in cui passano TUTTI i cambi
  // di campo qualunque sia il componente che li genera (stesso livello del
  // già presente `if section_key == "organi-controllo"` lato backend in
  // `salva_sezione`): se non c'è nulla da perdere (bozza già vuota per
  // tutti gli altri campi scrivibili) il cambio si applica direttamente,
  // senza disturbare l'utente con una conferma inutile.
  const updateField = useCallback(
    (sectionKey: string, field: string, value: string | null) => {
      if (sectionKey === "organi-controllo" && field === "assetto_controllo_in_carica" && value === "NESSUN_ORGANO_CONTROLLO") {
        const entry = state.sections[sectionKey];
        const draft = entry?.draft;
        if (draft && normalizza(draft[field]) !== value) {
          const altroCampoValorizzato = entry?.server?.groups
            .flatMap((g) => g.fields)
            .some((f) => f.editable && f.key !== field && normalizza(draft[f.key]) !== null);
          if (altroCampoValorizzato) {
            dispatch({ type: "REQUEST_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM", sectionKey });
            return;
          }
        }
      }
      // § Correzione 15: entrare in un assetto "revisore esterno
      // standalone" forza subito "Revisione legale affidata a" allo
      // stesso codice (§ testo esplicito "il valore deve essere impostato
      // su..."). Direzione primaria, nessuna conferma necessaria: nessun
      // dato perso, solo un secondo campo che si autoimposta insieme al
      // primo — a differenza della cancellazione sopra, che invece azzera
      // gli altri campi e per questo richiede conferma.
      if (
        sectionKey === "organi-controllo" &&
        field === "assetto_controllo_in_carica" &&
        value !== null &&
        ASSETTI_REVISORE_ESTERNO_STANDALONE.has(value)
      ) {
        dispatch({
          type: "BULK_UPDATE_FIELDS",
          sectionKey,
          values: { assetto_controllo_in_carica: value, revisione_legale_affidata_a: value },
        });
        return;
      }
      // § Correzione 15: direzione inversa — cambiare "Revisione legale
      // affidata a" mentre l'assetto in bozza è già uno di questi stessi
      // assetti richiede conferma prima di aggiornare anche l'assetto (§
      // testo esplicito "dopo aver richiesto conferma e senza perdere i
      // dati già inseriti", quindi nessun azzeramento degli altri campi
      // qui). Nessuna interruzione se il nuovo valore non ha un assetto
      // corrispondente (es. "Non attribuita"): resta una combinazione
      // temporaneamente incoerente, bloccata solo al salvataggio lato
      // backend — non c'è una destinazione sensata a cui proporre di
      // passare, quindi nessun dialogo per quel caso.
      if (sectionKey === "organi-controllo" && field === "revisione_legale_affidata_a") {
        const entry = state.sections[sectionKey];
        const assettoCorrente = entry?.draft?.["assetto_controllo_in_carica"] ?? null;
        if (
          assettoCorrente &&
          ASSETTI_REVISORE_ESTERNO_STANDALONE.has(assettoCorrente) &&
          value !== null &&
          value !== assettoCorrente &&
          AFFIDATARI_CON_ASSETTO_CORRISPONDENTE.has(value)
        ) {
          const nuovoAssettoLabel =
            entry?.server?.groups
              .flatMap((g) => g.fields)
              .find((f) => f.key === "assetto_controllo_in_carica")
              ?.options?.find((o) => o.code === value)?.label ?? value;
          dispatch({
            type: "REQUEST_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM",
            cambio: { sectionKey, nuovoAssetto: value, nuovoAssettoLabel },
          });
          return;
        }
      }
      dispatch({ type: "UPDATE_FIELD", sectionKey, field, value });
    },
    [state.sections],
  );

  // Applica il cambio di assetto e cancella nella bozza tutti gli altri
  // campi scrivibili della sezione — la cancellazione diventa definitiva
  // solo al successivo "Salva modifiche" (stesso percorso di un qualunque
  // altro campo modificato, nessun salvataggio nascosto qui: la richiesta
  // era "prima di farlo... mi deve chiedere", la conferma è già avvenuta
  // qui, il salvataggio resta un'azione distinta e visibile).
  const confermaCancellazioneConfigurazione = useCallback(() => {
    if (!state.cancellazioneConfigurazione) return;
    const { sectionKey } = state.cancellazioneConfigurazione;
    const entry = state.sections[sectionKey];
    if (entry?.draft && entry.server) {
      const valori: Record<string, string | null> = { assetto_controllo_in_carica: "NESSUN_ORGANO_CONTROLLO" };
      for (const f of entry.server.groups.flatMap((g) => g.fields)) {
        if (f.editable && f.key !== "assetto_controllo_in_carica") valori[f.key] = null;
      }
      dispatch({ type: "BULK_UPDATE_FIELDS", sectionKey, values: valori });
    }
    dispatch({ type: "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM" });
  }, [state.cancellazioneConfigurazione, state.sections]);

  const cancelCancellazioneConfigurazione = useCallback(() => {
    dispatch({ type: "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM" });
  }, []);

  // § Correzione 15: applica insieme sia "Assetto di controllo in carica"
  // sia "Revisione legale affidata a" (stesso codice, § coerenza
  // vincolante per questi assetti) — senza toccare nessun altro campo
  // della bozza, a differenza di `confermaCancellazioneConfigurazione`
  // sopra: qui non c'è nulla da perdere, solo due campi da tenere allineati.
  const confermaCambioAssettoAffidatario = useCallback(() => {
    if (!state.cambioAssettoAffidatario) return;
    const { sectionKey, nuovoAssetto } = state.cambioAssettoAffidatario;
    dispatch({
      type: "BULK_UPDATE_FIELDS",
      sectionKey,
      values: { assetto_controllo_in_carica: nuovoAssetto, revisione_legale_affidata_a: nuovoAssetto },
    });
    dispatch({ type: "CANCEL_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM" });
  }, [state.cambioAssettoAffidatario]);

  const cancelCambioAssettoAffidatario = useCallback(() => {
    dispatch({ type: "CANCEL_CAMBIO_ASSETTO_AFFIDATARIO_CONFIRM" });
  }, []);

  const save = useCallback(
    async (
      sectionKey: string,
      opts?: { confermaCessazioneOrganoControllo?: boolean; confermaRiduzioneSindaciEffettivi?: boolean },
    ): Promise<boolean> => {
      const entry = state.sections[sectionKey];
      if (!entry?.draft) return false;
      dispatch({ type: "SAVE_START", sectionKey });
      const esito = await salvaSezioneRegistro(sectionKey, entry.server?.version ?? null, entry.draft, opts);
      if (esito.esito === "ok") {
        dispatch({ type: "SAVE_SUCCESS", sectionKey, section: esito.sezione });
        rinfrescaOverview();
        return true;
      }
      if (esito.esito === "validazione") {
        dispatch({ type: "SAVE_VALIDATION_ERROR", sectionKey, errors: esito.errori });
        return false;
      }
      if (esito.esito === "conflitto") {
        dispatch({ type: "SAVE_CONFLICT", sectionKey, section: esito.sezione });
        return false;
      }
      if (esito.esito === "conferma_cessazione_organo_controllo") {
        // § Correzione 12: non un errore — resta "saving" spento (l'utente
        // deve decidere nel dialogo dedicato, non vede lo spinner del
        // pulsante "Salva modifiche" restare acceso).
        dispatch({ type: "SAVE_ERROR", sectionKey, message: "" });
        dispatch({
          type: "REQUEST_CESSAZIONE_CONFIRM",
          cessazione: { sectionKey, messaggio: esito.messaggio, count: esito.count, saving: false, error: null },
        });
        return false;
      }
      if (esito.esito === "conferma_riduzione_sindaci_effettivi") {
        // § Correzione 14: stesso trattamento di "conferma_cessazione_organo_controllo".
        dispatch({ type: "SAVE_ERROR", sectionKey, message: "" });
        dispatch({
          type: "REQUEST_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM",
          riduzione: { sectionKey, messaggio: esito.messaggio, count: esito.count, saving: false, error: null },
        });
        return false;
      }
      dispatch({ type: "SAVE_ERROR", sectionKey, message: esito.messaggio });
      return false;
    },
    [state.sections, rinfrescaOverview],
  );

  // § Correzione 26 §8.2/§16: salva SOLO i campi booleani toccati nella
  // sintesi, come PATCH parziale sulla vera sezione "attivita-economica"
  // (stesso endpoint di `save`, mai un salvataggio parallelo) — così il
  // valore risulta aggiornato anche nella sezione completa, senza toccare
  // gli altri campi di quella sezione che la sintesi non ha mai caricato
  // in bozza. Se non c'è nulla di cambiato non chiama il backend.
  const saveSintesiEdit = useCallback(async (): Promise<boolean> => {
    const draft = state.sintesi.draft;
    if (Object.keys(draft).length === 0) {
      dispatch({ type: "DISCARD_SINTESI_DRAFT" });
      return true;
    }
    const entry = state.sections["attivita-economica"];
    dispatch({ type: "SINTESI_SAVE_START" });
    const esito = await salvaSezioneRegistro("attivita-economica", entry?.server?.version ?? null, draft);
    if (esito.esito === "ok") {
      dispatch({ type: "FIELD_SNAPSHOT", sectionKey: "attivita-economica", section: esito.sezione });
      dispatch({ type: "DISCARD_SINTESI_DRAFT" });
      rinfrescaOverview();
      return true;
    }
    dispatch({ type: "SINTESI_SAVE_ERROR" });
    return false;
  }, [state.sintesi.draft, state.sections, rinfrescaOverview]);

  const enterSintesiEdit = useCallback(() => dispatch({ type: "ENTER_SINTESI_EDIT" }), []);
  const updateSintesiField = useCallback(
    (fieldKey: string, value: string | null) => dispatch({ type: "UPDATE_SINTESI_FIELD", fieldKey, value }),
    [],
  );
  const cancelSintesiEdit = useCallback(() => dispatch({ type: "DISCARD_SINTESI_DRAFT" }), []);

  // § Correzione 26 §4: chiudere la sintesi mentre ci sono modifiche non
  // salvate deve chiedere conferma, stesso dialogo/stessa struttura già
  // usata per le sezioni (`chiudiSeNonSporca`), qui riadattata alla bozza
  // indipendente della sintesi invece di `state.sections`.
  const requestCloseSintesi = useCallback(() => {
    if (state.sintesi.editing && Object.keys(state.sintesi.draft).length > 0) {
      dispatch({
        type: "REQUEST_CONFIRM",
        confirm: {
          sectionKey: "__sintesi__",
          saving: false,
          error: null,
          onDiscard: () => {
            dispatch({ type: "DISCARD_SINTESI_DRAFT" });
            dispatch({ type: "CLOSE_SINTESI" });
          },
          onSaved: () => dispatch({ type: "CLOSE_SINTESI" }),
        },
      });
      return;
    }
    dispatch({ type: "CLOSE_SINTESI" });
  }, [state.sintesi]);

  const toggleVisibility = useCallback(
    (sectionKey: string, fieldKey: string, visible: boolean) => {
      // Ottimistico: applica subito, ripristina in caso di errore (§13.3/§19).
      const entry = state.sections[sectionKey];
      const precedente = entry?.server ?? null;
      if (precedente) {
        const ottimistico: Section = {
          ...precedente,
          groups: precedente.groups.map((g) => ({
            ...g,
            fields: g.fields.map((f) => (f.key === fieldKey ? { ...f, visibleToCompany: visible } : f)),
          })),
        };
        dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: ottimistico });
      }
      impostaVisibilitaCampo(sectionKey, fieldKey, visible).then((esito) => {
        if (esito.esito === "ok") {
          dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: esito.sezione });
          // La qualità dei dati esclude i campi oscurati (§11.2, decisione
          // esplicita dell'utente): l'occhietto sposta un campo dentro o
          // fuori dal calcolo, la card "Qualità dei dati" della Home va
          // quindi riallineata subito, non solo al prossimo caricamento.
          rinfrescaOverview();
        } else if (precedente) {
          dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: precedente });
        }
      });
    },
    [state.sections, rinfrescaOverview],
  );

  const toggleGroupVisibility = useCallback(
    async (sectionKey: string, fieldKeys: string[], visible: boolean) => {
      // Bulk lato client (§9.3/§24.4 del prompt master): nessun endpoint
      // dedicato, applica in sequenza lo stesso endpoint per-campo già
      // usato da toggleVisibility, poi allinea lo stato al risultato finale.
      const entry = state.sections[sectionKey];
      const precedente = entry?.server ?? null;
      if (precedente) {
        const fieldKeySet = new Set(fieldKeys);
        const ottimistico: Section = {
          ...precedente,
          groups: precedente.groups.map((g) => ({
            ...g,
            fields: g.fields.map((f) => (fieldKeySet.has(f.key) ? { ...f, visibleToCompany: visible } : f)),
          })),
        };
        dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: ottimistico });
      }
      let ultima: Section | null = null;
      let fallita = false;
      for (const fieldKey of fieldKeys) {
        const esito = await impostaVisibilitaCampo(sectionKey, fieldKey, visible);
        if (esito.esito === "ok") ultima = esito.sezione;
        else fallita = true;
      }
      if (ultima) {
        dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: ultima });
        rinfrescaOverview(); // vedi toggleVisibility: la qualità esclude i campi oscurati.
      } else if (fallita && precedente) {
        dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: precedente });
      }
    },
    [state.sections, rinfrescaOverview],
  );

  const submitReview = useCallback(
    async (
      sectionKey: string,
      fieldKey: string,
      decision: "VERIFIED" | "REVISION_REQUIRED",
      note: string | null,
      expectedFieldVersion: number | null,
    ) => {
      const esito = await inviaDecisioneVerifica(sectionKey, fieldKey, decision, note, expectedFieldVersion);
      if (esito.esito === "ok") {
        dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section: esito.sezione });
        rinfrescaOverview();
        return "ok" as const;
      }
      if (esito.esito === "conflitto") {
        caricaSezione(sectionKey);
        return "conflict" as const;
      }
      return "error" as const;
    },
    [rinfrescaOverview, caricaSezione],
  );

  const confirmDiscardAndExit = useCallback(() => {
    if (!state.confirm) return;
    state.confirm.onDiscard();
    dispatch({ type: "CANCEL_CONFIRM" });
  }, [state.confirm]);

  // § richiesta esplicita (03/09/2026): salva TUTTE le sezioni con bozza non
  // salvata di "Dati camerali completi" (possono essere più di una, a
  // differenza di `save`/`saveSintesiEdit` che operano su una sola sezione)
  // — usata solo dalla sentinella "__dati_completi__" di `confirmSaveAndExit`
  // sotto. Si ferma al primo salvataggio fallito (`SAVE_VALIDATION_ERROR`/
  // `SAVE_CONFLICT` restano visibili su quella sezione quando si riapre la
  // pagina), senza tentare le successive.
  const saveAllDatiCompleti = useCallback(async (): Promise<boolean> => {
    const daSalvare = SEZIONI_DATI_COMPLETI_CON_BOZZA.filter((sectionKey) => {
      const entry = state.sections[sectionKey];
      return entry ? isSectionDirty(entry) : false;
    });
    for (const sectionKey of daSalvare) {
      const ok = await save(sectionKey);
      if (!ok) return false;
    }
    return true;
  }, [state.sections, save]);

  const confirmSaveAndExit = useCallback(() => {
    if (!state.confirm) return;
    const { sectionKey, onSaved } = state.confirm;
    dispatch({ type: "CONFIRM_SAVE_START" });
    // § Correzione 26: "__sintesi__" è la sentinella di `requestCloseSintesi`
    // per la bozza indipendente della sintesi — mai una vera sectionKey,
    // mai passata a `save` (che leggerebbe `state.sections["__sintesi__"]`,
    // inesistente). "__dati_completi__" (03/09/2026): stessa idea, sentinella
    // di `requestCloseDatiCompleti` sotto, ma può coprire più sezioni dirty
    // insieme (vedi `saveAllDatiCompleti`).
    const esito =
      sectionKey === "__sintesi__"
        ? saveSintesiEdit()
        : sectionKey === "__dati_completi__"
          ? saveAllDatiCompleti()
          : save(sectionKey);
    esito.then((ok) => {
      if (ok) {
        onSaved();
        dispatch({ type: "CANCEL_CONFIRM" });
      } else {
        dispatch({ type: "CONFIRM_SAVE_ERROR", message: "Impossibile salvare: correggi gli errori e riprova." });
      }
    });
  }, [state.confirm, save, saveSintesiEdit, saveAllDatiCompleti]);

  // § richiesta esplicita (03/09/2026): chiusura "guardata" del pulsante
  // "Chiudi" (X) di "Dati camerali completi" — stesso principio di
  // `requestCloseSintesi`/`chiudiSeNonSporca`, ma controlla tutte le
  // sezioni della pagina insieme (`SEZIONI_DATI_COMPLETI_CON_BOZZA`) invece
  // di una sola. "Esci senza salvare" scarta la bozza di OGNI sezione
  // dirty, non solo la prima — mai lasciarne una a metà scartata e le
  // altre no.
  const requestCloseDatiCompleti = useCallback(() => {
    const dirtyKeys = SEZIONI_DATI_COMPLETI_CON_BOZZA.filter((sectionKey) => {
      const entry = state.sections[sectionKey];
      return entry ? isSectionDirty(entry) : false;
    });
    if (dirtyKeys.length > 0) {
      dispatch({
        type: "REQUEST_CONFIRM",
        confirm: {
          sectionKey: "__dati_completi__",
          saving: false,
          error: null,
          onDiscard: () => {
            for (const sectionKey of dirtyKeys) dispatch({ type: "DISCARD_DRAFT", sectionKey });
            dispatch({ type: "CLOSE_DATI_COMPLETI" });
          },
          onSaved: () => dispatch({ type: "CLOSE_DATI_COMPLETI" }),
        },
      });
      return;
    }
    dispatch({ type: "CLOSE_DATI_COMPLETI" });
  }, [state.sections]);

  // § Correzione 12: seconda chiamata dello stesso salvataggio, questa
  // volta con il flag di conferma — il backend cessa gli incarichi attivi
  // e salva la sezione nella stessa transazione (mai due chiamate
  // separate, § "operazioni composite = transazione unica").
  const confermaCessazioneOrganoControllo = useCallback(() => {
    if (!state.cessazioneOrganoControllo) return;
    const { sectionKey } = state.cessazioneOrganoControllo;
    dispatch({ type: "CESSAZIONE_CONFIRM_START" });
    save(sectionKey, { confermaCessazioneOrganoControllo: true }).then((ok) => {
      if (ok) dispatch({ type: "CANCEL_CESSAZIONE_CONFIRM" });
      else dispatch({ type: "CESSAZIONE_CONFIRM_ERROR", message: "Impossibile salvare: riprova." });
    });
  }, [state.cessazioneOrganoControllo, save]);

  const cancelCessazioneOrganoControllo = useCallback(() => {
    dispatch({ type: "CANCEL_CESSAZIONE_CONFIRM" });
  }, []);

  // § Correzione 14: stesso pattern di `confermaCessazioneOrganoControllo`
  // sopra, per la riduzione di "Sindaci effettivi".
  const confermaRiduzioneSindaciEffettivi = useCallback(() => {
    if (!state.riduzioneSindaciEffettivi) return;
    const { sectionKey } = state.riduzioneSindaciEffettivi;
    dispatch({ type: "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_START" });
    save(sectionKey, { confermaRiduzioneSindaciEffettivi: true }).then((ok) => {
      if (ok) dispatch({ type: "CANCEL_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM" });
      else dispatch({ type: "RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM_ERROR", message: "Impossibile salvare: riprova." });
    });
  }, [state.riduzioneSindaciEffettivi, save]);

  const cancelRiduzioneSindaciEffettivi = useCallback(() => {
    dispatch({ type: "CANCEL_RIDUZIONE_SINDACI_EFFETTIVI_CONFIRM" });
  }, []);

  const api = useMemo<WorkspaceApi>(
    () => ({
      state,
      ruolo,
      ensureLoaded,
      reload,
      openDrawer: (sectionKey, fieldKey) => dispatch({ type: "OPEN_DRAWER", sectionKey, fieldKey }),
      clearHighlightField: () => dispatch({ type: "CLEAR_HIGHLIGHT_FIELD" }),
      requestCloseDrawer,
      requestPromoteFull: (sectionKey) => dispatch({ type: "PROMOTE_FULL", sectionKey }),
      requestPromoteSplit: (sectionKey) => dispatch({ type: "PROMOTE_SPLIT", sectionKey }),
      requestCloseTab,
      activateTab: (key) => dispatch({ type: "ACTIVATE_TAB", key }),
      enterEdit: (sectionKey) => dispatch({ type: "ENTER_EDIT", sectionKey }),
      updateField,
      requestDiscard,
      save,
      toggleVisibility,
      toggleGroupVisibility,
      isCampoPinned,
      isRecordPinned,
      togglePinCampo,
      togglePinRecord,
      refreshSectionSnapshot: (sectionKey, section) => dispatch({ type: "FIELD_SNAPSHOT", sectionKey, section }),
      submitReview,
      cancelConfirm: () => dispatch({ type: "CANCEL_CONFIRM" }),
      confirmSaveAndExit,
      confirmDiscardAndExit,
      cancelCessazioneOrganoControllo,
      confermaCessazioneOrganoControllo,
      cancelRiduzioneSindaciEffettivi,
      confermaRiduzioneSindaciEffettivi,
      cancelCancellazioneConfigurazione,
      confermaCancellazioneConfigurazione,
      cancelCambioAssettoAffidatario,
      confermaCambioAssettoAffidatario,
      openSintesi: () => dispatch({ type: "OPEN_SINTESI" }),
      requestCloseSintesi,
      expandSintesi: () => dispatch({ type: "EXPAND_SINTESI" }),
      collapseSintesi: () => dispatch({ type: "COLLAPSE_SINTESI" }),
      enterSintesiEdit,
      updateSintesiField,
      cancelSintesiEdit,
      saveSintesiEdit,
      openDatiCompleti: () => dispatch({ type: "OPEN_DATI_COMPLETI" }),
      requestCloseDatiCompleti,
    }),
    [
      state,
      requestCloseSintesi,
      enterSintesiEdit,
      updateSintesiField,
      cancelSintesiEdit,
      saveSintesiEdit,
      ruolo,
      ensureLoaded,
      reload,
      requestCloseDrawer,
      requestCloseTab,
      updateField,
      requestDiscard,
      save,
      toggleVisibility,
      toggleGroupVisibility,
      isCampoPinned,
      isRecordPinned,
      togglePinCampo,
      togglePinRecord,
      submitReview,
      confirmSaveAndExit,
      confirmDiscardAndExit,
      cancelCessazioneOrganoControllo,
      confermaCessazioneOrganoControllo,
      cancelRiduzioneSindaciEffettivi,
      confermaRiduzioneSindaciEffettivi,
      cancelCancellazioneConfigurazione,
      confermaCancellazioneConfigurazione,
      cancelCambioAssettoAffidatario,
      confermaCambioAssettoAffidatario,
      requestCloseDatiCompleti,
    ],
  );

  return (
    <WorkspaceContext.Provider value={api}>
      <TooltipProvider>{children}</TooltipProvider>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace deve essere usato dentro WorkspaceProvider");
  return ctx;
}
