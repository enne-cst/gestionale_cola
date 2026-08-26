# Log sessione — 2026-08-25 — Analisi riorganizzazione sezione CCIAA (fase 1, solo analisi)

## Punto di partenza

L'utente ha chiesto di completare e riorganizzare la sezione **CCIAA** della
piattaforma: far confluire, **solo a livello visivo e di navigazione**, tutte
le sezioni della schermata Anagrafica Aziendale che precedono "Organizzazione"
in un'unica sezione CCIAA ordinata come la visura camerale ufficiale, **senza**
riorganizzare fisicamente il database (che resta organizzato per pertinenza).
Materiale di riferimento fornito dall'utente in
`frontend/grafica/Modifiche 25-08-26/`:
`Specifiche_funzionali_campi_CCIAA 25-08-26.md` (1261 righe, specifica
funzionale vincolante), `CONFRONTO_HTML_E_PROMPT_CLAUDE_CODE.md` (948 righe),
`ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO 25-08-26.html` (28.761 righe,
prototipo grafico/comportamentale, "Artefatto A").

Regola esplicita dell'utente, vincolante per ogni sessione futura su questo
lavoro: **prima fase = SOLO ANALISI**, nessuna modifica a codice/schema.
Ogni informazione classificata come "mancante" o "ambigua" richiede una
decisione esplicita dell'utente prima di essere implementata (opzioni
sempre: Implementare / Non implementare / Rinviare / Riutilizzare struttura
alternativa). Questa sessione si è fermata esattamente a questo punto, su
richiesta dell'utente (limite di utilizzo raggiunto) — **nessun codice è
stato scritto, nessuna migrazione creata**.

## Metodo di analisi usato

Letti integralmente i due documenti Markdown e verificato lo schema DB
(anche contro il Postgres realmente in esecuzione via `docker compose`).
Usati 3 sub-agenti "fork" in parallelo per l'inventario grezzo (DB, frontend/
backend attuale, struttura prototipo HTML) — **il terzo (struttura HTML) è
da scartare**: ha allucinato una continuazione di conversazione mai avvenuta
("Prendo nota delle quattro decisioni...") e proposto di sua iniziativa
schemi DB (`per_incarichi`, `ana_organizzazioni`) senza che l'utente avesse
detto nulla. Non è stato usato nulla di quel contenuto nel report finale; i
punti essenziali che quel task doveva accertare sono stati riverificati
direttamente con grep mirati. **Se si riprende il lavoro, questo punto va
rifatto da capo** (grep sui due prototipi HTML per confermare in dettaglio
etichette di colonna nelle tabelle Soci/Amministratori/Sindaci, pattern di
selezione persona nel prototipo, ecc. — non ancora fatto in profondità).

## A. Perimetro esatto dell'intervento

Fonte di verità: `frontend/lib/anagrafica-sezioni.ts` (`CATEGORIE_ANAGRAFICA`).

| # | Categoria | Sezioni contenute | In perimetro CCIAA? |
|---|---|---|---|
| 1 | Informazioni societarie | identificazione camerale, durata società/esercizi, attività esercitata, capitale sociale | **Sì** |
| 2 | Sedi | sedi | **Sì** |
| 3 | Contatti | contatti | **Sì** |
| 4 | Dati CCIAA | iscrizioni registro imprese, codici ATECO, amministrazione/controllo, albi/ruoli/licenze, SOA, certificazioni, addetti (visura+comune) | **Sì** |
| 5 | **Organizzazione** | contratto lavoro, posizioni assicurative, fondi interprofessionali, dati generali, turni lavoro, outsourcing, subappaltatori, fornitori materiali, lavoratori autonomi | **No — esplicitamente esclusa** |
| 6-8 | Trend, Assicurazioni, Altre informazioni | (gate ISO 9001) | No, fuori scope |

Le categorie 1-4 sono esattamente ciò che deve confluire, solo
visivamente/navigazionalmente, nella nuova sezione unica CCIAA, nell'ordine
delle sezioni 0-10 del Markdown.

## B. Confronto piattaforma reale vs prototipo HTML

