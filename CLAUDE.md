# Gestionale Cola — guida per chi sviluppa (incluso Claude Code)

Piattaforma web gestionale multi-azienda per uno studio di consulenza (qualità,
ambiente, sicurezza sul lavoro — ISO 9001 / 14001 / 45001). La specifica
funzionale e architetturale completa è in `doc/Master_rev1.pdf`: in caso di
dubbio su *cosa* costruire o *perché*, quel documento è la fonte autorevole,
non questo file. Questo file spiega *come* lavorare nel repository nel
rispetto di quella specifica.

Stato di avanzamento e blocchi correnti: vedi `session-log/`.

## Stack tecnologico (vincolante, definito nel documento §2.2)

| Livello | Tecnologia | Versione di riferimento |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | Next 16.2.x, React 19.2.x |
| Stile / UI | Tailwind CSS v4 + shadcn/ui | — |
| Backend | Python + FastAPI | Python 3.13, FastAPI 0.136.x |
| ORM / migrazioni | SQLAlchemy 2.0 + Alembic | SQLAlchemy 2.0.36, Alembic 1.14 |
| Database | PostgreSQL | 18 |
| Storage documenti | Object storage disaccoppiato dal DB | locale ora, Google Drive previsto in futuro |
| Container | Docker + docker compose | — |

Non cambiare framework/libreria principale senza motivo forte: è una scelta
di progetto documentata, non un dettaglio implementativo libero (§2.2.13).

## Struttura del repository

```
backend/                      API FastAPI
  app/
    main.py                   entrypoint FastAPI, middleware, router
    config.py                 Settings (pydantic-settings, legge env var)
    database.py               engine/session SQLAlchemy, Base dichiarativa
    api/                      router per dominio (health.py, poi altri)
    storage/                  interfaccia StorageBackend + implementazioni
  alembic/
    versions/0001_baseline_schema.py   importa database_struttura/ come baseline
  requirements.txt
  Dockerfile

frontend/                     Next.js App Router
  app/                        route, layout, pagine (Server Components di default)
  lib/utils.ts                helper cn() per shadcn/ui
  components.json             config CLI shadcn/ui
  Dockerfile                  stage: deps, builder, runner (prod), dev (default)

database_struttura/           SCHEMA SQL sorgente, organizzato per Modulo/Categoria
  Sistema/                    tabelle di sistema (profili, aziende, utenti, moduli...)
  Mod. Anagrafica Aziendale/  tabelle anagrafica (dati CCIAA, sedi, qualifiche...)
  Mod. Personale/             tabelle personale
  Documenti/                  tabelle documentali

docker-compose.yml            db + backend + frontend, migrazioni automatiche
.env.example                  template variabili d'ambiente (copiare in .env)
doc/Master_rev1.pdf           specifica di progetto (fonte autorevole)
doc/AMBIENTE-SVILUPPO.md      come installare/avviare l'ambiente Docker (guida operativa, PC Windows)
session-log/                  log di sessione per riprendere il lavoro
```

## Ambiente di sviluppo

Guida completa, passo-passo, per predisporre un PC Windows da zero (WSL2,
Ubuntu, Docker Engine — niente Docker Desktop) e per i comandi di avvio
quotidiani: **`doc/AMBIENTE-SVILUPPO.md`**. Leggerla per intero prima di
lavorare su un nuovo checkout: descrive anche dove vive Docker (dentro la
distro Ubuntu di WSL2, non su Windows) e come lanciare i comandi da lì.

