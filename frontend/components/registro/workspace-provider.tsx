"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getRegistroOverview,
  getRegistroSezione,
  impostaVisibilitaCampo,
  inviaDecisioneVerifica,
  salvaSezioneRegistro,
} from "@/lib/actions/registro";
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

type State = {
  mode: WorkspaceMode;
  openSectionKey: string | null;
  tabs: string[];
  activeSurface: "overview" | string;
  sections: Record<string, SectionEntry>;
  overview: RegistryOverview;
  confirm: ConfirmState;
  cessazioneOrganoControllo: CessazioneOrganoControlloState;
  cancellazioneConfigurazione: CancellazioneConfigurazioneState;
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
  | { type: "OPEN_DRAWER"; sectionKey: string }
  | { type: "CLOSE_DRAWER" }
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
  | { type: "REQUEST_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM"; sectionKey: string }
  | { type: "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM" };

function withSection(state: State, sectionKey: string, patch: Partial<SectionEntry>): State {
  const attuale = state.sections[sectionKey] ?? nuovaSectionEntry();
  return { ...state, sections: { ...state.sections, [sectionKey]: { ...attuale, ...patch } } };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN_DRAWER":
      return { ...state, mode: "DRAWER", openSectionKey: action.sectionKey };
    case "CLOSE_DRAWER":
      return { ...state, mode: "OVERVIEW", openSectionKey: null };
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
    case "REQUEST_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM":
      return { ...state, cancellazioneConfigurazione: { sectionKey: action.sectionKey } };
    case "CANCEL_CANCELLAZIONE_CONFIGURAZIONE_CONFIRM":
      return { ...state, cancellazioneConfigurazione: null };
    default:
      return state;
  }
}

type WorkspaceApi = {
  state: State;
  ruolo: "AZIENDA" | "CONSULENTE";
  ensureLoaded: (sectionKey: string) => void;
  reload: (sectionKey: string) => void;
  openDrawer: (sectionKey: string) => void;
  requestCloseDrawer: () => void;
  requestPromoteFull: (sectionKey: string) => void;
  requestPromoteSplit: (sectionKey: string) => void;
  requestCloseTab: (sectionKey: string) => void;
  activateTab: (key: string) => void;
  enterEdit: (sectionKey: string) => void;
  updateField: (sectionKey: string, field: string, value: string | null) => void;
  requestDiscard: (sectionKey: string) => void;
  save: (sectionKey: string, opts?: { confermaCessazioneOrganoControllo?: boolean }) => Promise<boolean>;
  toggleVisibility: (sectionKey: string, fieldKey: string, visible: boolean) => void;
  toggleGroupVisibility: (sectionKey: string, fieldKeys: string[], visible: boolean) => void;
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
  cancelCancellazioneConfigurazione: () => void;
  confermaCancellazioneConfigurazione: () => void;
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
    overview: overviewIniziale,
    confirm: null,
    cessazioneOrganoControllo: null,
    cancellazioneConfigurazione: null,
  });

  // Evita richieste duplicate quando piu' componenti montano nello stesso
  // tick (drawer + card di anteprima che richiedono la stessa sezione).
  const richiesteInCorso = useRef<Set<string>>(new Set());

  const rinfrescaOverview = useCallback(() => {
    getRegistroOverview()
      .then((overview) => dispatch({ type: "SET_OVERVIEW", overview }))
      .catch(() => undefined);
  }, []);

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

  const save = useCallback(
    async (sectionKey: string, opts?: { confermaCessazioneOrganoControllo?: boolean }): Promise<boolean> => {
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
      dispatch({ type: "SAVE_ERROR", sectionKey, message: esito.messaggio });
      return false;
    },
    [state.sections, rinfrescaOverview],
  );

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

  const confirmSaveAndExit = useCallback(() => {
    if (!state.confirm) return;
    const { sectionKey, onSaved } = state.confirm;
    dispatch({ type: "CONFIRM_SAVE_START" });
    save(sectionKey).then((ok) => {
      if (ok) {
        onSaved();
        dispatch({ type: "CANCEL_CONFIRM" });
      } else {
        dispatch({ type: "CONFIRM_SAVE_ERROR", message: "Impossibile salvare: correggi gli errori e riprova." });
      }
    });
  }, [state.confirm, save]);

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

  const api = useMemo<WorkspaceApi>(
    () => ({
      state,
      ruolo,
      ensureLoaded,
      reload,
      openDrawer: (sectionKey) => dispatch({ type: "OPEN_DRAWER", sectionKey }),
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
      submitReview,
      cancelConfirm: () => dispatch({ type: "CANCEL_CONFIRM" }),
      confirmSaveAndExit,
      confirmDiscardAndExit,
      cancelCessazioneOrganoControllo,
      confermaCessazioneOrganoControllo,
      cancelCancellazioneConfigurazione,
      confermaCancellazioneConfigurazione,
    }),
    [
      state,
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
      submitReview,
      confirmSaveAndExit,
      confirmDiscardAndExit,
      cancelCessazioneOrganoControllo,
      confermaCessazioneOrganoControllo,
      cancelCancellazioneConfigurazione,
      confermaCancellazioneConfigurazione,
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
