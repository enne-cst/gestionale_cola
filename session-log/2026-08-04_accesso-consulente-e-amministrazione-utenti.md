# Log sessione — 2026-08-04 — Accesso del consulente ai clienti, amministrazione utenti da parte del super admin

## Punto di partenza

Il documento di progetto (§1.5.3, §2.2.7, cap. 4) descrive quattro profili
(Super Admin, Consulente, Admin Aziendale, Operatore Aziendale) e un modello
in cui il consulente gestisce i dati dei propri clienti come se fosse il
cliente stesso. La sessione precedente (`2026-08-04_navbar-e-autenticazione.md`)
aveva realizzato login JWT, approvazione aziende e associazione
consulente↔azienda, ma con due lacune reali rispetto al documento:

1. Un consulente, anche se regolarmente associato a un'azienda, riceveva
   403 su tutte le API dei moduli: `get_current_azienda`
   (`app/core/deps.py`) risolveva il contesto azienda solo per i profili
   `AZIENDA_ADMIN`/`OPERATORE`.
2. Il super admin non aveva strumenti reali di amministrazione utenti:
   nessun endpoint per creare un consulente (arrivavano solo dal seed di
   sviluppo), nessuna vista "aziende di un consulente" (solo quella
   inversa), nessuna rimozione di associazione o disattivazione.

Nessuna modifica di schema: le tabelle `sys_profili`/`sys_utenti`/
`rel_utenti_aziende` esistenti bastavano già.

## 1. Contesto "azienda attiva" per il consulente

- **Backend** (`app/core/deps.py`): nuovo helper `profilo_utente()` che
  risolve il profilo "principale" di un utente per priorità esplicita
  (`ORDINE_PROFILI = [SUPERADMIN, CONSULENTE, AZIENDA_ADMIN, OPERATORE]`),
  non più dall'ordine di creazione delle relazioni (fragile per un
  consulente con più aziende). `get_current_azienda` estesa: se l'utente
  non ha una relazione `AZIENDA_ADMIN`/`OPERATORE` ma manda l'header
  `X-Azienda-Id`, verifica su DB (mai fidandosi del client) che esista una
  relazione `CONSULENTE` attiva verso quella specifica azienda e che sia
  `approvata`. Un utente aziendale ha comunque sempre la precedenza: un
  header spurio non può dirottarlo.
- Tutto il resto del backend (fabbriche CRUD in `app/crud/generic.py`,
  `app/api/panoramica.py`, `require_modulo` in `app/core/moduli.py`) dipende
  da `get_current_azienda`: il consulente ha ereditato l'accesso completo
  senza toccare nient'altro.
- `app/api/auth.py`: `login`/`me` riscritti attorno a `profilo_utente()`.
  `MeResponse` guadagna `in_impersonificazione: bool`. `/me` riusa
  `get_current_azienda` direttamente (stessa fonte di verità, nessuna
  logica duplicata) invece di reimplementare la risoluzione del contesto.
- Nuovo `GET /api/consulente/aziende`: elenco delle aziende clienti del
  consulente (incluse quelle non approvate, mostrate ma non selezionabili).
- **Frontend**: cookie httpOnly separato (`AZIENDA_ATTIVA_COOKIE_NAME`),
  inoltrato da `lib/api.ts` come header `X-Azienda-Id`. Server action
  `entraInAzienda`/`esciDaAzienda` (`lib/actions/azienda-attiva.ts`). Area
  consulente (`app/consulente/page.tsx`) mostra ora la tabella dei clienti
  con pulsante "Entra" per quelli approvati. Banner ambra permanente
  (`components/impersonificazione-banner.tsx`) quando
  `me.in_impersonificazione`, con pulsante "Esci dall'azienda".
  `logout()` cancella anche questo cookie (non deve sopravvivere a un
  cambio utente sullo stesso browser).

## 2. Amministrazione utenti lato super admin

`app/api/superadmin.py`:

- `POST /consulenti` — crea un account consulente (utente + relazione
  `CONSULENTE` con `azienda_id=None`, stesso pattern del seed), in
  un'unica transazione.
- `GET /consulenti` — arricchito con le aziende gestite da ciascun
  consulente (`_aziende_per_consulente`, query unica per tutti gli id, non
  N+1): la direzione inversa di `_consulenti_per_azienda` già esistente.
- `DELETE /aziende/{azienda_id}/consulenti/{consulente_id}` — disattiva
  (non cancella) l'associazione: storicizzazione, non cancellazione fisica.
- `POST /consulenti/{id}/disattiva|attiva` — su `sys_utenti.attivo`, già
  verificato ad ogni richiesta da `get_current_user`: il blocco è
  immediato anche sulle sessioni aperte.

### Bug reale trovato e corretto durante l'implementazione

`associa_consulente` considerava "già associato" (400) anche
un'associazione disattivata dalla nuova `DELETE`, per via del vincolo
`UNIQUE(utente_id, azienda_id)`: un'associazione rimossa non poteva più
essere ricreata. Corretto per riattivare la riga esistente invece di
provare a inserirne una seconda.

**Frontend**: nuova area `app/superadmin/consulenti/` (tabella consulenti
con aziende gestite + azioni disattiva/riattiva/rimuovi, form di
creazione). In `app/superadmin/page.tsx`, nuova sezione "Aziende attive"
con azione "Blocca accesso" (riusa lo stato `rifiutata` già esistente:
`get_current_azienda` nega comunque l'accesso a qualunque stato diverso da
`approvata`, non serve un terzo stato dedicato).

## Verifica

Backend verificato via `curl` end-to-end (login, `/me` con e senza
`X-Azienda-Id`, isolamento — azienda non associata e azienda non approvata
→ 403 in entrambi i casi, header spurio ignorato per un admin aziendale,
CRUD consulenti completo, blocco di un'azienda con sessione aperta → 403
immediato). Frontend verificato in browser: login consulente → elenco
clienti → "Entra" → banner "Stai operando come" → "Esci dall'azienda";
pagina `/superadmin/consulenti` con dati coerenti.

### Errore nel processo di verifica (non nel codice)

Il primo giro di test via `curl` ha usato per errore l'id della prima
azienda restituita da `GET /api/superadmin/aziende` (ordinata per
`created_at desc`), che era "Tony SRL" — un dato di test residuo di una
sessione precedente, già `rifiutata` — invece dell'azienda di sviluppo. Lo
script di "ripristino" finale ha quindi approvato Tony SRL per sbaglio.
Corretto ripetendo i test con l'id giusto e riportando Tony SRL a
`rifiutata`. Nessun bug applicativo: solo un promemoria a non assumere
l'ordinamento di una lista quando si cerca un record specifico nei test.

## Come riprendere da qui

- Credenziali di sviluppo invariate (vedi log precedente). Aggiunto un
  consulente di prova disattivato (`nuovo-consulente@example.test`) e
  un'associazione consulente-prova↔Tony SRL come dati di test residui,
  innocui per ambienti nuovi (seed idempotente parte da zero).
- Fuori scopo, esplicitamente rimandato (invariato dal log precedente):
  multi-utente per azienda (`OPERATORE`), recupero password, verifica
  email, revoca dei token già emessi.
