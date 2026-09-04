# MODULO PERSONALE — SPECIFICA MASTER DI IMPLEMENTAZIONE

## Documento di accompagnamento per Claude Code

**Revisione:** 2  
**Data di consolidamento:** 3 settembre 2026  
**Riferimento grafico:** PERSONALE_PROTOTIPO_INTERATTIVO.html, versione 9  
**Destinatario:** agente incaricato di integrare il modulo nella piattaforma Webbapp esistente  
**Stato:** specifica funzionale e tecnica vincolante

---

# 1. FINALITÀ DEL DOCUMENTO

Questo documento descrive in modo completo come tradurre il prototipo interattivo del modulo Personale nella piattaforma reale.

Il prototipo HTML è un riferimento visivo e comportamentale. I dati presenti nel prototipo sono dimostrativi e non devono essere copiati nel database di produzione. Le funzioni JavaScript presenti nel file simulano soltanto i flussi e non costituiscono l’architettura da riutilizzare.

Questa specifica è vincolante per:

- significato delle informazioni;
- collocazione di ogni funzione;
- proprietà e origine dei dati;
- separazione tra cataloghi, configurazioni aziendali e registrazioni individuali;
- regole di ereditarietà;
- stato delle registrazioni;
- calcoli aggregati;
- autorizzazioni;
- privacy;
- audit;
- contratti API;
- casi limite;
- criteri di accettazione;
- procedura da seguire prima di proporre modifiche al database.

Claude Code non deve realizzare una pagina separata, un iframe, una demo autonoma o un secondo progetto. Deve integrare la funzione nel repository esistente, utilizzando stack, router, componenti, servizi, modelli, autorizzazioni e convenzioni già presenti.

---

# 2. ORDINE DI PREVALENZA DELLE FONTI

In caso di dubbio usare questo ordine:

1. decisioni consolidate in questo documento;
2. prototipo HTML per layout, densità, gerarchia visiva e interazioni;
3. schema e convenzioni effettivamente presenti nel repository;
4. documentazione precedente, soltanto se non contraddice i primi tre punti.

Quando il prototipo contiene un residuo tecnico non più raggiungibile dall’interfaccia, non implementarlo. In particolare, il vecchio gestore generico dei profili base presente nel JavaScript dimostrativo è superato: le voci base di un ruolo si gestiscono aprendo il ruolo nella sezione Ruoli.

Se il repository possiede già un’entità semanticamente equivalente a quella descritta qui, riutilizzarla. I nomi di tabelle e endpoint contenuti nel documento sono nomi logici consigliati, non autorizzano la creazione automatica di nuove strutture.

---

# 3. DECISIONI DEFINITIVE E FUNZIONI ESCLUSE

## 3.1 Struttura definitiva

Le viste principali del modulo sono:

1. Persone;
2. Monitoraggio personale;
3. Scadenziario;
4. Analisi formazione.

I tab della singola persona sono:

1. Panoramica;
2. Persona e rapporto;
3. Ruoli;
4. Formazione e abilitazioni;
5. Idoneità sanitaria;
6. Competenze;
7. Note.

## 3.2 Decisioni consolidate

- Formazione e abilitazioni appartengono allo stesso tab e alla stessa card operativa.
- Le attività pianificate non vengono replicate nel tab Formazione e abilitazioni: sono gestite nello Scadenziario.
- Lo storico delle ore formative è disponibile, ma chiuso per impostazione predefinita.
- I macrovalori da mostrare sono esclusivamente Conoscenza, Competenza e Consapevolezza.
- Il dettaglio di un macrovalore si apre nella pagina ed è collegato visivamente alla card selezionata; non usa un popup.
- Le voci base di valutazione collegate a un ruolo vengono configurate dalla sezione Ruoli.
- Le persone ereditano le voci applicabili; nella persona si valutano le voci, si aggiungono eccezioni personali e si nascondono quelle non pertinenti.
- Ogni ruolo può avere un mansionario aziendale.
- Il mansionario appartiene alla configurazione del ruolo, non alla singola assegnazione della persona.
- Titoli di studio occupa tutta la larghezza disponibile.
- Esperienze rilevanti resta chiuso per impostazione predefinita.
- Piano di sviluppo è eliminato.
- Attività collegate è eliminato dalla sezione Note.
- Il compositore di una nuova nota non è visibile finché non si preme Nuova nota.
- Monitoraggio personale contiene KPI, grafico della situazione complessiva e matrice.
- Lo Scadenziario è l’unico luogo operativo per scadenze e attività pianificate.
- Il collegamento con Google Calendar è futuro: predisporre il dominio senza attivare ora una sincronizzazione fittizia.

## 3.3 Funzioni da non implementare in questa versione

- assegnazione di mezzi o attrezzature a una specifica abilitazione;
- riquadro Mezzi autorizzati;
- provenienza dell’abilitazione come blocco grafico autonomo;
- requisiti della mansione mostrati nel tab Abilitazioni;
- motore automatico che deduce obblighi normativi dalla sola mansione;
- percentuali di copertura di requisiti non formalmente configurati;
- caratteristiche avanzate dell’incarico come potere di spesa o potere decisionale nella scheda persona;
- card Ultime valutazioni, perché duplica i tre macroindicatori;
- card Piano di sviluppo;
- pannello Attività collegate nelle Note;
- pannello Segnalazioni automatiche nel Monitoraggio;
- secondo riepilogo dei successivi 90 giorni nel Monitoraggio;
- secondo grafico che duplica KPI o matrice;
- editor del profilo base dentro la scheda della persona;
- dati paghe, retribuzione, IBAN o informazioni da cedolino;
- diagnosi e dati sanitari non necessari.

---

# 4. PROCEDURA OBBLIGATORIA PRIMA DI SCRIVERE CODICE

## 4.1 Audit del repository

Prima di modificare qualunque file Claude deve individuare:

- struttura frontend del modulo;
- struttura backend;
- router e convenzioni URL;
- modelli SQLAlchemy;
- migrazioni Alembic;
- servizi e repository;
- cataloghi esistenti;
- tabelle persona, rapporto, ruoli, mansioni e reparti;
- sistema allegati;
- sistema autorizzazioni;
- tenant context;
- audit log;
- scadenziario generale;
- job e notifiche;
- componenti UI riutilizzabili;
- convenzioni di gestione errori;
- meccanismi di concorrenza ottimistica;
- test esistenti.

La ricerca deve includere almeno i concetti:

- persona;
- rapporto aziendale;
- mansione;
- reparto;
- ruolo;
- incarico;
- caratteristica incarico;
- mansionario;
- formazione;
- corso;
- attestato;
- abilitazione;
- idoneità;
- visita;
- competenza;
- valutazione;
- titolo di studio;
- esperienza;
- nota;
- attività pianificata;
- scadenza;
- allegato;
- audit.

## 4.2 File di database già noti

Nel progetto sono già esistiti o sono stati discussi file relativi a:

- catalogo ruoli;
- catalogo caratteristiche dell’incarico;
- relazione ruoli-caratteristiche;
- persone;
- rapporti aziendali;
- titoli di studio;
- cataloghi dei titoli.

Claude deve cercare le versioni realmente presenti e non dedurre nomi o revisioni dalla conversazione. I file precedentemente citati, come 002_cat_ruoli, 003_cat_caratteristiche_incarico e 004_rel_ruoli_caratteristiche, sono indizi di ricerca, non una garanzia che la versione corrente abbia lo stesso nome o schema.

## 4.3 Matrice di corrispondenza obbligatoria

Prima dell’implementazione Claude deve produrre una tabella:

| Capacità richiesta | Entità esistente | Campi riutilizzati | Gap | Azione proposta |
|---|---|---|---|---|
| Anagrafica persona | da verificare | da verificare | da verificare | riuso/adattamento |
| Rapporto aziendale | da verificare | da verificare | da verificare | riuso/adattamento |
| Assegnazione ruolo | da verificare | da verificare | da verificare | riuso/adattamento |
| Mansionario ruolo | da verificare | da verificare | da verificare | riuso/estensione |
| Voci base del ruolo | da verificare | da verificare | da verificare | riuso/estensione |
| Valutazioni personali | da verificare | da verificare | da verificare | riuso/estensione |
| Formazione | da verificare | da verificare | da verificare | riuso/adattamento |
| Abilitazioni | da verificare | da verificare | da verificare | riuso/adattamento |
| Idoneità sanitaria | da verificare | da verificare | da verificare | riuso/adattamento |
| Note | da verificare | da verificare | da verificare | riuso/adattamento |
| Scadenziario | da verificare | da verificare | da verificare | riuso/adattamento |

## 4.4 Regola sul database

Claude non deve creare tabelle, colonne, enum, trigger o migrazioni senza conferma esplicita.

Quando manca una capacità deve:

1. descrivere la capacità mancante;
2. spiegare perché le strutture esistenti non sono sufficienti;
3. proporre la modifica minima;
4. indicare tabelle e campi interessati;
5. spiegare migrazione dati e rollback;
6. indicare impatto su API e frontend;
7. attendere conferma.

Sono vietati:

- tabelle duplicate;
- campi JSON usati per evitare una corretta modellazione relazionale;
- enum duplicati con significato equivalente;
- nuovi cataloghi quando ne esiste già uno estendibile;
- seed dimostrativi in produzione;
- migrazioni distruttive non approvate;
- modifiche fuori dal modulo necessarie soltanto per semplificare l’implementazione.

---

# 5. PRINCIPI DI DOMINIO

## 5.1 Separazioni fondamentali

| Concetto | Significato |
|---|---|
| Persona | identità anagrafica |
| Rapporto aziendale | relazione temporale tra persona e azienda |
| Mansione | attività professionale ordinaria svolta dalla persona |
| Ruolo | responsabilità formale o organizzativa aggiuntiva |
| Assegnazione ruolo | relazione tra persona, ruolo, ambito e periodo |
| Mansionario | definizione aziendale di scopo, compiti, responsabilità e autorità del ruolo |
| Voce base di valutazione | elemento di Conoscenza, Competenza o Consapevolezza ereditabile |
| Valutazione | rilevazione storica del livello di una persona su una voce |
| Formazione | corso o attività formativa svolta |
| Abilitazione | titolo o capacità formalmente riconosciuta |
| Idoneità sanitaria | giudizio sintetico utilizzabile dall’azienda |
| Attività pianificata | evento futuro nello Scadenziario |
| Scadenza | data derivata da una registrazione sorgente |
| Nota | annotazione contestuale priva di effetti automatici |

## 5.2 Mansione, mansionario e ruolo

I termini non sono intercambiabili:

- la mansione appartiene al rapporto della persona;
- il ruolo appartiene al catalogo/configurazione organizzativa;
- il mansionario descritto in questa revisione appartiene al ruolo;
- l’assegnazione collega una persona al ruolo, ma non contiene una copia del mansionario.

Una stessa persona può avere:

- una mansione corrente;
- più ruoli contemporanei;
- voci di valutazione ereditate dalla mansione;
- voci ereditate dai ruoli;
- eventuali voci generali aziendali;
- voci personali.

## 5.3 Proprietà del dato

Ogni informazione mostrata deve avere una fonte autorevole:

| Informazione | Proprietario logico |
|---|---|
| Nome, cognome, CF | anagrafica persona |
| Mansione e reparto | rapporto aziendale corrente |
| Ruolo societario | fonte CCIAA |
| Ruolo manuale | assegnazione aziendale |
| Mansionario | configurazione aziendale del ruolo |
| Voci base del ruolo | configurazione aziendale del ruolo |
| Valutazione | registrazione storica della persona |
| Corso svolto | registrazione formazione |
| Abilitazione | registrazione abilitazione |
| Giudizio | registrazione sanitaria protetta |
| Scadenza | registrazione sorgente, proiettata nello Scadenziario |
| Nota | autore della nota e azienda |

Le viste aggregate non diventano nuove fonti. KPI, Panoramica, matrice e Scadenziario leggono le registrazioni originali.

---

# 6. MULTI-TENANCY, AUTORIZZAZIONI E AUDIT

## 6.1 Tenant isolation

Ogni query deve essere vincolata all’azienda attiva. Non è sufficiente filtrare nel frontend.

Per qualunque identificativo ricevuto dall’API il backend deve verificare:

- appartenenza dell’oggetto all’azienda;
- appartenenza della persona all’azienda;
- validità della relazione utente-azienda;
- permesso richiesto;
- eventuale livello di riservatezza.

Un identificativo valido di un’altra azienda deve produrre una risposta non rivelatrice, coerente con le convenzioni di sicurezza del progetto.

## 6.2 Permessi granulari consigliati

Riutilizzare il sistema esistente. Se mancano permessi equivalenti, proporre:

| Permesso | Capacità |
|---|---|
| personale.read | consultare anagrafica e dati ordinari |
| personale.write | modificare persona e rapporto |
| personale.roles.read | consultare ruoli e mansionari |
| personale.roles.assign | assegnare, modificare o cessare incarichi |
| personale.roles.configure | modificare mansionari e voci base |
| personale.training.read/write | formazione e abilitazioni |
| personale.health.read/write | dati sanitari protetti |
| personale.skills.read/evaluate | consultare o valutare macroaree |
| personale.skills.configure | gestire fonti base |
| personale.notes.read/write | note secondo visibilità |
| personale.monitor.read | monitoraggio e matrice |
| personale.schedule.read/write | scadenze e pianificazione |
| personale.analytics.read | analisi formazione |

Non associare automaticamente questi permessi ai ruoli utente senza verificare la matrice autorizzativa reale.

## 6.3 Audit minimo

Registrare almeno:

- creazione e modifica della persona;
- apertura/chiusura di un rapporto;
- assegnazione, modifica e cessazione di un ruolo;
- modifica del mansionario;
- aggiunta, modifica o disattivazione di una voce base;
- aggiunta/nascondimento/ripristino di una voce individuale;
- registrazione di una valutazione;
- formazione, abilitazione e idoneità;
- caricamento/sostituzione di un documento;
- creazione/modifica/cancellazione di una nota;
- pianificazione e modifica di un’attività;
- accesso o download di documenti sanitari se il sistema prevede audit di lettura.

Ogni evento deve contenere azienda, oggetto, utente, timestamp, operazione e differenze prima/dopo secondo le convenzioni del progetto.

---

# 7. STATI, COLORI E CALCOLI

## 7.1 Stati canonici

Riutilizzare gli enum esistenti quando equivalenti.

| Stato logico | Significato | Colore |
|---|---|---|
| VALID | registrazione presente e valida | verde |
| EXPIRING | valida ma entro la soglia di preavviso | arancione |
| EXPIRED | data di scadenza superata | rosso |
| INCOMPLETE | registrazione presente ma inutilizzabile per dato essenziale mancante | arancione |
| PLANNED | attività futura non ancora completata | blu |
| NO_DATA | nessuna registrazione disponibile | grigio |
| NOT_APPLICABLE | elemento esplicitamente non applicabile | grigio neutro, non conteggiato |
| ARCHIVED | record storico non corrente | neutro |

Il colore non viene salvato nel database.

NO_DATA non significa automaticamente non conformità. EXPIRED può derivare soltanto da una registrazione con data superata o da una regola esplicita già configurata.

## 7.2 Precedenza aggregata

Per una categoria:

1. EXPIRED;
2. INCOMPLETE o EXPIRING;
3. PLANNED;
4. VALID;
5. NO_DATA.

Una registrazione scaduta con rinnovo pianificato resta rossa; la pianificazione viene mostrata come informazione secondaria.

## 7.3 Percentuale della persona

La percentuale della Panoramica descrive soltanto le registrazioni presenti:

    percentuale = registrazioni VALID / registrazioni presenti e monitorate × 100

Escludere dal denominatore:

- NO_DATA;
- NOT_APPLICABLE;
- record archiviati;
- attività soltanto pianificate;
- requisiti teorici non configurati.

Il prototipo mostra 10 registrazioni valide su 14 presenti, pari al 71 per cento. Il risultato non è una certificazione normativa.

## 7.4 Situazione complessiva del personale

La classificazione organizzativa usa categorie mutuamente esclusive:

- Regolare: almeno un dato monitorato e nessuna registrazione scaduta, incompleta o in scadenza;
- In attenzione: almeno una registrazione in scadenza o incompleta e nessuna scaduta;
- Da gestire: almeno una registrazione scaduta;
- Nessun dato: nessuna registrazione monitorabile presente.

La percentuale complessiva è:

    persone regolari / persone attive × 100

Il prototipo mostra 63 persone regolari su 87, pari al 72 per cento. Anche questo dato descrive soltanto il database.

## 7.5 Data di riferimento

Tutte le API aggregate devono accettare o derivare una data di riferimento coerente. La stessa data deve alimentare:

- KPI;
- Panoramica;
- matrice;
- Scadenziario;
- analisi.

Usare il fuso orario aziendale. Per l’attuale contesto visuale il riferimento è Europe/Rome.

# 8. ARCHITETTURA DELL’INTERFACCIA

## 8.1 Navigazione principale

Rappresentare vista, persona, tab e layout nell’URL o nello stato di routing persistente:

    /aziende/:aziendaId/personale?view=people
    /aziende/:aziendaId/personale?view=people&personId=:id&tab=roles&layout=split
    /aziende/:aziendaId/personale?view=control
    /aziende/:aziendaId/personale?view=schedule&mode=list
    /aziende/:aziendaId/personale?view=analytics

Conservare:

- ricerca;
- filtri;
- ordinamento;
- pagina;
- persona selezionata;
- tab interno;
- layout affiancato o a tutta larghezza;
- modalità elenco/calendario dello Scadenziario.

## 8.2 Comportamento laptop-first

A 1366 × 768 e 1440 × 900:

- non deve comparire scroll orizzontale dell’intera pagina;
- lo scroll orizzontale è ammesso dentro tabelle realmente più larghe;
- header e tab della persona restano visibili durante la consultazione;
- le azioni principali devono essere raggiungibili senza scroll eccessivo;
- le informazioni secondarie sono collassate;
- non mostrare contemporaneamente consultazione, modifica e configurazione.

### Nessuna persona selezionata

L’elenco persone occupa tutta la larghezza.

### Persona selezionata

L’elenco completo scompare. A sinistra rimane una colonna compatta con:

- titolo Persone;
- Torna all’anagrafica;
- ricerca;
- avatar e nome;
- evidenza della persona selezionata.

Non inserire nella colonna laterale mansione, reparto, ruoli, date o indicatori.

### Dettaglio a tutta larghezza

Il comando A tutta larghezza nasconde la colonna laterale. Il comando Affianca elenco la ripristina senza cambiare persona o tab.

## 8.3 Aperture progressive

Usare:

- card inline per dettaglio dei macrovalori;
- card inline per configurazione del ruolo;
- blocchi details/collassabili per dossier, storico ore ed esperienze;
- finestre modali soltanto per creazioni o registrazioni con form autonomo.

Evitare popup per informazioni strettamente collegate all’elemento selezionato.

## 8.4 Stato non salvato

Quando un form ha modifiche:

- impostare dirty state al primo cambiamento;
- intercettare cambio tab, persona, vista, chiusura e navigazione;
- mostrare Continua a modificare, Esci senza salvare, Salva ed esci;
- non mostrare dati della persona precedente dopo un cambio;
- usare concorrenza ottimistica se supportata.

---

# 9. VISTA PERSONE

## 9.1 Composizione

- titolo Anagrafica persone;
- totale persone;
- Nuova persona;
- ricerca;
- filtro reparto;
- filtro mansione;
- filtro ruolo;
- filtro stato rapporto;
- legenda;
- tabella;
- paginazione server-side.

## 9.2 Colonne

| Colonna | Fonte | Regola |
|---|---|---|
| Persona | anagrafica | avatar, nome e cognome |
| Mansione/reparto | rapporto corrente | due righe nella stessa cella |
| Ruoli principali | incarichi correnti | badge; eccedenza sintetizzata |
| Stato rapporto | rapporto | non confondere con stato registrazioni |
| Data assunzione | rapporto | data di inizio principale |
| Stato registrazioni | aggregato | conteggi verde, arancione e rosso |
| Apertura | UI | freccia o intera riga |

Il grigio non va contato nella colonna sintetica, ma può essere spiegato nella legenda o nel dettaglio.

## 9.3 Ricerca e filtri

La ricerca copre:

- nome;
- cognome;
- codice fiscale, se autorizzato;
- mansione;
- reparto;
- ruoli.

I filtri sono combinabili. L’ordinamento e la paginazione devono avvenire sul backend quando il dataset non è interamente caricato.

## 9.4 Nuova persona

Il form iniziale contiene soltanto:

### Dati essenziali

- nome obbligatorio;
- cognome obbligatorio;
- codice fiscale;
- email;
- telefono.

### Primo rapporto

- tipo rapporto obbligatorio;
- data inizio obbligatoria;
- stato obbligatorio;
- mansione obbligatoria;
- reparto obbligatorio;
- note iniziali facoltative.

Gli altri dati si completano nel dossier. La creazione di persona e primo rapporto deve essere atomica.

## 9.5 API indicativa

    GET  /api/v1/aziende/{azienda_id}/personale/persone
    POST /api/v1/aziende/{azienda_id}/personale/persone

Parametri elenco:

    q, reparto_id, mansione_id, ruolo_id, stato_rapporto,
    sort, direction, page, page_size, data_riferimento

La risposta di elenco deve contenere gli aggregati necessari senza N+1.

---

# 10. SHELL E HEADER DELLA PERSONA

## 10.1 Header

Mostrare:

- avatar;
- nome e cognome;
- badge Rapporto attivo o stato equivalente;
- mansione;
- reparto;
- A tutta larghezza/Affianca elenco;
- chiusura della scheda.

## 10.2 Cambio persona

Quando cambia persona:

- mantenere attiva la stessa vista soltanto se semanticamente valida; il prototipo torna alla Panoramica dalla colonna laterale;
- cancellare o ignorare richieste precedenti;
- mostrare skeleton nel pannello destro;
- non riutilizzare dati del profilo precedente;
- spostare il focus in modo accessibile.

## 10.3 Caricamento ed errori

Ogni tab deve avere:

- loading state;
- empty state;
- error state contestuale;
- Riprova;
- nessuna chiusura forzata dell’elenco laterale.

Non caricare tutte le tabelle della persona all’apertura. Panoramica usa un endpoint aggregato; gli altri tab caricano dati su richiesta.

---

# 11. PANORAMICA DELLA PERSONA

## 11.1 Quattro card superiori

La fascia superiore è composta da quattro card indipendenti ma uniformi:

1. Stato degli elementi monitorati con grafico circolare;
2. In scadenza;
3. Scaduto;
4. Attività pianificata.

Le tre card numeriche hanno:

- stessa larghezza;
- stessa altezza;
- stesso padding;
- contenuto centrato;
- medesimo trattamento di bordo e ombra.

La card principale può essere più larga. A 980 px occupa la prima riga; le altre tre restano simmetriche sotto. A 720 px le card vanno in colonna.

Non aggiungere una riga testuale che ripeta i tre contatori.

## 11.2 Azioni

| Card | Destinazione |
|---|---|
| Stato elementi monitorati | Monitoraggio filtrato sulla persona |
| In scadenza | Scadenziario filtrato sulla persona |
| Scaduto | prima categoria contenente il record scaduto o vista filtrata |
| Attività pianificata | Scadenziario filtrato sulla persona e stato pianificato |

La navigazione deve usare identificativi e filtri strutturati, non testi visibili.

## 11.3 Prossime scadenze

La card mostra un numero limitato di eventi:

- titolo;
- categoria;
- data;
- stato.

Ordinamento:

1. scadute, dalla più recente alla meno recente;
2. future, dalla più vicina.

Il click apre la registrazione sorgente:

- formazione o abilitazione → tab Formazione e abilitazioni;
- visita → Idoneità sanitaria;
- valutazione → Competenze;
- incarico → Ruoli.

## 11.4 Ruoli assegnati

Questa card ha sostituito la vecchia card Elementi monitorati.

Mostrare:

- ruolo;
- fonte;
- data iniziale;
- stato;
- situazione del documento.

Il comando Gestisci ruoli apre il tab Ruoli. Le informazioni sono sintesi delle assegnazioni originali e non record duplicati.

## 11.5 Contratto dati

    GET /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/panoramica

Risposta logica:

~~~json
{
  "persona": {},
  "rapporto_corrente": {},
  "indicatori": {
    "registrazioni_presenti": 14,
    "registrazioni_valide": 10,
    "percentuale_valide": 71,
    "in_scadenza": 2,
    "scadute": 1,
    "pianificate": 1
  },
  "prossime_scadenze": [],
  "ruoli_attivi": []
}
~~~

Ogni scadenza deve includere source_type, source_id, target_tab e permission_required.

---

# 12. PERSONA E RAPPORTO

## 12.1 Dati essenziali sempre visibili

| Campo | Regola |
|---|---|
| Nome | obbligatorio |
| Cognome | obbligatorio |
| Codice fiscale | normalizzato; unicità secondo modello multi-azienda esistente |
| Telefono | facoltativo |
| Email | facoltativa e validata |

Nome, cognome e codice fiscale mostrati in altre viste provengono sempre dalla stessa anagrafica.

## 12.2 Rapporto corrente

- tipo rapporto;
- data inizio;
- mansione;
- reparto;
- stato.

La card è una sintesi del rapporto corrente. Lo storico non deve essere sovrascritto quando cambia mansione, reparto o tipologia: chiudere il periodo precedente e aprire il nuovo secondo il modello esistente.

## 12.3 Dossier personale collassato

Il Dossier personale è chiuso all’apertura.

### Anagrafica completa

- matricola interna;
- data di nascita;
- luogo;
- provincia;
- Stato di nascita;
- sesso secondo catalogo reale;
- cittadinanza;
- eventuale fotografia se supportata;
- stato di completezza calcolato, non digitato.

### Residenza e domicilio

- indirizzo;
- CAP;
- comune;
- provincia;
- Stato se richiesto;
- indicazione domicilio uguale alla residenza;
- domicilio alternativo visibile soltanto se diverso.

### Contatti

- telefono personale;
- email personale;
- email aziendale se distinta;
- nominativo contatto di emergenza;
- relazione;
- telefono emergenza.

### Lingua e comprensione

- lingua madre;
- comprensione italiana: adeguata, parziale, da verificare, non adeguata;
- supporto linguistico necessario: sì/no;
- altre lingue;
- note facoltative.

Questi campi supportano formazione e istruzioni. Non generano giudizi sanitari o discriminatori.

### Documenti personali

- tipo documento;
- numero;
- scadenza;
- allegato;
- permesso di soggiorno quando applicabile;
- distinzione tra assente, non applicabile, presente e verificato.

### Dettagli contrattuali

- durata: indeterminato, determinato, collaborazione, amministratore, altro;
- data fine prevista soltanto per rapporti a termine;
- tempo pieno/parziale;
- percentuale part-time soltanto se parziale;
- CCNL;
- livello/inquadramento.

Non inserire retribuzione, IBAN o dati da cedolino.

## 12.4 Modifica

La vista nasce in consultazione. Modifica dati attiva un unico form. Il backend deve validare anche le condizioni:

- data nascita non futura;
- data fine rapporto non precedente all’inizio;
- percentuale part-time compresa nell’intervallo consentito;
- data fine prevista obbligatoria quando il rapporto è a termine;
- domicilio alternativo coerente con il flag;
- valori di catalogo realmente attivi.

## 12.5 API

    GET   /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/profilo
    PATCH /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/profilo
    GET   /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/rapporti

L’aggiornamento con dati di persona e rapporto deve essere transazionale.

---

# 13. RUOLI, MANSIONARI E VOCI BASE

## 13.1 Tabella delle assegnazioni

| Colonna | Regola |
|---|---|
| Ruolo | ruolo del catalogo; apre la configurazione |
| Ambito | governance, sicurezza, qualità, ambiente, organizzazione o altro catalogato |
| Fonte | CCIAA oppure Azienda |
| Data inizio | inizio incarico |
| Data fine | nulla se corrente |
| Stato | pianificato, attivo, sospeso, cessato |
| Documentazione | presente, da integrare o dato importato |
| Azione | unico menu/apertura; evitare molti pulsanti |

Non mostrare:

- percentuali;
- coperture;
- stato delle registrazioni collegate;
- anteprime di formazione;
- caratteristiche avanzate;
- potere di spesa;
- potere decisionale.

## 13.2 Fonte CCIAA

Un incarico proveniente dalla CCIAA:

- è in sola lettura nella sua assegnazione;
- rimanda alla fonte societaria per correzioni;
- può comunque aprire la configurazione aziendale del ruolo;
- non impedisce di definire un mansionario operativo.

Questa distinzione è essenziale: la fonte CCIAA governa chi ricopre il ruolo, non il contenuto del mansionario aziendale.

## 13.3 Assegna ruolo

Il form contiene:

- ruolo obbligatorio;
- ambito;
- data inizio obbligatoria;
- data fine;
- documento facoltativo;
- note.

Validazioni:

- data fine non precedente all’inizio;
- ruolo attivo nel catalogo;
- persona e ruolo appartenenti all’azienda/configurazione ammessa;
- controllo sovrapposizioni secondo cardinalità del ruolo;
- nessuna modifica indiretta ai record CCIAA.

## 13.4 Apertura del ruolo

Il click sul nome o sull’unica azione apre una card inline sotto la tabella. La riga selezionata viene evidenziata.

La card contiene due tab:

1. Mansionario;
2. Conoscenza, competenza e consapevolezza.

La card mostra sempre:

- nome del ruolo;
- ambito;
- fonte dell’assegnazione;
- avviso che la configurazione è condivisa;
- chiusura.

Non aprire un popup: il contenuto è contestuale alla tabella.

## 13.5 Mansionario del ruolo

Il mansionario è configurato una sola volta per azienda e ruolo. Tutte le persone che ricoprono quel ruolo lo richiamano.

Campi:

| Sezione | Tipo | Regola |
|---|---|---|
| Scopo del ruolo | testo lungo singolo | obbligatorio per mansionario completo |
| Attività e compiti | elenco ordinato | una voce per riga |
| Responsabilità | elenco ordinato | una voce per riga |
| Autorità e autonomia | elenco ordinato | una voce per riga |
| Riporta a | testo o relazione organizzativa | riusare organigramma se disponibile |
| Collabora con | testo o relazioni multiple | non duplicare organigramma |

In consultazione mostrare:

- scopo a tutta larghezza;
- tre blocchi simmetrici;
- relazioni organizzative in fondo.

Il pulsante Modifica mansionario attiva un solo form. Al salvataggio:

1. validare;
2. aggiornare la configurazione del ruolo;
3. registrare audit;
4. invalidare cache;
5. non creare copie sulle persone;
6. non alterare lo storico delle assegnazioni.

Se la piattaforma gestisce documenti approvati o firmati, valutare versionamento formale. In assenza di tale funzione, updated_at e audit devono comunque conservare la tracciabilità.

## 13.6 Voci base del ruolo

Nel secondo tab si definiscono le voci che il ruolo apporta al profilo individuale:

- Conoscenza;
- Competenza;
- Consapevolezza.

Ogni voce contiene:

- identificativo stabile;
- macroarea;
- nome;
- descrizione;
- stato attivo;
- ordine;
- eventuale validità temporale;
- azienda;
- ruolo di origine.

L’interfaccia mostra tre pannelli. Un solo comando Aggiungi voce base apre un form inline con:

- macroarea;
- nome obbligatorio;
- descrizione.

Non assegnare qui un livello alla persona. Questa sezione configura cosa valutare, non esegue la valutazione.

## 13.7 Ruolo globale e configurazione aziendale

Separare:

- catalogo globale del ruolo;
- attivazione/configurazione del ruolo per l’azienda;
- mansionario aziendale;
- voci base aziendali;
- assegnazioni individuali.

Il nome canonico Datore di Lavoro può appartenere al catalogo globale, mentre il mansionario della società A non deve essere visibile o modificabile dalla società B.

## 13.8 Effetti delle modifiche

### Aggiunta di una voce base

- diventa applicabile a tutte le persone con incarico attivo;
- compare come non valutata finché non viene valutata;
- non crea una valutazione automatica;
- aggiorna macroindicatori e matrice.

### Disattivazione di una voce base

- non viene più ereditata da quella fonte per il futuro;
- le valutazioni storiche restano;
- se la stessa voce proviene da un’altra fonte rimane attiva;
- non cancellare righe individuali.

### Cessazione del ruolo

- le voci esclusivamente provenienti dal ruolo cessano di essere applicabili;
- le voci con altre fonti rimangono;
- lo storico resta consultabile;
- il mansionario del ruolo non viene eliminato.

## 13.9 API indicative

    GET   /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/ruoli
    POST  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/ruoli
    PATCH /api/v1/aziende/{azienda_id}/personale/incarichi/{incarico_id}
    POST  /api/v1/aziende/{azienda_id}/personale/incarichi/{incarico_id}/cessazione

    GET   /api/v1/aziende/{azienda_id}/personale/ruoli/{ruolo_id}/configurazione
    PATCH /api/v1/aziende/{azienda_id}/personale/ruoli/{ruolo_id}/mansionario
    GET   /api/v1/aziende/{azienda_id}/personale/ruoli/{ruolo_id}/voci-valutazione
    POST  /api/v1/aziende/{azienda_id}/personale/ruoli/{ruolo_id}/voci-valutazione
    PATCH /api/v1/aziende/{azienda_id}/personale/ruoli/{ruolo_id}/voci-valutazione/{relazione_id}

---

# 14. FORMAZIONE E ABILITAZIONI

## 14.1 Unica sezione

Formazione e abilitazioni condividono:

- un tab;
- una card;
- KPI;
- ricerca;
- filtri;
- tabella.

Restano entità di dominio distinte. L’unificazione è di consultazione, non una fusione indiscriminata del database.

## 14.2 KPI

- registrazioni valide;
- in scadenza;
- scadute;
- documenti presenti.

Le attività pianificate non sono un KPI di questa card.

## 14.3 Filtri

- testo;
- tipologia: tutte, formazione, abilitazione;
- stato;
- soltanto obbligatori, esclusivamente se l’obbligatorietà è realmente configurata.

Non dedurre obbligatorietà dalla sola mansione.

## 14.4 Tabella unificata

| Colonna | Formazione | Abilitazione |
|---|---|---|
| Tipo | Formazione | Abilitazione |
| Corso/abilitazione | catalogo corso | catalogo abilitazione |
| Dettaglio | base, aggiornamento, specialistica | livello o tipologia |
| Conseguimento | completamento | conseguimento |
| Scadenza | esplicita o calcolata | esplicita o calcolata |
| Durata | ore riconosciute | non applicabile se assente |
| Documento | attestato | documento/patentino |
| Stato | aggregato tecnico | aggregato tecnico |
| Azioni | menu/modifica | menu/modifica |

## 14.5 Registra formazione

Campi:

- corso/attestato obbligatorio;
- tipologia;
- data completamento obbligatoria;
- ore riconosciute obbligatorie;
- ente formatore obbligatorio;
- esito;
- numero attestato;
- scadenza esplicita;
- allegato.

Regole:

- ore maggiori di zero;
- data non futura per attività completata;
- stato valido soltanto se i campi indispensabili sono presenti;
- scadenza esplicita prevale sulla durata catalogata;
- conservare la regola usata per calcolare la scadenza.

## 14.6 Aggiungi abilitazione

Campi:

- abilitazione obbligatoria;
- livello/tipologia;
- data conseguimento obbligatoria;
- scadenza;
- documento;
- note;
- stato di verifica.

Non includere:

- mezzo assegnato;
- provenienza come sezione autonoma;
- requisito della mansione;
- attrezzatura specifica.

## 14.7 Storico ore formative

È chiuso per impostazione predefinita e mostra ore per anno. Il conteggio include soltanto:

- partecipazioni completate;
- esito ammesso dal catalogo/regola;
- ore effettivamente riconosciute.

Escludere:

- corsi pianificati;
- cancellati;
- non frequentati;
- abilitazioni prive di ore;
- record duplicati.

Il comando Apri analisi completa porta ad Analisi formazione.

## 14.8 Scadenze e attività pianificate

Una formazione o abilitazione già acquisita possiede la propria scadenza. Una futura sessione o un rinnovo da organizzare è un’attività dello Scadenziario.

Non duplicare la stessa attività nel tab della persona. Il tab può mostrare un collegamento contestuale alla pianificazione, ma non una seconda lista.

