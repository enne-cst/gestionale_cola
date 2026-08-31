"use client";

import { PencilIcon, PlusIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AddRowButton, DataTableCard, EmptyTableMessage } from "@/components/data-table-card";
import { Button } from "@/components/ui/button";
import { CARICHE_COLLEGIO_SINDACALE, IncaricoFormDialog } from "@/components/registro/incarico-form-dialog";
import { IncaricoVerificationPopover } from "@/components/registro/incarico-verification-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkspace } from "@/components/registro/workspace-provider";
import { eliminaIncarico, getIncarichi, getRuoli } from "@/lib/actions/personale";
import { formatCurrency, formatDate, formatDecimal } from "@/lib/format";
import type { Incarico, RuoloSummary } from "@/lib/types/personale";

// § Correzione 14: etichetta di "Carica" per la colonna della tabella —
// A28, quando compilata (solo per un incarico SINDACO nel "Collegio
// sindacale"), altrimenti il comportamento invariato di sempre (nome del
// ruolo, es. "Amministratore" o "Sindaco").
const ETICHETTE_CARICA_COLLEGIO: Record<string, string> = Object.fromEntries(
  CARICHE_COLLEGIO_SINDACALE.map((c) => [c.codice, c.etichetta]),
);

function etichettaCarica(incarico: Incarico): string {
  // § Correzione 16: "La carica deve essere: Società di revisione legale"
  // (§ testo esplicito) — un'etichetta fissa per il titolare persona
  // giuridica, non il nome del ruolo (che qui resterebbe "Revisore
  // Legale", lo stesso ruolo condiviso col titolare persona fisica).
  if (incarico.persona_giuridica) return "Società di revisione legale";
  const carica = valoreCaratteristica(incarico, "A28");
  return (carica && ETICHETTE_CARICA_COLLEGIO[carica]) || incarico.ruolo.denominazione;
}

// § Correzione 17: "Carica" per la tabella "Sindaco unico + revisore
// esterno" — a differenza di `etichettaCarica` sopra (che per un titolare
// persona giuridica mostrerebbe "Società di revisione legale", § Correzione
// 16), qui il testo dipende solo dal ruolo, mai dal tipo di titolare del
// revisore esterno (persona fisica o società, § testo esplicito "le
// informazioni complete... nei rispettivi form", non nella colonna Carica).
function etichettaCaricaSindacoRevisoreEsterno(incarico: Incarico): string {
  return incarico.ruolo.codice === "SINDACO" ? "Sindaco unico" : "Revisore esterno";
}

// § Correzione 18: "Carica" per la tabella "Collegio sindacale + revisore
// esterno" — a differenza della funzione sopra, qui le righe SINDACO
// restano etichettate dalla carica del collegio (Presidente/Sindaco
// effettivo/Sindaco supplente, via `etichettaCarica`/A28, invariato);
// solo il ruolo REVISORE_LEGALE ha l'etichetta fissa "Revisore esterno"
// (mai "Società di revisione legale" per un titolare persona giuridica,
// stesso principio di `etichettaCaricaSindacoRevisoreEsterno`).
function etichettaCaricaCollegioRevisoreEsterno(incarico: Incarico): string {
  return incarico.ruolo.codice === "REVISORE_LEGALE" ? "Revisore esterno" : etichettaCarica(incarico);
}

// § Correzione 16: nome/identificativo del titolare, qualunque sia il tipo
// (persona fisica o giuridica) — evita di ripetere il controllo
// `incarico.persona ?? incarico.persona_giuridica` in ogni punto che ne ha
// bisogno (conferma di eliminazione, popover di verifica).
function nomeTitolare(incarico: Incarico): string {
  if (incarico.persona) return `${incarico.persona.cognome} ${incarico.persona.nome}`;
  if (incarico.persona_giuridica) return incarico.persona_giuridica.denominazione;
  return "—";
}

/** Cella "Persona" della tabella, per entrambi i tipi di titolare (§
 * Correzione 16): persona fisica (cognome+nome, CF sotto) o persona
 * giuridica (denominazione, CF sotto) — stesso layout in entrambi i casi. */
