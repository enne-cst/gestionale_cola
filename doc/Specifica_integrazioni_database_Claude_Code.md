# Specifica tecnica delle integrazioni e modifiche al database

## Istruzioni operative per Claude Code

**Progetto:** Webbapp  
**Ambito di questo documento:** database PostgreSQL, catalogo generale degli elementi e flusso di presa visione delle modifiche  
**Script di riferimento:**

1. `005_ana_ripartizione_organico_rev.2.sql`
2. `012_ana_variazioni_organico_rev.2.sql`
3. `012_sys_presa_visione_modifiche_rev.2.sql`

## 1. Obiettivo

Claude Code deve integrare nel progetto le strutture descritte nei tre script, adattandole allo schema realmente presente nel repository e correggendo ogni incoerenza rispetto al modello operativo della piattaforma. Gli script allegati costituiscono la specifica funzionale di partenza, ma non devono essere eseguiti in modo meccanico senza prima verificare dipendenze, convenzioni, migrazioni già applicate e strutture esistenti.

L’intervento deve:

- introdurre o aggiornare le tabelle operative e le viste richieste;
- registrare nel catalogo generale tutti gli elementi visualizzati o utilizzati dall’applicazione;
- classificare ogni elemento nella gerarchia corretta;
- associare gli elementi alle certificazioni applicabili e ai settori IAF;
- rendere disponibili descrizioni chiare per il tasto informativo dell’interfaccia;
- distinguere i campi memorizzati dai valori calcolati;
- integrare il flusso di presa visione, approvazione e richiesta di revisione delle modifiche;
- preservare i dati già esistenti e garantire migrazioni ripetibili e sicure.

## 2. Regola architetturale vincolante: catalogo generale

Ogni script relativo a una tabella `ana_*` deve contenere due parti coordinate:

1. **struttura operativa**, comprendente tabella, vincoli, vista, funzioni, trigger e indici necessari;
2. **migrazione nel catalogo generale**, comprendente sezione, voce, campi, descrizioni e associazioni di applicabilità.

La classificazione deve rispettare i ruoli effettivi delle strutture di sistema:

- `sys_elementi` è il catalogo generale. Contiene la gerarchia, il codice stabile, il tipo di elemento, la denominazione, la descrizione, il riferimento a schema/tabella/colonna e lo stato di attivazione;
- `sys_elementi.descrizione` è la fonte da usare per il tasto **Info** dell’interfaccia. Il testo deve spiegare significato, origine, modalità di compilazione, eventuale formula e casi in cui il valore non è disponibile;
- `rel_elementi_certificazioni` associa ciascun elemento a una o più certificazioni e indica, tramite `tutti_settori_iaf`, se è applicabile a tutti i settori IAF;
- qualora l’elemento valga solo per specifici settori IAF, Claude Code deve individuare e utilizzare la tabella relazionale già prevista dal progetto. Non deve inventarne una nuova se nel repository esiste già il meccanismo corretto;
- `001_sys_elementi_certificazioni.sql` è il nome dello script che definisce il sistema generale: non va confuso con il nome di una singola tabella fisica.

La gerarchia minima deve essere:

1. modulo;
2. sezione o sottocategoria;
3. voce funzionale;
4. singolo campo.

Ogni codice di catalogo deve essere stabile, univoco e coerente con il percorso gerarchico. Gli `upsert` devono aggiornare denominazioni, descrizioni e riferimenti tecnici senza creare duplicati. Non devono però eliminare associazioni legittime create da altri moduli o certificazioni.

## 3. Modus operandi obbligatorio per le migrazioni

Prima di modificare il codice, Claude Code deve ispezionare lo schema e le migrazioni esistenti e verificare almeno:

