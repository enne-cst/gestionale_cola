# Ambiente di sviluppo — cosa serve e come avviarlo

Questo file descrive **come predisporre un PC Windows per sviluppare questo
progetto** e come avviarlo una volta pronto. Non fa parte della specifica di
progetto (quella è `doc/Master_rev1.pdf`) — è documentazione operativa,
pensata anche per essere seguita da Claude Code su un PC nuovo dopo un
`git clone`/checkout, senza dover riscoprire tutto da capo.

Scelta di progetto: **Docker Engine dentro WSL2/Ubuntu**, non Docker
Desktop (nessuna installazione GUI aggiuntiva su Windows, solo terminale).

## Prerequisiti da installare su un PC nuovo (una tantum)

Se `wsl -l -v` (da PowerShell) non mostra già una distro Ubuntu con Docker
funzionante, vanno fatti questi passi, in ordine:

1. **Virtualizzazione hardware attiva nel firmware/BIOS.** Requisito di
   WSL2, non aggirabile da software. Verifica: Task Manager → scheda
   Prestazioni → CPU → il campo "Virtualizzazione" deve dire "Abilitata".
   Se dice "Disabilitata", va abilitata manualmente nel BIOS/UEFI della
   scheda madre (di solito *Advanced → CPU Configuration → Intel VT-x* o
   equivalente AMD), operazione fisica che l'utente deve fare da sé
   (Claude Code non può farlo).

2. **Installare WSL2 + distro Ubuntu** (PowerShell come amministratore):
   ```powershell
   wsl --install -d Ubuntu
   ```
   Riavvio se richiesto. Al primo avvio di Ubuntu viene chiesto di scegliere
   username e password Linux: è l'unico passaggio interattivo, va fatto a
   mano dall'utente (non automatizzabile da terminale).

3. **Verificare che `systemd` sia attivo** dentro la distro (necessario per
   far partire `docker.service` automaticamente):
   ```bash
   cat /etc/wsl.conf
   ```
   Deve contenere:
   ```ini
   [boot]
   systemd=true
   ```
   Se il file non esiste o manca questa riga, crearlo (da dentro Ubuntu,
   con `sudo`) e poi da PowerShell rilanciare `wsl --shutdown` seguito da
   una nuova apertura di Ubuntu per far ripartire la distro con systemd
   attivo.

4. **Installare Docker Engine dentro Ubuntu** (non Docker Desktop):
   ```bash
   curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
   sudo sh /tmp/get-docker.sh
   sudo usermod -aG docker $USER
   sudo systemctl enable --now docker
   ```
   Dopo `usermod`, serve chiudere e riaprire la shell Ubuntu (o
   `wsl --shutdown` da PowerShell e riaprire) perché l'appartenenza al
   gruppo `docker` venga applicata alla sessione.

5. **Verifica finale:**
   ```bash
   docker --version
   docker compose version
   docker ps
   ```
   Tutti e tre devono rispondere senza errori e senza `sudo`.

## Cosa è installato, e dove (riepilogo)

| Componente | Dove vive | Note |
|---|---|---|
| WSL2 | feature di Windows | richiede virtualizzazione attiva nel firmware |
| Distro Ubuntu | dentro WSL2 | `systemd` attivo (`/etc/wsl.conf`) |
| Docker Engine (Community, non Docker Desktop) | **dentro** la distro Ubuntu | installato via script ufficiale `get.docker.com`; l'utente Linux è nel gruppo `docker` (comandi `docker` senza `sudo`) |
| Docker Compose plugin (v2, comando `docker compose`) | dentro Ubuntu, incluso nell'installazione Docker | — |
| Servizio `docker.service` | dentro Ubuntu, gestito da `systemd` | abilitato: si avvia da solo ogni volta che la distro Ubuntu si avvia |
| Codice del progetto | filesystem **Windows** (dove è stato clonato il repo) | visto da dentro Ubuntu come `/mnt/c/...` (percorso Windows con `C:\` → `/mnt/c/`, backslash → slash) |

Punto importante: Docker **non** va installato su Windows. Vive solo dentro
Ubuntu/WSL2. Ogni comando `docker`/`docker compose` va lanciato da una shell
Ubuntu, non da PowerShell/cmd direttamente (a meno di usare
`wsl -d Ubuntu -- <comando>` da PowerShell, come fa Claude Code).

## Come avviare tutto (ambiente già pronto)

1. **Aprire una shell Ubuntu.** Uno di questi modi, equivalenti:
   - menu Start → cercare "Ubuntu" → aprire l'app
   - da PowerShell/Terminal: digitare `wsl`

   Avvia la distro (se non è già in esecuzione), che a sua volta avvia
   `systemd` e quindi anche `docker.service` in automatico.

2. **Andare nella cartella del progetto** (dentro la shell Ubuntu; sostituire
   il percorso con quello reale su questo PC):
   ```bash
   cd /mnt/c/percorso/verso/gestionale_cola
   ```

3. **Preparare `.env`** (solo la primissima volta su questo PC):
   ```bash
   cp .env.example .env
   ```

4. **Avviare lo stack:**
   ```bash
   docker compose up -d
   ```
   La prima volta, o dopo aver modificato `Dockerfile`/dipendenze, serve
   `--build`:
   ```bash
   docker compose up --build -d
   ```

5. **Servizi raggiunti dal browser Windows** (WSL2 espone le porte su
   `localhost` automaticamente):
   - Frontend: http://localhost:3000
   - Backend + docs automatiche: http://localhost:8000/docs
   - Postgres: `localhost:5432` (credenziali in `.env`, non versionato)

## Comandi utili

```bash
docker compose ps                    # stato dei container
docker compose logs backend -f       # log in tempo reale del backend
docker compose logs -f               # log di tutti i servizi
docker compose down                  # ferma e rimuove i container (i volumi restano)
docker compose down -v               # come sopra, ma cancella anche i dati Postgres
docker compose restart backend       # riavvia solo un servizio
docker compose exec db psql -U gestionale -d gestionale -c '\dt'   # elenco tabelle
```

## Per fermare tutto

```bash
docker compose down
```
Non è strettamente necessario farlo ad ogni spegnimento del PC: WSL2 si
sospende quando Windows si spegne/riavvia, e i container semplicemente non
saranno in esecuzione al prossimo accesso finché non si rilancia
`docker compose up -d`.

## Stato dello schema database

La baseline (`backend/alembic/versions/0001_baseline_schema.py` +
`database_struttura/`) è stata verificata con un avvio reale e **la
migrazione va a buon fine**: 44 tabelle create correttamente.

Due tabelle sono presenti solo come **placeholder minimo** (id, colonne
obbligatorie da convenzione, nessun campo applicativo), create solo per
soddisfare le foreign key di altre tabelle già scritte, in attesa di una
progettazione dedicata:

- `doc_documenti` (modulo Documenti — intera struttura da progettare)
- `per_titoli_studio` (modulo Personale — catalogo titoli di studio da
  popolare/estendere)

Non vanno considerate definitive: quando si affronta quel modulo, vanno
riprogettate come nuova revisione Alembic (mai modificando direttamente il
file già eseguito, per la convenzione descritta in `CLAUDE.md`).