function CellaTitolare({ incarico }: { incarico: Incarico }) {
  if (incarico.persona) {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {incarico.persona.cognome} {incarico.persona.nome}
        </span>
        <span className="text-xs text-muted-foreground">{incarico.persona.codice_fiscale}</span>
      </div>
    );
  }
  if (incarico.persona_giuridica) {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{incarico.persona_giuridica.denominazione}</span>
        <span className="text-xs text-muted-foreground">{incarico.persona_giuridica.codice_fiscale}</span>
      </div>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

// § Correzione 14: quanti posti prescrive la composizione del collegio
// sindacale per ciascuna carica — Presidente e Sindaco supplente sono
// fissi, Sindaco effettivo dipende dalla scelta "Sindaci effettivi" (3 o
// 5) fatta nella sezione. `null` = non ancora determinabile (scelta non
// ancora fatta), stesso significato di `sindaciEffettivi: null`.
function capCaricaCollegio(codice: string, sindaciEffettivi: number | null): number | null {
  if (codice === "PRESIDENTE") return 1;
  if (codice === "SINDACO_SUPPLENTE") return 2;
  if (codice === "SINDACO_EFFETTIVO") return sindaciEffettivi !== null ? Math.max(sindaciEffettivi - 1, 0) : null;
  return null;
}

/** Prima data valorizzata tra quelle candidate, nell'ordine indicato — usata
 * per mostrare "Data di nomina" qualunque sia la caratteristica realmente
 * compilata per il ruolo (A49 per amministratori/sindaci, A01 per soci). */
function primaData(incarico: Incarico, codici: string[]): string {
  for (const codice of codici) {
    const valore = incarico.valori[codice];
    if (typeof valore === "string" && valore) return formatDate(valore);
  }
  return "—";
}

function valoreCaratteristica(incarico: Incarico, codice: string): string | null {
  const valore = incarico.valori[codice];
  return typeof valore === "string" && valore ? valore : null;
}

function formatPercentuale(valore: string | null): string {
  return valore ? `${formatDecimal(valore)}%` : "—";
}

/** Tabella incorporata Soci/Amministratori/Sindaci (§4/§5/§6 della specifica
 * CCIAA): sopra il motore generico `per_incarichi` già esistente, filtrata
 * per i soli ruoli pertinenti alla card. Nessuna riga inventata: se il
 * ruolo non ha ancora incarichi registrati, la tabella è semplicemente
 * vuota, non un placeholder statico. */
export function IncaricoTable({
  titolo,
  icon,
  ruoliCodici,
  etichettaVuoto,
  sectionKey,
  variante,
  addRowLabel = "Aggiungi",
  collegioSindacale,
  tipoTitolare,
  sindacoRevisoreEsterno,
  capienzaAmministratori,
  capienzaSoci,
}: {
  titolo: string;
  icon: LucideIcon;
  ruoliCodici: string[];
  etichettaVuoto: string;
  // Sezione a registro il cui banner "Modifica dati" governa la modalità
  // modifica della card (la tabella non ne ha una propria — vedi
  // `DataTableCard`). Omesso finché non è stato migrato anche il call site
  // (Amministratori/Sindaci, per ora invariati).
  sectionKey?: string;
  // "soci": vista riepilogativa Correzione 02 (Persona/Ruolo/Data di
  // nomina/Quota/Valore nominale/Versamento/Stato di carica/Verifica,
  // colonna azioni solo in modifica) — nascita/cittadinanza/domicilio
  // restano solo nel form completo (pulsante Modifica, in modalità
  // modifica).
  // "cariche": vista riepilogativa Correzione 09 (Persona/Ruolo/Carica/
  // Data di nomina/Durata/Stato della carica/Verifica), usata sia da
  // Amministratori sia — stessa richiesta, stesso giorno — da Sindaci:
  // stessa struttura per tutte e 4 le configurazioni dell'organo
  // amministrativo e per tutte le configurazioni dell'organo di controllo
  // (solo il titolo della tabella cambia, vedi TITOLO_TABELLA_AMMINISTRATORI
  // in cciaa-section-panel.tsx per Amministratori, titolo fisso per
  // Sindaci). "Carica" mostra lo stesso valore di "Ruolo"
  // (incarico.ruolo.denominazione): decisione esplicita dell'utente, non
  // esiste in piattaforma un campo distinto per la carica specifica
  // (Presidente/Consigliere/Sindaco effettivo...) e non se ne crea uno
  // nuovo per questa correzione. Colonna azioni sempre visibile, non
  // gated dalla modifica scheda: invariato rispetto al comportamento
  // precedente di queste due card (mai stato esteso il gating di
  // Correzione 02, § quella correzione, "non generalizzare senza
  // conferma").
  variante: "soci" | "cariche";
  // Testo del pulsante di inserimento riga, solo per il ramo con
  // `sectionKey` (§ Correzione 05 punto 10: "Aggiungi riga" per la card
  // Amministratori). Default invariato per gli altri chiamanti (Soci).
  addRowLabel?: string;
  // § Correzione 14: solo per la card Sindaci quando l'assetto è "Collegio
  // sindacale" — `sindaciEffettivi` è il valore corrente (bozza se in
  // modifica) del campo omonimo della sezione. Attiva: il selettore
  // "Carica" nel dialogo "Aggiungi riga", il conteggio del titolo secondo
  // la composizione prescritta (non le sole righe già compilate) e le
  // righe segnaposto per i posti ancora non occupati. Assente per ogni
  // altra card/configurazione (Soci, Amministratori, le altre
  // configurazioni dell'organo di controllo).
  // § Correzione 18: `revisoreEsterno` opzionale — solo per l'assetto
  // "Collegio sindacale + revisore esterno", aggiunge una terza carica
  // predisposta (Revisore esterno, ruolo REVISORE_LEGALE, cap 1) alle
  // cariche del collegio (Presidente/Sindaco effettivo/Sindaco supplente),
  // sia nel conteggio "Numero componenti"/"N righe" sia nei segnaposto —
  // stessa semantica di `tipoRevisore` di `sindacoRevisoreEsterno` sotto
  // (null finché "Revisione legale affidata a" non è stato ancora scelto).
  // Assente per il puro "Collegio sindacale" (Correzione 14, invariato).
  collegioSindacale?: { sindaciEffettivi: number | null; revisoreEsterno?: { tipoRevisore: "FISICA" | "GIURIDICA" | null } };
  // § Correzione 16: quando `ruoliCodici` include REVISORE_LEGALE ma la
  // card deve mostrare solo un tipo di titolare (persona fisica per
  // "Revisore legale persona fisica", giuridica per "Società di revisione
  // legale" — stesso ruolo condiviso da entrambe le configurazioni, § nota
  // in cciaa-section-panel.tsx), filtra le righe per tipo di titolare
  // effettivo e passa lo stesso vincolo al dialogo "Aggiungi riga"
  // (`PersonaGiuridicaPicker` invece di `PersonaPicker`). `undefined` per
  // ogni card che mescola i due tipi (Soci, Amministratori, Sindaco
  // unico/Collegio sindacale, tabella generica "Sindaci e revisori").
  tipoTitolare?: "FISICA" | "GIURIDICA";
  // § Correzione 17: solo per la card Sindaci quando l'assetto è "Sindaco
  // unico + revisore esterno" — la tabella accetta esattamente 2 cariche
  // predisposte (Sindaco unico/ruolo SINDACO, Revisore esterno/ruolo
  // REVISORE_LEGALE), mai i placeholder/il conteggio a composizione
  // variabile di `collegioSindacale` sopra. `tipoRevisore` è il valore
  // corrente (bozza se in modifica) di "Revisione legale affidata a" —
  // determina se la seconda riga accetta una persona fisica o una società
  // (§ testo esplicito "il form completo deve cambiare in funzione della
  // tipologia del soggetto"); `null` finché non è stato ancora scelto,
  // nessun placeholder/riga per il revisore in quel caso (stesso
  // comportamento di "Sindaci effettivi" non ancora scelto per il
  // collegio). Mutuamente esclusivo con `tipoTitolare`/`collegioSindacale`
  // sopra (mai passati insieme).
  sindacoRevisoreEsterno?: { tipoRevisore: "FISICA" | "GIURIDICA" | null };
  // § richiesta esplicita (31/08/2026): solo per la card Amministratori
  // quando l'organo è Consiglio di amministrazione/Amministrazione
  // pluripersonale congiuntiva/disgiuntiva (le 3 configurazioni con
  // "Numero componenti" modificabile, § `_ORGANI_NUMERO_COMPONENTI_
  // MODIFICABILE` in incarichi.py) — `target` è il valore corrente del
  // campo "Numero componenti" della sezione. Stesso meccanismo di
  // segnaposto già in uso per il collegio sindacale (righe "Posto libero"
  // per la capienza non ancora occupata), ma senza carica/ruolo
  // predisposti (per gli amministratori "Carica" coincide col ruolo, §
  // Correzione 09: nessuna carica specifica da preselezionare) — il "+" di
  // ogni posto libero apre lo stesso dialogo generico del pulsante header.
  // L'aggiornamento di "Numero componenti" quando si aggiunge/elimina una
  // riga è fatto dal backend (vedi `sincronizza_numero_amministratori_
  // dopo_aggiunta/_eliminazione`), non da questo componente: `carica()`
  // dopo ogni `onSaved`/eliminazione si limita a rileggere la sezione
  // aggiornata tramite il refresh del pannello che la ospita.
  capienzaAmministratori?: { target: number };
  // § richiesta esplicita (31/08/2026, seguito): stesso identico
  // meccanismo di `capienzaAmministratori` sopra, per la card Soci —
  // `target` è il valore corrente di "Numero dei soci". Mutuamente
  // esclusivo con `capienzaAmministratori` (una tabella è sempre l'una o
  // l'altra variante, mai entrambe): `etichettaCapienza` più sotto sceglie
  // il testo giusto ("amministratore"/"socio") in base a quale dei due è
  // presente.
  capienzaSoci?: { target: number };
}) {
  const { ruolo, state, reload } = useWorkspace();
  const consulente = ruolo === "CONSULENTE";
  const editingScheda = sectionKey ? (state.sections[sectionKey]?.editing ?? false) : undefined;
  const [ruoli, setRuoli] = useState<RuoloSummary[] | null>(null);
  const [incarichi, setIncarichi] = useState<Incarico[] | null>(null);
  const [errore, setErrore] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    Promise.all([getRuoli(ruoliCodici), getIncarichi()])
      .then(([ruoliLetti, tutti]) => {
        setRuoli(ruoliLetti);
        const codiciSet = new Set(ruoliCodici);
        setIncarichi(tutti.filter((i) => codiciSet.has(i.ruolo.codice)));
      })
      .catch(() => setErrore(true));
  }, [ruoliCodici]);

  useEffect(() => {
    carica();
  }, [carica]);

  // § richiesta esplicita (31/08/2026, estesa a Soci il 31/08/2026): un
  // aggiunta/eliminazione di riga cambia anche "Numero componenti"/"Numero
  // dei soci" lato backend (vedi `capienzaAmministratori`/`capienzaSoci`
  // sopra) — solo per quelle due card la sezione va ricaricata insieme
  // alla tabella, cosi' il campo mostra subito il nuovo valore senza
  // aspettare che l'utente riapra la scheda. No-op per Sindaci:
  // `capienzaAmministratori`/`capienzaSoci` sono entrambi assenti lì.
  const ricaricaDopoModifica = useCallback(() => {
    carica();
    if ((capienzaAmministratori || capienzaSoci) && sectionKey) reload(sectionKey);
  }, [carica, capienzaAmministratori, capienzaSoci, sectionKey, reload]);

  async function onElimina(incarico: Incarico) {
    if (!confirm(`Rimuovere l'incarico di ${nomeTitolare(incarico)}?`)) return;
    const esito = await eliminaIncarico(incarico.id);
    if (esito.esito === "ok") ricaricaDopoModifica();
  }

  if (errore) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <span>Impossibile caricare i dati.</span>
        <button type="button" onClick={carica} className="font-semibold underline">
          Riprova
        </button>
      </div>
    );
  }

  if (ruoli === null || incarichi === null) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-live="polite" aria-busy="true">
        {[0, 1].map((i) => (
          <span key={i} className="az-skeleton h-9 w-full" />
        ))}
      </div>
    );
  }

  const Icon = icon;
  const caricheOpzioni = collegioSindacale ? CARICHE_COLLEGIO_SINDACALE : undefined;
  // § Correzione 16: solo le righe del tipo di titolare atteso da questa
  // card — vedi il commento su `tipoTitolare` sopra. Righe di un altro
  // tipo (es. un revisore persona fisica storico, mentre l'assetto
  // corrente è "Società di revisione legale") restano nel database, non
  // spariscono: semplicemente non compaiono in QUESTA tabella.
  // § Correzione 17/18: per "Sindaco unico + revisore esterno" e "Collegio
  // sindacale + revisore esterno" il ruolo SINDACO resta sempre mostrato,
  // il ruolo REVISORE_LEGALE solo se del tipo atteso da `tipoRevisore`
  // (nessuna riga finché non è stato scelto — stesso principio del filtro
  // persona/persona giuridica di `tipoTitolare` sopra, qui condizionato al
  // ruolo invece che applicato a tutte le righe). `tipoRevisoreEsterno`
  // unifica le due fonti (mai valorizzate insieme, § tipi sopra).
  const tipoRevisoreEsterno = sindacoRevisoreEsterno?.tipoRevisore ?? collegioSindacale?.revisoreEsterno?.tipoRevisore;
  const incarichiFiltrati =
    tipoTitolare === "GIURIDICA"
      ? incarichi.filter((i) => i.persona_giuridica !== null)
      : tipoTitolare === "FISICA"
        ? incarichi.filter((i) => i.persona !== null)
        : sindacoRevisoreEsterno || collegioSindacale?.revisoreEsterno
          ? incarichi.filter(
              (i) =>
                i.ruolo.codice !== "REVISORE_LEGALE" ||
                (tipoRevisoreEsterno === "GIURIDICA"
                  ? i.persona_giuridica !== null
                  : tipoRevisoreEsterno === "FISICA" && i.persona !== null),
            )
          : incarichi;
  const addTrigger = sectionKey ? (
    <IncaricoFormDialog
      ruoli={ruoli}
      onSaved={ricaricaDopoModifica}
      caricheDisponibili={caricheOpzioni}
      tipoTitolare={tipoTitolare === "GIURIDICA" ? "GIURIDICA" : undefined}
      trigger={<AddRowButton icon={PlusIcon} label={addRowLabel} />}
    />
  ) : (
    <IncaricoFormDialog ruoli={ruoli} onSaved={carica} trigger={<AddRowButton icon={Icon} />} />
  );

  // § Correzione 14: righe segnaposto per i posti del collegio sindacale
  // (o, § Correzione 17, per le 2 cariche predisposte di "Sindaco unico +
  // revisore esterno") ancora non occupati — solo UI, mai righe reali nel
  // database (§ decisione esplicita, AskUserQuestion: `PerIncarico.persona_id`
  // NOT NULL rende impossibile crearle davvero). Ognuna apre lo stesso
  // dialogo "Aggiungi riga" con ruolo/carica già preselezionati. Forma
  // condivisa dai due meccanismi (`SegnapostoRiga` inline sotto): solo il
  // collegio sindacale usa `caricheDisponibili`/`caricaCodice` (il
  // selettore "Carica" derivato da A28); "Sindaco unico + revisore
  // esterno" distingue le 2 righe per ruolo, non per carica.
  const ruoloSindaco = collegioSindacale ? ruoli.find((r) => r.codice === "SINDACO") : undefined;
  const segnapostoCollegio =
    collegioSindacale && ruoloSindaco
      ? CARICHE_COLLEGIO_SINDACALE.flatMap((c) => {
          const cap = capCaricaCollegio(c.codice, collegioSindacale.sindaciEffettivi);
          if (cap === null) return [];
          const occupati = incarichi.filter(
            (i) => i.ruolo.codice === "SINDACO" && valoreCaratteristica(i, "A28") === c.codice,
          ).length;
          return Array.from({ length: Math.max(cap - occupati, 0) }, (_, idx) => ({
            key: `${c.codice}-${idx}`,
            ruoloId: ruoloSindaco.id,
            ruoloEtichetta: ruoloSindaco.denominazione,
            caricaEtichetta: c.etichetta,
            caricaCodice: c.codice,
            caricheDisponibili: CARICHE_COLLEGIO_SINDACALE,
            tipoTitolarePredefinito: undefined as "GIURIDICA" | undefined,
            sempreApribile: false,
          }));
        })
      : [];
  // § Correzione 17: le 2 cariche predisposte — "Sindaco unico" (sempre,
  // cap 1) e "Revisore esterno" (cap 1) — sempre visibili quando il posto
  // non è occupato, "Numero componenti" vale sempre 2 per questo assetto
  // (§ testo esplicito, nessuna condizione), quindi anche il conteggio
  // "2 righe" della tabella resta coerente indipendentemente da cosa è già
  // stato scelto. Finché "Revisione legale affidata a" non indica ancora
  // persona fisica o società, il posto "Revisore esterno" resta visibile
  // ma senza un pulsante "+" attivo (nessun picker sensato da preaprire
  // senza saperlo).
  const ruoloSindacoUnico = sindacoRevisoreEsterno ? ruoli.find((r) => r.codice === "SINDACO") : undefined;
  const segnapostoSindacoUnico = ruoloSindacoUnico && incarichiFiltrati.every((i) => i.ruolo.codice !== "SINDACO")
    ? [
        {
          key: "sindaco-unico",
          ruoloId: ruoloSindacoUnico.id as string | undefined,
          ruoloEtichetta: ruoloSindacoUnico.denominazione,
          caricaEtichetta: "Sindaco unico",
          caricaCodice: undefined as string | undefined,
          caricheDisponibili: undefined as { codice: string; etichetta: string }[] | undefined,
          tipoTitolarePredefinito: undefined as "GIURIDICA" | undefined,
          sempreApribile: false,
        },
      ]
    : [];
  // § Correzione 18: stesso identico posto "Revisore esterno" (cap 1),
  // condiviso tra "Sindaco unico + revisore esterno" (Correzione 17) e
  // "Collegio sindacale + revisore esterno" — riusato cosi' com'è, la sola
  // differenza tra i due assetti è quali ALTRE cariche compaiono accanto
  // (`segnapostoSindacoUnico` sopra vs `segnapostoCollegio` sotto).
  const ruoloRevisoreLegale =
    sindacoRevisoreEsterno || collegioSindacale?.revisoreEsterno ? ruoli.find((r) => r.codice === "REVISORE_LEGALE") : undefined;
  const segnapostoRevisoreEsterno =
    ruoloRevisoreLegale && incarichiFiltrati.every((i) => i.ruolo.codice !== "REVISORE_LEGALE")
      ? [
          {
            key: "revisore-esterno",
            ruoloId: (tipoRevisoreEsterno ? ruoloRevisoreLegale.id : undefined) as string | undefined,
            ruoloEtichetta: ruoloRevisoreLegale.denominazione,
            caricaEtichetta: "Revisore esterno",
            caricaCodice: undefined as string | undefined,
            caricheDisponibili: undefined as { codice: string; etichetta: string }[] | undefined,
            tipoTitolarePredefinito: tipoRevisoreEsterno === "GIURIDICA" ? ("GIURIDICA" as const) : undefined,
            sempreApribile: false,
          },
        ]
      : [];
  // § richiesta esplicita (31/08/2026, estesa a Soci il 31/08/2026): posti
  // liberi fino a "Numero componenti"/"Numero dei soci" — a differenza dei
  // segnaposto sopra, qui non c'è una carica specifica da preselezionare
  // (§ Correzione 09: per gli amministratori "Carica" coincide col ruolo;
  // per i soci c'è un solo ruolo possibile, SOCIO), quindi `ruoloId` resta
  // sempre assente ma il "+" deve comunque aprirsi — `sempreApribile`
  // distingue questo caso dal posto "Revisore esterno" sopra ancora senza
  // tipo, dove invece il "+" resta volutamente disattivo. `capienza`
  // unifica le due fonti (mai valorizzate insieme, una tabella è sempre
  // "cariche" o "soci"), `etichettaCapienza` sceglie il testo del pulsante
  // in base a quale delle due è presente.
  // Mai meno delle righe reali già presenti (capienza sarebbe incoerente
  // solo se il campo non fosse ancora allineato, es. dato storico mai
  // toccato da questo meccanismo): il conteggio/i posti liberi si basano
  // su questo valore corretto, mai su quello grezzo del campo quando è
  // inferiore alle righe reali.
  const capienza = capienzaAmministratori ?? capienzaSoci;
  const etichettaCapienza = capienzaSoci ? "socio" : "amministratore";
  const capienzaTarget = capienza ? Math.max(capienza.target, incarichiFiltrati.length) : null;
  const segnapostoCapienza = capienzaTarget !== null
    ? Array.from(
        { length: Math.max(capienzaTarget - incarichiFiltrati.length, 0) },
        (_, idx) => ({
          key: `capienza-${idx}`,
          ruoloId: undefined as string | undefined,
          ruoloEtichetta: "—",
          caricaEtichetta: "—",
          caricaCodice: undefined as string | undefined,
          caricheDisponibili: undefined as { codice: string; etichetta: string }[] | undefined,
          tipoTitolarePredefinito: undefined as "GIURIDICA" | undefined,
          sempreApribile: true,
        }),
      )
    : [];
  const segnaposto = [...segnapostoCollegio, ...segnapostoSindacoUnico, ...segnapostoRevisoreEsterno, ...segnapostoCapienza];
  // § Correzione 14/17/18: il conteggio del titolo segue la composizione
  // prescritta (sindaciEffettivi + 2 per il collegio puro, + 1 in più per
  // il revisore esterno quando presente — § Correzione 18 "il totale deve
  // comprendere anche il revisore esterno", 3→6/5→8 —, sempre 2 per
  // "Sindaco unico + revisore esterno"), non le sole righe già compilate —
  // coerente con "Numero componenti" della sezione, che conta allo stesso
  // modo. Invariato (righe compilate, filtrate per tipo di titolare §
  // Correzione 16) per ogni altra card/configurazione.
  const numeroComponenti =
    collegioSindacale?.sindaciEffettivi != null
      ? collegioSindacale.sindaciEffettivi + 2 + (collegioSindacale.revisoreEsterno ? 1 : 0)
      : sindacoRevisoreEsterno
        ? 2
        : // § richiesta esplicita (31/08/2026): come sopra, il conteggio
          // segue "Numero componenti" (righe compilate + posti liberi), non
          // le sole righe già compilate.
          (capienzaTarget ?? incarichiFiltrati.length);
  const vuoto = incarichiFiltrati.length === 0 && segnaposto.length === 0;
  return (
    <DataTableCard title={titolo} count={numeroComponenti} editing={editingScheda} addTrigger={addTrigger}>
      {vuoto ? (
        <EmptyTableMessage>{etichettaVuoto}</EmptyTableMessage>
      ) : (
        <Table>
          {variante === "soci" ? (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-center">Ruolo</TableHead>
                  <TableHead className="text-center">Data di nomina</TableHead>
                  <TableHead className="text-center">Quota</TableHead>
                  <TableHead className="text-center">Valore nominale</TableHead>
                  <TableHead className="text-center">Versamento</TableHead>
                  <TableHead className="text-center">Stato di carica</TableHead>
                  <TableHead className="text-center">Verifica</TableHead>
                  {editingScheda && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {incarichiFiltrati.map((incarico) => {
                  const statoCarica = valoreCaratteristica(incarico, "A25");
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${nomeTitolare(incarico)}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <CellaTitolare incarico={incarico} />
                      </TableCell>
                      <TableCell className="text-center">{incarico.ruolo.denominazione}</TableCell>
                      <TableCell className="text-center">{primaData(incarico, ["A49", "A01"])}</TableCell>
                      <TableCell className="text-center">{formatPercentuale(valoreCaratteristica(incarico, "A54"))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(valoreCaratteristica(incarico, "A53"))}</TableCell>
                      <TableCell className="text-center">{formatCurrency(valoreCaratteristica(incarico, "A56"))}</TableCell>
                      <TableCell className="text-center">{statoCarica ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <IncaricoVerificationPopover
                            incarico={incarico}
                            nomeIncarico={nomeIncarico}
                            consulente={consulente}
                            onDecided={carica}
                            disabled={editingScheda === true}
                          />
                        </div>
                      </TableCell>
                      {editingScheda && (
                        <TableCell className="flex justify-end gap-1">
                          <IncaricoFormDialog
                            ruoli={ruoli}
                            incarico={incarico}
                            onSaved={carica}
                            trigger={
                              <Button variant="ghost" size="icon" aria-label="Modifica">
                                <PencilIcon className="size-4" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" aria-label="Elimina" onClick={() => onElimina(incarico)}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {/* § richiesta esplicita (31/08/2026, seguito): posti
                 * liberi fino a "Numero dei soci" — stesso `segnaposto`
                 * calcolato sopra (qui saranno sempre e solo quelli di
                 * `segnapostoCapienza`, un socio non ha collegio/sindaco
                 * unico), solo il "+" compare (e solo in modifica, come le
                 * altre azioni di questa variante): nessuna carica da
                 * mostrare in questa tabella. */}
                {segnaposto.map((posto) => (
                  <TableRow key={posto.key} className="text-muted-foreground">
                    <TableCell className="italic">Posto libero</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    {editingScheda && (
                      <TableCell className="flex justify-end gap-1">
                        <IncaricoFormDialog
                          ruoli={ruoli}
                          onSaved={ricaricaDopoModifica}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Aggiungi ${etichettaCapienza}`}>
                              <PlusIcon className="size-4" />
                            </Button>
                          }
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </>
          ) : (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-center">Ruolo</TableHead>
                  <TableHead className="text-center">Carica</TableHead>
                  <TableHead className="text-center">Data di nomina</TableHead>
                  <TableHead className="text-center">Durata</TableHead>
                  <TableHead className="text-center">Stato della carica</TableHead>
                  <TableHead className="text-center">Verifica</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incarichiFiltrati.map((incarico) => {
                  const statoCarica = valoreCaratteristica(incarico, "A25");
                  const durata = valoreCaratteristica(incarico, "A29");
                  const nomeIncarico = `${incarico.ruolo.denominazione} ${nomeTitolare(incarico)}`;
                  return (
                    <TableRow key={incarico.id}>
                      <TableCell>
                        <CellaTitolare incarico={incarico} />
                      </TableCell>
                      <TableCell className="text-center">{incarico.ruolo.denominazione}</TableCell>
                      <TableCell className="text-center">
                        {sindacoRevisoreEsterno
                          ? etichettaCaricaSindacoRevisoreEsterno(incarico)
                          : collegioSindacale?.revisoreEsterno
                            ? etichettaCaricaCollegioRevisoreEsterno(incarico)
                            : etichettaCarica(incarico)}
                      </TableCell>
                      <TableCell className="text-center">{primaData(incarico, ["A49", "A01"])}</TableCell>
                      <TableCell className="text-center">{durata ?? "—"}</TableCell>
                      <TableCell className="text-center">{statoCarica ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <IncaricoVerificationPopover
                            incarico={incarico}
                            nomeIncarico={nomeIncarico}
                            consulente={consulente}
                            onDecided={carica}
                            disabled={editingScheda === true}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <IncaricoFormDialog
                          ruoli={ruoli}
                          incarico={incarico}
                          onSaved={carica}
                          tipoTitolare={
                            sindacoRevisoreEsterno || collegioSindacale?.revisoreEsterno
                              ? incarico.persona_giuridica
                                ? "GIURIDICA"
                                : undefined
                              : tipoTitolare === "GIURIDICA"
                                ? "GIURIDICA"
                                : undefined
                          }
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Modifica">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        {/* § richiesta esplicita (31/08/2026): eliminare una
                         * riga cambia anche "Numero componenti" (vedi
                         * `capienzaAmministratori`), quindi per questa card
                         * il pulsante compare solo col banner "Modifica
                         * dati" attivo — invariato (sempre visibile) per
                         * ogni altra card (Soci con la propria gating già
                         * esistente, Sindaci), dove eliminare una riga non
                         * tocca alcun conteggio della sezione. */}
                        {(!capienzaAmministratori || editingScheda) && (
                          <Button variant="ghost" size="icon" aria-label="Elimina" onClick={() => onElimina(incarico)}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {segnaposto.map((posto) => (
                  <TableRow key={posto.key} className="text-muted-foreground">
                    <TableCell className="italic">Posto libero</TableCell>
                    <TableCell className="text-center">{posto.ruoloEtichetta}</TableCell>
                    <TableCell className="text-center">{posto.caricaEtichetta}</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      {posto.sempreApribile && !editingScheda ? (
                        // § richiesta esplicita (31/08/2026): un posto libero
                        // di "Numero componenti" (capienza, § sempreApribile)
                        // si può occupare solo col banner "Modifica dati"
                        // attivo (occuparlo cambierebbe la tabella, anche se
                        // non il conteggio, § regola sul riempimento posti) —
                        // nessun "+" fuori da quella modalità, cella vuota.
                        null
                      ) : posto.ruoloId || posto.sempreApribile ? (
                        <IncaricoFormDialog
                          ruoli={ruoli}
                          onSaved={ricaricaDopoModifica}
                          caricheDisponibili={posto.caricheDisponibili}
                          caricaPredefinita={posto.caricaCodice}
                          ruoloIdPredefinito={posto.ruoloId}
                          tipoTitolare={posto.tipoTitolarePredefinito}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={posto.sempreApribile ? `Aggiungi ${etichettaCapienza}` : `Aggiungi ${posto.caricaEtichetta.toLowerCase()}`}
                            >
                              <PlusIcon className="size-4" />
                            </Button>
                          }
                        />
                      ) : (
                        // § Correzione 17: il posto "Revisore esterno" è
                        // visibile ma non ancora aggiungibile finché
                        // "Revisione legale affidata a" non indica persona
                        // fisica o società (nessun picker sensato da
                        // preaprire senza saperlo, stesso principio di
                        // "Seleziona prima il numero dei sindaci effettivi"
                        // per il collegio, qui verificato in anteprima
                        // lato frontend invece che al salvataggio).
                        <span className="text-xs italic text-muted-foreground">Scegli il tipo di revisore</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </>
          )}
        </Table>
      )}
    </DataTableCard>
  );
}
