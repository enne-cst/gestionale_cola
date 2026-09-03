"use client";

import { BarChart3Icon, BuildingIcon, ScrollTextIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { TitoliAbilitativiTable } from "@/app/(app)/anagrafica/titoli-abilitativi/titoli-abilitativi-table";
import { getIndicatoriAggiornamentoImpresa } from "@/app/(app)/anagrafica/aggiornamento-impresa/actions";
import { getRiepilogoPersonaleOccupazione } from "@/app/(app)/anagrafica/personale-occupazione/actions";
import { getApiResource } from "@/lib/actions/api-resource";
import { getIncarichi } from "@/lib/actions/personale";
import { formattaValore } from "@/components/registro/field-row";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { MeResponse } from "@/lib/types/auth";
import type { IndicatoriAggiornamentoImpresa, PersonaleOccupazioneRiepilogo } from "@/lib/types/anagrafica";
import type { Incarico } from "@/lib/types/personale";
import type { FieldState, Section } from "@/lib/types/registro";

// § Correzione 26 §7-10: le 6 sezioni a registro da cui la sintesi deriva
// i propri campi, sempre le stesse a prescindere dal ruolo — caricate
// tramite `ensureLoaded`/`state.sections`, MAI una fetch locale separata
// (§16 "quando un dato viene modificato nella sezione completa, la
// sintesi deve aggiornarsi automaticamente"): usando lo stesso stato
// condiviso del resto del workspace, un toggle di visibilità o un
// cambio valore fatti da un'altra scheda aperta sullo stesso campo si
// riflettono qui senza bisogno di ricaricare, ed è la stessa ragione per
// cui il salvataggio dei 4 booleani (`saveSintesiEdit` in
// workspace-provider.tsx) può leggere `state.sections["attivita-economica"]`
// per la versione (If-Match) senza che questo componente gliela debba
// passare esplicitamente.
const SEZIONI = ["sede", "statuto", "capitale-sociale", "attivita-economica", "amministrazione-controllo", "unita-locali"] as const;

const RUOLI_AMMINISTRATORI = new Set(["AMMINISTRATORE", "AMMINISTRATORE_DELEGATO", "COMPONENTE_CDA"]);
const RUOLI_SINDACI = new Set(["SINDACO", "REVISORE_LEGALE"]);

// § Correzione 14 (catalogo caratteristiche incarico): A23 = "Rappresentanza
// legale (Sì/No)". Usata qui solo per comporre l'etichetta "· Rappresentante
// dell'Impresa" (§7, "senza inventare un nominativo" — il nome resta quello
// vero dell'incarico, solo la qualifica è condizionata da questo dato reale).
const CARATTERISTICA_RAPPRESENTANZA_LEGALE = "A23";

// § Correzione 28 §9: "la fonte deve provenire dalla configurazione della
// voce o dalla mappatura centrale e non essere scritta separatamente in
// ogni punto dell'interfaccia" — nomi delle sezioni funzionali (non nomi
// di tabella/colonna/endpoint), un solo posto per tutte le voci sotto.
const FONTE_SEDE = "Sede";
const FONTE_STATUTO = "Informazioni da statuto/atto costitutivo";
const FONTE_ATTIVITA = "Attività, albi, ruoli e licenze";
const FONTE_CAPITALE_SOCIALE = "Capitale sociale";
const FONTE_AMMINISTRATORI = "Amministratori";
const FONTE_PERSONALE_OCCUPAZIONE = "Personale e occupazione";
const FONTE_SOCI = "Soci e titolari di diritti su azioni e quote";
const FONTE_SINDACI = "Sindaci e membri degli organi di controllo";
const FONTE_UNITA_LOCALI = "Sedi secondarie e unità locali";
const FONTE_AGGIORNAMENTO_IMPRESA = "Aggiornamento impresa";

function campoDa(sezione: Section | null | undefined, chiave: string): FieldState | undefined {
  return sezione?.groups.flatMap((g) => g.fields).find((f) => f.key === chiave);
}

type AltriDati = {
  incarichi: Incarico[];
  personale: PersonaleOccupazioneRiepilogo;
  indicatori: IndicatoriAggiornamentoImpresa;
  denominazione: string | null;
};

type Stato = { fase: "loading" } | { fase: "error" } | { fase: "ok"; dati: AltriDati };

function Icona({ nome, className }: { nome: "register" | "activity" | "chart" | "shield"; className?: string }) {
  const Componente = { register: BuildingIcon, activity: ScrollTextIcon, chart: BarChart3Icon, shield: ShieldCheckIcon }[nome];
  return <Componente className={className} />;
}

function SintesiCard({ title, icon, wide = false, children }: { title: string; icon: "register" | "activity" | "chart" | "shield"; wide?: boolean; children: ReactNode }) {
  return (
    <section className={cn("rounded-[10px] border border-[#dce5f3] bg-white", wide && "sm:col-span-2")}>
      <h3 className="flex items-center gap-2 px-4 pt-3.5 pb-2 text-sm font-bold text-[var(--az-ink)]">
        <Icona nome={icon} className="size-[19px] text-[var(--az-blue)]" />
        {title}
      </h3>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

// § Correzione 29: niente più icona dell'occhio nella sintesi (nessun
// controllo interattivo/informativo dedicato) — la visibilità del campo
// originale resta comunque percepibile: la voce assume uno sfondo scuro
// quando `visibleToCompany` è false, stessa convenzione già usata da
// `FieldRow` per un campo oscurato (`nascosto && "bg-[#f0f2f5]"`), qui
// applicata all'intera voce invece che al solo riquadro del valore.

// § Correzione 28 §12 (aggiornato dalla Correzione 29): struttura
// verticale uniforme per ogni voce — etichetta, valore, fonte sempre
// visibile. Nessun indicatore di verifica (§10) e nessuna icona
// dell'occhio (§ Correzione 29): la visibilità del campo originale è
// riflessa solo dallo sfondo scuro della voce, mai un controllo cliccabile.
function SintesiVoce({
  label,
  fonte,
  visibile,
  valore,
  children,
}: {
  label: string;
  fonte: string;
  // undefined = la voce non ha un campo originale con visibilità propria
  // (i conteggi derivati da liste di record, § Correzione 26 §4/§9.2):
  // niente sfondo scuro, non un'omissione — non esiste nulla da riflettere.
  visibile?: boolean;
  valore?: string;
  // Per il campo booleano modificabile: il selettore Sì/No al posto del
  // testo del valore, stessa riga/stessa struttura.
  children?: ReactNode;
}) {
  const oscurato = visibile === false;
  return (
    <div className={cn("flex flex-col", oscurato && "-m-2 rounded-[7px] bg-[#f0f2f5] p-2")}>
      <span className="text-[13px] font-medium text-[#536a9f]">{label}</span>
      <div className="mt-[10px] min-h-5 text-sm font-bold break-words text-[var(--az-ink)]">{children ?? valore}</div>
      <p className="mt-2 text-xs text-[var(--az-muted)]">Fonte: {fonte}</p>
    </div>
  );
}

// Voce sostenuta da un vero campo a registro (§ Correzione 28 §2/§9):
// valore, visibilità e fonte derivano tutti dallo stesso `FieldState` —
// nessuna copia, nessuno stato proprio. `formattaValore` è la stessa
// funzione usata da `FieldRow` nelle sezioni originali (esportata da lì),
// così un "0"/"No" reale resta "0"/"No" qui e non diventa "—" (§3).
//
// `field` può essere `undefined` per l'Azienda quando il campo è
// oscurato nella sezione di origine (§ registro_campi.py `costruisci_sezione`,
// "il campo nascosto non viene renderizzato per l'Azienda" — la sintesi
// legge la stessa sezione, quindi eredita la stessa esclusione): non un
// mancato collegamento da segnalare, ma esattamente il caso "dato non
// disponibile a questo utente" — fonte comunque mostrata (§9), nessun
// occhio (l'Azienda non vede mai l'occhio, § convenzione di `FieldRow`,
// solo il Consulente lo vede altrove nell'app).
function CampoSezione({ field, fonte, labelOverride }: { field: FieldState | undefined; fonte: string; labelOverride?: string }) {
  if (!field) return <SintesiVoce label={labelOverride ?? fonte} valore="—" fonte={fonte} />;
  return <SintesiVoce label={labelOverride ?? field.label} valore={formattaValore(field)} fonte={fonte} visibile={field.visibleToCompany} />;
}

// § Correzione 26 §4/§9.2/§18 (ancora valido): valore calcolato dal
// backend/dai record delle sezioni di origine (conteggio o indicatore di
// "Aggiornamento impresa"), senza una riga propria in
// `sys_registro_stato_campi` — quindi senza occhio (nessuna visibilità da
// riflettere, § commento su `SintesiVoce`).
function CampoCalcolato({ label, valore, fonte }: { label: string; valore: string; fonte: string }) {
  return <SintesiVoce label={label} valore={valore} fonte={fonte} />;
}

// § Correzione 26 §8.2: unico campo davvero modificabile dalla sintesi —
// selettore a pillola Sì/No in modifica (§ Correzione 28: l'occhio resta
// comunque solo informativo, il clic non lo tocca), altrimenti la stessa
// voce di sola lettura di `CampoSezione`.
function CampoBooleanoModificabile({ field }: { field: FieldState }) {
  const { state, updateSintesiField } = useWorkspace();
  if (!state.sintesi.editing) return <CampoSezione field={field} fonte={FONTE_ATTIVITA} />;

  const valoreCorrente = state.sintesi.draft[field.key] ?? field.value;
  return (
    <SintesiVoce label={field.label} fonte={FONTE_ATTIVITA} visibile={field.visibleToCompany}>
      <div className="inline-grid grid-cols-2 gap-[3px] rounded-full border border-[#d2ddec] bg-[#f3f6fa] p-[3px]">
        {(["true", "false"] as const).map((opzione) => (
          <button
            key={opzione}
            type="button"
            onClick={() => updateSintesiField(field.key, opzione)}
            className={cn(
              "min-h-[28px] rounded-full px-3 text-[11px] font-bold transition-colors",
              valoreCorrente === opzione
                ? opzione === "true"
                  ? "border border-[#bce7d8] bg-[#e7f7f1] text-[#087a5c]"
                  : "border border-[#d2ddeb] bg-white text-[#334d78]"
                : "border border-transparent text-[#617395] hover:bg-[#e9f1ff] hover:text-[var(--az-blue)]",
            )}
          >
            {opzione === "true" ? "Sì" : "No"}
          </button>
        ))}
      </div>
    </SintesiVoce>
  );
}

/** Contenuto di "Sintesi camerale" (§ Correzioni 26/28): banner aziendale +
 * 4 sottosezioni (DATI ANAGRAFICI, ATTIVITA', L'IMPRESA IN CIFRE (1),
 * CERTIFICAZIONE D'IMPRESA), tutte derivate dalle sezioni CCIAA reali già
 * a registro, mai una copia propria (§16/§17/§20). Ogni voce mostra
 * sempre valore, occhio informativo (quando applicabile) e fonte —
 * nessun indicatore di verifica (§10 Correzione 28: quelli restano nelle
 * sezioni originali). Aperto dal pulsante "Visualizza sintesi" del banner
 * "Dati CCIAA" (§ Correzione 25); vive dentro `CciaaSectionPanel`
 * (vistaKey "sintesi"), che ne fornisce intestazione e footer — qui c'è
 * solo il corpo scorrevole. */
export function SintesiPanel() {
  const { state, ensureLoaded } = useWorkspace();

  useEffect(() => {
    for (const chiave of SEZIONI) ensureLoaded(chiave);
  }, [ensureLoaded]);

  const [altri, setAltri] = useState<Stato>({ fase: "loading" });
  useEffect(() => {
    setAltri({ fase: "loading" });
    Promise.all([
      getIncarichi(),
      getRiepilogoPersonaleOccupazione(),
      getIndicatoriAggiornamentoImpresa(),
      getApiResource<MeResponse>("/api/auth/me"),
    ])
      .then(([incarichi, personale, indicatori, me]) =>
        setAltri({ fase: "ok", dati: { incarichi, personale, indicatori, denominazione: me.azienda?.ragione_sociale ?? null } }),
      )
      .catch(() => setAltri({ fase: "error" }));
  }, []);

  const sede = state.sections["sede"]?.server;
  const statuto = state.sections["statuto"]?.server;
  const capitaleSociale = state.sections["capitale-sociale"]?.server;
  const attivitaEconomica = state.sections["attivita-economica"]?.server;
  const amministrazioneControllo = state.sections["amministrazione-controllo"]?.server;
  const unitaLocali = state.sections["unita-locali"]?.server;

  const sezioniPronte = sede && statuto && capitaleSociale && attivitaEconomica && amministrazioneControllo && unitaLocali;

  if (altri.fase === "error") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        Impossibile caricare i dati della sintesi.
      </div>
    );
  }

  if (altri.fase === "loading" || !sezioniPronte) {
    return (
      <div className="flex flex-col gap-2 py-2" role="status" aria-live="polite" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="az-skeleton h-16 w-full" />
        ))}
      </div>
    );
  }

  const { incarichi, personale, indicatori, denominazione } = altri.dati;
  const righeSoci = incarichi.filter((i) => i.ruolo.codice === "SOCIO");
  const righeAmministratori = incarichi.filter((i) => RUOLI_AMMINISTRATORI.has(i.ruolo.codice));
  const righeSindaci = incarichi.filter((i) => RUOLI_SINDACI.has(i.ruolo.codice));

  const campoStatoAttivita = campoDa(attivitaEconomica, "stato_attivita");
  const campoOrgano = campoDa(amministrazioneControllo, "organo_amministrativo_in_carica");
  const campoCameraCommercio = campoDa(sede, "camera_commercio_competente");

  // § Correzione 26/28 §5: "Amministratore Unico" — nome vero dell'unico
  // incarico attivo quando l'organo in carica è AMMINISTRATORE_UNICO
  // (business rule già garantita altrove, § verifica_amministratore_unico_disponibile:
  // quella configurazione ammette un solo titolare attivo, quindi non è
  // "il primo trovato" ma "l'unico possibile"), altrimenti l'etichetta
  // della configurazione presente nei dati completi — mai un nominativo
  // inventato quando l'organo è collegiale/congiunto/disgiunto.
  let amministratoreUnicoValore = "—";
  if (campoOrgano?.value === "AMMINISTRATORE_UNICO") {
    const titolare = righeAmministratori[0];
    if (titolare?.persona) {
      const rappresentanza = titolare.valori[CARATTERISTICA_RAPPRESENTANZA_LEGALE];
      amministratoreUnicoValore = `${titolare.persona.cognome} ${titolare.persona.nome}${rappresentanza === true ? " · Rappresentante dell'Impresa" : ""}`;
    }
  } else if (campoOrgano?.value) {
    amministratoreUnicoValore = campoOrgano.options?.find((o) => o.code === campoOrgano.value)?.label ?? campoOrgano.value;
  }

  const campiBooleani = ["presenza_attivita_import_export", "contratto_rete", "albi_ruoli_licenze_presenti", "registri_ambientali_presenti"]
    .map((chiave) => campoDa(attivitaEconomica, chiave))
    .filter((f): f is FieldState => f !== undefined);

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* § Correzione 26 §5: banner aziendale, sempre a tutta larghezza.
          § Correzione 28 §4: denominazione dal dato identificativo reale
          dell'azienda (`/api/auth/me`), mai un testo dimostrativo. */}
      <section className="flex items-center gap-3 rounded-[10px] border border-[#d8e3f4] bg-gradient-to-br from-white to-[#f8fbff] p-[13px_15px]">
        <span className="grid size-[42px] shrink-0 place-items-center rounded-[9px] bg-[#edf4ff] text-[var(--az-blue)]">
          <BuildingIcon className="size-[22px]" />
        </span>
        <div className="grid min-w-0 gap-[3px]">
          <strong className="text-[15px] text-[var(--az-ink)]">{denominazione ?? "—"}</strong>
          {campoCameraCommercio?.value && <small className="text-[11px] text-[#4f6aa0]">{campoCameraCommercio.value}</small>}
          <small className="text-[11px] text-[#4f6aa0]">Registro Imprese – Archivio ufficiale della CCIAA</small>
        </div>
        {campoStatoAttivita?.value && (
          <span className="ml-auto shrink-0 rounded-full bg-[#e7f7f1] px-[10px] py-1 text-[11px] font-bold text-[#087a5c]">
            {campoStatoAttivita.options?.find((o) => o.code === campoStatoAttivita.value)?.label ?? campoStatoAttivita.value}
          </span>
        )}
      </section>

      <SintesiCard title="DATI ANAGRAFICI" icon="register" wide>
        <div className="grid grid-cols-1 items-start gap-x-[18px] gap-y-6 sm:grid-cols-2">
          <CampoSezione field={campoDa(sede, "indirizzo_sede_legale")} fonte={FONTE_SEDE} labelOverride="Indirizzo Sede legale" />
          <CampoSezione field={campoDa(sede, "pec")} fonte={FONTE_SEDE} labelOverride="Domicilio digitale/PEC" />
          <CampoSezione field={campoDa(sede, "numero_rea")} fonte={FONTE_SEDE} labelOverride="Numero REA" />
          <CampoSezione field={campoDa(sede, "codice_fiscale")} fonte={FONTE_SEDE} labelOverride="Codice fiscale e n. iscr. al Registro Imprese" />
          <CampoSezione field={campoDa(sede, "partita_iva")} fonte={FONTE_SEDE} labelOverride="Partita IVA" />
          <CampoSezione field={campoDa(statuto, "forma_giuridica")} fonte={FONTE_STATUTO} labelOverride="Forma giuridica" />
          <CampoSezione field={campoDa(statuto, "data_atto_costitutivo")} fonte={FONTE_STATUTO} labelOverride="Data atto di costituzione" />
          <CampoSezione field={campoDa(statuto, "data_iscrizione")} fonte={FONTE_STATUTO} labelOverride="Data iscrizione" />
          <CampoCalcolato label="Data ultimo protocollo" valore={formatDate(indicatori.ultimo_protocollo)} fonte={FONTE_AGGIORNAMENTO_IMPRESA} />
          <CampoCalcolato label="Amministratore Unico" valore={amministratoreUnicoValore} fonte={FONTE_AMMINISTRATORI} />
        </div>
      </SintesiCard>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <SintesiCard title="ATTIVITA'" icon="activity">
          <div className="grid grid-cols-1 gap-y-6">
            <CampoSezione field={campoDa(attivitaEconomica, "stato_attivita")} fonte={FONTE_ATTIVITA} labelOverride="Stato attività" />
            <CampoSezione field={campoDa(attivitaEconomica, "data_decorrenza_attivita")} fonte={FONTE_ATTIVITA} labelOverride="Data inizio attività" />
            <CampoSezione field={campoDa(attivitaEconomica, "descrizione_attivita_esercitata")} fonte={FONTE_ATTIVITA} labelOverride="Attività prevalente" />
            <CampoSezione field={campoDa(attivitaEconomica, "codice_ateco_2025")} fonte={FONTE_ATTIVITA} labelOverride="Codice ATECO" />
            <CampoSezione field={campoDa(attivitaEconomica, "codice_nace_2_1")} fonte={FONTE_ATTIVITA} labelOverride="Codice NACE 2.1" />
            {campiBooleani.map((campo) => (
              <CampoBooleanoModificabile key={campo.key} field={campo} />
            ))}
          </div>
        </SintesiCard>

        <SintesiCard title="L'IMPRESA IN CIFRE (1)" icon="chart">
          <div className="grid grid-cols-1 gap-y-6">
            <CampoSezione field={campoDa(capitaleSociale, "capitale_sottoscritto")} fonte={FONTE_CAPITALE_SOCIALE} labelOverride="Capitale sociale sottoscritto" />
            <CampoCalcolato
              label={personale.data_rilevazione ? `Addetti al ${formatDate(personale.data_rilevazione)}` : "Addetti"}
              valore={personale.addetti_totali != null ? String(personale.addetti_totali) : "—"}
              fonte={FONTE_PERSONALE_OCCUPAZIONE}
            />
            <CampoCalcolato label="Soci e titolari di diritti su azioni e quote" valore={String(righeSoci.length)} fonte={FONTE_SOCI} />
            <CampoCalcolato label="Amministratori" valore={String(righeAmministratori.length)} fonte={FONTE_AMMINISTRATORI} />
            <CampoSezione field={campoDa(amministrazioneControllo, "numero_titolari_cariche")} fonte={FONTE_AMMINISTRATORI} labelOverride="Titolari di cariche" />
            <CampoCalcolato label="Sindaci, organi di controllo" valore={String(righeSindaci.length)} fonte={FONTE_SINDACI} />
            <CampoSezione field={campoDa(unitaLocali, "numero_unita_locali")} fonte={FONTE_UNITA_LOCALI} labelOverride="Unità locali" />
            <CampoCalcolato label="Pratiche inviate negli ultimi 12 mesi" valore={String(indicatori.pratiche_ultimi_12_mesi)} fonte={FONTE_AGGIORNAMENTO_IMPRESA} />
            <CampoCalcolato label="Trasferimenti di quote" valore={String(indicatori.trasferimenti_quote)} fonte={FONTE_AGGIORNAMENTO_IMPRESA} />
            <CampoCalcolato label="Trasferimenti di sede" valore={String(indicatori.trasferimenti_sede)} fonte={FONTE_AGGIORNAMENTO_IMPRESA} />
            <CampoCalcolato label="Partecipazioni" valore={String(indicatori.partecipazioni)} fonte={FONTE_AGGIORNAMENTO_IMPRESA} />
          </div>
          <p className="mt-4 border-t border-[#e5ebf5] pt-2 text-[10px] leading-[1.45] text-[#5a709c]">
            (1) I numeri relativi a Soci, Amministratori, Titolari di cariche e Sindaci corrispondono ai soggetti presenti nel relativo blocco del documento.
          </p>
        </SintesiCard>
      </div>

      <SintesiCard title="CERTIFICAZIONE D'IMPRESA" icon="shield" wide>
        <p className="mb-2 text-xs text-[var(--az-muted)]">Fonte: {FONTE_ATTIVITA}</p>
        <TitoliAbilitativiTable sectionKey="attivita-economica" />
      </SintesiCard>
    </div>
  );
}
