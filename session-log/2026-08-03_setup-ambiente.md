# Log sessione — 2026-08-03 — Setup iniziale ambiente di sviluppo

## Punto di partenza

Richiesta: iniziare a sviluppare la webapp gestionale descritta in
`doc/Master_rev1.pdf`, con backend Python, garantendo fin da subito
compatibilità con un deploy futuro via Docker. Nel repository esisteva già
`database_struttura/` (poi rinominata così durante la sessione, prima si
chiamava `database`) con lo schema SQL scritto a mano, organizzato per
Modulo/Categoria — coerente col capitolo 4 del documento.

## Decisioni prese (e perché)

- **Stack**: quello prescritto dal documento §2.2, non negoziato da capo —
  Next.js/React/TypeScript/Tailwind/shadcn-ui (frontend), FastAPI/SQLAlchemy/
  Alembic (backend), PostgreSQL (database). Versioni verificate via ricerca
  web (non dalla sola memoria del modello, per evitare versioni obsolete):
  Next.js 16.2.6, React 19.2.8, Python 3.13, FastAPI 0.136.x, SQLAlchemy
  2.0.36, Alembic 1.14, PostgreSQL 18, Node 22 LTS.
- **Storage documenti**: richiesta esplicita dell'utente — per ora
  filesystem locale (volume Docker), perché in futuro si passerà a Google
  Drive. Per questo `backend/app/storage/` definisce un'interfaccia
  `StorageBackend` astratta con un'unica implementazione oggi
  (`LocalStorageBackend`); il passaggio a Google Drive richiederà solo una
  nuova implementazione della stessa interfaccia, non un refactor.
- **Repository**: monorepo (scelta esplicita dell'utente), con
  `docker-compose.yml` alla radice che orchestra `backend/`, `frontend/` e
  Postgres, contesto di build a livello di repo root (necessario perché il
  backend deve includere anche `database_struttura/` nell'immagine).
- **Schema DB già esistente**: invece di ricostruirlo da zero con modelli
  SQLAlchemy + `alembic autogenerate`, i file `.sql` esistenti sono stati
  trattati come sorgente autorevole e agganciati come migrazione baseline
  (`backend/alembic/versions/0001_baseline_schema.py`), eseguiti in ordine
  di dipendenza esplicito (Sistema → Anagrafica Aziendale → Personale →
  Documenti). Convenzione stabilita per il futuro: ogni nuova tabella =
  nuovo file `.sql` numerato + nuova revisione Alembic dedicata (dettagli in
  `CLAUDE.md`).
- Corretto un refuso preesistente: il file
  `007_ana_amministrazione_controllo .sql` aveva uno spazio finale nel nome
  prima dell'estensione; rinominato in `007_ana_amministrazione_controllo.sql`.

## Cosa è stato creato

Struttura completa di `backend/`, `frontend/`, `docker-compose.yml`,
`.env.example`, `.gitignore`, `.dockerignore`. Repository Git inizializzato
e primo commit creato: `c84adf7 — Scaffold iniziale: backend FastAPI,
frontend Next.js, docker-compose`.

Dettaglio della struttura e delle convenzioni: vedi `CLAUDE.md` alla radice
del repository (va tenuto aggiornato, questo file di log invece è una
fotografia del momento, non va riscritto).

## Blocco corrente: virtualizzazione hardware disabilitata

Obiettivo di questa sessione era anche verificare l'avvio reale dello stack
via Docker, installabile **da terminale senza Docker Desktop** (Docker
Engine dentro WSL2, richiesta esplicita dell'utente). Diagnosi effettuata:

- Windows/CPU supportano tutto il necessario (`systeminfo` →
  "Estensioni modalità di monitoraggio macchina virtuale: Sì",
  "Conversione indirizzi di secondo livello: Sì",
  "Prevenzione esecuzione dati disponibile: Sì").
- **"Virtualizzazione abilitata nel firmware: No"** — unico requisito
  mancante. Macchina fisica (non una VM), quindi si risolve nel BIOS/UEFI
  della scheda madre, non da software.
- `wsl --install` (anche elevato via `Start-Process -Verb RunAs`) si ferma
  proprio su questo punto: il componente Windows si registra, ma WSL2 non
  può avviare una macchina virtuale senza virtualizzazione attiva nel
  firmware.

L'utente ha confermato che serve un riavvio per intervenire nel BIOS.

## Come riprendere da qui

Vedi `session-log/PROSSIMI-PASSI.md` per la checklist puntuale.