- disponibilità di `gen_random_uuid()` e relativa estensione PostgreSQL;
- esistenza e struttura di `sys_aziende`, `sys_utenti`, `cat_moduli`, `sys_elementi`, `cat_certificazioni`, `rel_elementi_certificazioni` e `ana_dati_generali`;
- presenza dei vincoli univoci necessari agli `ON CONFLICT`;
- esistenza della chiave univoca o primaria composta `(azienda_id, anno_riferimento)` in `ana_dati_generali`;
- convenzioni del progetto per nomi, timestamp, trigger, indici, cancellazioni, Row Level Security e audit;
- meccanismo con cui il modulo Personale consolida e trasferisce i dati annuali;
- ordine reale delle migrazioni e possibile conflitto tra i due file numerati `012`.

`CREATE TABLE IF NOT EXISTS` non modifica una tabella già esistente. Se la tabella è già presente con una struttura incompleta o differente, Claude Code deve produrre una migrazione incrementale con `ALTER TABLE`, backfill dei dati, creazione dei vincoli e successiva applicazione degli eventuali `NOT NULL`. Non sono ammesse eliminazioni o ricreazioni distruttive delle tabelle contenenti dati.

Ogni migrazione deve essere:

- racchiusa in una transazione, quando le operazioni utilizzate lo consentono;
- idempotente o compatibile con il sistema di versionamento già adottato;
- priva di dati aziendali di esempio;
- eseguibile nell’ordine previsto dalle dipendenze;
- accompagnata da commenti SQL utili;
- verificata sia su database vuoto sia su database già popolato.

## 4. Integrazione `ana_ripartizione_organico`

### 4.1 Scopo funzionale

La tabella conserva, per ogni azienda e anno, la fotografia consolidata dell’organico al 31 dicembre. I dati provengono dal modulo Personale e rappresentano la distribuzione per ruolo, genere, cittadinanza, durata del rapporto e titolo di studio.

Deve esistere una sola rilevazione per coppia `(azienda_id, anno_riferimento)`. La rilevazione deve essere collegata alla corrispondente riga di `ana_dati_generali`, che fornisce il totale `numero_addetti` utilizzato come denominatore.

### 4.2 Dati memorizzati

Devono essere memorizzati l’anno di riferimento e i valori numerici relativi a:

- amministrativi;
- project manager;
- tecnici;
- preposti;
- operativi;
- dirigenti della sicurezza;
- uomini e donne;
- italiani e stranieri;
- lavoratori a tempo determinato e indeterminato;
- laureati e diplomati.

I conteggi devono essere maggiori o uguali a zero. Prima di aggiungere vincoli a dati esistenti, Claude Code deve individuare e gestire eventuali valori non validi. Non deve imporre automaticamente l’uguaglianza tra la somma delle categorie e `numero_addetti`: alcune classificazioni possono sovrapporsi o non essere esaustive. Eventuali controlli di quadratura vanno applicati solo se già previsti dalle regole di dominio del progetto.

### 4.3 Valori calcolati

La vista `vw_ana_ripartizione_organico` deve calcolare le 14 percentuali usando:

`valore_categoria * 100 / numero_addetti`

Il risultato deve essere arrotondato a due decimali. Se `numero_addetti` è zero, la percentuale deve essere `NULL`, evitando divisioni per zero. Le percentuali non devono essere duplicate nella tabella operativa e devono essere esposte dall’applicazione come valori di sola lettura.

### 4.4 Catalogazione

Devono essere registrati nel catalogo:

- la sottocategoria `ANAGRAFICA_AZIENDALE.TREND`;
- la voce `ANAGRAFICA_AZIENDALE.TREND.RIPARTIZIONE_ORGANICO`;
- i 15 campi inseriti, comprendendo l’anno e i 14 conteggi;
- i 14 campi percentuali calcolati, collegati alla vista e non alla tabella operativa.

Tutti gli elementi della voce devono essere associati a `ISO_9001` e risultare applicabili a tutti i settori IAF. L’associazione della sezione condivisa `TREND` deve essere gestita senza rimuovere eventuali associazioni ulteriori già presenti.

## 5. Integrazione `ana_variazioni_organico`

### 5.1 Scopo funzionale

