# Log sessione — 2026-08-04 — Frontend Anagrafica Aziendale, redesign modulo, scheda Panoramica

## Punto di partenza

Il modulo Anagrafica Aziendale aveva backend completo (modelli, schema,
endpoint CRUD) per tutte le tabelle `ana_*`/`qual_*` della categoria "Dati
estratti dalla CCIA" (cap. 3.2.1), ma il frontend copriva solo 6 sezioni su
22: identificazione camerale, durata società, attività esercitata,
capitale sociale, sedi, contatti.

## 1. Frontend per le sezioni `ana_*` senza pagina

Su richiesta esplicita, limitato alle tabelle `ana_*` (escluse le `qual_*`,
tutte legate a qualifiche societarie/incarichi, rimandate). Aggiunte 8
sezioni, seguendo i pattern già in uso (form singleton con
`useActionState`, tabella + dialog per le liste):

- Semplici: iscrizioni registro imprese, codici ATECO, albi/ruoli/licenze.
- Singleton con figli: amministrazione e controllo (+ elenco dinamico
  "sistemi di amministrazione").
- Liste con figli (nuovo pattern, prima non esisteva in frontend): SOA (+
  categorie), certificazioni (+ settori IAF), addetti da visura (+
  periodi), addetti per comune (+ periodi) — righe ripetibili gestite
  lato client dentro il dialog, inviate come array annidato all'API.

Aggiunto anche un piccolo `PeriodoSelect` nativo (non il Select di
shadcn/Radix) riusato in addetti-visura/addetti-comune, perché comparendo
più volte nella stessa form come riga ripetibile deve poter inviare il
proprio valore via `FormData` senza stato client aggiuntivo.

## 2. Redesign del modulo (ispirato a uno screenshot fornito dall'utente)

- **Tema colore**: da bordeaux (hue ~20 OKLCH) a blu (hue ~258), sia light
  che dark, mantenendo la stessa struttura di token shadcn/ui
  (`frontend/app/globals.css`).
- **Raggruppamento sezioni**: da 5 categorie granulari a 4 — Informazioni
  societarie (i 4 dati camerali principali), Sedi, Contatti, "Dati CCIAA"
  (tutto il resto: iscrizioni, codici ATECO, amministrazione e controllo,
  albi, SOA, certificazioni, addetti visura/comune).
- **Navigazione**: sidebar verticale sostituita da una tab bar orizzontale
  per le 4 categorie (`components/anagrafica-nav.tsx`), presente su tutte
  le pagine del modulo. Header con breadcrumb a sinistra (conservato,
  esplicitamente richiesto) e nome azienda a destra — nuovo endpoint
  `GET /api/sistema/azienda-corrente` (`backend/app/api/sistema.py`) per
  leggerlo da `sys_aziende`.
- **Pagina panoramica** (`/anagrafica`) ridisegnata: anello di completezza
  al posto della barra lineare, card "sezioni da completare" e "ultimo
  aggiornamento" (calcolate da dati reali, non inventate), card raggruppate
  sotto l'intestazione di ciascuna categoria.
- **Sezioni compattabili**: intestazione di categoria cliccabile
  (`components/collapsible-section.tsx`) che nasconde le card lasciando
  solo la dicitura; pulsanti "Espandi tutte"/"Comprimi tutte"
  (`components/expand-all-button.tsx`). Cliccare una tab della nav
  riespande automaticamente la categoria anche se era compattata (evento
  custom `anagrafica:espandi-sezione`, perché un cambio di solo hash su
  Next.js non genera sempre un `hashchange` nativo).
- **Barra "torna alla panoramica"**: su ogni sottopagina di sezione
  (`components/back-to-overview.tsx`, inserita nel layout condiviso),
  link esplicito di rientro con freccia, per non affidarsi alla sola tab
  evidenziata.

## 3. Scheda "Panoramica" (nuova funzionalità, pensata per tutti i moduli)

Tab dedicata (prima delle altre) con le sole voci scelte dal consulente,
in **sola lettura** e sempre aggiornate dal vivo (mai valori congelati):