| Elemento | Comportamento attuale | Comportamento prototipo | Proposta | Decisione richiesta |
|---|---|---|---|---|
| Home sezioni | 4 blocchi separati (`CorporateSection` per "Informazioni societarie" + `CollapsibleSection` per Sedi/Contatti/Dati CCIAA) | 1 griglia unica 3-3-3-1 a 10 card | Fondere visivamente le 4 categorie in un'unica griglia CCIAA | Confermare la fusione vera (vs. semplice riordino restando separate) |
| **Anteprima al 50%** | Già reale e matura: `frontend/components/registro/workspace-shell.tsx` — `Sheet` (Radix/shadcn) `w-[50vw] min-w-[720px]`, overlay/oscuramento, scroll/responsive/unsaved-changes dialog già rifiniti in sessioni precedenti | Ricostruita in HTML/CSS statico, guard "modifiche non salvate" non uniforme (limite dichiarato dal documento stesso) | **Mantenere la logica esistente**, adattare solo lo stile alla CCIAA, NON riscrivere | Nessuna — entrambi i documenti concordano che questo è il comportamento di riferimento |
| Tabelle Soci/Amministratori/Sindaci/Revisori | Non esistono in UI (le API CRUD esistono già, vedi sezione C) | Tabelle demo, id `Date.now()`, verificatore hard-coded "Marco R." | Costruire ex novo sul layout del prototipo, con dati/logica reali | — |
| Sintesi camerale / pagina "Dati camerali completi" | Non esistono | Presenti nel prototipo | Nuovi componenti di composizione (fase successiva, dopo la fusione base) | Vedi decisione 3 |

Confermata via grep diretto nel bundle la presenza letterale delle 10 card
attese (Sede, Informazioni da statuto/atto costitutivo, Capitale sociale,
Soci e titolari di diritti su azioni e quote, Amministratori, Sindaci e
membri degli organi di controllo, Attività/albi/ruoli/licenze, Personale e
occupazione, Sedi secondarie e unità locali, Aggiornamento impresa), dei 4
gruppi della Sintesi (`DATI ANAGRAFICI`, `ATTIVITA'`, `L'IMPRESA IN CIFRE`,
`CERTIFICAZIONE D'IMPRESA`) e di 22 occorrenze dei marcatori demo/hard-coded
(`Marco R.`, `Date.now()`, `window.__CCIAA_PDF_DATA__`, `86%`) — vanno
sostituiti con logica reale, mai copiati.

## C. Persone, soggetti e cariche

**Buona notizia strutturale**: tutte le tabelle camerali `qual_soci`,
`qual_amministratori_cariche`, `qual_sindaco`, `qual_revisore_legale`,
`qual_direttore_tecnico_soa`, `qual_amministratore_delegato`,
`qual_componente_consiglio_amministrazione`, `qual_responsabile_fer` hanno
solo un `persona_id` FK + dati della carica — **nessuna duplicazione
anagrafica**, esattamente il modello richiesto dalla specifica. Hanno anche
**CRUD backend già completo e funzionante**
(`/api/anagrafica/soci`, `/amministratori-cariche`, `/sindaci`,
`/revisori-legali`, `/direttori-tecnici-soa`, `/amministratori-delegati`,
`/componenti-cda`, `/elenco-soci`) in `backend/app/api/anagrafica.py` — ma
**zero pagine/componenti frontend**, coerente con quanto già segnalato in
`session-log/PROSSIMI-PASSI.md` ("sezioni `qual_*` ancora senza frontend").
Per queste sezioni il lavoro futuro è "costruire la vista", non "inventare
l'API".

**Punto critico bloccante, non originato da questa richiesta**: conflitto
irrisolto tra due schemi "persona":
- `per_persone` — tabella **realmente in uso oggi** (live nel DB, referenziata
  da tutte le `qual_*` sopra e dal modello SQLAlchemy `backend/app/models/personale.py`):
  `nominativo` unico (non nome/cognome separati), domicilio a colonne
  piatte, PEC, `codice_fiscale`, nascita.