La tabella conserva, per ogni azienda e anno, il numero di nuove assunzioni, il numero di cessazioni, l’obiettivo percentuale di variazione e le note. L’organico medio annuo non deve essere duplicato: deve essere letto da `ana_dati_generali`.

Deve esistere una sola rilevazione per `(azienda_id, anno_riferimento)`, collegata alla corrispondente panoramica annuale dei dati generali.

### 5.2 Regole di calcolo

La vista `vw_ana_variazioni_organico` deve esporre:

- l’organico medio annuo corrente;
- la variazione percentuale rispetto all’anno solare precedente;
- lo scostamento tra variazione effettiva e obiettivo.

La variazione deve essere calcolata come:

`(organico_medio_corrente - organico_medio_precedente) * 100 / organico_medio_precedente`

Lo scostamento deve essere:

`variazione_percentuale_effettiva - obiettivo_variazione_percentuale`

Entrambi i risultati devono essere arrotondati a due decimali. Per il primo anno disponibile, in assenza del dato dell’anno solare precedente oppure quando l’organico medio precedente è zero, variazione e scostamento devono essere `NULL`. Claude Code non deve sostituire automaticamente “anno precedente” con “ultima annualità disponibile” senza una diversa regola esplicita.

I numeri di assunzioni e cessazioni devono essere non negativi. L’obiettivo percentuale può essere positivo, nullo o negativo e non deve essere limitato a valori positivi.

### 5.3 Catalogazione

Devono essere registrati:

- la sottocategoria condivisa `ANAGRAFICA_AZIENDALE.TREND`;
- la voce `ANAGRAFICA_AZIENDALE.TREND.VARIAZIONI_ORGANICO`;
- i cinque campi memorizzati: anno, nuove assunzioni, cessazioni, obiettivo e note;
- i tre campi calcolati: organico medio annuo, incremento/decremento percentuale e scostamento.

I campi calcolati devono puntare a `vw_ana_variazioni_organico` ed essere di sola lettura. La voce e i relativi campi devono essere associati a `ISO_9001` e a tutti i settori IAF.

## 6. Integrazione del sistema di presa visione e verifica

### 6.1 Stati

Il catalogo `cat_stati_verifica_modifiche` deve contenere almeno:

- `DA_VERIFICARE`: modifica non ancora valutata;
- `APPROVATO`: modifica verificata e accettata;
- `IN_REVISIONE`: modifica da correggere.

Gli inserimenti devono essere idempotenti e mantenere ordine di visualizzazione e stato di attivazione.

### 6.2 Significato dei timestamp

I timestamp devono avere significati distinti e non ambigui:

- **modifica rilevata:** momento in cui nasce la nuova modifica da sottoporre a controllo;
- **modifica vista:** momento della prima apertura da parte dell’utente incaricato;
- **presa visione:** momento della conferma esplicita dell’utente;
- **stato verifica:** momento dell’ultima variazione dello stato;
- **created/updated:** tracciamento tecnico della riga.

Nello script allegato `modifica_vista_at` è obbligatorio. Questo impedisce di creare preventivamente una riga nello stato `DA_VERIFICARE`. Claude Code deve correggere il modello rendendo il campo nullable e introducendo o riutilizzando un timestamp non nullo per la rilevazione della modifica.

### 6.3 Identificazione delle modifiche successive

Il vincolo univoco attuale `(utente_id, entita, record_id)` rappresenta soltanto lo stato corrente e non distingue due modifiche successive allo stesso record. Claude Code deve prima cercare nel progetto un registro audit o una versione della modifica:

- se esiste, la presa visione deve riferirsi all’identificativo dell’evento o della versione e il vincolo univoco deve includerlo;
- se non esiste e la piattaforma richiede solo lo stato corrente, una nuova modifica dello stesso record deve aggiornare la riga esistente, riportarla a `DA_VERIFICARE`, azzerare `modifica_vista_at`, `presa_visione_at` e `nota_verifica`, e aggiornare il momento di rilevazione;
- se è richiesto lo storico completo, deve essere introdotto un identificativo di evento condiviso e devono essere conservate righe distinte per ogni modifica. Non va eliminato lo storico per adattarsi al vincolo attuale.