## 14.9 API

    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/formazione-abilitazioni
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/formazione
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/abilitazioni
    PATCH /api/v1/aziende/{azienda_id}/personale/formazione/{registrazione_id}
    PATCH /api/v1/aziende/{azienda_id}/personale/abilitazioni/{abilitazione_id}
    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/ore-formative

L’endpoint unificato può restituire una union DTO con source_type e source_id.

---

# 15. IDONEITÀ SANITARIA

## 15.1 Principio di minimizzazione

Memorizzare soltanto le informazioni necessarie all’azienda:

- tipo visita;
- data;
- giudizio sintetico;
- periodicità;
- data prossima visita/scadenza;
- medico competente;
- prescrizioni o limitazioni nel minimo consentito;
- documento protetto;
- stato.

Non memorizzare diagnosi, referti clinici completi o dettagli non necessari.

## 15.2 Vista

Mostrare:

- banner Dati sanitari protetti;
- ultimo giudizio;
- valido fino al;
- prossima visita;
- presenza di limitazioni;
- storico visite;
- prossima attività;
- esposizioni associate in sola lettura, se provengono dal modulo Sicurezza.

Le esposizioni non si modificano qui e devono riportare fonte e collegamento al modulo proprietario.

## 15.3 Registra visita

Campi:

- tipo visita;
- data visita;
- giudizio;
- periodicità in mesi;
- prossima visita;
- medico competente;
- documento;
- prescrizioni minime.

Validazioni:

- data visita non futura salvo appuntamento pianificato, che appartiene allo Scadenziario;
- prossima visita successiva alla visita;
- periodicità positiva;
- accesso esplicito al documento;
- nessuna indicizzazione non protetta del testo sanitario.

## 15.4 Pianificazione

Pianifica visita crea o aggiorna un’attività nello Scadenziario con:

- persona;
- tipo;
- data e ora;
- medico;
- luogo;
- promemoria;
- istruzioni organizzative.

L’attività pianificata non è un nuovo giudizio.

## 15.5 API

    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/idoneita
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/visite
    GET  /api/v1/aziende/{azienda_id}/personale/visite/{visita_id}/documento

Le risposte aggregate non devono includere allegati o testo riservato se il chiamante non possiede il permesso sanitario.

# 16. CONOSCENZA, COMPETENZA E CONSAPEVOLEZZA

## 16.1 Macroaree

La vista contiene soltanto:

- Conoscenza;
- Competenza;
- Consapevolezza.

Non aggiungere macroindicatori ulteriori e non riproporre una card Ultime valutazioni.

Significato operativo:

| Macroarea | Oggetto |
|---|---|
| Conoscenza | ciò che la persona conosce e sa richiamare |
| Competenza | capacità dimostrata di applicare conoscenze e abilità |
| Consapevolezza | comprensione del proprio contributo, degli obiettivi e delle conseguenze |

## 16.2 Origine delle voci

Il profilo individuale è una composizione:

    profilo generale aziendale
    + voci della mansione corrente
    + voci di tutti i ruoli attivi
    + voci personali
    - eccezioni individuali nascoste

La configurazione delle voci del ruolo avviene aprendo il ruolo nel tab Ruoli. Le voci della mansione devono essere gestite dalla configurazione della mansione già esistente o da quella che verrà esplicitamente approvata. Non creare un editor generico dentro la persona.

## 16.3 Identità e deduplicazione

Una voce deve avere un identificativo stabile. Non deduplicare in base al testo.

Se la stessa voce arriva da:

- mansione;
- Datore di Lavoro;
- Legale Rappresentante;

deve comparire una sola volta e conservare tutte le fonti.

La struttura logica risultante deve contenere:

~~~json
{
  "voce_id": "uuid",
  "macroarea": "KNOWLEDGE",
  "nome": "Obblighi normativi",
  "fonti": [
    {"tipo": "MANSIONE", "id": "uuid", "nome": "Amministratore"},
    {"tipo": "RUOLO", "id": "uuid", "nome": "Datore di Lavoro"}
  ],
  "personale": false,
  "nascosta": false,
  "valutazione_corrente": {}
}
~~~

## 16.4 Tre card superiori

Ogni card mostra:

- nome macroarea;
- livello aggregato;
- segmenti grafici;
- numero voci attive;
- numero voci nascoste, se maggiore di zero;
- data ultimo aggiornamento.

Il click:

- seleziona la card;
- apre sotto le tre card una card inline;
- sposta il raccordo grafico sotto la card selezionata;
- chiude la card se si clicca di nuovo lo stesso macrovalore.

La X è ammessa come chiusura secondaria. Non usare una finestra modale.

## 16.5 Tabella compatta del macrovalore

Vista normale:

| Colonna | Contenuto |
|---|---|
| Voce e origine | nome, breve descrizione e prima fonte più contatore delle ulteriori |
| Valutazione | Base, Intermedio, Avanzato o Non valutata |
| Ultimo aggiornamento | data e valutatore |
| Menu | azioni contestuali |

Il menu della riga contiene:

- Nascondi dalla persona, per voce ereditata;
- Visualizza origine;
- Storico;
- Modifica, soltanto per voce personale;
- Archivia, soltanto per voce personale e con conferma.

Non mostrare Valuta e Nascondi come pulsanti ripetuti su ogni riga.

## 16.6 Valuta macroarea

Un solo pulsante Valuta attiva la modalità di valutazione per tutte le voci visibili della macroarea.

Metadati comuni:

- data valutazione;
- valutatore, precompilato con utente corrente;
- nota generale facoltativa.

Tabella:

| Campo | Regola |
|---|---|
| Voce | sola lettura |
| Fonte | sola lettura |
| Valutazione precedente | ultima valida |
| Nuova valutazione | Base, Intermedio, Avanzato |
| Evidenza/nota | facoltativa per riga |

I valori precedenti sono riproposti per velocizzare l’aggiornamento. Il salvataggio crea una nuova valutazione storica; non sovrascrive la precedente.

Azioni finali:

- Annulla;
- Salva valutazione.

## 16.7 Scala

Scala iniziale:

| Valore | Etichetta |
|---:|---|
| 1 | Base |
| 2 | Intermedio |
| 3 | Avanzato |

Conservare il valore tramite ID del catalogo livello o codice stabile, non tramite colore o testo localizzato.

## 16.8 Calcolo del macrovalore

Considerare:

- solo voci attive;
- solo voci applicabili;
- solo voci visibili;
- ultima valutazione valida di ogni voce.

Escludere:

- voci nascoste;
- fonti cessate senza fonti alternative;
- voci archiviate;
- valutazioni annullate.

Se anche una sola voce visibile non è valutata, il macrovalore mostra Da completare.

Se tutte sono valutate, la prima versione usa la media aritmetica non pesata:

    media = somma livelli correnti / numero voci valutate
    livello macro = arrotondamento della media all’intero più vicino

Non introdurre pesi finché non approvati. Restituire comunque valore numerico preciso e conteggi dal backend, così la formula può evolvere.

## 16.9 Aggiungi voce personale

Il comando è discreto e si trova sotto la tabella. Apre un form inline con:

- nome obbligatorio;
- descrizione;
- macroarea già determinata;
- scala iniziale a tre livelli.

La voce:

- appartiene soltanto alla persona;
- non modifica ruolo o mansione;
- può essere modificata;
- entra nel calcolo finché attiva e visibile.

## 16.10 Nascondi e ripristina

Nascondere una voce ereditata:

- crea un’eccezione individuale;
- non modifica la fonte;
- non cancella valutazioni;
- esclude la voce dal calcolo corrente;
- registra autore, data e motivo facoltativo.

Le voci nascoste sono raccolte in un blocco chiuso. Da lì si possono ripristinare.

Il ripristino:

- rimuove o chiude l’eccezione;
- rende nuovamente visibile la voce;
- recupera l’ultima valutazione storica, se ancora valida;
- aggiorna macrovalore e matrice.

## 16.11 Cambi di mansione o ruolo

Quando cambia una fonte:

1. ricalcolare l’insieme delle voci applicabili;
2. aggiungere le nuove voci come non valutate;
3. mantenere le voci ancora sostenute da altre fonti;
4. archiviare l’applicabilità delle voci senza fonti;
5. conservare tutte le valutazioni;
6. non trasformare automaticamente voci ereditate in voci personali;
7. aggiornare Panoramica e matrice.

## 16.12 API

    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze
    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze/{macroarea}
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze/voci-personali
    PATCH /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze/voci-personali/{voce_id}
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze/{voce_id}/nascondi
    DELETE /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/competenze/{voce_id}/nascondi
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/valutazioni
    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/valutazioni

Il POST valutazioni riceve macroarea, metadati comuni e righe. Deve essere transazionale.

---

# 17. TITOLI DI STUDIO ED ESPERIENZE

## 17.1 Titoli di studio

La card occupa tutta la larghezza. Ha sostituito Piano di sviluppo.

Colonne:

- titolo;
- indirizzo/specializzazione;
- istituto o ateneo;
- anno;
- documento;
- stato;
- azioni.

Form:

- titolo dal catalogo;
- indirizzo;
- istituto;
- anno;
- stato documento;
- votazione facoltativa;
- allegato.

Una persona può avere più titoli. Stato dichiarato e stato verificato sono distinti. Il titolo non viene considerato verificato per la sola presenza del testo.

## 17.2 Esperienze rilevanti

Il blocco è chiuso per impostazione predefinita. Il riepilogo mostra numero di esperienze.

Campi:

- ruolo/attività;
- organizzazione;
- data inizio;
- data fine;
- rilevanza: professionale, tecnica o organizzativa;
- verificata sì/no;
- descrizione;
- eventuale evidenza.

Le esperienze non sono rapporti aziendali correnti e non devono modificare mansione o ruoli.

## 17.3 API

    GET/POST/PATCH /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/titoli-studio
    GET/POST/PATCH /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/esperienze

---

# 18. NOTE E ANNOTAZIONI

## 18.1 Scopo

Le note registrano osservazioni contestuali sulla persona. Non sono attività, scadenze o valutazioni.

## 18.2 Layout

Stato iniziale:

- titolo e descrizione;
- pulsante Nuova nota;
- ricerca;
- filtri categoria e autore;
- filtro In evidenza;
- timeline.

Il form Nuova nota non è visibile.

Dopo il click:

- compare una card laterale o inline coerente con lo spazio;
- il pulsante non apre un secondo popup;
- la timeline resta visibile;
- Annulla o X chiudono il compositore;
- dopo il salvataggio il compositore si richiude.

Attività collegate non deve comparire.

## 18.3 Campi

- categoria;
- titolo, se previsto dal modello;
- annotazione obbligatoria;
- visibilità;
- autore automatico;
- data/ora automatica;
- evidenza/In primo piano facoltativo.

Categorie iniziali possono includere:

- Generale;
- Formazione;
- Ruolo;
- Sorveglianza sanitaria, senza contenuto clinico;
- Competenze.

## 18.4 Visibilità

Valori minimi:

- Solo consulenti;
- Condivisa con l’azienda.

Applicare il controllo nel backend. Una nota Solo consulenti non deve comparire:

- nell’elenco;
- nei conteggi;
- nei risultati di ricerca;
- nelle esportazioni;
- nelle API aggregate

per utenti non autorizzati.

## 18.5 Nessun effetto automatico

Una nota non:

- crea una scadenza;
- crea un promemoria;
- modifica lo stato della persona;
- cambia una registrazione;
- viene collegata obbligatoriamente a un’attività.

Se serve pianificare, usare lo Scadenziario.

## 18.6 API

    GET  /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/note
    POST /api/v1/aziende/{azienda_id}/personale/persone/{persona_id}/note
    PATCH /api/v1/aziende/{azienda_id}/personale/note/{nota_id}
    DELETE /api/v1/aziende/{azienda_id}/personale/note/{nota_id}

La cancellazione preferibilmente è logica e auditata.

---

# 19. MONITORAGGIO PERSONALE

## 19.1 Struttura

La vista contiene nell’ordine:

1. KPI generali;
2. grafico della situazione complessiva;
3. quadro generale del personale.

Non reinserire:

- Segnalazioni automatiche;
- riepilogo separato a 90 giorni;
- grafico circolare duplicato dei KPI;
- liste operative già presenti nello Scadenziario.