- **Schema**: nuova tabella trasversale ai moduli `sys_panoramica_voci`
  (non lega il nome "anagrafica", riusabile per moduli futuri). Costruita
  in 3 migrazioni incrementali via via che i requisiti si sono ampliati nel
  corso della sessione:
  - `0002` (`Sistema/013_sys_panoramica_voci.sql`): tabella base, un campo
    per voce (per le sezioni "singleton", un record per azienda).
  - `0003` (`Sistema/014_..._record.sql`): aggiunto `record_id` per fissare
    un **intero record** di una sezione a elenco (una sede, un contatto...)
    invece di un campo — `campo` reso opzionale, un solo indice univoco
    parziale per ciascuno dei due usi (un vincolo UNIQUE su colonne
    nullable non basterebbe: NULL non è mai uguale a NULL in Postgres).
  - `0004` (`Sistema/015_..._ordine.sql`): colonna `ordine` per il
    riordino manuale.
- **Backend** (`backend/app/api/panoramica.py`): router scritto a mano
  (non con la fabbrica CRUD generica) perché la semantica è diversa da un
  CRUD normale — POST idempotente, DELETE per chiave naturale
  (modulo+sezione+campo o record_id, non id), più `PUT /ordine` per il
  riordino in blocco.
- **Pin sui campi delle 5 sezioni singleton** (identificazione camerale,
  durata società, attività esercitata, capitale sociale, amministrazione e
  controllo): icona spillo accanto a ogni campo del form
  (`PinnableFormField`/`PinnableFormTextareaField`/`PinnableFormCheckboxField`,
  hook condiviso `usePanoramicaPin`).
- **Pin di record interi sulle 9 sezioni a elenco**: icona nella riga della
  tabella (`components/pin-record-button.tsx`), aggiunta a tutte le
  tabelle (sedi, contatti, iscrizioni, codici ATECO, albi, SOA,
  certificazioni, addetti visura/comune).
- **Pagina Panoramica** (`app/anagrafica/panoramica/`): elenco unico
  trascinabile (non più raggruppato per scheda, su richiesta esplicita
  dell'utente dopo una prima versione a card separate) — ogni riga mostra
  titolo/valore calcolati dal vivo (rifacendo la fetch alla sezione di
  origine, mai un valore salvato al momento del pin) più un'etichetta della
  sezione di provenienza. Drag-and-drop nativo HTML5, nessuna libreria
  aggiunta.

### Bug reali trovati e corretti durante la verifica

- **Confine Server/Client Component**: passare l'icona (riferimento a
  componente) da un Server Component a `CollapsibleSection` (Client
  Component) falliva — React Server Components non serializza riferimenti
  a componente attraverso quel confine, solo elementi già risolti. Fix:
  passare `<IconAvatar icon={...} />` già renderizzato, non il componente
  icona.
- **`setState` durante il render**: `riordinaPanoramica(...)` (server
  action) veniva chiamata dentro l'updater di `setItems`, causando
  "Cannot update a component (`Router`) while rendering a different
  component (`PanoramicaLista`)". Fix: calcolare il nuovo array, chiamare
  `setItems` e poi la server action come effetto "fire and forget"
  separato.

## Nota tecnica sull'ambiente

Le modifiche ai file sotto `/mnt/c/...` (bind mount Windows→WSL2) non
sempre vengono rilevate dall'hot-reload di Next.js/Turbopack dentro il
container: quando una modifica non sembra avere effetto nel browser, un
`docker compose restart frontend` risolve. Verificato più volte in questa
sessione.

## Come riprendere da qui

- Il pin in Panoramica copre solo Anagrafica Aziendale; il meccanismo
  (tabella/API) è già generico e riusabile quando si svilupperà un
  prossimo modulo reale (Personale completo, Piano Formativo, ecc.).
- Sezioni `qual_*` (soci, amministratori, sindaci, revisori legali,
  direttori tecnici SOA, amministratori delegati, componenti CdA,
  responsabili FER) ancora senza frontend, escluse esplicitamente da
  questa sessione.
- Categorie "Organizzazione" e "Altre informazioni" di Anagrafica Aziendale
  (cap. 3.2.2/3.2.3) e Mod. Personale restano da progettare da zero
  (nessuna tabella a schema), come da pianificazione discussa a inizio
  sessione.
