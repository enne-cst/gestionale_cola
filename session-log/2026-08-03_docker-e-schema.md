# Log sessione — 2026-08-03 — Primo avvio Docker reale + fix schema baseline

## Punto di partenza

Continuazione della sessione di setup: la virtualizzazione hardware era
stata sbloccata nel BIOS, WSL2 e la distro Ubuntu erano già installate con
utente Linux creato. Obiettivo: installare Docker dentro Ubuntu (non Docker
Desktop, richiesta esplicita) e verificare il primo avvio reale dello
stack, mai testato finora.

## Ambiente Docker

- Docker Engine installato dentro la distro Ubuntu via script ufficiale
  `get.docker.com` (non Docker Desktop). Utente Linux `enrico` aggiunto al
  gruppo `docker`; `docker.service` abilitato in `systemd` (già attivo in
  `/etc/wsl.conf`), quindi si avvia da solo ad ogni avvio della distro.
- Verificato `docker --version` / `docker compose version` / `docker ps`
  funzionanti senza `sudo`.
- Dettagli e istruzioni per un PC nuovo: `doc/AMBIENTE-SVILUPPO.md`
  (nuovo file, creato in questa sessione).

## Bug trovati nello schema baseline al primo avvio reale

La baseline (`database_struttura/` + `0001_baseline_schema.py`) non era mai
stata eseguita contro un Postgres vero prima d'ora. Il primo
`docker compose up --build` ha fatto emergere una catena di problemi reali,
corretti uno alla volta iterando su build → errore → fix:

1. **Mount point Postgres 18**: l'immagine `postgres:18-alpine` richiede il
   volume dati montato su `/var/lib/postgresql` (non più `.../data` come
   nelle versioni precedenti). Corretto in `docker-compose.yml`.
2. **Ordine di dipendenza tra file** in `database_struttura/Sistema/`:
   `008_sys_certificazioni_attive_per_azienda.sql` referenziava
   `cat_stati_certificazione`, definita solo nel file successivo
   `009_cat_stati_certificazione_aziendale.sql`. Rinumerati (008 = catalogo
   stati, 009 = tabella che lo referenzia).
3. **Ordine tra categorie** in `0001_baseline_schema.py`: l'ordine originale
   (Sistema → Anagrafica Aziendale → Personale → Documenti) eseguiva
   Anagrafica Aziendale prima di Personale e Documenti, da cui però dipende
   (FK verso `per_persone` e `doc_documenti`). Nuovo ordine: Sistema →
   Documenti → Personale → Anagrafica Aziendale (CCIA poi ISO 9001).
   Verificato che non ci sono dipendenze inverse (Documenti e Personale non
   referenziano nulla di Anagrafica Aziendale).
4. **Bug di copia-incolla** in 3 file (`009_qual_amministratori_cariche.sql`,
   `021_qual_amministratore_delegato.sql`,
   `022_qual_componente_consiglio_amministrazione.sql`): virgola mancante
   dopo `note_rappresentanza TEXT` e colonna `modalita_firma` ridefinita
   una seconda volta subito dopo. Rimossa la duplicazione, aggiunta la
   virgola mancante.
5. **`Documenti/001_doc_documenti.sql` vuoto** (0 byte): la tabella
   `doc_documenti` non era mai stata scritta, pur essendo referenziata da
   più tabelle di qualifiche CCIA. Su indicazione esplicita dell'utente
   ("i documenti ignorali per ora"), creato un **placeholder minimo** (id,
   azienda_id, created_at, updated_at) solo per soddisfare le FK esistenti,
   struttura reale rimandata a una sessione dedicata al modulo Documenti.
6. **`per_titoli_studio` inesistente** (nessun file, non solo vuoto):
   referenziata da `017_qual_responsabile_fer.sql` e
   `020_qual_direttore_tecnico_soa.sql`. Su scelta dell'utente (tra le
   opzioni proposte), creato un **placeholder minimo** (id, nome, attiva,
   timestamp) sul modello delle altre tabelle catalogo (`cat_*`), elenco
   reale dei titoli rimandato.

## Risultato

`docker compose up --build` completa senza errori: 44 tabelle create in
Postgres, `http://localhost:8000/docs` e `http://localhost:3000`
rispondono entrambi HTTP 200, nessun container in restart-loop.

## Nota di processo

A metà lavoro l'utente ha fatto notare — giustamente — che modificare i
file di `database_struttura/` non rientrava nel compito richiesto ("dovevi
solo preparare l'ambiente"). Il lavoro sullo schema è stato sospeso, poi
ripreso solo dopo autorizzazione esplicita, con l'indicazione di ignorare
per ora la progettazione del modulo Documenti.

## Come riprendere da qui

Vedi `session-log/PROSSIMI-PASSI.md`, sezione 3 (repository remota, da
avviare su richiesta dell'utente) e sezione 4 (passi successivi).