- `ana_persone` — nuovo file `database_struttura/Mod. Personale/001_ana_persone.sql`,
  presente su disco ma **non committato in git, non migrato, non
  referenziato da nessuna `qual_*` né da alcun modello Python**. Schema
  orientato al rapporto di lavoro (mansione, data assunzione, livelli di
  competenza/conoscenza/consapevolezza); niente domicilio strutturato né PEC.
  I vecchi file `001_per_persone.sql`/`002_per_titoli_studio.sql` risultano
  cancellati nel working tree (git status) ma non ancora sostituiti in modo
  coerente: se `ana_persone` venisse migrata così com'è, le FK di tutte le
  `qual_*` verso `per_persone` non si risolverebbero più.
- Stesso stato "presente su disco ma non committato/non in Alembic" per i 4
  nuovi cataloghi in `database_struttura/Cataloghi/` (`cat_ruoli` — 34 ruoli
  R001-R034 — , `cat_caratteristiche_incarico` — 51 caratteristiche A01-A51,
  la stessa nomenclatura già usata nei commenti di colonna di
  `qual_amministratori_cariche` — , `rel_ruoli_caratteristiche`,
  `cat_tipologie_titoli_studio`). Sono solo cataloghi di configurazione: non
  esiste ancora nessuna tabella "incarico" che li usi per registrare che una
  persona ricopre un ruolo.

Le sezioni Soci/Amministratori/Sindaci della CCIAA dipendono interamente da
quale delle due tabelle persona sia la fonte autorevole. **Non è lavoro di
questa sessione** — sembra il lavoro sospeso a metà di un'altra sessione non
loggata — ma va risolto prima di costruire qualunque vista su queste sezioni.

**Persone giuridiche**: `qual_soci` e `qual_revisore_legale` gestiscono già
il caso "organizzazione" con un pattern minimale (`tipo_soggetto` +
`denominazione_organizzazione`/`codice_fiscale_organizzazione` piatte, CHECK
di mutua esclusione con `persona_id`). Le altre `qual_*` hanno
`persona_id NOT NULL`: **non ammettono oggi** un amministratore/sindaco non
persona fisica. Non esiste una tabella "soggetti" generale/polimorfica nel
progetto.

## D. Database — mancanze principali (classificazione E/F della specifica)

- **§7 "Trasferimenti d'azienda, fusioni, scissioni, subentri"**: nessuna
  tabella "evento societario" esiste in nessuna cartella — **E, mancante**.
- **Due meccanismi di verifica/audit paralleli e non unificati**:
  `sys_registro_stato_campi`/`sys_registro_audit` (stato per singolo campo:
  DA_VERIFICARE/APPROVATO/IN_REVISIONE + visibilità azienda, oggi collegato
  **solo** alla sezione "Informazioni societarie" via
  `backend/app/core/registro_campi.py`) vs `sys_presa_visione_modifiche`
  (verifica per intero record, tabella presente ma **orfana**, nessuna
  entità applicativa agganciata) — **F, ambiguo**, serve decisione
  sull'utente su quale estendere alle nuove sezioni CCIAA.
- **~15 cataloghi richiesti dalla sezione 4 del Markdown** (tipi di visura,
  CCIAA/Registri Imprese, stati camerali, forme giuridiche, sezioni Registro
  Imprese, tipi di durata, diritti su partecipazioni, cariche camerali,
  operazioni societarie/ruoli, ATECO/ATECORI/NACE versionati, fonti
  informative, albi/ruoli/registri, categorie/classifiche SOA, tipologie
  contrattuali/orari/qualifiche INPS, tipologie unità locale) sono oggi tutti
  campi `VARCHAR` liberi nelle tabelle CCIA esistenti (es. `forma_giuridica`,
  `stato_attivita`, `tipo_diritto`, `sezione`, `tipologia`, `classifica`) —
  **E, mancanti come cataloghi strutturati**. Solo certificazioni
  (`cat_certificazioni`) e settori IAF (`cat_settori_iaf`) sono già cataloghi
  veri e già riusati correttamente da `ana_certificazioni`.
- `qual_amministratori_cariche.tipo_carica` (e campi analoghi nelle altre
  `qual_*`) è testo libero, non FK a un catalogo cariche.