## 19.2 KPI

- persone attive;
- registrazioni valide;
- in scadenza;
- scadute;
- registrazioni incomplete;
- attività pianificate.

Ogni KPI è cliccabile e applica un filtro coerente a elenco, matrice o Scadenziario.

## 19.3 Grafico complessivo

Mostrare:

- percentuale persone regolari;
- numeratore e denominatore;
- Regolari;
- In attenzione;
- Da gestire;
- Nessun dato;
- nota esplicita sul carattere non normativo.

Le quattro categorie devono sommare al totale delle persone attive.

## 19.4 Matrice sintetica

Colonne definitive:

- Persona;
- Mansione/reparto;
- Formazione e abilitazioni;
- Idoneità;
- Ruoli;
- Competenze;
- Documenti;
- Prossima data.

La colonna Competenze è necessaria per riflettere la nuova organizzazione dei macrovalori. Se la versione visuale del prototipo non la mostra ancora, considerarla un allineamento residuo del prototipo e non una scelta di esclusione.

## 19.5 Stato Competenze nella matrice

| Colore | Regola |
|---|---|
| Verde | tutte le voci attive sono valutate e la valutazione è aggiornata |
| Arancione | valutazione parziale o da aggiornare |
| Rosso | valutazione esplicitamente scaduta secondo una periodicità configurata |
| Blu | valutazione futura pianificata |
| Grigio | nessuna voce applicabile o nessun profilo configurato |

Non usare il rosso per la semplice assenza di una valutazione se non esiste una periodicità o scadenza configurata. In tale caso usare arancione o grigio secondo il contesto esplicito.

## 19.6 Interazioni

- ricerca per nome, mansione o reparto;
- filtro reparto;
- filtro mansione;
- filtro stato;
- Solo anomalie;
- paginazione;
- click sulla cella per aprire persona e tab corretto;
- click sulla prossima data per aprire la registrazione.

Le colonne Persona e Mansione/reparto restano bloccate durante lo scorrimento orizzontale interno.

## 19.7 Vista dettagliata

Vista dettagliata apre un pannello ampio con:

- riepilogo dei quattro stati;
- ricerca per persona, mansione, reparto o ruolo;
- filtro reparto;
- filtro stato complessivo;
- esportazione;
- tutte le colonne della matrice;
- stato complessivo;
- conteggio filtrato.

L’esportazione deve rispettare:

- filtri correnti;
- permessi;
- esclusione di dati sanitari non autorizzati;
- etichetta della data di riferimento.

## 19.8 Stato complessivo riga

Usare la precedenza:

1. rosso se almeno una categoria è EXPIRED;
2. arancione se almeno una è INCOMPLETE o EXPIRING;
3. blu se almeno una è PLANNED e le altre non sono peggiori;
4. verde se tutte le categorie presenti sono valide;
5. grigio se nessuna categoria ha dati.

## 19.9 API

    GET /api/v1/aziende/{azienda_id}/personale/monitoraggio/kpi
    GET /api/v1/aziende/{azienda_id}/personale/monitoraggio/distribuzione
    GET /api/v1/aziende/{azienda_id}/personale/monitoraggio/matrice
    GET /api/v1/aziende/{azienda_id}/personale/monitoraggio/matrice/export

Parametri matrice:

    q, reparto_id, mansione_id, ruolo_id, stato,
    solo_anomalie, page, page_size, sort, data_riferimento

---

# 20. SCADENZIARIO

## 20.1 Unica sede operativa

Lo Scadenziario è il solo luogo in cui:

- ordinare scadenze;
- vedere attività pianificate;
- filtrare;
- organizzare rinnovi;
- pianificare corsi;
- pianificare visite;
- creare promemoria operativi;
- consultare calendario.

Panoramica e tab individuali possono mostrare sintesi o collegamenti, ma non liste operative parallele.

## 20.2 Fonti

Le righe possono derivare da:

- scadenza formazione;
- scadenza abilitazione;
- scadenza idoneità/visita;
- scadenza documento;
- scadenza incarico;
- periodicità di valutazione esplicitamente configurata;
- attività manuale;
- corso prenotato;
- visita pianificata.

Ogni riga deve indicare source_type e source_id. Una scadenza derivata non deve duplicare la data sorgente in un record indipendente salvo che il sistema esistente usi una proiezione sincronizzata.

## 20.3 Elenco

È la vista principale. Colonne:

- persona;
- attività;
- categoria;
- data;
- giorni mancanti o trascorsi;
- stato;
- apertura.

Raggruppamenti:

- Scadute;
- Questa settimana;
- mese corrente;
- mesi successivi.

## 20.4 Calendario

La vista calendario:

- mostra il mese;
- evidenzia giorni con eventi;
- consente selezione del giorno;
- apre nell’aside le attività;
- usa gli stessi dati e filtri dell’elenco.

Il calendario compatto opzionale nella vista elenco non è una terza sorgente.

## 20.5 Filtri

- testo;
- orizzonte temporale;
- reparto;
- tipologia;
- stato;
- persona, quando si arriva dalla Panoramica;
- categoria;
- assegnatario/responsabile se previsto.

## 20.6 Pianifica corso

Campi:

- corso;
- data;
- durata prevista;
- modalità;
- luogo/link;
- ente;
- partecipanti;
- reparto;
- comunicazione.

Il salvataggio crea un’attività o evento pianificato. La formazione diventa acquisita soltanto dopo completamento e registrazione dell’esito.

## 20.7 Pianifica visita

Campi:

- tipo visita;
- data;
- ora;
- medico;
- luogo;
- promemoria;
- indicazioni organizzative.

Non creare un giudizio sanitario.

## 20.8 Google Calendar futuro

Il pulsante deve essere contrassegnato come Futuro finché l’integrazione non è implementata.

Non:

- simulare una sincronizzazione riuscita;
- salvare ID inventati;
- richiedere autorizzazioni Google in questa fase;
- copiare eventi manualmente.

Predisporre il modello in modo estendibile. Quando verrà autorizzata l’integrazione, saranno necessari almeno:

- collegamento account/azienda;
- calendario di destinazione;
- ID evento esterno;
- ID attività interna;
- direzione della sincronizzazione;
- stato sincronizzazione;
- ultimo tentativo;
- ultimo successo;
- errore;
- etag o versione remota;
- timezone;
- gestione cancellazioni;
- revoca credenziali.

Definire prima dell’implementazione futura:

- sincronizzazione solo verso Google o bidirezionale;
- quali categorie esportare;
- chi può collegare il calendario;
- visibilità dei dati sanitari;
- comportamento in caso di conflitto;
- calendario personale o aziendale.

## 20.9 API

    GET  /api/v1/aziende/{azienda_id}/personale/scadenziario
    POST /api/v1/aziende/{azienda_id}/personale/attivita
    PATCH /api/v1/aziende/{azienda_id}/personale/attivita/{attivita_id}
    POST /api/v1/aziende/{azienda_id}/personale/attivita/{attivita_id}/completa

Gli endpoint Google non vanno esposti finché il flusso OAuth e le regole non sono approvati.

---

# 21. ANALISI FORMAZIONE

## 21.1 Ambito

La vista analizza formazione svolta e pianificata. Non è una dashboard generica del personale.

Filtri:

- anno;
- reparto;
- mansione;
- categoria;
- eventuale stato.

## 21.2 KPI

### Attività svolta

- ore erogate;
- ore medie per persona;
- corsi completati.

### Stato e pianificazione

- registrazioni valide;
- attività pianificate.

Non sommare abilitazioni prive di ore alle ore formative.

## 21.3 Grafici

- ore di formazione per mese;
- formazione per categoria;
- ore per reparto;
- stato delle attività formative.

Distinguere consuntivo e pianificato. Una barra futura non entra nei totali consuntivi.

## 21.4 Dettaglio persone

Colonne:

- persona;
- reparto;
- ore anno precedente;
- ore anno selezionato;
- corsi completati;
- in scadenza;
- scaduti;
- stato registrazioni.

## 21.5 Formule

    ore erogate = somma ore riconosciute di partecipazioni completate ammesse

    ore medie = ore erogate / persone incluse nel perimetro del filtro

Specificare se il denominatore comprende:

- tutte le persone attive;
- soltanto persone con almeno una partecipazione.

La scelta deve essere visibile nel tooltip o metadato e coerente con l’API.

## 21.6 API

    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/kpi
    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/serie-mensile
    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/categorie
    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/reparti
    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/persone
    GET /api/v1/aziende/{azienda_id}/personale/analytics/formazione/export

# 22. MODELLO DATI LOGICO

## 22.1 Premessa

I nomi seguenti descrivono responsabilità logiche. Claude deve mapparli sulle tabelle reali e chiedere conferma prima di creare ciò che manca.

Regole comuni:

- chiave primaria coerente con il progetto;
- azienda_id su ogni dato tenant-specific o relazione che consenta di risalirvi senza ambiguità;
- created_at;
- updated_at;
- created_by/updated_by se previsti;
- soft delete o stato attivo quando lo storico è necessario;
- vincoli univoci tenant-aware;
- foreign key esplicite;
- nessuna cancellazione a cascata che elimini storico professionale o sanitario.

## 22.2 Persona

Entità logica per_persone:

| Campo logico | Nota |
|---|---|
| id | chiave |
| azienda_id | tenant |
| nome | obbligatorio |
| cognome | obbligatorio |
| codice_fiscale | normalizzato |
| matricola | univoca nell’azienda se usata |
| data_nascita | facoltativa |
| luogo/provincia/stato_nascita | usare cataloghi esistenti |
| sesso_id/codice | convenzione esistente |
| cittadinanza | catalogo o testo normalizzato |
| dati residenza | secondo modello indirizzi |
| dati domicilio | preferire entità indirizzo se già presente |
| contatti | preferire modello contatti se già presente |
| dati lingua | minimizzati |
| stato | attivo/archiviato dell’anagrafica |

Unicità del codice fiscale:

- rispettare la decisione già adottata nel progetto: unicità nel perimetro aziendale;
- gestire soggetti senza CF o con identificativo estero;
- non usare il CF come chiave primaria.

## 22.3 Rapporto aziendale

Entità logica per_rapporti_azienda:

| Campo | Nota |
|---|---|
| id | chiave |
| azienda_id | tenant |
| persona_id | persona |
| tipo_rapporto_id | catalogo |
| data_inizio | obbligatoria |
| data_fine_prevista | opzionale/condizionale |
| data_fine_effettiva | chiusura |
| mansione_id | catalogo mansioni |
| reparto_id | catalogo reparti |
| stato | pianificato, attivo, cessato |
| tempo_lavoro | pieno/parziale |
| percentuale_part_time | condizionale |
| ccnl_id/testo | riuso catalogo |
| livello_inquadramento | catalogo o testo |
| note | facoltative |

Vincoli:

- data fine maggiore o uguale alla data inizio;
- percentuale valorizzata soltanto per part-time;
- regola sul singolo rapporto corrente secondo requisiti del progetto;
- storico non sovrascritto.

## 22.4 Cataloghi organizzativi

Riutilizzare:

- cat_mansioni;
- cat_reparti;
- cat_ruoli;
- cataloghi tipo rapporto;
- cataloghi stati;
- catalogo titoli di studio;
- cataloghi formazione e abilitazioni.

Ogni catalogo deve avere:

- codice stabile;
- etichetta;
- descrizione;
- attivo;
- ordine;
- validità temporale se necessaria;
- eventuale ownership di sistema o azienda.

## 22.5 Configurazione aziendale del ruolo

Il catalogo ruolo non deve contenere il mansionario specifico di una singola azienda.

Entità logica cfg_ruoli_azienda:

| Campo | Nota |
|---|---|
| id | identificativo configurazione |
| azienda_id | tenant |
| ruolo_id | catalogo globale |
| attivo | disponibilità aziendale |
| scopo | testo principale |
| riporta_a_testo | fallback se non esiste organigramma |
| collabora_con_testo | fallback |
| versione | opzionale per concorrenza/versionamento |
| valid_from/valid_to | se si versiona formalmente |

Unique consigliato: azienda_id + ruolo_id per configurazione corrente.

Se esiste un organigramma riutilizzabile, riporta_a e collabora_con possono essere relazioni. Non creare una seconda gerarchia soltanto per il mansionario.