Riassunto minimo (ambiente già pronto, da dentro una shell Ubuntu):
```bash
cp .env.example .env      # solo la prima volta, poi personalizzare se serve
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (docs automatiche su /docs)
- Postgres: localhost:5432 (credenziali in `.env`)

Il servizio `backend` esegue `alembic upgrade head` automaticamente prima di
avviare uvicorn: al primo avvio crea tutto lo schema. Il codice di
`backend/` e `frontend/` è montato come bind volume, quindi le modifiche ai
file si riflettono subito (hot reload sia lato FastAPI `--reload` sia lato
Next.js `next dev`).

Avvio reale verificato: la migrazione baseline crea correttamente le 44
tabelle. Due di queste sono solo placeholder minimi in attesa di
progettazione dedicata — vedi "Stato dello schema database" in
`doc/AMBIENTE-SVILUPPO.md` per l'elenco e i dettagli prima di assumere che
`doc_documenti` o `per_titoli_studio` siano già strutturate.

## Schema database: convenzione OBBLIGATORIA

Lo schema non nasce da modelli SQLAlchemy con `alembic revision --autogenerate`,
ma da file `.sql` scritti a mano e organizzati per Modulo/Categoria dentro
`database_struttura/`, secondo l'organizzazione del capitolo 4 del documento.
La migrazione `backend/alembic/versions/0001_baseline_schema.py` li esegue in
un ordine di dipendenza esplicito (Sistema prima di tutto, perché quasi ogni
tabella referenzia `sys_aziende`).

**Regola:** una volta che la baseline è stata applicata a un ambiente
(sviluppo, test o produzione), i file già coperti da `0001_baseline_schema.py`
non vanno più modificati — modificarli con effetto retroattivo romperebbe
l'allineamento con gli ambienti dove la migrazione è già passata.

Per aggiungere una tabella o modificare lo schema, da qui in avanti:

1. Aggiungere un nuovo file `.sql` numerato progressivamente nella cartella
   di categoria giusta (o crearne una nuova se il modulo non esiste ancora),
   seguendo lo stile esistente: `CREATE TABLE IF NOT EXISTS`, PK
   `UUID DEFAULT gen_random_uuid()`, `created_at`/`updated_at` `TIMESTAMPTZ`,
   FK esplicite verso `sys_aziende` per l'isolamento multi-azienda.
2. Creare una **nuova revisione Alembic** (`alembic revision -m "..."`) che
   esegue quello specifico file con `op.execute(...)`, incatenata come
   `down_revision` sull'ultima applicata. Mai ri-eseguire l'intera cartella:
   la scansione automatica in `0001_baseline_schema.py` è un'eccezione valida
   solo per il primo bootstrap di un database vuoto.
3. Solo dopo aver stabilizzato la tabella, aggiungere (se serve al backend)
   il modello SQLAlchemy corrispondente in `backend/app/models/`.

## Principi architetturali da rispettare (documento §2.3, sintesi operativa)

Questi non sono suggerimenti stilistici: sono vincoli del documento di
progetto e vanno rispettati anche sotto pressione di scadenza.

- **Tutta la logica di business sta nel backend.** Il frontend valida solo
  per UX (feedback immediato); ogni regola che conta viene ri-verificata
  dalle API. Non fidarsi mai di dati "già validati dal frontend".
- **Isolamento dati tra aziende è responsabilità del backend, non del
  frontend.** Ogni query filtra esplicitamente per `azienda_id` lato server,
  mai fidandosi di un id ricevuto dal client senza verificarne
  l'autorizzazione. Questo vale doppio per i consulenti multi-azienda.
- **API-first, organizzate per risorsa/dominio**, non per schermata. Un
  endpoint non deve esistere solo perché una pagina specifica ne ha bisogno
  in quella forma esatta.
- **Niente logica duplicata.** Se una regola (es. calcolo scadenza) serve in
  più punti, va scritta una volta nel backend e riusata, mai reimplementata
  nel frontend o copiata in più endpoint.
- **Configurazione prima della programmazione.** Differenze tra aziende,
  settori o certificazioni si gestiscono con dati di configurazione
  (cataloghi, pacchetti attivi), non con `if azienda.settore == "..."` sparsi
  nel codice.
- **Storicizzazione esplicita** per documenti, certificati, incarichi e
  qualifiche: non sovrascrivere un valore precedente se la natura del dato
  richiede di conservare lo storico (vedi tabelle `qual_*` esistenti come
  esempio: nomina, decorrenza, cessazione sono campi distinti, non un
  singolo valore aggiornato in place).
- **Operazioni composite = transazione unica.** Se un'azione tocca più
  tabelle correlate (es. rinnovo di un documento), va fatta in una
  transazione atomica, mai come sequenza di operazioni indipendenti che
  potrebbero lasciare uno stato intermedio incoerente.
- **Job/automazioni idempotenti.** Notifiche, sincronizzazioni ed
  elaborazioni pianificate devono riconoscere se sono già state eseguite ed
  evitare duplicati.
- **Niente ottimizzazione prematura.** Paginazione, cache, indici aggiuntivi
  si introducono quando c'è un problema di prestazioni reale e misurato, non
  per precauzione.
- **Semplicità tecnica.** Prima di introdurre un nuovo layer di astrazione,
  un pattern architetturale o una libreria, chiedersi se il progetto ne ha
  davvero bisogno adesso.

## Convenzioni di codice

**Backend (Python/FastAPI)**
- Endpoint organizzati per dominio sotto `app/api/` (un router per area
  funzionale, es. `anagrafica.py`, `personale.py`), inclusi in `main.py`.
- Configurazione solo tramite `app/config.py` (`pydantic-settings`), mai
  valori hardcoded o letti direttamente da `os.environ` altrove.
- Mai credenziali o segreti nel codice: sempre variabili d'ambiente (vedi
  `.env.example`), mai committare `.env`.
- Accesso ai documenti sempre tramite `app.storage.get_storage()`
  (l'interfaccia `StorageBackend`), mai percorsi filesystem hardcoded altrove
  nel codice: è quello che permette di passare a Google Drive in futuro
  senza toccare i moduli applicativi.

**Frontend (Next.js/TypeScript)**
- App Router: componenti **Server Component per default**; aggiungere
  `"use client"` solo dove serve interattività reale (form, stato locale).
- Componenti UI: usare la CLI `npx shadcn add <componente>` (dentro il
  container: `docker compose exec frontend npx shadcn add button`) invece di
  scrivere a mano i primitivi — mantiene coerenza con `components.json`.
- Classi Tailwind condizionali sempre tramite l'helper `cn()` in
  `lib/utils.ts`, mai concatenazione di stringhe manuale.
- Il frontend non contiene regole di business: se serve una decisione (es.
  "questo campo è obbligatorio in base al pacchetto attivo"), quella
  decisione arriva dall'API, il frontend la applica soltanto.

## Variabili d'ambiente

Tutte documentate in `.env.example`. Da ricordare in particolare:
- `NEXT_PUBLIC_API_URL` (usato dal browser) vs `API_URL_INTERNAL` (usato dal
  server Next.js dentro Docker) sono **due URL diversi apposta**: il nome
  del servizio Docker `backend` non è risolvibile dal browser dell'utente.
- `STORAGE_BACKEND`/`STORAGE_LOCAL_PATH` selezionano l'implementazione di
  storage; quando si aggiungerà Google Drive si estenderà
  `app/storage/__init__.py` con un nuovo backend, senza toccare i chiamanti.