La scelta deve essere coerente con il sistema di audit già presente e documentata nel riepilogo finale.

### 6.4 Transizioni e validazioni

Devono essere applicate le seguenti regole:

- l’apertura della modifica valorizza `modifica_vista_at` solo la prima volta;
- la presa visione è un’azione esplicita e valorizza `presa_visione_at`;
- l’approvazione imposta `APPROVATO` e aggiorna `stato_verifica_at`;
- la richiesta di correzione imposta `IN_REVISIONE`, aggiorna `stato_verifica_at` e richiede una nota non vuota;
- una nuova modifica successiva riapre il controllo secondo il modello scelto al punto precedente;
- `updated_at` deve essere aggiornato automaticamente, riutilizzando se possibile la funzione standard già presente nel progetto;
- tenant e utente devono essere ricavati dal contesto autenticato e non accettati ciecamente dal client.

### 6.5 Indici e integrità

Oltre ai vincoli di chiave esterna, Claude Code deve valutare e creare gli indici richiesti dalle interrogazioni reali, almeno per:

- modifiche aperte per azienda e utente;
- stato di verifica;
- ricerca per `entita` e `record_id`;
- ordinamento per momento di rilevazione o aggiornamento.

La politica `ON DELETE` per aziende e utenti deve seguire quella già adottata dal progetto. Il riferimento polimorfico `entita`/`record_id` non è protetto da una normale chiave esterna: validazione dell’entità, autorizzazione e gestione dei record eliminati devono essere esplicitamente implementate.

## 7. Integrazione applicativa richiesta

Il database non deve essere integrato come insieme isolato di tabelle. Claude Code deve individuare e aggiornare i livelli del progetto che consumano questi dati.

### Catalogo e interfaccia dinamica

- Caricare sezioni, voci e campi da `sys_elementi` rispettando `elemento_padre_id`, `attivo` e ordine già previsto dalla piattaforma.
- Filtrare gli elementi in base alle certificazioni possedute dall’azienda e all’applicabilità IAF.
- Mostrare il tasto Info usando `sys_elementi.descrizione`.
- Esporre i campi collegati alle viste come sola lettura.
- Evitare definizioni duplicate e hard-coded nel frontend quando il catalogo è già la fonte autorevole.

### Modulo Personale

- Usare il meccanismo di consolidamento esistente per alimentare i conteggi annuali.
- Non duplicare in `ana_*` dati già autorevolmente conservati in `ana_dati_generali`.
- Rendere l’operazione ripetibile per la stessa azienda e lo stesso anno tramite aggiornamento controllato.
- Garantire che il consolidamento di un anno non modifichi i dati di altre aziende.

### Presa visione

- Generare o riaprire la verifica quando cambia un record soggetto a controllo.
- Restituire all’interfaccia stato, date e nota.
- Prevedere azioni separate per apertura, presa visione, approvazione e invio in revisione.
- Applicare autorizzazioni e isolamento per azienda in ogni query e mutazione.
- Evitare doppie conferme e transizioni concorrenti mediante aggiornamenti atomici.

## 8. Correzioni e verifiche obbligatorie sugli script allegati

Claude Code deve correggere o confermare esplicitamente i seguenti punti:

1. **Numerazione duplicata:** due file usano il prefisso `012`. Se condividono lo stesso runner o namespace di migrazione, uno deve essere rinumerato e tutte le dipendenze devono essere aggiornate.
2. **Migrazioni su schemi esistenti:** sostituire la falsa sicurezza di `IF NOT EXISTS` con migrazioni incrementali quando gli oggetti esistono già ma non corrispondono alla revisione 2.
3. **Transazione dello script di presa visione:** uniformarlo alle migrazioni del progetto e racchiuderlo in transazione se compatibile.
4. **Trigger `updated_at`:** aggiungerlo a `sys_presa_visione_modifiche` o riutilizzare la funzione comune.
5. **Timestamp di visualizzazione:** rendere `modifica_vista_at` nullable e separarlo dal momento di rilevazione.
6. **Modifiche ripetute:** definire il modello di versione/evento oppure il reset atomico dello stato corrente.
7. **Vincoli sui conteggi:** impedire valori negativi nelle due tabelle `ana_*`, dopo aver sanato eventuali dati preesistenti.
8. **Campi derivati:** mantenerli esclusivamente nelle viste e marcarli come non modificabili nel livello applicativo.
9. **Catalogo:** verificare che ogni colonna funzionale e ogni campo calcolato abbia un elemento con codice, descrizione e riferimento tecnico corretti.
10. **Associazioni:** verificare `ISO_9001`, `tutti_settori_iaf = TRUE` e l’assenza di associazioni stale o duplicate, senza cancellare associazioni valide di altre funzionalità.
11. **Dipendenze e indici:** verificare estensione UUID, chiavi referenziate, indici di consultazione e politiche di cancellazione.
12. **Sicurezza multi-tenant:** tutte le letture e scritture devono essere limitate all’azienda autorizzata; applicare RLS se è il modello già usato dal progetto.

## 9. Ordine di implementazione

1. Analizzare repository, migrazioni, schema effettivo e flussi applicativi.
2. Risolvere numerazione e ordine delle migrazioni.
3. Verificare prerequisiti e chiavi delle tabelle di sistema.
4. Correggere e applicare il sistema di presa visione.
5. Creare o aggiornare `ana_ripartizione_organico` e la relativa vista.
6. Creare o aggiornare `ana_variazioni_organico` e la relativa vista.
7. Registrare gerarchia, voci e campi in `sys_elementi`.
8. Registrare le associazioni in `rel_elementi_certificazioni` e nelle relazioni IAF specifiche, se necessarie.
9. Integrare servizi, API, autorizzazioni e interfaccia.
10. Eseguire test automatici, test di migrazione e verifica manuale del flusso.

## 10. Criteri di accettazione

L’intervento è completato solo quando risultano verificati tutti i seguenti criteri:

- gli script si applicano senza errori su un database vuoto;
- l’aggiornamento da una versione precedente preserva tutti i dati;
- una seconda esecuzione non crea duplicati né altera dati aziendali;
- per ogni azienda e anno esiste al massimo una riga nelle due tabelle `ana_*`;
- le viste restituiscono percentuali e scostamenti corretti;
- i casi con denominatore zero o anno precedente assente restituiscono `NULL`;
- nessun conteggio negativo è accettato;
- tutti i campi risultano censiti nella gerarchia corretta di `sys_elementi`;
- il tasto Info mostra le descrizioni del catalogo;
- gli elementi sono visibili solo alle aziende con certificazione e settore IAF compatibili;
- i campi derivati non sono modificabili;
- una modifica genera o riapre correttamente una verifica;
- apertura, presa visione, approvazione e revisione producono timestamp e stati coerenti;
- `IN_REVISIONE` non può essere salvato senza nota;
- due utenti o aziende non possono accedere reciprocamente alle proprie verifiche;
- le operazioni concorrenti non generano righe duplicate o perdita dello stato;
- i test e i controlli statici previsti dal repository risultano superati.

## 11. Output richiesto a Claude Code

Al termine Claude Code deve consegnare:

1. le migrazioni corrette, mantenendo lo stile del repository;
2. gli adeguamenti a servizi, API e interfaccia necessari all’integrazione;
3. i test automatici e di migrazione;
4. un riepilogo dei file modificati;
5. le decisioni assunte sui punti ambigui, in particolare storico delle modifiche, numerazione delle migrazioni e associazioni IAF;
6. l’elenco di eventuali anomalie preesistenti non correggibili senza una decisione funzionale;
7. le istruzioni di applicazione e, se previsto dal progetto, di rollback.