## 22.6 Voci del mansionario

Entità logica cfg_ruoli_mansionario_voci:

| Campo | Nota |
|---|---|
| id | chiave |
| configurazione_ruolo_id | configurazione aziendale |
| sezione | ACTIVITY, RESPONSIBILITY, AUTHORITY |
| testo | contenuto |
| ordine | ordinamento |
| attiva | disattivazione non distruttiva |
| valid_from/valid_to | opzionale |

Non salvare i tre elenchi come unico testo JSON se il repository supporta una relazione ordinata. La struttura relazionale permette:

- riordino;
- audit per voce;
- disattivazione;
- riuso futuro;
- esportazione affidabile.

Se il database possiede già un catalogo di caratteristiche del ruolo adatto a rappresentare queste sezioni, valutarne il riuso. Non forzarlo se è progettato per valori dell’incarico individuale anziché per contenuti condivisi.

## 22.7 Assegnazioni dei ruoli

Entità logica per_incarichi:

| Campo | Nota |
|---|---|
| id | chiave |
| azienda_id | tenant |
| persona_id | persona |
| ruolo_id | ruolo |
| ambito_id/testo | perimetro |
| fonte | CCIAA o MANUAL |
| source_record_id | riferimento CCIAA quando disponibile |
| data_inizio | obbligatoria |
| data_fine | opzionale |
| stato | pianificato/attivo/sospeso/cessato |
| note | facoltative |
| documento_id | tramite sistema allegati |

La riga non contiene scopo, attività, responsabilità o autorità del mansionario.

Vincoli:

- tenant coerente tra persona e incarico;
- record CCIAA non modificabile dalle API manuali;
- sovrapposizione controllata secondo cardinalità del ruolo;
- cessazione non distruttiva.

## 22.8 Catalogo delle voci di valutazione

Entità logica cat_voci_valutazione_personale:

| Campo | Nota |
|---|---|
| id | identità stabile usata per deduplicare |
| azienda_id | nullo per sistema, valorizzato per azienda |
| codice | stabile |
| macroarea | KNOWLEDGE, COMPETENCE, AWARENESS |
| nome | etichetta |
| descrizione | significato |
| scala_id | scala livelli |
| attiva | stato |

Unique coerente: azienda_id + codice, con gestione dei record di sistema secondo convenzioni PostgreSQL esistenti.

## 22.9 Relazioni delle fonti base

### Ruoli

Relazione logica rel_ruoli_voci_valutazione:

- id;
- azienda_id;
- ruolo_id o configurazione_ruolo_id;
- voce_id;
- ordine;
- attiva;
- valid_from;
- valid_to.

### Mansioni

Relazione logica rel_mansioni_voci_valutazione:

- azienda_id;
- mansione_id;
- voce_id;
- ordine;
- attiva;
- validità.

### Profilo generale

Se confermato:

- azienda_id;
- voce_id;
- ordine;
- attiva;
- validità.

La presenza di dati dimostrativi Profilo generale nel prototipo non autorizza una nuova tabella se il concetto non esiste ancora. Claude deve verificare e proporre.

## 22.10 Voci personali ed eccezioni

### Voce personale

Entità logica per_voci_valutazione_personali:

- id;
- azienda_id;
- persona_id;
- macroarea;
- nome;
- descrizione;
- scala_id;
- attiva;
- created_by;
- created_at;
- archived_at.

Una voce personale non deve essere aggiunta al catalogo condiviso senza azione esplicita.

### Voce nascosta

Entità logica rel_persone_voci_nascoste:

- azienda_id;
- persona_id;
- voce_id;
- motivo facoltativo;
- hidden_by;
- hidden_at;
- restored_by;
- restored_at;
- attiva.

Unique corrente: persona_id + voce_id con azienda coerente.

## 22.11 Valutazioni

Entità testata per_valutazioni_personale:

| Campo | Nota |
|---|---|
| id | valutazione |
| azienda_id | tenant |
| persona_id | soggetto |
| macroarea | una delle tre |
| data_valutazione | data |
| valutatore_user_id | utente |
| nota_generale | facoltativa |
| stato | bozza/confermata/annullata se previsto |
| created_at | audit |

Dettagli per_valutazioni_personale_dettagli:

| Campo | Nota |
|---|---|
| valutazione_id | testata |
| voce_id | voce condivisa, nullable per voce personale se modello separato |
| voce_personale_id | alternativa controllata |
| livello_id/codice | Base/Intermedio/Avanzato |
| valore_numerico | se previsto dalla scala |
| evidenza_nota | facoltativa |
| snapshot_nome | consigliato per storico leggibile |
| snapshot_fonti | soltanto se il sistema usa snapshot auditati |

Vincolo: una sola riga per voce nella stessa valutazione.

Una valutazione confermata è immutabile o rettificabile tramite nuova versione/annullamento auditato. Non aggiornare la riga storica per rappresentare il valore corrente.

## 22.12 Composizione del profilo effettivo

Il servizio deve:

1. recuperare rapporto corrente;
2. recuperare ruoli attivi alla data;
3. recuperare voci generali;
4. recuperare voci mansione;
5. recuperare voci ruoli;
6. recuperare voci personali;
7. unire per voce_id;
8. aggregare tutte le fonti;
9. applicare eccezioni nascoste;
10. associare ultima valutazione valida;
11. calcolare completezza e macrovalore.

Non è obbligatorio materializzare questa composizione in tabella. Preferire calcolo tramite servizio/query. Introdurre una cache o proiezione soltanto se le prestazioni reali lo richiedono e se l’invalidazione è completa.

## 22.13 Formazione

Riutilizzare o mappare:

### cat_corsi_formazione

- codice;
- nome;
- categoria;
- tipologia;
- durata standard;
- validità;
- soglia preavviso;
- attivo;
- metadati normativi già approvati.

### eventi formativi

- azienda;
- corso;
- data/periodo;
- ente;
- modalità;
- luogo;
- ore;
- stato.

### partecipazioni

- evento;
- persona;
- esito;
- ore riconosciute;
- completamento;
- note.

### attestati

- partecipazione/persona;
- numero;
- data conseguimento;
- scadenza esplicita;
- regola di calcolo;
- documento;
- stato verifica.

## 22.14 Abilitazioni

Entità logica per_abilitazioni:

- azienda_id;
- persona_id;
- abilitazione_catalogo_id;
- livello/tipologia;
- data_conseguimento;
- data_scadenza;
- stato_verifica;
- documento_id;
- note;
- stato.

Nessuna relazione obbligatoria persona-attrezzatura in questa versione.

## 22.15 Idoneità sanitaria

Entità logica per_giudizi_idoneita o equivalente:

- azienda_id;
- persona_id;
- tipo_visita_id;
- data_visita;
- giudizio_id;
- periodicita_mesi;
- data_scadenza/prossima_visita;
- medico_id o riferimento;
- prescrizioni_minime protette;
- documento_id protetto;
- stato.

Le esposizioni sono riferimenti in sola lettura dal modulo Sicurezza. Non duplicarle in questa tabella.

## 22.16 Titoli ed esperienze

Titoli:

- persona;
- titolo catalogo;
- specializzazione;
- istituto;
- anno;
- votazione;
- documento;
- stato verifica.

Esperienze:

- persona;
- attività/ruolo;
- organizzazione;
- data inizio/fine;
- rilevanza;
- descrizione;
- verificata;
- evidenza.

## 22.17 Note

Entità logica per_note:

- azienda_id;
- persona_id;
- categoria;
- titolo facoltativo;
- testo;
- visibilità;
- in_evidenza;
- autore;
- created_at;
- updated_at;
- archived_at.

Non aggiungere activity_id obbligatorio. Attività collegate è escluso.

## 22.18 Attività e Scadenziario

Separare:

- scadenze derivate da record;
- attività create manualmente;
- eventi pianificati.

Entità attività, se manca:

- azienda_id;
- persona_id facoltativo;
- tipo;
- categoria;
- titolo;
- data_inizio;
- data_scadenza;
- ora;
- stato;
- responsabile;
- source_type/source_id facoltativi;
- ricorrenza;
- promemoria;
- note organizzative;
- external_sync_status futuro.

Non salvare una seconda scadenza indipendente quando la data appartiene già al record sorgente, salvo proiezione tecnica controllata.

## 22.19 Allegati

Usare il sistema documentale esistente.

Metadati minimi:

- azienda;
- proprietario logico;
- tipo documento;
- nome file;
- MIME;
- dimensione;
- checksum;
- storage key;
- caricato da;
- data;
- livello di riservatezza;
- stato verifica;
- eventuale scadenza.

Controllare autorizzazione sia sui metadati sia sul download.

## 22.20 Indici e vincoli

Prevedere, in base allo schema reale:

- persona per azienda + stato;
- rapporto per azienda + persona + date;
- incarico per azienda + persona + stato + date;
- configurazione ruolo per azienda + ruolo;
- voci mansionario per configurazione + sezione + ordine;
- relazioni ruolo-voce per azienda + ruolo + voce;
- valutazioni per azienda + persona + macroarea + data;
- dettagli valutazione per valutazione + voce;
- formazione/abilitazioni/idoneità per persona + scadenza;
- note per persona + created_at;
- attività per azienda + stato + data.

Tutti i vincoli univoci devono considerare azienda quando il dato è tenant-specific.

---

# 23. SERVIZI BACKEND

## 23.1 Servizi di dominio consigliati

### PersonService

- crea persona e rapporto;
- modifica anagrafica;
- gestisce storico rapporti;
- produce DTO elenco.

### RoleAssignmentService

- assegna ruolo;
- valida cardinalità e date;
- distingue CCIAA/manuale;
- cessa incarico;
- emette eventi di ricalcolo.

### RoleDefinitionService

- recupera configurazione aziendale;
- modifica mansionario;
- gestisce voci ordinate;
- configura voci base;
- registra audit;
- impedisce cross-tenant.

### CompetencyProfileService

- compone fonti;
- deduplica per ID;
- applica eccezioni;
- recupera ultima valutazione;
- calcola completezza;
- calcola macrovalori.

### CompetencyEvaluationService

- valida che le voci siano applicabili;
- salva testata e dettagli in transazione;
- conserva storico;
- aggiorna aggregati/cache.

### TrainingService

- gestisce eventi, partecipazioni e attestati;
- calcola ore;
- calcola scadenze.

### QualificationService

- gestisce abilitazioni e validità.

### HealthSuitabilityService

- applica permessi sanitari;
- gestisce giudizi e prossime visite;
- minimizza il DTO.

### PersonnelDeadlineService

- raccoglie scadenze da tutte le fonti;
- unisce attività pianificate;
- calcola stato e giorni mancanti;
- restituisce target di navigazione.

### PersonnelMonitoringService

- KPI;
- distribuzione;
- matrice;
- esportazione.

### TrainingAnalyticsService

- aggregazioni temporali;
- categorie;
- reparti;
- dettaglio persone.

## 23.2 Eventi che invalidano gli aggregati

- creazione/modifica/cessazione rapporto;
- cambio mansione o reparto;
- assegnazione/cessazione ruolo;
- modifica voci base del ruolo;
- modifica voci base della mansione;
- aggiunta/nascondimento/ripristino voce personale;
- nuova valutazione;
- formazione o abilitazione;
- nuova idoneità;
- modifica data di scadenza;
- pianificazione/completamento/annullamento attività;
- caricamento o verifica documento quando influenza completezza.

## 23.3 Transazioni

Devono essere atomiche almeno:

- persona + primo rapporto;
- cambio rapporto con chiusura precedente;
- incarico + documento/metadati;
- mansionario + riordino voci;
- aggiunta voce base + audit;
- valutazione testata + dettagli;
- evento formativo + partecipazioni, se salvati insieme;
- visita + documento/metadati;
- attività + partecipanti.

I file possono richiedere una transazione applicativa compensativa: non lasciare record confermati con upload fallito senza stato esplicito.

## 23.4 Concorrenza

Per configurazioni condivise, soprattutto mansionario e voci base:

- usare updated_at, version o ETag;
- rifiutare aggiornamenti basati su versione obsoleta;
- restituire 409 con dati utili al confronto;
- non applicare last-write-wins silenzioso.

## 23.5 Prestazioni

Evitare:

- query per ogni riga persona;
- query per ogni cella matrice;
- calcolo completo del tenant a ogni apertura;
- download allegati per produrre KPI;
- caricamento di tutti i tab insieme.

Usare:

- query aggregate;
- prefetch controllato;
- paginazione;
- cache tenant-aware;
- invalidazione per eventi;
- indici sulle scadenze;
- endpoint dedicati alla matrice.

---

# 24. CONTRATTI API

## 24.1 Convenzioni

Ogni DTO deve usare:

- ID stabili;
- codici enum, non colori;
- date ISO 8601;
- timestamp con timezone;
- etichette localizzate separate dai codici;
- source_type e source_id per record aggregati;
- can_edit/can_view_document quando utile;
- version/updated_at per concorrenza;
- pagination metadata negli elenchi.

## 24.2 DTO della riga persona

~~~json
{
  "id": "uuid",
  "nome_completo": "Mario Rossi",
  "avatar_url": null,
  "rapporto": {
    "stato": "ACTIVE",
    "data_inizio": "2021-03-15",
    "mansione": {"id": "uuid", "nome": "Impiegato tecnico"},
    "reparto": {"id": "uuid", "nome": "Ufficio tecnico"}
  },
  "ruoli_principali": [
    {"id": "uuid", "nome": "RSPP"}
  ],
  "stato_registrazioni": {
    "valid": 10,
    "expiring": 1,
    "expired": 0
  }
}
~~~

## 24.3 DTO configurazione ruolo

~~~json
{
  "ruolo": {
    "id": "uuid",
    "codice": "DATORE_LAVORO",
    "nome": "Datore di Lavoro",
    "ambito": "SICUREZZA"
  },
  "assegnazione_selezionata": {
    "id": "uuid",
    "fonte": "MANUAL",
    "read_only": false
  },
  "mansionario": {
    "scopo": "Testo",
    "attivita": [{"id": "uuid", "ordine": 1, "testo": "Testo"}],
    "responsabilita": [],
    "autorita": [],
    "riporta_a": "Direzione",
    "collabora_con": "RSPP"
  },
  "voci_base": {
    "knowledge": [],
    "competence": [],
    "awareness": []
  },
  "version": 4,
  "permissions": {
    "can_edit_assignment": true,
    "can_edit_role_definition": true
  }
}
~~~

## 24.4 DTO profilo macroarea

~~~json
{
  "macroarea": "KNOWLEDGE",
  "label": "Conoscenza",
  "summary": {
    "active_count": 4,
    "hidden_count": 1,
    "evaluated_count": 4,
    "complete": true,
    "average": 2.75,
    "level_code": "ADVANCED",
    "updated_at": "2026-06-20"
  },
  "items": []
}
~~~

## 24.5 Errori canonici

Riutilizzare formato esistente. Coprire:

- 400 richiesta non valida;
- 401 non autenticato;
- 403 permesso mancante;
- 404 record non visibile/appartenente al tenant;
- 409 conflitto di versione o sovrapposizione;
- 422 validazione di dominio;
- 423 record importato o bloccato, se convenzione esistente;
- 500 errore con correlation ID.

Messaggi specifici:

- ruolo CCIAA non modificabile;
- voce non più applicabile;
- valutazione contiene una voce duplicata;
- data fine precedente all’inizio;
- documento sanitario non autorizzato;
- configurazione ruolo aggiornata da altro utente.

## 24.6 Idempotenza

Usare chiavi idempotenza dove un doppio invio può creare duplicati:

- creazione persona;
- assegnazione ruolo;
- valutazione;
- registrazione formazione;
- pianificazione attività.

# 25. ARCHITETTURA FRONTEND

## 25.1 Stack

Integrare nello stack corrente:

- Next.js;
- React;
- TypeScript;
- Tailwind;
- componenti Shadcn o design system del progetto;
- client API e gestione query già adottati.

Non copiare il CSS monolitico o il JavaScript del prototipo.

## 25.2 Componenti consigliati

~~~text
PersonnelModule
├── PersonnelMainTabs
├── PeopleListView
│   ├── PeopleFilters
│   ├── PeopleTable
│   └── PeoplePagination
├── PersonDetailLayout
│   ├── PeopleRail
│   ├── PersonHeader
│   ├── PersonTabs
│   └── PersonTabContent
├── PersonOverview
│   ├── PersonStatusCards
│   ├── UpcomingDeadlinesCard
│   └── AssignedRolesCard
├── PersonProfile
│   ├── EssentialDataCard
│   ├── CurrentRelationshipCard
│   └── PersonalDossier
├── PersonRoles
│   ├── RoleAssignmentsTable
│   └── RoleDefinitionWorkspace
│       ├── RoleDescriptionView
│       ├── RoleDescriptionForm
│       └── RoleBaseItems
├── PersonLearning
│   ├── LearningKpis
│   ├── LearningFilters
│   ├── LearningRecordsTable
│   └── TrainingHoursHistory
├── PersonHealth
├── PersonCompetencies
│   ├── MacroValueCards
│   ├── CompetencyDetailCard
│   ├── CompetencyEvaluationForm
│   ├── PersonalItemForm
│   └── HiddenItems
├── PersonNotes
├── PersonnelMonitoring
│   ├── MonitoringKpis
│   ├── WorkforceStatusChart
│   ├── PersonnelMatrix
│   └── DetailedMatrix
├── PersonnelSchedule
└── TrainingAnalytics
~~~

I nomi sono indicativi. Evitare un singolo componente contenitore con tutta la logica.

## 25.3 Stato server e stato UI

Stato server:

- persona;
- rapporti;
- ruoli;
- mansionario;
- voci base;
- valutazioni;
- registrazioni;
- KPI;
- matrice.

Stato UI:

- tab attivo;
- riga ruolo aperta;
- tab del ruolo;
- macroarea aperta;
- modalità valutazione;
- form nota visibile;
- blocchi collassati;
- filtri e paginazione.

Non salvare dati di dominio in localStorage. È ammesso salvare preferenze non sensibili, per esempio layout, se già previsto.

## 25.4 Cache

Chiavi cache devono includere:

- azienda;
- persona;
- vista/tab;
- filtri;
- data di riferimento;
- versione configurazione quando utile.

Invalidare in modo mirato. Una modifica del mansionario non richiede necessariamente il ricaricamento della formazione, ma una modifica delle voci base richiede il ricalcolo delle competenze delle persone interessate.

## 25.5 Navigazione profonda

Ogni cella aggregata deve poter aprire:

- persona corretta;
- tab corretto;
- record corretto, se previsto;
- ritorno alla vista di origine.

Non usare ricerche sul nome visibile per trovare il record.

---

# 26. REGOLE GRAFICHE E DI INTERAZIONE

## 26.1 Design

Mantenere lo stile del prototipo:

- fondo pagina molto chiaro;
- card bianche;
- blu come colore primario;
- verde valido;
- arancione attenzione;
- rosso scaduto;
- blu pianificato;
- grigio nessun dato;
- bordi leggeri;
- ombre contenute;
- raggio card circa 10–12 px;
- raggio controlli circa 8 px;
- densità adatta a laptop.

Usare i token reali del progetto, non duplicare colori hardcoded.

## 26.2 Simmetrie

Elementi appartenenti allo stesso gruppo devono avere:

- altezza coerente;
- padding coerente;
- allineamento verticale;
- spaziatura uniforme;
- stessa gerarchia tipografica.

In particolare:

- tre card numeriche della Panoramica;
- tre macrocard;
- tre pannelli delle voci base del ruolo;
- KPI della stessa riga;
- riquadri del mansionario.

## 26.3 Azioni

Principio: una sola azione primaria per contesto.

- Ruoli: un’unica apertura/menu per riga.
- Macroarea: un solo Valuta.
- Nota: un solo Nuova nota.
- Titoli: un solo Aggiungi titolo.
- Formazione: Registra formazione e Aggiungi abilitazione sono distinte perché creano entità diverse.

Azioni rare devono stare nel menu contestuale.

## 26.4 Accessibilità

- elementi interattivi nativi button/link;
- focus visibile;
- tab con role tab e aria-selected;
- card espandibili con aria-expanded e aria-controls;
- etichette form;
- errori associati ai campi;
- tabelle con header corretti;
- testo oltre al colore;
- chiusura modali con Esc;
- focus trap nelle modali;
- ripristino del focus al trigger;
- supporto prefers-reduced-motion.

## 26.5 Breakpoint

Verificare almeno:

- 1440 × 900;
- 1366 × 768;
- 1024 × 768;
- 768 × 1024;
- 390 × 844.

Sotto i breakpoint:

- rail nascosta su mobile;
- card in una o due colonne;
- tabelle con overflow interno;
- nessun testo essenziale nascosto;
- azioni ancora raggiungibili.

---

# 27. VALIDAZIONE, EMPTY STATE ED ERRORI

## 27.1 Validazione frontend e backend

Il frontend anticipa gli errori; il backend resta autorevole.

Validare:

- obbligatorietà;
- formati;
- intervalli date;
- record di catalogo attivi;
- ownership;
- autorizzazioni;
- versioni concorrenti;
- allegati;
- coerenza stato.

## 27.2 Empty state

Esempi:

| Area | Messaggio | Azione |
|---|---|---|
| Ruoli | Nessun ruolo assegnato | Assegna ruolo |
| Mansionario | Mansionario non definito | Definisci mansionario |
| Voci ruolo | Nessuna voce base | Aggiungi voce base |
| Formazione | Nessuna registrazione acquisita | Registra formazione |
| Abilitazioni | Nessuna abilitazione | Aggiungi abilitazione |
| Idoneità | Nessun giudizio disponibile | Registra visita, se autorizzato |
| Macroarea | Nessuna voce applicabile | Apri la fonte/configurazione autorizzata |
| Titoli | Nessun titolo registrato | Aggiungi titolo |
| Esperienze | Nessuna esperienza | Aggiungi esperienza |
| Note | Nessuna nota | Nuova nota |
| Scadenziario | Nessuna scadenza nel periodo | Modifica filtri |

NO_DATA non deve apparire come errore.

## 27.3 Errori di caricamento

Ogni blocco mostra:

- messaggio breve;
- Riprova;
- eventuale correlation ID;
- nessun dato vecchio presentato come corrente.

## 27.4 Successo

Usare toast brevi per:

- salvataggio;
- aggiunta;
- ripristino;
- pianificazione.

Non usare toast come unica conferma di un cambiamento strutturale: la vista deve aggiornarsi.

---

# 28. PRIVACY E SICUREZZA

## 28.1 Dati ordinari

- minimizzare dati personali;
- mascherare dove previsto;
- non inserire dati sensibili nei log;
- validare e sanificare testo libero;
- proteggere esportazioni.

## 28.2 Dati sanitari

- permessi separati;
- risposta API ridotta;
- documenti protetti;
- URL firmati brevi se usati;
- nessuna cache pubblica;
- nessuna anteprima non autorizzata;
- audit secondo policy;
- nessun dato sanitario in tooltip o matrice generale oltre lo stato sintetico ammesso.

## 28.3 Note

Il filtro visibilità deve essere applicato in query. Non recuperare note riservate e poi nasconderle nel client.

## 28.4 File

Controllare:

- MIME reale;
- dimensione;
- malware scanning se già presente;
- checksum;
- nome sicuro;
- tenant;
- permesso al download;
- stato upload.

## 28.5 Esportazioni

Le esportazioni devono:

- rispettare filtri;
- rispettare permessi;
- evitare documenti sanitari;
- indicare data di generazione e data di riferimento;
- registrare audit se previsto.

---

# 29. JOB, NOTIFICHE E PROIEZIONI

## 29.1 Calcolo scadenze

Preferire calcolo al bisogno o proiezione aggiornata da eventi. Se esiste un job:

- deve essere idempotente;
- tenant-aware;
- recuperabile;
- osservabile;
- testato sui cambi data e timezone.

## 29.2 Notifiche

Non inviare notifiche automaticamente soltanto perché un record è arancione o rosso. Usare configurazioni e destinatari espliciti.

Distinguere:

- stato della registrazione;
- attività pianificata;
- promemoria;
- notifica inviata.

## 29.3 Google Calendar

Nessun job di sincronizzazione deve essere attivato in questa fase. Lasciare un punto di estensione documentato e non una simulazione.

---

# 30. PIANO DI TEST

## 30.1 Unit test backend

