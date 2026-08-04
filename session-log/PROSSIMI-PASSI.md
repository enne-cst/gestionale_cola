# Prossimi passi

Checklist viva: aggiornare le caselle man mano, non serve conservare lo
storico qui (per quello c'è il log datato accanto a questo file).

## 1. Ambiente Docker — FATTO

- [x] Virtualizzazione abilitata nel BIOS
- [x] WSL2 + distro Ubuntu installati, utente Linux creato
- [x] Docker Engine (non Docker Desktop) installato dentro Ubuntu via
      `get.docker.com`, utente nel gruppo `docker`, `docker.service`
      abilitato in `systemd`
- [x] `docker compose up --build` verificato end-to-end: backend, frontend
      e Postgres partono e restano su
- [x] Guida completa in `doc/AMBIENTE-SVILUPPO.md`

## 2. Schema database — FATTO (con due placeholder da riprendere)

Il primo avvio reale ha rivelato diversi bug mai emersi prima perché la
baseline non era mai stata eseguita davvero:

- [x] `docker-compose.yml`: corretto mount point Postgres 18
      (`db_data:/var/lib/postgresql`, non `.../data`)
- [x] Riordinati i file in `database_struttura/Sistema/` (008/009):
      `cat_stati_certificazione` deve esistere prima di
      `sys_aziende_certificazioni` che la referenzia
- [x] Riordinate le categorie in `0001_baseline_schema.py`: `Documenti` e
      `Mod. Personale` vanno eseguite prima di `Mod. Anagrafica Aziendale`,
      che dipende da entrambe
- [x] Corretto bug di copia-incolla (virgola mancante + colonna
      `modalita_firma` duplicata) in 3 file: `009_qual_amministratori_cariche.sql`,
      `021_qual_amministratore_delegato.sql`,
      `022_qual_componente_consiglio_amministrazione.sql`
- [x] `Documenti/001_doc_documenti.sql` era vuoto (0 byte): creato
      **placeholder minimo** (id, azienda_id, timestamp) solo per sbloccare
      le FK — struttura reale del modulo Documenti rimandata
- [x] `per_titoli_studio` non esisteva per niente (referenziata da
      `017_qual_responsabile_fer.sql` e `020_qual_direttore_tecnico_soa.sql`):
      creato **placeholder minimo** (id, nome, attiva, timestamp) — elenco
      reale dei titoli rimandato

Risultato verificato: `docker compose up --build` → 44 tabelle create,
`http://localhost:8000/docs` e `http://localhost:3000` rispondono 200.

**Nota per la prossima sessione che tocca Documenti o Personale**: prima di
aggiungere colonne vere a `doc_documenti`/`per_titoli_studio`, ricordarsi
che sono placeholder minimi, non schema definitivo — vanno ridisegnati con
una nuova revisione Alembic dedicata (mai modificando `0001` direttamente,
ormai applicata).

## 3. Modulo Anagrafica Aziendale + navbar dei moduli — FATTO

- [x] Frontend completo per le sezioni `ana_*` (vedi log
      `2026-08-04_frontend-anagrafica-e-panoramica.md`)
- [x] Navbar laterale dei moduli, collassabile, fissa allo scroll insieme
      alla barra di sezione; scroll-spy sulla tab attiva (vedi log
      `2026-08-04_navbar-e-autenticazione.md`)

## 4. Login reale e ruoli (azienda / consulente / super admin) — FATTO

Dettagli completi nel log `2026-08-04_navbar-e-autenticazione.md`.

- [x] JWT, hash bcrypt, `middleware.ts`, cookie httpOnly
- [x] Area consulente (creazione azienda + account admin)
- [x] Area super admin (approvazione aziende, associazione a un consulente)

Fuori scopo per ora (vedi "Come riprendere da qui" nel log): dashboard
super admin più ampia, multi-utente per azienda (`OPERATORE`), recupero
password, verifica email, revoca dei token già emessi.

## 4bis. Consulente "dentro" i dati del cliente + amministrazione utenti — FATTO

Dettagli completi nel log `2026-08-04_accesso-consulente-e-amministrazione-utenti.md`.

- [x] Il consulente può entrare nel contesto di un'azienda cliente e operare
      come se fosse l'admin aziendale (header `X-Azienda-Id`, verificato dal
      backend ad ogni richiesta)
- [x] Super admin: creare account consulente, vedere le aziende gestite da
      ciascun consulente (direzione inversa di quella già esistente),
      rimuovere un'associazione, disattivare/riattivare un consulente,
      bloccare l'accesso di un'azienda già approvata

Fuori scopo per ora: multi-utente per azienda (`OPERATORE`), recupero
password, verifica email, revoca dei token già emessi (stesse lacune
segnalate nel punto 4).

## 5. Prossimo: repository remota

Da fare su richiesta esplicita dell'utente (non ancora avviato): creare una
repo remota (GitHub o altro provider — da chiedere all'utente quale, nome,
pubblica/privata) e collegarla con `git remote add`, poi primo push.
Prima del primo push su un provider condiviso, rigenerare `SECRET_KEY`
(oggi un valore di sviluppo in `.env`/`.env.example`) per qualunque
ambiente che non sia locale.

## 6. Dopo il push

- [ ] Generare `frontend/package-lock.json` reale (oggi non esiste perché
      Node non è mai stato eseguito in locale) e committarlo, per build
      riproducibili — si genera da solo al primo `docker compose build
      frontend`, basta copiarlo fuori dal container o rilanciare `npm
      install` in locale una volta installato Node
- [ ] Progettare seriamente il modulo Documenti (oggi solo placeholder in
      `doc_documenti`) e il catalogo titoli di studio (`per_titoli_studio`)
- [ ] Iniziare il modulo Personale (schema `database_struttura/Mod.
      Personale/` già presente, frontend da fare)
- [ ] Sezioni `qual_*` di Anagrafica Aziendale (soci, amministratori,
      sindaci, ecc.) ancora senza frontend, escluse esplicitamente finora