- Alcune tabelle già esistenti sono strutturate diversamente da quanto
  richiesto dal Markdown (dettaglio nel report consegnato in chat il
  2026-08-25, non ripetuto qui per brevità — es. `ana_addetti_visura_periodi`
  usa colonne fisse invece di righe ripetibili per la distribuzione
  contrattuale; `ana_sedi.tipo_sede` è un singolo VARCHAR invece di
  multi-select da catalogo). Da riprendere in dettaglio nella prossima
  sessione se si procede sui cataloghi.
- `qual_responsabile_fer` non corrisponde a nessuna sezione 0-10 della visura
  camerale (è un ruolo tecnico energie rinnovabili, non un dato CCIAA) —
  segnalato come "elemento esistente senza corrispondenza visuale certa"
  come richiesto esplicitamente dalla specifica.

## Decisioni richieste all'utente prima di qualunque implementazione

| # | Argomento | Opzioni |
|---|---|---|
| 1 | Fonte autorevole persone: `per_persone` (attuale, live) o `ana_persone` (non committata, non migrata) | Restare su `per_persone` per ora / attendere che l'utente risolva quel lavoro sospeso / altra indicazione |
| 2 | Fondere visivamente le 4 categorie in un'unica griglia CCIAA | Implementare / rinviare |
| 3 | §7 Trasferimenti/fusioni/scissioni/subentri | Implementare (nuova tabella "evento societario" + soggetti coinvolti) / non implementare ora / rinviare |
| 4 | Meccanismo di verifica da estendere alle sezioni CCIAA | Estendere il registro campo-per-campo esistente (`sys_registro_stato_campi`) / usare la presa-visione a record (`sys_presa_visione_modifiche`) / combinazione |
| 5 | Persone giuridiche come amministratori/sindaci/revisori | Estendere con lo stesso pattern già usato in `qual_soci` (tipo_soggetto + colonne piatte) / valutare struttura "soggetti" generale (impatto più ampio) / rinviare |
| 6 | ~15 cataloghi mancanti (forme giuridiche, stati camerali, tipi di durata, ecc.) | Implementare progressivamente per fasi (da prioritizzare insieme) / lasciare testo libero per ora |
| 7 | `qual_responsabile_fer` — dove va mostrato | Escluderlo dalla vista CCIAA (resta dov'è oggi) / trovargli collocazione dedicata |
| 8 | Catalogo cariche (`tipo_carica` oggi testo libero) | Creare catalogo minimo dedicato alla CCIAA / collegare a `cat_ruoli` quando/se quel lavoro sospeso verrà completato / lasciare testo libero per ora |

## Piano di esecuzione proposto (da avviare solo dopo le decisioni sopra)

1. **Fase 0 — fatta**: questa analisi.
2. **Fase 1**: decisioni utente sui punti 1-8.
3. **Fase 2**: fusione **solo visiva** delle 4 categorie esistenti in
   un'unica griglia "CCIAA" nell'ordine del PDF, riusando i componenti
   `registro/*` esistenti incluso il pannello al 50% — nessuna migrazione.
4. **Fase 3**: costruire le viste mancanti per Soci/Amministratori/Sindaci/
   Revisori sopra le API già esistenti, con selettore ricercabile di persona
   (sezione N della specifica: ricerca per nome/cognome/CF, etichetta
   "Cognome Nome — CF — data di nascita", nessun testo libero, azione "Apri
   scheda persona").
5. **Fase 4**: cataloghi che l'utente deciderà di implementare (punto 6).
6. **Fase 5**: Sintesi camerale / pagina "Dati camerali completi" / §7
   eventi societari, solo se confermati (punti 3-4).

## Come riprendere da qui

1. Rileggere questo file per intero prima di rispondere all'utente.
2. Presentare di nuovo (o riassumere) la tabella delle 8 decisioni e
   ottenerle esplicitamente prima di scrivere qualunque codice, migrazione o
   componente.
3. Se si rifà l'estrazione della struttura dei prototipi HTML (task fallito
   in questa sessione, vedi "Metodo di analisi usato"), farlo con un fork
   dedicato e verificarne l'output con più attenzione prima di fidarsene —
   non ripetere l'errore di questa sessione.
4. Non toccare il lavoro sospeso su `ana_persone`/`Cataloghi/` a meno che
   l'utente non lo chieda esplicitamente o non risponda alla decisione 1.