Testare:

- normalizzazione CF;
- validazione date rapporto;
- stato registrazione;
- precedenza aggregata;
- percentuale persona;
- classificazione complessiva;
- unione delle fonti competenze;
- deduplicazione per voce_id;
- rimozione di una fonte;
- voce con più fonti;
- nascondimento;
- ripristino;
- completezza macroarea;
- media e arrotondamento;
- scadenza formazione;
- ore formative;
- visibilità note;
- permessi sanitari;
- tenant isolation.

## 30.2 Integration test API

Scenari:

1. creare persona e rapporto;
2. fallimento del rapporto annulla la persona;
3. assegnare ruolo manuale;
4. tentare modifica di incarico CCIAA;
5. modificare mansionario;
6. verificare che due persone vedano lo stesso mansionario;
7. aggiungere voce base al ruolo;
8. verificare ereditarietà;
9. valutare la voce;
10. nasconderla per una sola persona;
11. cessare il ruolo;
12. mantenere la voce se esiste una seconda fonte;
13. conservare lo storico;
14. registrare formazione;
15. aggiungere abilitazione senza mezzo;
16. registrare idoneità con permesso;
17. negare accesso sanitario;
18. creare nota riservata;
19. escluderla per utente aziendale;
20. pianificare corso nello Scadenziario.

## 30.3 Component test

- filtri elenco;
- apertura/chiusura persona;
- cambio tab;
- layout full/split;
- dirty state;
- Dossier collassato;
- ruolo inline;
- cambio Mansionario/Competenze del ruolo;
- editor mansionario;
- aggiunta voce base;
- macrocard e raccordo grafico;
- valutazione inline;
- voce personale;
- menu riga;
- voci nascoste;
- storico ore chiuso;
- esperienze chiuse;
- nota nascosta finché non richiesta;
- matrice e filtri;
- Scadenziario elenco/calendario.

## 30.4 End-to-end

### Flusso ruolo e mansionario

1. aprire persona;
2. entrare in Ruoli;
3. aprire Datore di Lavoro;
4. modificare mansionario;
5. salvare;
6. aprire seconda persona con stesso ruolo;
7. verificare stesso contenuto;
8. verificare audit.

### Flusso competenze

1. aggiungere voce base al ruolo;
2. aprire persona con ruolo;
3. verificare voce non valutata;
4. valutare macroarea;
5. verificare storico;
6. nascondere voce;
7. verificare esclusione dal macrovalore;
8. ripristinare;
9. verificare ricalcolo.

### Flusso scadenza

1. registrare attestato con scadenza;
2. verificare tab persona;
3. verificare Panoramica;
4. verificare matrice;
5. verificare Scadenziario;
6. modificare scadenza;
7. verificare aggiornamento coerente.

## 30.5 Visual regression

Catturare:

- elenco;
- Panoramica;
- Dossier chiuso e aperto;
- Ruoli con workspace;
- mansionario in consultazione e modifica;
- profilo base del ruolo;
- Formazione e abilitazioni;
- Competenze chiuse, aperte e in valutazione;
- Note senza e con compositore;
- Monitoraggio;
- matrice dettagliata;
- Scadenziario elenco e calendario;
- mobile.

---

# 31. CRITERI DI ACCETTAZIONE

## AC-01 — Integrazione

- funzione integrata nel progetto esistente;
- nessun iframe o app parallela;
- nessun dato simulato in produzione;
- routing coerente.

## AC-02 — Elenco persone

- filtri combinabili;
- paginazione server-side;
- nessun N+1;
- apertura accessibile;
- ritorno senza perdita di stato.

## AC-03 — Persona e rapporto

- una sola anagrafica;
- rapporto separato;
- Dossier collassato;
- campi condizionali validati;
- dirty state funzionante.

## AC-04 — Panoramica

- quattro card indipendenti;
- nessun riepilogo numerico duplicato;
- Prossime scadenze e Ruoli assegnati;
- dati coerenti con fonti;
- percentuale non normativa.

## AC-05 — Ruoli

- tabella essenziale;
- CCIAA sola lettura per assegnazione;
- ruolo apribile inline;
- mansionario condiviso per azienda e ruolo;
- nessuna copia nella persona;
- voci base configurabili;
- audit e concorrenza.

## AC-06 — Formazione e abilitazioni

- unico tab/card;
- entità distinte nel dominio;
- nessun mezzo;
- nessuna lista pianificata duplicata;
- storico ore collassato.

## AC-07 — Idoneità

- dati minimizzati;
- permessi specifici;
- documenti protetti;
- pianificazione separata dal giudizio.

## AC-08 — Competenze

- tre macroaree;
- apertura inline;
- profilo composto;
- deduplicazione per ID;
- valutazione storica;
- voce personale;
- nascondi/ripristina;
- nessun editor delle fonti nella persona;
- Titoli a tutta larghezza;
- Esperienze chiuse;
- nessun Piano di sviluppo.

## AC-09 — Note

- nessuna Attività collegata;
- un solo pulsante Nuova nota;
- form nascosto inizialmente;
- visibilità applicata dal backend;
- nessuna creazione automatica di attività.

## AC-10 — Monitoraggio

- KPI;
- grafico unico;
- matrice con Competenze;
- stato non normativo;
- vista dettagliata;
- filtri;
- colonne bloccate;
- esportazione autorizzata.

## AC-11 — Scadenziario

- unica sede operativa;
- elenco e calendario coerenti;
- pianificazione corsi e visite;
- navigazione alle fonti;
- Google Calendar indicato come futuro, senza falso collegamento.

## AC-12 — Analisi

- formule documentate;
- pianificato distinto da consuntivo;
- filtri coerenti;
- esportazione corretta.

## AC-13 — Sicurezza

- tenant isolation;
- permessi backend;
- privacy sanitaria;
- note riservate;
- allegati protetti;
- audit.

## AC-14 — Responsive e accessibilità

- verifiche ai breakpoint;
- focus;
- tastiera;
- testo oltre colore;
- overflow soltanto interno;
- nessun controllo irraggiungibile.

---

# 32. SEQUENZA DI IMPLEMENTAZIONE

## Fase 0 — Audit

- analisi repository;
- matrice di corrispondenza;
- gap report;
- richiesta conferma database.

Stop obbligatorio prima delle migrazioni.

## Fase 1 — Fondazioni

- routing;
- elenco;
- shell persona;
- persona/rapporto;
- autorizzazioni base.

## Fase 2 — Ruoli

- assegnazioni;
- fonte CCIAA;
- workspace;
- mansionario;
- voci base;
- audit.

## Fase 3 — Competenze

- composizione profilo;
- macrocard;
- valutazioni;
- voci personali;
- eccezioni;
- titoli/esperienze.

## Fase 4 — Registrazioni

- formazione;
- abilitazioni;
- idoneità;
- documenti;
- stati.

## Fase 5 — Operatività

- Note;
- Scadenziario;
- Monitoraggio;
- matrice;
- Analisi formazione.

## Fase 6 — Hardening

- performance;
- concorrenza;
- accessibilità;
- visual regression;
- esportazioni;
- sicurezza;
- documentazione.

---

# 33. DEFINITION OF DONE

La funzione è completa soltanto quando:

- usa dati reali;
- non contiene TODO funzionali nascosti;
- non contiene localStorage come database;
- non contiene seed dimostrativi;
- rispetta tenant e permessi;
- ha migrazioni approvate;
- ha rollback;
- ha test;
- ha error/loading/empty state;
- ha audit;
- è responsive;
- è accessibile;
- aggiorna tutte le viste dopo una mutazione;
- non duplica scadenze;
- non duplica mansionari;
- conserva storico;
- documenta API e formule;
- supera i criteri di accettazione.

---

# 34. ISTRUZIONE OPERATIVA PER CLAUDE CODE

Usa il seguente mandato:

> Integra il modulo Personale nel repository esistente seguendo integralmente la specifica SPECIFICA_IMPLEMENTAZIONE_MODULO_PERSONALE_PER_CLAUDE_CODE.md e usando PERSONALE_PROTOTIPO_INTERATTIVO.html come riferimento grafico e interattivo.
>
> Prima di scrivere codice esegui un audit del repository e produci la matrice di corrispondenza tra funzioni richieste, tabelle, modelli, servizi, endpoint e componenti esistenti. Individua in particolare le strutture già presenti per persone, rapporti, mansioni, reparti, ruoli, caratteristiche degli incarichi, formazione, abilitazioni, idoneità, competenze, allegati, scadenze, autorizzazioni e audit.
>
> Non creare né modificare tabelle, colonne, enum, trigger o migrazioni senza approvazione esplicita. Se manca una capacità, proponi la modifica minima con motivazione, SQL logico, migrazione, rollback e impatto. Fermati prima di applicarla.
>
> Mantieni rigorosamente separate l’assegnazione del ruolo e la configurazione aziendale del ruolo. Il mansionario e le voci base di Conoscenza, Competenza e Consapevolezza appartengono al ruolo; la persona li eredita e conserva soltanto valutazioni, voci personali ed eccezioni.
>
> Non implementare le funzioni escluse dalla sezione 3.3. Non copiare dati simulativi, JavaScript monolitico o CSS del prototipo. Riusa design system, autorizzazioni e convenzioni del progetto.
>
> Dopo l’approvazione del database procedi per fasi, aggiungendo test e verificando coerenza tra Panoramica, tab, matrice, Scadenziario e Analisi.

---

# 35. CHECKLIST PRE-APPROVAZIONE

Claude deve compilare:

## Repository

- [ ] struttura frontend individuata;
- [ ] struttura backend individuata;
- [ ] modelli e migrazioni letti;
- [ ] autorizzazioni comprese;
- [ ] sistema allegati individuato;
- [ ] audit individuato;
- [ ] scadenziario esistente analizzato.

## Dati

- [ ] persona mappata;
- [ ] rapporto mappato;
- [ ] mansione/reparto mappati;
- [ ] catalogo ruoli mappato;
- [ ] incarichi CCIAA/manuali mappati;
- [ ] mansionario verificato;
- [ ] voci base verificate;
- [ ] valutazioni verificate;
- [ ] formazione/abilitazioni mappate;
- [ ] idoneità mappata;
- [ ] note mappate.

## Gap

- [ ] nessuna tabella duplicata;
- [ ] gap motivati;
- [ ] proposta minima;
- [ ] migrazione descritta;
- [ ] rollback descritto;
- [ ] impatto stimato;
- [ ] conferma richiesta.

## Implementazione

- [ ] piano per fasi;
- [ ] test pianificati;
- [ ] privacy sanitaria;
- [ ] tenant isolation;
- [ ] responsive;
- [ ] accessibilità;
- [ ] gestione concorrenza;
- [ ] invalidazione cache.

---

# 36. NOTE DI ALLINEAMENTO CON IL PROTOTIPO

Il prototipo versione 9 è dimostrativo. Prima dell’integrazione reale considerare:

1. i numeri e i nomi sono simulati;
2. i toast che dichiarano operazioni simulate non sono comportamento produttivo;
3. il vecchio gestore generico del profilo base nel JavaScript non deve essere esposto;
4. la configurazione delle voci del ruolo avviene nel workspace del ruolo;
5. la matrice definitiva deve includere Competenze;
6. il pulsante Google Calendar resta futuro;
7. gli stati devono essere calcolati dal backend;
8. tutte le mutazioni devono aggiornare le viste correlate;
9. le informazioni riservate devono essere filtrate prima di raggiungere il client.

---

# 37. RIEPILOGO DELLA LOGICA CENTRALE

La logica da preservare è:

    Ruolo
      ├── assegnazione alla persona
      ├── mansionario aziendale condiviso
      └── voci base di valutazione

    Persona
      ├── anagrafica
      ├── rapporto e mansione
      ├── ruoli attivi
      ├── voci ereditate
      ├── voci personali
      ├── eccezioni nascoste
      └── valutazioni storiche

    Registrazioni
      ├── formazione e abilitazioni
      ├── idoneità
      ├── documenti
      └── scadenze

    Viste aggregate
      ├── Panoramica
      ├── Monitoraggio
      ├── Matrice
      ├── Scadenziario
      └── Analisi

Ruoli configura; Persona eredita e valuta; Scadenziario pianifica; le viste aggregate leggono le fonti senza duplicarle.
