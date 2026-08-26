# Specifiche funzionali dei campi della sezione CCIAA

## Direttive vincolanti per Claude Code

### A. Premessa architetturale

Nel database attuale è già stato svolto un lavoro di analisi e suddivisione delle informazioni in tabelle organizzate **per pertinenza del dato e responsabilità funzionale**. Questa organizzazione deve essere considerata una scelta architetturale da preservare.

La decisione di rappresentare nella piattaforma la Camera di Commercio con lo stesso ordine, gli stessi titoli e gli stessi blocchi della visura ufficiale riguarda **esclusivamente il livello di presentazione e consultazione**. Non introduce una nuova suddivisione logica del database e non autorizza a riorganizzare la persistenza secondo i capitoli del PDF.

Devono quindi rimanere distinti due ordinamenti:

1. **ordinamento del database per pertinenza**, nel quale ogni informazione continua a essere conservata nella tabella responsabile del relativo concetto;
2. **ordinamento visuale secondo la visura CCIAA**, nel quale i dati vengono composti e mostrati nello stesso ordine del documento ufficiale, indipendentemente dalla tabella di provenienza.

Questi due ordinamenti non devono coincidere fisicamente.

#### Perimetro delle sezioni già presenti nella schermata

Tutte le sezioni attualmente presenti nella schermata **prima di “Organizzazione”** rientrano integralmente nel presente intervento perché costituiscono parti della nuova sezione visuale unica **CCIAA**. La sezione **“Organizzazione” è espressamente esclusa**.

Questa regola è vincolante. Le sezioni esistenti comprese in tale intervallo non devono essere considerate moduli autonomi da lasciare affiancati alla nuova CCIAA e non devono essere escluse dall'analisi perché possiedono titoli differenti da quelli della visura.

Claude Code deve:

- censire tutte le sezioni attualmente visualizzate che precedono **Organizzazione**, escludendo Organizzazione stessa;
- elencare tutti i campi, i record ripetibili, le azioni, i controlli e le funzioni presenti in ciascuna di esse;
- inserire ogni elemento nella matrice di corrispondenza obbligatoria;
- individuare la sezione e il punto della nuova gerarchia camerale in cui l'elemento deve essere mostrato;
- ricollocare gli elementi nella sezione visuale unica CCIAA seguendo l'ordine del PDF;
- continuare a leggere e salvare ciascun dato attraverso la tabella, il servizio e l'endpoint responsabili già esistenti;
- preservare importazione, modifica, verifica, note, audit, permessi e collegamenti agli altri moduli;
- evitare che lo stesso campo resti visibile contemporaneamente nella vecchia posizione e nella nuova, salvo un periodo transitorio esplicitamente concordato;
- aggiornare navigazione, indice, titoli e collegamenti interni affinché le vecchie sezioni risultino parti della CCIAA e non percorsi concorrenti.

La confluenza nella sezione unica CCIAA è quindi **una fusione della presentazione**, non una fusione delle tabelle.

Se una voce già presente nelle sezioni precedenti a Organizzazione non possiede una corrispondenza evidente con i titoli del PDF, Claude Code non deve eliminarla né collocarla arbitrariamente. Deve classificarla come elemento esistente senza corrispondenza visuale certa, descriverne funzione e origine e chiedere in quale blocco della CCIAA debba essere mantenuta.

La sezione **Organizzazione** e tutte le sezioni collocate dopo di essa non rientrano in questa confluenza. Devono essere lasciate invariate, salvo che una successiva istruzione le richiami espressamente.

### B. Regola fondamentale: la struttura del PDF è una struttura visuale

Le sezioni 0–10 e i relativi sottoblocchi descritti nel presente documento devono essere interpretati come **contenitori visuali** della sezione CCIAA della piattaforma.

Una singola sezione visuale può legittimamente contenere campi provenienti da numerose tabelle differenti. Ad esempio, uno stesso blocco dell'interfaccia può mostrare cinque o più campi letti da sei tabelle diverse, purché l'ordine finale corrisponda alla visura ufficiale e ogni dato continui a essere gestito dalla propria struttura autorevole.

Claude Code deve pertanto:

- comporre i blocchi visuali recuperando i dati dalle tabelle esistenti;
- usare servizi, query, endpoint, DTO/view model o componenti di aggregazione coerenti con l'architettura già adottata;
- mantenere per ogni campo la corretta origine tecnica;
- presentare le informazioni secondo l'ordine del PDF senza imporre quell'ordine al database;
- mantenere separati i concetti anche quando vengono mostrati uno accanto all'altro nell'interfaccia;
- garantire che una modifica effettuata dalla sezione CCIAA venga salvata nella tabella realmente responsabile del dato.

Il termine **vista** usato nel presente documento indica prima di tutto una vista funzionale/frontend. Non deve essere interpretato automaticamente come richiesta di creare una `VIEW` SQL. Una vista SQL, un nuovo endpoint aggregato o un read model possono essere proposti soltanto se risultano coerenti con il progetto e realmente necessari; non devono diventare un modo per duplicare o spostare i dati.

### C. Operazioni espressamente vietate

La nuova organizzazione visuale non autorizza Claude Code a:

- creare una tabella per ogni sezione o sottosezione della visura;
- accorpare in una sola tabella tutti i dati mostrati nello stesso blocco frontend;
- spostare colonne tra tabelle soltanto per far coincidere database e PDF;
- rinominare tabelle o colonne esclusivamente per riprodurre i titoli camerali;
- duplicare un dato già esistente in una seconda tabella o colonna;
- creare campi “di comodo” che copino valori già disponibili altrove;
- trasformare sezioni strutturate in un unico JSON o testo non interrogabile allo scopo di semplificare la pagina;
- eliminare o ricreare tabelle contenenti dati;
- modificare relazioni, chiavi o responsabilità delle tabelle senza una necessità funzionale dimostrata e senza conferma;
- creare nuovi cataloghi o nuove tabelle relazionali senza aver verificato l'esistenza di strutture equivalenti;
- dedurre dalla numerazione 0–10 una numerazione delle migrazioni o dei file SQL;
- considerare la gerarchia visuale registrata in `sys_elementi` come se fosse la struttura fisica di appartenenza del dato.

Se un concetto è già correttamente conservato in una tabella pertinente, quella tabella deve rimanere la fonte autorevole anche quando il dato viene visualizzato in un capitolo camerale differente.

### D. Obiettivo effettivo dell'intervento

Il lavoro richiesto ha due obiettivi distinti:

1. **riordinare la presentazione**, affinché l'utente visualizzi la Camera di Commercio nello stesso ordine e con la stessa logica del documento ufficiale;
2. **correggere il funzionamento dei campi già esistenti**, utilizzando le specifiche contenute nel presente Markdown per migliorare descrizione, controllo, validazione, gestione dei valori nulli, menu, ripetibilità, provenienza, storicizzazione, importazione e stato di verifica.

Il documento non deve essere interpretato come ordine di implementare automaticamente ogni informazione elencata. La descrizione di un campo stabilisce **come quel campo deve funzionare se è già presente oppure se ne verrà autorizzata l'implementazione**; non costituisce di per sé autorizzazione a creare nuove strutture.

### E. Analisi obbligatoria prima di modificare il codice

Prima di implementare qualsiasi modifica Claude Code deve analizzare almeno:

- tabelle, colonne, viste e relazioni attualmente presenti;
- migrazioni già applicate e convenzioni di naming;
- modelli ORM, schemi di validazione, servizi e repository;
- endpoint e payload API utilizzati dalla sezione CCIAA;
- componenti frontend e configurazioni che determinano ordine, visibilità e modifica dei campi;
- processo di estrazione PDF/JSON e riconciliazione dei dati importati;
- utilizzo dei medesimi dati da parte di altri moduli;
- registrazione degli elementi in `sys_elementi` e relative associazioni;
- sistema di verifica, presa visione, approvazione e revisione;
- eventuali cataloghi già esistenti per menu, classificazioni e stati.

Claude Code non deve modificare lo schema basandosi soltanto sui nomi usati nel presente documento. Deve prima individuare dove il concetto è già rappresentato, anche se possiede una denominazione tecnica diversa.

### F. Matrice di corrispondenza obbligatoria

Prima di procedere con l'implementazione Claude Code deve produrre una matrice di corrispondenza per tutti i campi delle sezioni 0–10.

La matrice deve comprendere anche tutti gli elementi attualmente presenti nelle sezioni della schermata che precedono **Organizzazione**, escludendo Organizzazione stessa, anche quando un elemento non compare nel presente elenco o non possiede ancora una collocazione camerale certa.

Per ogni campo la matrice deve indicare almeno:

| Informazione richiesta | Contenuto della mappatura |
|---|---|
| Percorso visuale | Sezione, sottosezione e campo secondo il presente documento. |
| Stato di esistenza | Esistente, parzialmente esistente, derivabile, mancante oppure da chiarire. |
| Origine attuale | Schema, tabella, colonna, vista o calcolo già utilizzato. |
| Percorso applicativo | Modello, servizio, endpoint e componente frontend coinvolti. |
| Comportamento attuale | Tipo di controllo, validazioni, gestione `NULL`, importazione e verifica attualmente applicati. |
| Comportamento richiesto | Differenza rispetto alle specifiche contenute nel presente documento. |
| Azione proposta | Solo riordino visuale, correzione del comportamento, riuso di dato esistente, calcolo, migrazione oppure possibile nuova implementazione. |
| Impatto | Database, backend, frontend, importazione, catalogo, audit, altri moduli e dati esistenti. |
| Decisione necessaria | Indicare esplicitamente se è richiesta una conferma prima di procedere. |

Ogni campo deve essere classificato in una delle seguenti categorie:

- **A — Esistente e conforme:** il dato esiste e funziona già secondo la specifica; è necessario soltanto posizionarlo correttamente nella nuova vista.
- **B — Esistente ma da correggere:** il dato esiste, ma controllo, validazione, importazione, descrizione, stato, storicizzazione o altra logica devono essere adeguati.
- **C — Esistente con denominazione o posizione tecnica differente:** il concetto è già presente e deve essere riutilizzato senza duplicarlo.
- **D — Derivabile:** il valore può essere calcolato o aggregato da dati esistenti e non deve essere memorizzato nuovamente.
- **E — Mancante:** il dato e la struttura necessaria non risultano presenti nel progetto.
- **F — Ambiguo:** non è possibile stabilire con sicurezza se una struttura esistente rappresenti il medesimo concetto.

### G. Gestione obbligatoria delle informazioni mancanti

È noto fin da ora che il database attuale **non contiene tutte le informazioni elencate nel presente Markdown**.

Quando Claude Code individua un campo, un record ripetibile, un catalogo o una relazione appartenente alla categoria **E — Mancante**, non deve implementarlo automaticamente.

Deve invece:

1. descrivere l'informazione mancante e il punto del documento in cui è richiesta;
2. dimostrare che non esiste già una struttura equivalente o riutilizzabile;
3. spiegare perché il dato non può essere semplicemente derivato;
4. indicare la possibile soluzione minima, specificando tabelle/colonne o cataloghi coinvolti;
5. descrivere impatti su importazione, API, frontend, audit, verifiche e altri moduli;
6. indicare eventuali alternative che riutilizzino maggiormente lo schema esistente;
7. chiedere espressamente se l'informazione debba essere implementata oppure esclusa.

La richiesta di decisione deve essere presentata in una tabella chiara, con una riga per ogni informazione mancante o per gruppi realmente omogenei. Per ciascuna riga devono essere disponibili almeno le opzioni:

- **Implementare**;
- **Non implementare**;
- **Rinviare**;
- **Riutilizzare una struttura alternativa proposta**.

Claude Code deve attendere la decisione prima di creare tabelle, colonne, cataloghi, relazioni, migrazioni o componenti dedicati ai dati mancanti. L'assenza di una risposta non equivale ad approvazione.

Se il campo manca soltanto nel frontend ma il dato è già correttamente disponibile nel database/backend, non deve essere classificato come nuova informazione: deve essere trattato come riordino o completamento della vista.

### H. Gestione dei campi già esistenti

Per i campi appartenenti alle categorie **A**, **B**, **C** o **D**, il presente documento deve essere utilizzato per correggere e uniformare il comportamento, senza duplicare la persistenza.

In particolare Claude Code deve verificare:

- significato effettivo del campo;
- tabella autorevole;
- tipo e formato del dato;
- controllo frontend appropriato;
- opzioni e descrizioni dei menu;
- obbligatorietà e applicabilità;
- distinzione tra `NULL`, zero, falso e non applicabile;
- record singolo o ripetibile;
- necessità di periodo, data di riferimento o storico;
- provenienza ufficiale, manuale o generata;
- comportamento in caso di nuova importazione;
- stato di verifica e note;
- riuso del dato negli altri moduli.

Le correzioni non distruttive che utilizzano strutture già esistenti rientrano nell'obiettivo del lavoro. Se però la correzione di un campo esistente richiede nuove colonne, nuove tabelle, spostamento di dati, modifica sostanziale di chiavi/relazioni o creazione di cataloghi, Claude Code deve evidenziarlo e richiedere conferma prima di intervenire.

### I. Composizione della vista CCIAA

La pagina deve essere composta seguendo l'ordine delle sezioni e delle voci del presente documento, ma per ogni campo deve continuare a utilizzare il proprio percorso dati reale.

L'implementazione deve garantire che:

- il caricamento della pagina aggreghi i dati senza produrre copie persistenti;
- il salvataggio di un campo sia instradato alla corretta struttura responsabile;
- autorizzazioni, audit e isolamento multi-azienda rimangano applicati a ogni origine;
- record ripetibili provenienti da tabelle diverse mantengano identificatori stabili;
- errori in una sorgente non provochino il salvataggio parziale inconsapevole in altre tabelle;
- il frontend non debba conoscere dettagli tecnici non necessari, ma il backend mantenga tracciabile la provenienza;
- gli altri moduli che utilizzano gli stessi dati continuino a funzionare senza regressioni;
- la Vista di sintesi finale legga gli stessi dati e non possieda una persistenza autonoma.

L'eventuale endpoint aggregato deve essere un livello di composizione. Non deve diventare una nuova fonte autorevole né ricevere salvataggi generici che rendano ambiguo dove finiscono i dati.

### J. Trattamento delle discrepanze e delle ambiguità

Se il Markdown e il progetto utilizzano nomi differenti, Claude Code deve confrontare significato, fonte, cardinalità e comportamento prima di concludere che il campo è mancante.

Se due tabelle sembrano contenere lo stesso concetto, non deve sceglierne arbitrariamente una, accorparle o eliminarne una. Deve documentare:

- differenza semantica;
- utilizzi attuali;
- dati presenti;
- dipendenze applicative;
- possibile fonte autorevole;
- rischio di duplicazione o perdita;
- decisione richiesta.

Se un campo del Markdown risulta troppo generico rispetto al database, devono essere mantenuti i concetti più precisi già esistenti e aggregati soltanto nella visualizzazione.

### K. Ordine operativo obbligatorio

Claude Code deve procedere nel seguente ordine:

1. analizzare repository, schema, migrazioni e flussi esistenti;
2. censire tutte le sezioni e le funzioni della schermata attuale precedenti a **Organizzazione**, escludendo Organizzazione;
3. confrontare il prototipo HTML con il comportamento reale della piattaforma e sottoporre all'utente tutte le differenze rilevanti;
4. analizzare le tabelle del modulo Personale e le strutture camerali relative a soggetti, cariche, partecipazioni e organi di controllo;
5. produrre la matrice di corrispondenza completa tra struttura attuale e nuova sezione unica CCIAA;
6. separare riordino visuale, correzioni di campi esistenti e informazioni mancanti;
7. presentare l'elenco delle informazioni mancanti e attendere le decisioni;
8. ottenere conferma sulle differenze fra HTML e piattaforma esistente;
9. proporre la composizione frontend/backend della nuova vista CCIAA;
10. implementare il riordino visuale riutilizzando le strutture esistenti;
11. far confluire nella CCIAA tutte le sezioni attuali precedenti a Organizzazione, senza includere Organizzazione e senza duplicarne la persistenza;
12. integrare le viste di soci, amministratori, sindaci e revisori con l'anagrafica autorevole del modulo Personale;
13. correggere il comportamento dei campi già presenti secondo le specifiche approvate;
14. implementare soltanto le informazioni mancanti espressamente autorizzate;
15. aggiornare `sys_elementi` e le altre configurazioni senza cambiare la responsabilità fisica dei dati;
16. eseguire test di regressione, importazione, modifica, autorizzazione e persistenza sulle diverse tabelle coinvolte;
17. consegnare un riepilogo di ogni file, tabella, campo, endpoint e componente modificato.

### L. Criteri di accettazione specifici

L'intervento non può essere considerato completato se non risultano soddisfatti tutti i seguenti criteri:

- la sezione CCIAA segue l'ordine visuale del PDF ufficiale;
- tutte le sezioni della schermata attuale precedenti a **Organizzazione** sono confluite nella sezione visuale unica CCIAA;
- nessun campo o comportamento appartenente a tali sezioni è stato perso durante la ricollocazione;
- le vecchie sezioni non rimangono come percorsi paralleli o duplicati non autorizzati;
- la sezione **Organizzazione** e tutte le sezioni successive sono rimaste invariate, salvo istruzioni esplicite;
- il prototipo HTML è stato confrontato con la piattaforma e nessun comportamento esistente è stato sostituito senza conferma;
- la vista al 50% già funzionante conserva apertura in primo piano e oscuramento dello sfondo;
- i titoli camerali non hanno imposto una nuova suddivisione fisica del database;
- i dati continuano a essere organizzati per pertinenza nelle tabelle autorevoli;
- una stessa sezione visuale può leggere e modificare correttamente campi provenienti da tabelle diverse;
- nessun dato esistente è stato duplicato per esigenze di visualizzazione;
- nessuna tabella è stata creata, accorpata, rinominata o ricostruita soltanto per imitare il PDF;
- ogni informazione mancante implementata dispone di una conferma esplicita;
- ogni informazione mancante non approvata è stata esclusa senza introdurre placeholder strutturali;
- i campi esistenti funzionano secondo le descrizioni e i controlli del presente documento;
- salvataggi, importazioni, verifiche e audit raggiungono la tabella corretta;
- i dati anagrafici di soci, amministratori, sindaci e revisori sono letti dalle strutture autorevoli del modulo Personale e non duplicati nelle tabelle CCIAA;
- le tabelle CCIAA conservano esclusivamente riferimenti al soggetto e dati della carica, incarico, partecipazione o diritto;
- la selezione di una persona aggiorna automaticamente la vista dei suoi dati senza copiarli nel record camerale;
- la rimozione di una carica o partecipazione non elimina la persona e preserva storico e audit;
- la stessa persona può essere collegata a più ruoli senza produrre duplicati anagrafici;
- gli altri moduli continuano a utilizzare gli stessi dati senza regressioni;
- la Vista di sintesi rimane esclusivamente frontend e priva di dati duplicati.

### M. Uso del prototipo HTML e confronto con la piattaforma esistente

Il file HTML fornito insieme al presente documento rappresenta una **linea guida visuale e funzionale** per comprendere il risultato desiderato. Non costituisce un modello perfetto, una specifica pixel-perfect o un ordine di sostituire automaticamente ciò che è già stato implementato nella piattaforma.

Il prototipo può contenere:

- soluzioni grafiche da adottare;
- comportamenti semplificati o incompleti;
- dati dimostrativi o hard-coded;
- componenti privi delle logiche reali della piattaforma;
- interazioni meno efficaci di quelle già implementate;
- differenze dovute al fatto che si tratta di una dimostrazione HTML isolata.

Claude Code deve quindi confrontare sistematicamente il prototipo HTML con la piattaforma esistente prima di modificare qualsiasi componente. Per ogni differenza deve produrre una tabella con:

| Informazione | Contenuto richiesto |
|---|---|
| Elemento confrontato | Pagina, sezione, componente o interazione interessata. |
| Comportamento attuale | Funzionamento effettivamente presente nella piattaforma. |
| Comportamento HTML | Funzionamento mostrato nel prototipo. |
| Valutazione | Vantaggi, limiti e funzioni eventualmente mancanti in entrambe le soluzioni. |
| Proposta | Mantenere l'esistente, adottare l'HTML, combinare le due soluzioni oppure formulare un'alternativa. |
| Impatto | File, componenti, stato, API, accessibilità, responsive e regressioni potenziali. |
| Decisione richiesta | Conferma esplicita dell'utente prima di intervenire. |

Non esiste una regola generale secondo cui l'HTML prevale sulla piattaforma o viceversa. In presenza di una differenza, Claude Code deve chiedere quale soluzione adottare, presentando una proposta motivata. L'assenza di risposta non autorizza la sostituzione del comportamento esistente.

In particolare, la **vista al 50% dell'anteprima di una scheda già implementata nella piattaforma**, che apre correttamente il contenuto e oscura il resto dello sfondo, deve essere considerata il comportamento di riferimento da preservare. Il prototipo HTML attuale non riproduce correttamente questa interazione e non deve essere utilizzato per degradarla. Eventuali variazioni devono essere sottoposte a conferma.

Claude Code non deve eliminare funzioni esistenti soltanto perché non sono rappresentate nel prototipo. Deve inoltre evitare di copiare nel codice di produzione dati dimostrativi, stili duplicati o logiche statiche presenti nell'HTML.

Il prototipo deve quindi essere usato per orientare:

- ordine e composizione dei blocchi;
- stile generale;
- gerarchia visiva;
- dimensioni e proporzioni;
- contenuti e azioni desiderate;
- confronto tra modalità a tutta larghezza, al 50% e viste di dettaglio.

Le decisioni approvate dopo il confronto diventano vincolanti e devono essere riepilogate prima dell'implementazione.

### N. Modello autorevole per persone, cariche, incarichi e partecipazioni

Le tabelle visuali presenti nelle sezioni **Soci**, **Amministratori**, **Sindaci**, **Revisori** e negli altri blocchi di governance devono essere considerate composizioni di due famiglie di dati differenti:

1. **dati propri della persona o del soggetto**, appartenenti alle strutture autorevoli del modulo Personale;
2. **dati della carica, dell'incarico, della partecipazione o del diritto**, appartenenti alle strutture camerali e di governance della CCIAA.

La posizione del dato nella pagina non cambia questa responsabilità. Nome, cognome, codice fiscale, nascita, cittadinanza, domicilio e contatti non devono essere copiati nelle tabelle CCIAA per costruire la riga visuale. La riga deve contenere il riferimento stabile alla persona o al soggetto e deve leggere i dati anagrafici dalle tabelle del modulo Personale.

I dati specifici della relazione devono invece essere salvati e modificati nelle strutture camerali pertinenti. Rientrano in questa categoria, a seconda del blocco:

- tipo di carica o incarico;
- organo di appartenenza;
- rappresentanza dell'impresa;
- data dell'atto di nomina;
- data di iscrizione;
- durata e scadenza;
- stato della carica;
- poteri e limitazioni;
- tipo di diritto sulla partecipazione;
- valore nominale, percentuale e importo versato;
- quota del diritto e forma di titolarità;
- data di riferimento dell'assetto societario;
- altri attributi appartenenti alla relazione e non alla persona.

#### N.1 Struttura della riga visuale

Ogni riga o scheda deve rappresentare una **relazione** e non una copia della persona. Deve possedere un identificatore stabile proprio e almeno un riferimento alla persona/soggetto collegato.

| Parte visualizzata | Fonte autorevole | Comportamento nella sezione CCIAA |
|---|---|---|
| Persona o soggetto selezionato | Tabelle del modulo Personale o struttura soggetti esistente | Selezionabile tramite menu a tendina/autocomplete. |
| Nome, cognome, codice fiscale, nascita, cittadinanza, domicilio e PEC | Scheda della persona selezionata | Compilazione automatica e sola lettura nella CCIAA. |
| Dati della carica o partecipazione | Tabelle camerali/relazionali pertinenti | Modificabili direttamente nella riga. |
| Stato, storico e provenienza della relazione | Sistema camerale, audit e verifica | Gestiti sull'istanza della relazione. |
| Azione di rimozione | Relazione persona–impresa/carica/partecipazione | Cessa o rimuove la relazione dalla vista; non elimina la persona. |

#### N.2 Menu di selezione della persona

Quando la sezione viene posta in modifica, il campo che identifica la persona deve diventare un menu a tendina ricercabile. Il menu deve:

- mostrare soltanto soggetti accessibili nell'azienda corrente, rispettando l'isolamento multi-tenant;
- ricercare almeno per nome, cognome e codice fiscale;
- mostrare opzioni nel formato indicativo **Cognome Nome — codice fiscale — data di nascita**, così da distinguere omonimi;
- restituire e salvare l'identificatore stabile della persona, non il testo visualizzato;
- impedire la creazione di duplicati dovuti a differenze grafiche del nome;
- non accettare testo libero come sostituto di una persona censita;
- aggiornare automaticamente tutti i dati anagrafici mostrati nella riga quando cambia la selezione;
- mantenere invariati i dati della carica finché l'utente non li modifica espressamente;
- segnalare se la nuova persona selezionata possiede già la stessa carica o relazione nel medesimo periodo;
- prevedere un'azione **Apri scheda persona** per consultare o correggere i dati anagrafici nella loro sede autorevole.

Se la persona necessaria non è ancora presente, l'interfaccia non deve creare un record anagrafico incompleto attraverso un semplice valore libero. Deve utilizzare il flusso autorizzato di creazione della persona nel modulo Personale e, dopo il salvataggio, riportare la nuova persona nel menu.

#### N.3 Importazione dalla visura

Durante l'acquisizione automatica della visura il sistema deve elaborare separatamente la persona e la relazione camerale:

1. identificare la persona, principalmente tramite codice fiscale;
2. cercare una corrispondenza nelle tabelle del modulo Personale;
3. riutilizzare la persona esistente quando la corrispondenza è certa;
4. creare la persona nelle strutture del modulo Personale quando non esiste e l'implementazione necessaria è già disponibile o approvata;
5. confrontare i dati personali importati con quelli esistenti applicando le regole di provenienza, aggiornamento e verifica;
6. creare o aggiornare separatamente la carica, l'incarico, la partecipazione o il diritto nelle strutture CCIAA;
7. collegare la relazione alla persona tramite identificatore stabile;
8. evitare qualsiasi duplicazione dei dati anagrafici nelle tabelle camerali.

La stessa persona può apparire in più sezioni e ricoprire più funzioni. Deve esistere un solo soggetto anagrafico, collegato a più relazioni autonome. Non devono essere creati più record persona perché la stessa persona è contemporaneamente socio, amministratore o rappresentante dell'impresa.

L'iscrizione della persona nel modulo Personale non implica l'esistenza di un rapporto di lavoro. Amministratori, soci, sindaci e revisori non devono ricevere contratti, mansioni o rapporti lavorativi fittizi. La scheda personale e il rapporto di lavoro sono concetti distinti.

#### N.4 Modifica e rimozione

Nella sezione CCIAA i dati anagrafici della persona sono visualizzati in sola lettura. Sono modificabili in quella sede soltanto:

- la persona collegata, attraverso il menu di selezione;
- i dati della carica, dell'incarico, della partecipazione o del diritto;
- lo stato e le date della relazione;
- le note e le informazioni di verifica riferite alla relazione.

La sostituzione della persona deve modificare il riferimento della relazione e non deve copiare i valori anagrafici nella tabella camerale.

La rimozione di una riga non deve mai cancellare la persona dal modulo Personale. Deve cessare, disattivare o rendere non corrente la sola relazione, conservando storico, audit, fonte e date. Se il database attuale gestisce una cancellazione fisica, Claude Code deve proporre l'adeguamento e chiedere conferma prima di cambiare la semantica.

Una nuova importazione deve poter distinguere fra:

- persona già esistente e relazione invariata;
- persona già esistente con relazione modificata;
- persona già esistente con nuova relazione;
- nuova persona e nuova relazione;
- relazione non più presente nella nuova visura;
- possibile duplicato o corrispondenza incerta.

#### N.5 Soggetti giuridici e altri titolari

Un socio o titolare di diritti può essere una persona giuridica o un altro soggetto non riconducibile a una persona fisica. Tali soggetti non devono essere forzati nelle tabelle progettate esclusivamente per persone fisiche.

Claude Code deve verificare se il progetto dispone già di una struttura autorevole per società, enti, comunioni o altri soggetti. Se manca, deve classificare il caso come informazione/struttura mancante e chiedere conferma prima di introdurla. Il menu della sezione Soci dovrà utilizzare il selettore del tipo di soggetto appropriato, mantenendo la medesima separazione tra dati del soggetto e dati della partecipazione.

#### N.6 Verifiche obbligatorie sul database esistente

Prima di implementare questo comportamento Claude Code deve verificare:

- quali tabelle del modulo Personale rappresentano l'anagrafica unica;
- quali vincoli impediscono i duplicati, in particolare sul codice fiscale;
- se domicilio, cittadinanza e contatti sono attributi diretti o record storici collegati;
- quali tabelle camerali contengono già cariche, soci, quote, diritti e organi di controllo;
- come sono attualmente gestiti cessazione, storico e cancellazione;
- se i record importati conservano fonte e identificatore della visura;
- come la verifica è collegata alla singola relazione;
- se il frontend salva attualmente copie dei dati personali nelle tabelle camerali;
- quali API possono comporre i dati senza alterarne la responsabilità.

Se una relazione o un campo necessario manca, deve essere applicato il processo di conferma previsto per le informazioni mancanti. Il presente principio autorizza il riuso delle tabelle del modulo Personale, ma non autorizza automaticamente la creazione di nuove tabelle camerali.

---

## 1. Scopo e perimetro

Il documento descrive i dati delle sezioni **0–10** della visura camerale digitale della piattaforma. Per ogni campo definisce:

- l'informazione che deve contenere;
- il significato funzionale;
- il comportamento in importazione, consultazione e modifica;
- il controllo da utilizzare nell'interfaccia;
- i valori ammessi e le validazioni principali;
- la natura del dato utile alla successiva rielaborazione del database.

La **Vista di sintesi** non è descritta campo per campo in questo documento perché è una composizione frontend. Essa deve leggere i dati delle sezioni 0–10 senza introdurre copie o tabelle autonome.

La presente specifica non assegna ancora in modo definitivo i campi alle tabelle fisiche esistenti. Prima di creare, eliminare, accorpare o modificare tabelle, dovrà essere effettuata una mappatura tra questo modello funzionale e lo schema reale del progetto. Ogni nuova struttura necessaria dovrà essere sottoposta a conferma.

---

# 2. Regole trasversali applicabili a tutti i campi

## 2.1 Provenienza del dato

Ogni valore deve conservare una provenienza distinguibile:

- **CCIAA/importato**: valore estratto dal PDF, dal JSON o da altra fonte camerale ufficiale;
- **manuale**: valore inserito o integrato da un utente autorizzato;
- **generato**: valore calcolato dalla piattaforma a partire da altri dati;
- **catalogo esterno**: valore associato a un catalogo ufficiale, come ATECO, NACE, Paesi, valute, settori IAF o categorie SOA.

Il dato camerale ufficiale non deve essere sovrascritto senza traccia. Se la piattaforma consente una correzione o integrazione manuale, devono rimanere distinguibili almeno il valore importato, il valore corrente utilizzato dalla piattaforma, l'autore della modifica, la data della modifica e la motivazione o nota.

## 2.2 Importazione e aggiornamento

- Un nuovo valore deve essere inserito.
- Un valore esistente realmente cambiato deve essere aggiornato e deve riaprire il controllo.
- Un valore identico deve produrre un aggiornamento idempotente, senza duplicazioni e senza invalidare una verifica valida.
- Per i record multipli il confronto deve avvenire sulla corretta istanza, evitando di confondere persone, sedi, quote, certificazioni o classificazioni differenti.
- Quando la fonte non riporta un campo, il valore deve rimanere `NULL`; non deve essere trasformato in zero, falso o stringa vuota.

## 2.3 Stati di verifica

Ogni campo o istanza soggetta a controllo deve poter assumere almeno i seguenti stati:

- **DA_VERIFICARE**: dato nuovo, modificato oppure applicabile ma non ancora verificato;
- **APPROVATO**: dato controllato e accettato rispetto al valore corrente;
- **IN_REVISIONE**: dato ritenuto errato, incompleto o da correggere; richiede obbligatoriamente una nota.

Una nuova importazione che modifica il valore approvato deve riportare il campo a **DA_VERIFICARE**. Una nuova importazione che conferma lo stesso valore non deve modificare lo stato. La semplice apertura del dato, l'aggiunta di una nota o il cambio di visibilità non equivalgono all'approvazione.

## 2.4 Applicabilità e valori assenti

- `NULL` significa informazione assente, non disponibile o non estratta.
- `0` è un valore numerico valido e deve essere distinto da `NULL`.
- `false` o **No** è una risposta esplicita e deve essere distinto da informazione non disponibile.
- **Non applicabile** deve essere gestito come stato di applicabilità separato, non come testo inserito nel campo.
- In lettura un valore nullo può essere mostrato come “—”; in modifica il controllo deve essere vuoto.
- Le sezioni e sottosezioni non applicabili alla forma giuridica o al tipo di visura non devono essere forzate.

## 2.5 Controlli standard

| Controllo | Regola comune |
|---|---|
| Testo breve | Input su una riga, spazi normalizzati, lunghezza massima definita, nessuna conversione automatica in maiuscolo nel dato persistito. |
| Testo esteso | Area di testo multilinea, conservazione dei capoversi, nessun limite artificiale incompatibile con statuti, oggetti sociali o poteri. |
| Data | Date picker con formato visuale italiano `GG/MM/AAAA`; nel dato usare una data senza orario. Vietate date impossibili. |
| Data e ora | Date-time picker soltanto quando l'ora è significativa; memorizzazione con fuso orario. |
| Numero intero | Input numerico senza decimali; valori negativi vietati salvo diversa indicazione. |
| Importo | Input monetario con separatori italiani in visualizzazione; memorizzazione decimale esatta, mai floating point. Valuta separata. |
| Percentuale | Input numerico decimale; mostrare `%` come suffisso; controllare l'intervallo specifico del campo. |
| Sì/No/Non disponibile | Select a tre stati o radio button; non usare un semplice checkbox quando deve essere distinto `No` da `NULL`. |
| Menu singolo | Select ricercabile se il catalogo supera circa 15 opzioni; nessun valore preselezionato. |
| Menu multiplo | Multi-select con ricerca, visualizzazione a tag e possibilità di rimuovere una singola selezione. |
| Autocomplete da catalogo | Ricerca per codice e descrizione; il record salva l'identificativo del catalogo e conserva il testo originale della fonte. |
| Record ripetibile | Tabella o card con azioni Aggiungi, Modifica e Rimuovi; ogni istanza possiede un identificatore stabile e un proprio stato di verifica. |
| Campo calcolato | Sola lettura; mostra origine e regola di calcolo nel tasto Info; non deve essere duplicato come valore manuale. |

## 2.6 Regole dei menu a tendina

I menu non devono dipendere da liste hard-coded nel frontend. Devono leggere cataloghi versionabili e attivabili. Ogni catalogo deve prevedere almeno codice stabile, denominazione, descrizione, ordine, stato attivo e, quando necessario, periodo di validità.

Se la CCIAA restituisce un valore non ancora presente nel catalogo:

1. il valore originale deve essere conservato;
2. il record non deve essere scartato;
3. deve essere marcato come **da classificare**;
4. l'utente non deve poter creare liberamente duplicati con differenze di maiuscole, apostrofi o abbreviazioni;
5. l'eventuale aggiunta al catalogo generale deve seguire il flusso autorizzativo del progetto.

## 2.7 Indicazioni per il database

- I campi scalari descrivono un solo valore corrente dell'impresa o del documento.
- I gruppi ripetibili devono essere record distinti, non colonne numerate.
- I dati storici devono avere data o periodo di validità/rilevazione.
- Le classificazioni devono referenziare cataloghi, conservando anche il valore testuale originale della fonte.
- I conteggi riepilogativi derivabili da record di dettaglio non devono essere duplicati, salvo snapshot camerali espressamente identificati come tali.
- Ogni elemento deve essere migrato in `sys_elementi` con codice stabile, gerarchia, descrizione per il tasto Info e riferimento tecnico; le associazioni a certificazioni e IAF devono usare i meccanismi esistenti.

---

# 3. Specifiche campo per campo

## 0. Dati presenti nella pagina di sintesi e non riportati nelle sezioni successive

Questa sezione conserva soltanto informazioni presenti nella prima pagina che non vengono ripetute nei capitoli 1–10. Gli altri valori della prima pagina sono letti dalle rispettive sezioni di dettaglio.

### 0.1 Identificazione e verifica del documento

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipo di visura | Denominazione ufficiale del documento, ad esempio “Visura ordinaria società di capitale”. Identifica sia la profondità temporale sia la tipologia di soggetto cui la visura si riferisce. Deve conservare la dicitura originale e, quando possibile, essere collegata a un codice normalizzato. | In importazione è valorizzato automaticamente. In modifica usare un autocomplete da catalogo dei tipi di visura, ricercabile per denominazione. Il catalogo deve distinguere almeno visura ordinaria e storica e le categorie di impresa previste dal Registro Imprese. Valori sconosciuti restano importati come “da classificare”. | Scalare, testo originale + riferimento a catalogo. |
| Camera di Commercio emittente | Camera di Commercio che ha prodotto il documento, completa dell'ambito territoriale, ad esempio “TREVISO - BELLUNO”. Non coincide necessariamente con una semplice provincia. | Autocomplete obbligatorio dal catalogo ufficiale delle CCIAA italiane, con ricerca per denominazione, provincia e codice. Conservare la denominazione originale. Non consentire testo libero se il catalogo contiene la Camera. | Scalare, riferimento a catalogo territoriale. |
| Numero del documento | Identificativo univoco stampato nel piè di pagina della visura. Serve per riconoscere il documento sorgente e impedire importazioni duplicate. | Campo alfanumerico normalmente di sola lettura, valorizzato dall'importazione. Rimuovere soltanto gli spazi tipografici introdotti dall'estrazione PDF, preservando il codice effettivo. Deve essere univoco almeno rispetto alla fonte emittente. | Scalare, stringa indicizzata. |
| Data di estrazione | Data in cui il documento è stato estratto dal Registro Imprese. Non rappresenta la data dell'ultima pratica né la data di importazione nella piattaforma. | Date picker in inserimento manuale; valorizzazione automatica in importazione. Non può essere futura rispetto al momento di acquisizione, salvo tolleranza tecnica documentata. | Scalare, `DATE`. |
| QR Code di verifica | Contenuto o riferimento del QR Code che consente di verificare la corrispondenza tra la visura acquisita e quella archiviata al momento dell'estrazione. Non deve essere confuso con una semplice immagine decorativa. | Acquisizione automatica dal documento quando tecnicamente disponibile. In UI mostrare azione “Verifica documento”; nessun input manuale ordinario. Validare il formato del payload o dell'URL e accettare solo destinazioni ufficiali previste. | Scalare opzionale, payload/URL protetto; eventuale immagine come allegato. |

### 0.2 Informazioni sull'attività presenti soltanto nella sintesi

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Stato attività | Stato camerale dell'impresa alla data della visura, ad esempio “attiva”. Non coincide con lo stato di una singola unità locale né con lo stato dell'abbonamento alla piattaforma. | Menu singolo da catalogo degli stati camerali. Deve includere almeno **Attiva**, **Inattiva**, **Sospesa**, **In liquidazione**, **Cessata**, **Cancellata** e altri stati ufficiali supportati dalla fonte. Ogni opzione deve avere una descrizione giuridico-operativa; valori nuovi della CCIAA restano da classificare. | Scalare storico, riferimento a catalogo. |
| Codice NACE 2.1 | Codice europeo NACE riportato nella prima pagina, ad esempio `41.00`. Deve essere distinto dal codice ATECO nazionale e associato alla corretta versione della classificazione. | Autocomplete dal catalogo NACE versionato; ricerca per codice e descrizione. Il controllo deve mostrare “codice — descrizione”. Non consentire un codice inesistente per la versione selezionata; se importato e non riconosciuto, conservarlo come valore sorgente da classificare. | Scalare o ripetibile secondo la fonte, riferimento a catalogo versionato. |
| Versione NACE | Versione della classificazione cui appartiene il codice, ad esempio `2.1`. Serve a interpretare correttamente il codice nel tempo. | Menu singolo dal catalogo delle versioni NACE, ordinato dalla più recente. In importazione deve essere dedotta dall'etichetta ufficiale; non deve essere modificabile separatamente in modo incompatibile con il codice. | Scalare, riferimento a catalogo versioni. |
| Attività import/export | Indicazione camerale circa lo svolgimento di attività di importazione o esportazione. Il trattino presente in visura significa informazione non disponibile, non automaticamente “No”. | Select a tre stati: **Sì**, **No**, **Non disponibile**. Se la fonte riporta un dettaglio testuale, abilita un campo note collegato. Non usare checkbox binario. | Scalare nullable, booleano + eventuale dettaglio. |
| Contratto di rete | Indica se l'impresa aderisce a uno o più contratti di rete. Il valore di sintesi può essere sì/no/non disponibile; l'eventuale dettaglio futuro deve essere gestito come record ripetibile. | Select a tre stati: **Sì**, **No**, **Non disponibile**. Se “Sì”, mostrare collegamento all'elenco dei contratti o richiesta di dettaglio; non obbligare a inventare informazioni assenti dalla visura. | Indicatore scalare + eventuale relazione ripetibile. |
| Albi, ruoli e licenze | Indicazione sintetica della presenza di iscrizioni ad albi, ruoli o licenze non dettagliate nei capitoli successivi della visura di riferimento. | Select a tre stati: **Sì**, **No**, **Non disponibile**. Se “Sì” e sono disponibili dettagli, aprire un elenco ripetibile con tipologia, ente, numero, date e stato; non salvare l'intero dettaglio nel solo indicatore. | Indicatore scalare + eventuali record collegati. |
| Albi e registri ambientali | Indicazione sintetica della presenza di iscrizioni ad albi o registri ambientali non dettagliate nei capitoli successivi della visura di riferimento. | Select a tre stati: **Sì**, **No**, **Non disponibile**. Se “Sì” e sono disponibili dettagli, usare record ripetibili con catalogo dell'albo, numero, sezione/categoria, data e stato; evitare testo unico non strutturato. | Indicatore scalare + eventuali record collegati. |

### 0.3 Indicatori de “L'impresa in cifre” non disponibili nei capitoli successivi

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Numero titolari di cariche | Numero dei soggetti conteggiati dalla CCIAA come titolari di cariche diverse dagli amministratori e dai membri degli organi di controllo. È uno snapshot riferito alla data della visura. | Numero intero di sola lettura in importazione, minimo zero. Se in futuro esiste il dettaglio dei titolari, mostrare il confronto tra conteggio dichiarato e record disponibili senza correggere automaticamente il valore sorgente. | Snapshot numerico con data documento. |
| Pratiche inviate negli ultimi 12 mesi | Numero complessivo delle pratiche trasmesse al Registro Imprese nel periodo mobile di dodici mesi considerato dalla visura. Non è il numero delle pratiche ancora aperte. | Numero intero non negativo. Di norma sola lettura perché calcolato dalla fonte. Deve conservare la data finale del periodo, coincidente normalmente con la data di estrazione. | Snapshot numerico con intervallo temporale. |
| Trasferimenti di quote | Numero di trasferimenti di quote rilevati dalla CCIAA nel riepilogo. Non equivale al numero attuale dei soci. | Numero intero non negativo, sola lettura se importato. Se non disponibile usare `NULL`, non zero. | Snapshot numerico. |
| Trasferimenti di sede | Numero di trasferimenti di sede rilevati dalla CCIAA. Deve rimanere distinto dall'indicazione puntuale del trasferimento da altra provincia presente nella sezione 1. | Numero intero non negativo, sola lettura se importato. Se non disponibile usare `NULL`. | Snapshot numerico. |
| Partecipazioni in altre società | Indica se l'impresa detiene partecipazioni in altre società secondo le informazioni desunte dalla CCIAA. Il trattino della visura indica informazione non disponibile o assenza non esplicitamente certificata, secondo il tracciato sorgente. | Select a tre stati: **Sì**, **No**, **Non disponibile**. Se esiste un dettaglio delle partecipazioni, collegarlo come elenco senza trasformare l'indicatore in un conteggio arbitrario. | Scalare nullable + eventuale relazione. |

### 0.4 Documenti consultabili

Il blocco è ripetibile per tipologia di documento. Non devono esistere colonne separate e rigide per ogni anno di bilancio.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia documento consultabile | Categoria del documento che il Registro Imprese rende consultabile, ad esempio Bilancio, Fascicolo, Statuto o Altro atto. | Menu singolo da catalogo: **Bilancio**, **Fascicolo**, **Statuto**, **Patti sociali**, **Altro atto**, **Altro documento camerale**. Ogni voce deve avere descrizione; “Altro” richiede denominazione testuale. | Record ripetibile, riferimento a catalogo. |
| Disponibilità | Indica se almeno un documento della tipologia è disponibile. | Select a tre stati: **Disponibile**, **Non disponibile**, **Informazione non presente**. Non usare un checkbox perché il trattino del documento non equivale sempre a “No”. | Enum nullable. |
| Numero documenti disponibili | Quantità indicata dalla sintesi, usata in particolare per “Altri atti”. | Intero non negativo. Deve rimanere `NULL` quando la fonte si limita a “Sì” senza indicare la quantità. | Intero nullable. |
| Anno o periodo | Anno o periodo cui si riferisce il documento consultabile, ad esempio gli esercizi dei bilanci disponibili. | Per il bilancio usare un selettore anno e creare un record per ogni annualità. Per documenti con intervallo usare data inizio/data fine. Vietare elenchi di anni in una singola stringa. | Record ripetibile con anno o intervallo. |
| Riferimento al documento | Collegamento all'eventuale file acquisito o alla risorsa consultabile. La semplice indicazione della visura non implica che il file sia già disponibile nella piattaforma. | Controllo allegato/collegamento, non campo testo libero. Mostrare separatamente **indicato come consultabile** e **file effettivamente acquisito**. | Relazione opzionale a gestione documentale. |

---

## 1. Sede

### 1.1 Indirizzo della sede legale

L'indirizzo deve essere modellato come componente strutturato riutilizzabile, non come una sola stringa, conservando anche il testo completo originale della CCIAA.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Comune | Comune della sede legale. | Autocomplete dal catalogo dei comuni italiani con ricerca per nome, provincia e codice catastale. Per sedi estere passa al catalogo località/Paesi senza forzare un comune italiano. | Riferimento territoriale nullable per estero. |
| Provincia | Provincia o città metropolitana della sede. Deve essere coerente con il comune. | Valore derivato dal comune e normalmente non modificabile separatamente. Per dati importati incoerenti, conservare il testo sorgente e segnalare la discrepanza. | Derivato dal riferimento territoriale + testo sorgente. |
| Toponimo | Tipo di area di circolazione, ad esempio Via, Viale, Piazza o Località. | Autocomplete da catalogo dei toponimi; ammettere valore sorgente non classificato. | Riferimento a catalogo + testo. |
| Denominazione stradale | Nome della via o località senza numero civico. | Testo breve; vietare il solo inserimento di spazi. Non alterare automaticamente nomi propri o numeri romani. | Stringa. |
| Numero civico | Numero e eventuale suffisso del civico, ad esempio `3/1`. | Testo breve alfanumerico, non semplice numero, perché deve accettare barre, lettere e diciture come SNC. | Stringa breve. |
| CAP | Codice di avviamento postale. | Input numerico visuale a cinque caratteri per l'Italia, preservando eventuali zeri iniziali. Per estero usare testo secondo il formato nazionale. Controllo di coerenza con il comune senza bloccare importazioni ufficiali difformi. | Stringa, non intero. |
| Nazione | Stato in cui si trova la sede. | Autocomplete dal catalogo ISO 3166, con Italia proposta soltanto quando deducibile dalla fonte. Mostrare denominazione italiana e codice. | Riferimento a catalogo Paesi. |
| Indirizzo completo originale | Testo dell'indirizzo così come riportato nella visura. Serve per audit, confronto e riestrazione dei componenti. | Sola lettura per il valore importato. Non deve essere ricostruito sovrascrivendo la fonte. | Testo sorgente. |

### 1.2 Domicilio digitale/PEC

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Domicilio digitale/PEC | Indirizzo PEC ufficialmente iscritto al Registro Imprese per l'impresa. Non deve essere confuso con email ordinarie o PEC personali degli amministratori. | Input email con normalizzazione in minuscolo, rimozione spazi e validazione sintattica. Non bloccare un dato ufficiale solo perché il dominio non risponde. In importazione conservare il valore originale. | Stringa indicizzata; storico consigliato. |

### 1.3 Dati identificativi camerali e fiscali

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Partita IVA | Identificativo IVA dell'impresa. Per l'Italia è normalmente composto da 11 cifre. | Input testo numerico con controllo formale e checksum italiano quando la nazione è Italia. Conservare zeri iniziali. Non correggere automaticamente un valore ufficiale non valido: segnalarlo. | Stringa, univocità valutata nel perimetro corretto. |
| Numero REA | Numero del Repertorio Economico Amministrativo, composto da sigla territoriale e progressivo, ad esempio `TV - 405520`. | Due componenti: autocomplete Camera/provincia REA e input progressivo alfanumerico. Mostrare la forma composta. La coppia deve essere univoca per l'impresa e per il periodo di validità. | Valore composto; storico. |

### 1.4 Impresa trasferita da altra Provincia

Il blocco è condizionale: viene mostrato soltanto quando la visura riporta il trasferimento. Può diventare ripetibile se devono essere conservati più trasferimenti storici.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Presenza trasferimento | Indica che l'impresa è stata trasferita da un'altra provincia. | Sì/No/Non disponibile. In importazione è **Sì** se il blocco è presente; l'assenza del blocco resta `NULL` se il tracciato non garantisce un “No”. | Booleano nullable. |
| Provincia di provenienza | Provincia dalla quale l'impresa è stata trasferita. | Autocomplete dal catalogo province/CCIAA. Deve essere diversa dalla provincia di destinazione alla data del trasferimento, salvo anomalie ufficiali da segnalare. | Riferimento territoriale. |
| Numero REA precedente | REA posseduto presso la provincia di provenienza. | Controllo composto sigla + progressivo, precompilando la sigla dalla provincia di provenienza. | Stringa composta, indicizzata. |
| Data del trasferimento | Data di efficacia o iscrizione del trasferimento, se disponibile nella fonte. | Date picker; può essere `NULL`. Non deve essere dedotta dalla data di iscrizione corrente senza una regola esplicita. | `DATE` nullable. |

---

## 2. Informazioni da statuto/atto costitutivo

### 2.1 Iscrizione Registro Imprese

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Codice fiscale e numero di iscrizione | Identificativo con cui l'impresa è iscritta al Registro Imprese. Nella visura italiana può coincidere con il codice fiscale, ma deve mantenere il significato camerale distinto. | Input testo con controllo formale coerente con la tipologia di soggetto. Se coincide con il codice fiscale aziendale, usare lo stesso valore autorevole senza duplicazioni incoerenti. | Scalare; possibile riferimento al dato identificativo principale. |
| Registro delle Imprese competente | Registro territoriale presso cui è effettuata l'iscrizione. | Autocomplete dal catalogo delle CCIAA/Registri Imprese. | Riferimento a catalogo. |
| Data di iscrizione | Data di iscrizione presso il Registro Imprese indicato. | Date picker. Non può precedere la data dell'atto di costituzione senza segnalazione; la segnalazione non deve cancellare un dato ufficiale. | `DATE`, storico se cambia Registro. |

### 2.2 Sezioni del Registro Imprese

Il blocco è ripetibile perché un'impresa può risultare iscritta contemporaneamente in più sezioni.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Sezione di iscrizione | Sezione del Registro Imprese, ad esempio **ORDINARIA** o una sezione speciale/autonoma. | Menu singolo da catalogo versionabile. Il catalogo deve comprendere almeno Ordinaria, sezioni speciali previste dalla normativa e sezione autonoma per la titolarità effettiva. Valori non riconosciuti restano da classificare. | Record ripetibile, riferimento a catalogo. |
| Data di iscrizione nella sezione | Data dalla quale l'iscrizione nella specifica sezione risulta efficace. | Date picker; obbligatoria soltanto quando presente nella fonte. Deve essere collegata all'istanza della sezione corretta. | `DATE` nullable per record. |
| Stato dell'iscrizione nella sezione | Indica se l'iscrizione è attiva, cessata o sospesa quando la fonte fornisce tale informazione. | Menu: **Attiva**, **Cessata**, **Sospesa**, **Non determinato**. “Non determinato” rappresenta assenza di stato esplicito e non deve essere selezionato automaticamente come stato reale. | Enum/catalogo, storico. |

### 2.3 Estremi e informazioni di costituzione

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Denominazione | Denominazione legale completa dell'impresa come risultante dall'atto costitutivo, inclusa l'indicazione della forma sociale. | Testo breve con spazi normalizzati. Conservare grafia ufficiale; non applicare title case automatico. Le ricerche possono usare una versione normalizzata separata. | Stringa autorevole, storico denominazioni consigliato. |
| Forma giuridica | Forma giuridica ufficiale dell'impresa, ad esempio società a responsabilità limitata. | Autocomplete dal catalogo delle forme giuridiche, mostrando sigla e denominazione estesa. Il catalogo deve supportare forme italiane ed estere e periodi di validità. | Riferimento a catalogo. |
| Data dell'atto di costituzione | Data in cui è stato stipulato l'atto costitutivo. | Date picker. Non coincide necessariamente con data di iscrizione o inizio attività. | `DATE`. |
| Notaio o pubblico ufficiale | Soggetto che ha ricevuto l'atto, se riportato. | Autocomplete persone/professionisti quando già censito; altrimenti testo strutturato con nome, cognome e qualifica. Non obbligatorio nella visura ordinaria. | Relazione opzionale o testo sorgente. |
| Numero di repertorio | Numero di repertorio dell'atto notarile, se riportato. | Input alfanumerico, non numerico puro; conservare barre e suffissi. | Stringa nullable. |
| Località dell'atto | Comune o Stato in cui è stato stipulato l'atto. | Autocomplete territoriale con supporto estero. | Riferimento territoriale nullable. |

### 2.4 Sistema di amministrazione e controllo

#### 2.4.1 Durata della società

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipo di durata | Indica se la società è a tempo determinato o indeterminato. | Menu singolo: **Fino a una data**, **A tempo indeterminato**, **Altra regola statutaria**, **Non disponibile**. Se si seleziona “Fino a una data” il campo data termine diventa obbligatorio; “Altra regola” abilita una descrizione. | Enum/catalogo. |
| Data termine | Data di scadenza della società prevista dallo statuto. | Date picker condizionale. Deve essere successiva alla data di costituzione. | `DATE` nullable. |
| Regola di durata | Testo della regola quando la durata non è rappresentabile con una sola data. | Area di testo breve, visibile soltanto con “Altra regola statutaria”. | Testo nullable. |

#### 2.4.2 Scadenza esercizi

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Scadenza primo esercizio | Data di chiusura del primo esercizio sociale. | Date picker. Può differire dalla scadenza ordinaria degli esercizi successivi. | `DATE` nullable. |
| Scadenza esercizi successivi | Giorno e mese di chiusura ricorrente degli esercizi, ad esempio `31/12`, senza imporre un anno. | Controllo giorno/mese. Validare le combinazioni di calendario; non salvare una data fittizia con anno convenzionale se il database supporta campi separati. | Giorno + mese o tipo dedicato. |
| Giorni di proroga approvazione bilancio | Numero di giorni di proroga dei termini di approvazione del bilancio previsto dallo statuto, ad esempio 60. | Input intero non negativo. Deve rimanere `NULL` se non riportato, non essere impostato automaticamente a zero. | Intero nullable. |

#### 2.4.3 Sistema di amministrazione adottato

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Sistema di amministrazione adottato | Forma amministrativa effettivamente in uso, ad esempio amministratore unico. È distinta dagli organi soltanto previsti dallo statuto. | Menu singolo dal catalogo degli assetti amministrativi. Deve includere almeno **Amministratore unico**, **Più amministratori**, **Consiglio di amministrazione** e ulteriori modelli previsti dalla normativa. Mostrare descrizione e compatibilità con la forma giuridica. | Riferimento a catalogo. |
| Soggetto che esercita il controllo contabile | Tipologia del soggetto/organo incaricato, ad esempio revisore legale. | Menu singolo da catalogo: **Revisore legale**, **Società di revisione**, **Collegio sindacale**, **Sindaco unico**, **Altro organo previsto**, **Non indicato**. “Non indicato” non equivale a “Nessun controllo”. | Riferimento a catalogo nullable. |

#### 2.4.4 Organi amministrativi previsti

Il blocco è ripetibile: lo statuto può prevedere forme alternative, anche se una sola è in carica.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia organo amministrativo | Modello previsto dallo statuto, ad esempio amministratore unico, più amministratori o consiglio di amministrazione. | Menu singolo dallo stesso catalogo degli assetti amministrativi. Ogni opzione deve descrivere se l'organo è monocratico o collegiale. | Record ripetibile, riferimento a catalogo. |
| In carica | Indica se la specifica forma prevista è anche quella attualmente adottata. | Valore derivato dal confronto con il sistema adottato; sola lettura. | Booleano derivato. |
| Numero minimo amministratori | Numero minimo di componenti previsto per l'organo. | Intero minimo 1. Per organo monocratico deve essere 1. | Intero nullable. |
| Numero massimo amministratori | Numero massimo di componenti previsto. | Intero maggiore o uguale al minimo. Può essere `NULL` se lo statuto non indica un massimo. | Intero nullable. |

### 2.5 Oggetto sociale

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Oggetto sociale | Testo integrale delle attività e finalità che la società può svolgere secondo statuto. Non coincide con l'attività effettivamente esercitata. | Area di testo estesa, sola lettura per la versione importata, con ricerca interna e conservazione dei capoversi. Non troncare il contenuto. Eventuali sintesi devono essere campi generati separati. | Testo lungo, versionabile. |

### 2.6 Poteri da statuto

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Poteri da statuto | Testo integrale delle regole statutarie sui poteri di amministrazione, delega e rappresentanza. Non deve essere ridotto ai poteri della singola persona in carica. | Area di testo estesa con conservazione dei capoversi. Sola lettura per il valore ufficiale; integrazioni manuali separate e tracciate. | Testo lungo, versionabile. |

### 2.7 Ripartizione degli utili e delle perdite tra i soci

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Riferimento statutario | Articolo o clausola indicata dalla visura, ad esempio `ART. 28`. | Input breve alfanumerico. Non tentare di trasformare automaticamente il riferimento in una percentuale. | Stringa nullable. |
| Testo della regola | Testo completo della clausola quando disponibile nel documento o in un atto collegato. | Area di testo estesa. Se la visura riporta soltanto il riferimento, lasciare `NULL`. | Testo lungo nullable. |

### 2.8 Altri riferimenti statutari

Il blocco è ripetibile per tipologia di clausola.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia clausola | Tipo di riferimento statutario, ad esempio recesso, esclusione o prelazione. | Menu singolo: **Clausola di recesso**, **Clausola di esclusione**, **Clausola di prelazione**, **Altra clausola statutaria**. “Altra” richiede una denominazione. | Record ripetibile, riferimento a catalogo. |
| Presenza dell'informazione | Indica che l'informazione è presente nello statuto/atto costitutivo anche quando la visura non ne riproduce il testo. | Sì/No/Non disponibile. Se il PDF dice “Informazione presente”, registrare **Sì** senza inventare il contenuto. | Booleano nullable. |
| Testo o riferimento | Contenuto della clausola oppure articolo/riferimento disponibile. | Area di testo. Può restare `NULL` quando è nota solo la presenza. | Testo nullable. |

---

## 3. Capitale e strumenti finanziari

### 3.1 Capitale sociale in Euro

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Capitale deliberato | Importo massimo deliberato dai soci. Può essere maggiore del capitale sottoscritto. | Input monetario decimale non negativo. Valuta collegata; in questa visura è Euro. Controllo di coerenza: normalmente deliberato ≥ sottoscritto, con segnalazione non distruttiva delle eccezioni ufficiali. | Decimal + valuta, storico. |
| Capitale sottoscritto | Parte del capitale deliberato effettivamente sottoscritta dai soci. È il valore usato nella sintesi “L'impresa in cifre”. | Input monetario decimale non negativo. Normalmente sottoscritto ≤ deliberato e ≥ versato. | Decimal + valuta, storico. |
| Capitale versato | Parte del capitale sottoscritto già versata. | Input monetario decimale non negativo. Segnalare se superiore al sottoscritto. | Decimal + valuta, storico. |
| Valuta | Valuta in cui sono espressi gli importi del capitale. | Menu singolo ricercabile dal catalogo ISO 4217, mostrando codice e denominazione. La valuta deve essere condivisa dai tre importi dello stesso snapshot. | Riferimento a catalogo valute. |
| Data di riferimento | Data alla quale la configurazione del capitale risulta valida, se disponibile. | Date picker. Se non è indicata espressamente, non usare automaticamente la data di estrazione come data dell'evento; può essere salvata separatamente come data di osservazione. | `DATE` nullable. |

### 3.2 Strumenti finanziari previsti dallo statuto

Il blocco è ripetibile per tipologia di strumento.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia strumento finanziario | Categoria dello strumento previsto, ad esempio titoli di debito. | Menu singolo da catalogo: **Titoli di debito**, **Strumenti finanziari partecipativi**, **Categorie speciali di quote/azioni**, **Altro strumento**. “Altro” richiede descrizione. Il catalogo deve poter essere esteso senza modifica frontend. | Record ripetibile, riferimento a catalogo. |
| Riferimento statutario | Articolo o clausola che disciplina lo strumento, ad esempio `ART. 5`. | Input breve alfanumerico. | Stringa nullable. |
| Descrizione | Testo disponibile sui diritti, condizioni o caratteristiche dello strumento. | Area di testo; non obbligatoria se la visura contiene soltanto il riferimento all'articolo. | Testo nullable. |

---

## 4. Soci e titolari di diritti su azioni e quote

La sezione deve separare i **soggetti**, le **partecipazioni** e i **diritti**. Una persona o organizzazione può detenere più diritti o partecipazioni; lo stesso soggetto non deve essere duplicato ogni volta che compare anche come amministratore o titolare di altra carica.

### 4.1 Sintesi della composizione societaria

La tabella/grafico camerale è una sintesi dei soli diritti considerati dalla fonte. I valori devono essere derivati dai record di dettaglio quando coincidono con essi; il testo e lo snapshot ufficiale possono essere conservati per confronto.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Data di riferimento della composizione | Data alla quale l'assetto proprietario sintetico è riferito. | Date picker. È obbligatoria per distinguere assetti successivi e non deve essere sostituita dalla data di estrazione della visura. | `DATE`, chiave temporale dello snapshot. |
| Socio/titolare | Persona fisica o soggetto giuridico cui è attribuito il diritto sintetizzato. | Autocomplete sull'anagrafica Persone/Soggetti dell'azienda, con ricerca per denominazione e codice fiscale. Se non esiste, creare una nuova istanza soltanto nel flusso autorizzato. | Relazione a soggetto. |
| Valore della partecipazione | Valore nominale della quota o delle azioni rappresentate nella sintesi. | Input monetario non negativo, con valuta dello snapshot. | Decimal. |
| Percentuale | Incidenza della partecipazione sul capitale considerato dalla sintesi. | Percentuale da 0 a 100 con precisione adeguata. Preferibilmente calcolata da valore/capitale; conservare separatamente il valore ufficiale se la fonte lo riporta e segnalare scostamenti oltre la tolleranza di arrotondamento. | Calcolato + eventuale snapshot ufficiale. |
| Tipo di diritto | Diritto esercitato sulla partecipazione. | Menu singolo da catalogo dei diritti: **Proprietà**, **Nuda proprietà**, **Usufrutto**, **Pegno**, **Sequestro**, **Intestazione fiduciaria**, **Comproprietà/contitolarità**, **Altro diritto o vincolo**. Ogni opzione deve spiegare che il diritto non coincide necessariamente con la piena disponibilità della quota. “Altro” richiede descrizione. | Riferimento a catalogo. |

### 4.2 Estremi dell'elenco soci

Ogni deposito/elenco deve essere uno snapshot autonomo. Non sovrascrivere l'elenco precedente quando si importa una visura con una data di riferimento diversa.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Data di riferimento dell'elenco | Data alla quale l'elenco dei soci e dei titolari descrive l'assetto. | Date picker obbligatorio quando presente nell'intestazione. | `DATE`. |
| Data dell'atto | Data dell'atto cui si riferisce la pratica di deposito. | Date picker. | `DATE` nullable. |
| Data di deposito | Data in cui l'elenco è stato depositato. | Date picker. Non può precedere l'atto senza segnalazione. | `DATE` nullable. |
| Data di protocollo | Data di protocollazione della pratica. | Date picker. | `DATE` nullable. |
| Numero di protocollo | Identificativo territoriale della pratica, ad esempio `TV-2024-67424`. | Input alfanumerico con normalizzazione degli spazi, preservando trattini e prefissi. Deve essere indicizzato e, con la Camera competente, univoco quando il sistema sorgente lo garantisce. | Stringa indicizzata. |
| Capitale sociale dichiarato | Capitale dichiarato nel modello con cui è stato depositato l'elenco. Può essere confrontato con il capitale corrente ma non deve sovrascriverlo automaticamente. | Input monetario non negativo con valuta. Mostrare eventuale differenza rispetto al capitale della sezione 3. | Decimal + valuta, valore di snapshot. |

### 4.3 Soggetti presenti nell'elenco

Ogni riga dell'elenco soci deve collegarsi a una persona o a un soggetto già censito. In modalità modifica, l'utente può cambiare il soggetto mediante il menu di selezione; non può riscrivere nella tabella CCIAA i suoi dati anagrafici. Nome, identificativi, cittadinanza e Stato di costituzione sono letti dalla struttura autorevole del soggetto e aggiornano automaticamente la vista.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Soggetto collegato | Persona fisica, persona giuridica o altra entità cui appartiene la partecipazione. Il record camerale salva il riferimento stabile al soggetto. | Menu a tendina/autocomplete ricercabile per nome, denominazione e codice fiscale. Per persone fisiche mostrare **Cognome Nome — codice fiscale — data di nascita**; per soggetti giuridici **Denominazione — codice fiscale/identificativo**. Nessun testo libero. | Relazione obbligatoria a soggetto. |
| Tipo di soggetto | Distingue persona fisica, persona giuridica o altra entità titolare. | Valore derivato dalla scheda del soggetto selezionato e mostrato in sola lettura. Le categorie sono **Persona fisica**, **Persona giuridica**, **Ente/associazione**, **Comunione o contitolarità**, **Altro soggetto**. | Attributo derivato dal soggetto. |
| Nome e cognome / Denominazione | Identificazione ufficiale del titolare. Per persona fisica nome e cognome restano componenti separati nella struttura autorevole; per organizzazione viene mostrata la denominazione. | Compilazione automatica e sola lettura nella CCIAA. La modifica avviene tramite **Apri scheda persona/soggetto**. Conservare separatamente il testo originale importato per riconciliazione. | Dato letto dal soggetto + testo sorgente. |
| Codice fiscale | Identificativo fiscale del soggetto utilizzato anche per la riconciliazione dell'importazione. | Compilazione automatica e sola lettura. Non può essere modificato nel record della partecipazione. | Identificativo letto dal soggetto. |
| Paese di cittadinanza | Cittadinanza della persona fisica selezionata. Non deve essere usata per le società. | Compilazione automatica e sola lettura dal modulo Personale; il campo non compare per soggetti cui non è applicabile. | Attributo letto dal soggetto, nullable. |
| Stato di costituzione | Stato secondo il quale è costituito un soggetto giuridico estero. | Compilazione automatica e sola lettura dalla struttura del soggetto giuridico. | Attributo letto dal soggetto, nullable. |
| Apri scheda persona/soggetto | Azione che consente di consultare o correggere i dati anagrafici nella sede autorevole. | Pulsante o link contestuale. Dopo il salvataggio della scheda, la riga CCIAA deve aggiornarsi senza creare copie. | Azione UI, non campo persistito. |

La rimozione del socio dalla tabella deve cessare o rendere non corrente la partecipazione collegata allo specifico assetto societario. Non deve cancellare la persona o il soggetto dall'anagrafica autorevole.

### 4.4 Partecipazioni e diritti di dettaglio

Ogni partecipazione è collegata allo snapshot dell'elenco e al soggetto titolare. Se sulla stessa quota insistono più diritti, utilizzare più record di diritto collegati alla medesima partecipazione.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia della partecipazione | Indica se il diritto riguarda quote, azioni o altra partecipazione prevista dalla forma giuridica. | Menu singolo: **Quota**, **Azione**, **Altra partecipazione**. Le opzioni devono essere filtrate per forma giuridica senza impedire l'importazione di valori ufficiali inattesi. | Riferimento a catalogo. |
| Valore nominale | Valore nominale della partecipazione attribuita al soggetto. | Input monetario non negativo con valuta dello snapshot. | Decimal. |
| Importo versato | Parte del valore nominale già versata. | Input monetario non negativo. Deve essere ≤ valore nominale, salvo anomalia ufficiale da segnalare. | Decimal nullable. |
| Numero di azioni o quote | Quantità dei titoli quando la fonte la esprime come numero. Non sostituisce il valore nominale. | Input decimale/intero secondo il tipo di strumento; minimo maggiore di zero. Può essere `NULL` per quote espresse soltanto in valore. | Numero nullable. |
| Percentuale della partecipazione | Percentuale sul capitale dello snapshot. | Campo calcolato quando capitale e valore sono disponibili; input percentuale soltanto per acquisire il valore ufficiale non ricostruibile. Range 0–100. | Calcolato + snapshot opzionale. |
| Tipo di diritto | Natura del diritto o vincolo sulla partecipazione. | Menu dal catalogo dettagliato definito al punto 4.1. Non usare testo libero ordinario. | Relazione a catalogo. |
| Quota del diritto | Frazione o percentuale del diritto spettante al titolare quando vi è contitolarità. | Percentuale 0–100 oppure frazione strutturata numeratore/denominatore. Non confondere con la percentuale della partecipazione sul capitale. | Decimal/frazione nullable. |
| Titolarità individuale o congiunta | Modalità con cui il diritto è detenuto. | Menu: **Individuale**, **Congiunta**, **In comunione**, **Non specificata**. “Non specificata” rappresenta assenza di informazione. | Enum/catalogo. |
| Descrizione di vincoli ulteriori | Eventuali condizioni o vincoli non rappresentabili dal tipo di diritto. | Area di testo breve, visibile quando il tipo di diritto prevede un vincolo o è “Altro”. | Testo nullable. |

### 4.5 Domicilio del titolare o rappresentante comune

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipo di domicilio | Specifica se l'indirizzo appartiene al titolare oppure al rappresentante comune. | Menu: **Domicilio del titolare**, **Domicilio del rappresentante comune**. | Enum. |
| Indirizzo | Domicilio completo del titolare o del rappresentante comune selezionato. | Compilazione automatica e sola lettura dalla struttura indirizzi del soggetto. Conservare il testo originale importato per riconciliazione; non copiarlo come indirizzo autonomo della partecipazione. | Indirizzo letto dal soggetto + testo sorgente. |
| Rappresentante comune | Persona o soggetto designato per una partecipazione detenuta congiuntamente, se indicato. | Menu a tendina/autocomplete sull'anagrafica soggetti, visibile solo per contitolarità/comunione o quando la fonte lo riporta. La selezione compila automaticamente i dati del rappresentante. | Relazione opzionale a soggetto. |
| Estremi della nomina | Riferimento all'atto o pratica di nomina del rappresentante comune. | Testo breve o relazione a pratica quando disponibile. | Stringa/relazione nullable. |

---

## 5. Amministratori

### 5.1 Organi amministrativi in carica

Il blocco è ripetibile nel caso di più organi o articolazioni rilevanti. La forma in carica deve essere coerente con il sistema adottato nella sezione 2, senza duplicare i dati in modo indipendente.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia organo in carica | Organo amministrativo effettivamente operante, ad esempio amministratore unico. | Menu singolo dal catalogo degli organi amministrativi già utilizzato nella sezione 2. | Riferimento a catalogo. |
| Numero componenti | Numero dei membri in carica indicato dalla CCIAA. | Intero minimo 1. Se esiste l'elenco di dettaglio, mostrare una segnalazione se il conteggio non coincide, senza sovrascrivere il valore importato. | Snapshot numerico o calcolato. |
| Tipo di durata | Modalità con cui è definita la durata dell'organo. | Menu: **A tempo indeterminato**, **Fino a data**, **Per numero di esercizi**, **Fino all'approvazione di un bilancio**, **Fino a revoca/dimissioni**, **Altra durata**, **Non indicata**. Le opzioni attivano i campi pertinenti. | Riferimento a catalogo. |
| Data di scadenza | Data precisa di termine quando applicabile. | Date picker condizionale. | `DATE` nullable. |
| Bilancio di riferimento della scadenza | Esercizio il cui bilancio determina la fine dell'incarico. | Selettore anno/esercizio, obbligatorio per “Fino all'approvazione di un bilancio”. | Anno o relazione a esercizio. |
| Descrizione della durata | Dicitura originale quando non rappresentabile dai campi strutturati. | Testo breve di sola lettura per l'importato. | Testo sorgente nullable. |

### 5.2 Elenco amministratori – dati del soggetto

Ogni amministratore deve riferirsi a un soggetto unico dell'anagrafica Persone/Soggetti. Le cariche sono record separati, così una persona può avere più incarichi senza essere duplicata. In modalità modifica, la persona è sostituibile tramite menu; i suoi dati anagrafici sono compilati automaticamente e non sono modificabili nella tabella CCIAA.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Persona collegata | Persona fisica che ricopre la carica amministrativa. Il record della carica salva il suo identificatore stabile. | Menu a tendina/autocomplete con ricerca per nome, cognome e codice fiscale. Le opzioni mostrano **Cognome Nome — codice fiscale — data di nascita**. La selezione deve rispettare l'azienda corrente, impedire duplicati della stessa carica nello stesso periodo e non accettare testo libero. | Relazione obbligatoria alla persona. |
| Nome | Nome anagrafico della persona selezionata. | Compilazione automatica e sola lettura dal modulo Personale. | Attributo letto dalla persona. |
| Cognome | Cognome anagrafico della persona selezionata. | Compilazione automatica e sola lettura; conservare apostrofi e caratteri internazionali nella scheda autorevole. | Attributo letto dalla persona. |
| Luogo di nascita | Comune o località estera di nascita della persona selezionata. | Compilazione automatica e sola lettura. | Attributo letto dalla persona. |
| Stato di nascita | Paese di nascita, quando applicabile. | Compilazione automatica e sola lettura. | Attributo letto dalla persona, nullable. |
| Data di nascita | Data di nascita della persona selezionata. | Compilazione automatica e sola lettura; utilizzata per distinguere omonimi e controllare la coerenza con la nomina. | Attributo letto dalla persona. |
| Codice fiscale | Codice fiscale della persona, principale chiave di riconciliazione con la visura. | Compilazione automatica e sola lettura. La modifica avviene esclusivamente nella scheda persona. | Identificativo letto dalla persona. |
| Paese di cittadinanza | Cittadinanza della persona selezionata. | Compilazione automatica e sola lettura dal modulo Personale. | Attributo letto dalla persona, nullable. |
| Apri scheda persona | Azione per consultare o modificare i dati anagrafici nella loro sede autorevole. | Pulsante/link contestuale. Al ritorno, aggiornare la riga CCIAA senza duplicare i valori. | Azione UI, non campo persistito. |

### 5.3 Domicilio e domicilio digitale dell'amministratore

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Domicilio | Indirizzo della persona selezionata pertinente alla rilevazione camerale. Può cambiare nel tempo. | Compilazione automatica e sola lettura dalla struttura indirizzi del modulo Personale. Eventuali differenze importate devono alimentare la riconciliazione della persona, non un secondo indirizzo copiato nella carica. | Record indirizzo letto dalla persona. |
| PEC personale/professionale | Indirizzo PEC riferito alla persona e distinto dalla PEC dell'impresa. | Compilazione automatica e sola lettura dal contatto autorevole della persona. La modifica avviene nella scheda persona. | Contatto letto dalla persona. |

### 5.4 Cariche amministrative

Il blocco è ripetibile per persona. Una persona può ricoprire più cariche con date e poteri differenti.

Tutti i campi della seguente tabella appartengono alla carica e restano modificabili direttamente nella sezione CCIAA. La sostituzione della persona non deve modificarli automaticamente; eventuali incompatibilità devono essere segnalate all'utente.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Carica | Denominazione ufficiale dell'incarico, ad esempio amministratore unico, consigliere o presidente. | Autocomplete dal catalogo delle cariche camerali, filtrabile per organo ma non rigidamente limitato. Il menu deve mostrare denominazione, descrizione e famiglia della carica. | Riferimento a catalogo. |
| Rappresentante dell'impresa | Indica se la carica attribuisce rappresentanza legale secondo la visura. | Sì/No/Non disponibile. Non dedurre automaticamente “Sì” dalla sola carica se la fonte fornisce un'indicazione esplicita diversa. | Booleano nullable. |
| Data dell'atto di nomina | Data dell'atto che conferisce l'incarico. | Date picker; non precedente alla nascita e normalmente non successiva alla data di iscrizione. | `DATE`. |
| Data di iscrizione | Data di iscrizione della nomina al Registro Imprese. | Date picker; può essere successiva alla nomina. | `DATE` nullable. |
| Tipo di durata | Modalità di durata della singola carica. | Menu con le stesse opzioni definite per l'organo: indeterminata, fino a data, esercizi, approvazione bilancio, revoca/dimissioni, altra, non indicata. | Riferimento a catalogo. |
| Data di scadenza | Data esatta quando prevista. | Date picker condizionale. | `DATE` nullable. |
| Esercizio di scadenza | Esercizio del bilancio la cui approvazione determina la scadenza. | Selettore anno/esercizio condizionale. | Anno/relazione nullable. |
| Poteri specifici | Poteri attribuiti alla persona in aggiunta o in deroga ai poteri generali da statuto. | Area di testo estesa. Non duplicare automaticamente il testo generale della sezione 2.6. | Testo lungo nullable. |
| Limitazioni | Limitazioni o condizioni poste ai poteri della persona. | Area di testo; `NULL` se non riportate, non usare automaticamente “Nessuna”. | Testo nullable. |
| Stato della carica | Stato corrente o storico dell'incarico. | Menu: **In carica**, **Cessata**, **Sospesa**, **Revocata**, **Dimissionaria**, **Non determinato**. Le opzioni devono avere descrizione e non devono sostituire le date. | Riferimento a catalogo, storico. |

L'azione di rimozione deve cessare o disattivare la carica e rimuoverla dall'elenco corrente, preservandone storico, fonte e audit. Non deve eliminare la persona dal modulo Personale.

---

## 6. Sindaci, membri degli organi di controllo

### 6.1 Organo o funzione di controllo

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia organo/funzione | Organo o funzione di controllo in carica, ad esempio revisore unico, sindaco unico, collegio sindacale o società di revisione. | Menu singolo da catalogo: **Revisore unico**, **Revisore legale**, **Società di revisione**, **Sindaco unico**, **Collegio sindacale**, **Consiglio di sorveglianza**, **Altro organo di controllo**. Ogni opzione specifica se è persona, organizzazione o organo collegiale. | Riferimento a catalogo. |
| Numero componenti effettivi | Numero dei componenti effettivi dell'organo, se applicabile. | Intero non negativo. Per funzione monocratica normalmente 1. | Intero nullable. |
| Numero componenti supplenti | Numero dei componenti supplenti, se previsti. | Intero non negativo; `NULL` se non previsto o non riportato. | Intero nullable. |
| Tipo di durata | Modalità di durata dell'organo. | Menu durata condiviso con la sezione 5. | Riferimento a catalogo. |
| Data/esercizio di scadenza | Data o esercizio cui è collegata la cessazione dell'organo. | Date picker o selettore esercizio, attivati dal tipo di durata. | Data/anno nullable. |

### 6.2 Elenco sindaci e membri degli organi di controllo

I dati anagrafici, il domicilio e gli identificativi devono riutilizzare l'anagrafica unica dei soggetti. Nome, cognome, nascita, codice fiscale, cittadinanza, domicilio e contatti seguono le regole della sezione 5.2–5.3: vengono compilati automaticamente e mostrati in sola lettura. In modalità modifica è selezionabile il soggetto, mentre restano modificabili i dati dell'incarico di controllo.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Soggetto collegato | Persona fisica o organizzazione che svolge la funzione di controllo. Il record dell'incarico salva l'identificatore stabile del soggetto. | Menu a tendina/autocomplete sull'anagrafica autorevole, con ricerca per nome/denominazione e codice fiscale. Per persone fisiche mostrare **Cognome Nome — codice fiscale — data di nascita**. Nessun testo libero e nessuna copia dei dati anagrafici nel record dell'incarico. | Relazione obbligatoria a soggetto. |
| Dati anagrafici del soggetto | Nome/denominazione, identificativi, nascita, cittadinanza, domicilio e contatti del soggetto selezionato. | Compilazione automatica e sola lettura. Prevedere l'azione **Apri scheda persona/soggetto** per eventuali correzioni nella sede autorevole. | Dati letti dal soggetto, non persistiti nella carica. |
| Carica | Incarico camerale, ad esempio revisore unico, sindaco effettivo, presidente del collegio, sindaco supplente. | Autocomplete dal catalogo delle cariche di controllo. Il menu deve distinguere cariche effettive e supplenti e indicare la compatibilità con l'organo. | Riferimento a catalogo. |
| Data dell'atto di nomina | Data dell'atto che conferisce l'incarico. | Date picker. | `DATE`. |
| Data di iscrizione | Data di iscrizione della nomina. | Date picker. | `DATE` nullable. |
| Tipo di durata | Regola di durata dell'incarico. | Menu durata condiviso con amministratori e organi. | Riferimento a catalogo. |
| Esercizio/data di scadenza | Esercizio di bilancio o data che determina la fine dell'incarico. | Controllo condizionale in base al tipo di durata. | Data/anno nullable. |
| Registro o albo professionale | Registro professionale cui il soggetto risulta iscritto, se riportato. | Autocomplete da catalogo di albi professionali; “Altro” richiede denominazione e autorità competente. | Riferimento a catalogo nullable. |
| Numero di iscrizione professionale | Numero identificativo nel registro/albo. | Input alfanumerico; univocità valutata insieme ad albo e territorio. | Stringa nullable. |
| Stato della carica | Stato corrente o storico dell'incarico. | Menu condiviso: In carica, Cessata, Sospesa, Revocata, Dimissionaria, Non determinato. | Riferimento a catalogo, storico. |

La rimozione di un sindaco, revisore o membro dell'organo di controllo deve cessare o disattivare il solo incarico, preservandone storico, provenienza e audit. Il soggetto deve rimanere disponibile nel modulo Personale e può continuare a essere collegato ad altre cariche o rapporti.

---

## 7. Trasferimenti d'azienda, fusioni, scissioni, subentri

La sezione deve utilizzare un modello unico di **evento societario** con sottotipi. Ogni evento conserva le società coinvolte, il loro ruolo, le date e gli estremi della pratica. Non creare una colonna per ogni società o un testo unico non interrogabile.

### 7.1 Evento societario

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Famiglia dell'operazione | Classifica l'evento nella macrofamiglia camerale. | Menu singolo: **Trasferimento d'azienda**, **Fusione**, **Scissione**, **Subentro**. Il menu determina i sottotipi e i ruoli delle imprese disponibili. | Riferimento a catalogo. |
| Tipo di atto/operazione | Denominazione specifica riportata dalla CCIAA, ad esempio progetto di scissione mediante costituzione di nuova società o scissione esecutiva. | Autocomplete da catalogo dipendente dalla famiglia. Per scissione prevedere almeno **Progetto di scissione**, **Scissione mediante costituzione di nuova società**, **Scissione a favore di società esistente**, **Scissione parziale/totale**; per fusione **Progetto**, **Fusione per incorporazione**, **Fusione con costituzione di nuova società**; per trasferimenti **Cessione**, **Affitto**, **Conferimento**, **Donazione**, **Usufrutto**, **Altro**; per subentri i tipi ufficiali disponibili. Conservare sempre la dicitura sorgente. | Riferimento a catalogo + testo sorgente. |
| Descrizione dell'operazione | Informazione integrativa non rappresentata dal tipo normalizzato. | Area di testo breve. | Testo nullable. |
| Data dell'atto | Data dell'atto o del progetto. | Date picker. | `DATE` nullable. |
| Data della delibera | Data della deliberazione societaria, quando distinta dall'atto. | Date picker. | `DATE` nullable. |
| Data di iscrizione | Data in cui l'evento è stato iscritto nel Registro Imprese. | Date picker. | `DATE` nullable. |
| Data dell'atto di esecuzione | Data dell'atto che dà esecuzione all'operazione. | Date picker, visibile per fusioni/scissioni o altri eventi che la prevedono. | `DATE` nullable. |
| Data di efficacia | Data dalla quale l'operazione produce effetti, se esplicitamente riportata. | Date picker. Non dedurla automaticamente dalla data di iscrizione. | `DATE` nullable. |
| Data di modifica | Data dell'ultima modifica dell'informazione camerale relativa all'evento. Non coincide con `updated_at` tecnico. | Date picker/import automatico; etichetta chiara per distinguerla dall'aggiornamento applicativo. | `DATE` nullable. |

### 7.2 Società e soggetti coinvolti

Il blocco è ripetibile: uno stesso evento può coinvolgere più società con ruoli diversi.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Società/soggetto coinvolto | Impresa o soggetto interessato dall'operazione, ad esempio IMMOBILIARE FIDA SRL. | Autocomplete su imprese già censite e Registro Imprese; se non disponibile, acquisizione strutturata di denominazione e identificativi. Evitare duplicati per semplice differenza grafica. | Relazione a soggetto/impresa. |
| Ruolo nell'operazione | Funzione svolta dal soggetto nell'evento. | Menu dipendente dalla famiglia: per trasferimento **Cedente**, **Cessionario**, **Affittante**, **Affittuario**, **Conferente**, **Beneficiario**; per fusione **Incorporante**, **Incorporata**, **Società risultante**; per scissione **Scissa**, **Beneficiaria esistente**, **Beneficiaria di nuova costituzione**; per subentro **Precedente titolare**, **Subentrante**. | Riferimento a catalogo. |
| Codice fiscale/identificativo | Identificativo della società coinvolta quando disponibile. | Controllo formale coerente con Paese e tipologia. | Stringa indicizzata nullable. |
| Sede | Sede/località della società riportata nel blocco dell'evento. | Componente indirizzo o almeno riferimento territoriale. Non aggiornare automaticamente la sede corrente del soggetto con una sede storica dell'evento. | Indirizzo storico collegato all'evento. |

### 7.3 Estremi della pratica

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Numero di protocollo/pratica | Identificativo della pratica camerale relativa all'evento, se disponibile. | Input alfanumerico indicizzato, preservando prefissi territoriali. | Stringa nullable. |
| Data di deposito | Data di deposito della pratica. | Date picker. | `DATE` nullable. |
| Camera/Registro competente | Ufficio presso cui è iscritta la pratica. | Autocomplete dal catalogo CCIAA. | Riferimento a catalogo nullable. |
| Documento o atto collegato | Riferimento all'eventuale documento acquisito. | Collegamento alla gestione documentale; non URL libero quando il file è interno. | Relazione opzionale a documento. |

---

## 8. Attività, albi ruoli e licenze

La sezione contiene dati provenienti da fonti differenti: Registro Imprese, Agenzia delle Entrate, Casellario ANAC, Accredia e INPS. La fonte e la data di aggiornamento devono essere memorizzate a livello del record cui si riferiscono, non soltanto come nota generale.

### 8.1 Attività dell'impresa

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Data di inizio dell'attività dell'impresa | Data camerale di avvio dell'attività. La visura la qualifica come informazione storica; non deve essere sovrascritta dalla data di una singola attività o unità locale. | Date picker. Deve essere uguale o successiva alla costituzione nella normalità, con segnalazione delle eccezioni. | `DATE`, dato storico principale. |
| Attività prevalente esercitata dall'impresa | Descrizione ufficiale dell'attività considerata prevalente a livello d'impresa. È testo camerale e non coincide necessariamente con l'oggetto sociale o con la descrizione ATECO. | Area di testo. Conservare la versione originale e una versione normalizzata soltanto per ricerca. Non sostituirla automaticamente con la descrizione del codice ATECO. | Testo storico. |
| Attività esercitata nella sede legale | Descrizione dell'attività effettivamente svolta presso la sede legale. Può essere diversa o più specifica dell'attività prevalente dell'impresa. | Area di testo, collegata alla sede legale. Se la sede cambia, la descrizione deve mantenere il proprio periodo di validità. | Record attività-sede, storico. |
| Data di inizio dell'attività presso la sede | Data da cui l'attività indicata è esercitata presso la sede legale, riportata nel testo camerale. | Date picker. Non deve essere dedotta dalla sola data di inizio impresa quando il documento non la specifica. | `DATE` nullable per record attività-sede. |

### 8.2 Classificazioni delle attività economiche

Le classificazioni sono record ripetibili e versionati. Lo stesso ambito — impresa, sede legale o unità locale — può possedere più codici e più versioni classificatorie. Il record deve indicare l'oggetto classificato.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Ambito della classificazione | Indica se il codice descrive l'impresa nel complesso, l'attività prevalente, la sede legale o una specifica unità locale. | Menu: **Attività prevalente dell'impresa**, **Impresa**, **Sede legale**, **Unità locale**. Per unità locale è obbligatorio il collegamento all'istanza. | Enum + relazione all'oggetto. |
| Sistema di classificazione | Sistema cui appartiene il codice, ad esempio ATECO 2025 o ATECORI 2007-2022. | Menu singolo dal catalogo dei sistemi classificatori, con periodo di validità e fonte. Non salvare la versione nel testo descrittivo del codice. | Riferimento a catalogo versionato. |
| Codice attività | Codice ufficiale della classificazione, ad esempio `41.00.00` o `41.2`. | Autocomplete dipendente dal sistema selezionato, con ricerca per codice e parole della descrizione. Mostrare codice completo e descrizione ufficiale. Non consentire combinazioni codice/versione inesistenti. | Riferimento a catalogo codici. |
| Descrizione ufficiale | Descrizione associata al codice nella specifica versione. | Campo derivato dal catalogo e non modificabile. Conservare comunque il testo sorgente della visura per rilevare differenze di versione o troncamenti. | Derivato da catalogo + testo sorgente. |
| Importanza | Ruolo attribuito al codice dalla fonte, ad esempio prevalente svolta dall'impresa o primaria Registro Imprese. | Menu singolo da catalogo: **Prevalente svolta dall'impresa**, **Primaria Registro Imprese**, **Secondaria Registro Imprese**, **Altra importanza ufficiale**, **Non indicata**. Ogni opzione deve descrivere l'ambito; “Altra” conserva la dicitura sorgente. | Riferimento a catalogo. |
| Fonte originaria | Ente o dichiarazione da cui deriva il codice, ad esempio Agenzia delle Entrate o attività dichiarata al Registro Imprese. | Menu singolo ricercabile: **Agenzia delle Entrate**, **Registro Imprese – attività dichiarata**, **Attribuzione camerale**, **Altra fonte ufficiale**, **Non indicata**. Il valore deve poter coesistere con l'indicazione di riclassificazione. | Riferimento a catalogo fonti. |
| Riclassificato d'ufficio | Indica che il codice è stato riclassificato automaticamente/d'ufficio nella nuova versione. | Sì/No/Non disponibile. Se **Sì**, richiedere o acquisire il sistema/codice di origine quando disponibile. | Booleano nullable. |
| Data di inizio validità | Data da cui il codice risulta riferito all'attività o all'ambito. | Date picker, opzionale. | `DATE` nullable. |
| Data di fine validità | Data di cessazione/sostituzione del codice, se conosciuta. | Date picker; deve essere successiva o uguale alla data di inizio. | `DATE` nullable. |
| Testo originale della classificazione | Blocco testuale così come restituito dalla fonte, comprensivo di note su importanza e provenienza. | Sola lettura, utile per audit. | Testo sorgente. |

### 8.3 Albi, ruoli e registri

Il blocco è ripetibile e viene utilizzato quando la visura contiene dettagli ulteriori rispetto all'indicatore della sezione 0.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia di albo/ruolo/registro | Catalogo cui appartiene l'iscrizione. | Autocomplete da catalogo nazionale e territoriale degli albi/ruoli/registri. Mostrare denominazione, ente competente e ambito. “Altro” richiede denominazione e autorità. | Riferimento a catalogo. |
| Ente competente | Autorità che gestisce l'iscrizione. | Derivato dal catalogo quando univoco; altrimenti autocomplete enti. | Relazione a ente. |
| Numero di iscrizione | Identificativo dell'impresa nell'albo o registro. | Input alfanumerico; univocità insieme a albo, ente e sezione. | Stringa indicizzata. |
| Sezione/categoria | Sezione o categoria interna all'albo. | Menu dipendente dall'albo quando esiste un catalogo; altrimenti valore sorgente da classificare. | Riferimento a catalogo/testo. |
| Data di iscrizione | Data di decorrenza dell'iscrizione. | Date picker. | `DATE` nullable. |
| Data di scadenza | Termine dell'iscrizione, quando previsto. | Date picker; successiva alla data di iscrizione. | `DATE` nullable. |
| Stato | Stato dell'iscrizione. | Menu: **Attiva**, **Sospesa**, **Cessata**, **Revocata**, **Scaduta**, **In rinnovo**, **Non determinato**. Lo stato “Scaduta” può essere calcolato dalla data, ma il valore ufficiale resta separato. | Riferimento a catalogo. |

### 8.4 Licenze e autorizzazioni

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia di licenza/autorizzazione | Provvedimento che abilita l'impresa a una determinata attività. | Autocomplete da catalogo dei titoli autorizzativi. “Altro” richiede denominazione. | Record ripetibile, riferimento a catalogo. |
| Ente rilasciante | Autorità che ha emesso il titolo. | Autocomplete enti pubblici/autorità. | Relazione a ente. |
| Numero del provvedimento | Identificativo della licenza o autorizzazione. | Input alfanumerico. | Stringa nullable. |
| Data del provvedimento/rilascio | Data di adozione o rilascio. Se entrambe sono disponibili, conservarle separatamente. | Date picker. | `DATE` nullable. |
| Data di scadenza | Termine di validità. | Date picker. | `DATE` nullable. |
| Attività autorizzata | Descrizione dell'attività o ambito coperto dal titolo. | Area di testo; eventuale relazione a codici attività senza sostituire il testo ufficiale. | Testo + relazioni opzionali. |
| Stato | Stato del titolo. | Menu: **Valida**, **Sospesa**, **Revocata**, **Scaduta**, **In rinnovo**, **Non determinata**. | Riferimento a catalogo. |

### 8.5 Categorie di opere generali e specializzate

Le categorie sono informazioni provenienti dal Casellario ANAC e devono poter essere collegate all'attestazione SOA che le supporta.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Fonte | Fonte del dato, nella visura di riferimento Casellario ANAC. | Campo da catalogo fonti, normalmente valorizzato automaticamente e di sola lettura. | Riferimento a catalogo. |
| Categoria SOA | Codice e denominazione della categoria, ad esempio `OG1 — edifici civili e industriali` o `OS7`. | Autocomplete dal catalogo ufficiale delle categorie SOA, ricercabile per codice e descrizione. Il catalogo deve distinguere opere generali OG e specializzate OS e mantenere versioni/validità. | Riferimento a catalogo categorie. |
| Tipo categoria | Distingue categoria generale o specializzata. | Derivato dal catalogo: **OG – Opera generale**, **OS – Opera specializzata**. Sola lettura. | Derivato. |
| Classifica | Livello di importo autorizzato, ad esempio I, III o V. | Menu singolo dal catalogo delle classifiche SOA vigenti. Ogni opzione mostra codice romano e limite economico; non hard-codificare gli importi nel frontend. | Riferimento a catalogo classifiche. |
| Importo limite | Importo massimo associato alla classifica, ad esempio “fino a 5.165.000 euro”. | Derivato dal catalogo in base a classifica, normativa e periodo. Non modificabile separatamente. | Decimal derivato + valuta. |
| Data di riferimento/validità | Data alla quale la categoria e classifica risultano valide. | Date picker o periodo derivato dall'attestazione collegata. | Data/intervallo. |
| Attestazione collegata | Attestazione SOA da cui deriva la categoria/classifica. | Autocomplete limitato alle attestazioni dell'impresa. | Relazione obbligatoria quando nota. |

### 8.6 Attestazione di qualificazione all'esecuzione di lavori pubblici

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Codice identificativo SOA | Codice fiscale o identificativo dell'organismo di attestazione riportato dalla fonte. | Input alfanumerico con validazione coerente con la natura dell'organismo. Usarlo per ricercare/riutilizzare l'ente. | Identificativo dell'ente. |
| Denominazione SOA | Denominazione completa dell'organismo che rilascia l'attestazione. | Autocomplete catalogo organismi SOA/enti, con ricerca per denominazione e identificativo. Conservare la denominazione sorgente. | Relazione a ente + testo sorgente. |
| Numero attestazione | Identificativo dell'attestazione, ad esempio `79220/10/00`. | Input alfanumerico che accetta barre e trattini. Deve essere univoco almeno per organismo emittente. | Stringa indicizzata. |
| Data di rilascio | Data in cui l'attestazione è stata rilasciata. | Date picker. | `DATE`. |
| Data di scadenza | Data finale di validità. | Date picker, successiva al rilascio. Può alimentare lo scadenzario senza duplicare la data. | `DATE`. |
| Regolamento | Riferimento normativo applicato, ad esempio `D.P.R. 207/2010`. | Autocomplete da catalogo normativo oppure input assistito se il riferimento non è censito. Conservare testo e, se disponibile, identificativo della norma. | Relazione a norma + testo. |
| Stato dell'attestazione | Stato corrente rispetto alla fonte e alle date. | Menu: **Valida**, **In scadenza**, **Scaduta**, **Sospesa**, **Revocata**, **Non determinata**. “In scadenza” può essere calcolato secondo soglia configurabile; non sovrascrive lo stato ufficiale. | Stato ufficiale + stato calcolato. |
| Fonte | Origine dell'informazione, normalmente Casellario ANAC. | Campo da catalogo fonti di sola lettura per importato. | Riferimento a catalogo. |

### 8.7 Ulteriori informazioni dal Casellario ANAC

Il blocco è ripetibile e non deve essere limitato alla sola certificazione di qualità osservata nella visura di riferimento.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia informazione | Categoria dell'informazione proveniente dal Casellario, ad esempio certificazione di qualità collegata alla qualificazione. | Menu da catalogo ANAC: **Certificazione di qualità**, **Annotazione**, **Provvedimento**, **Requisito**, **Altra informazione**. “Altra” richiede descrizione. | Record ripetibile, riferimento a catalogo. |
| Descrizione | Contenuto ufficiale dell'informazione. | Area di testo, conservazione integrale del testo sorgente. | Testo. |
| Ente/organismo collegato | Soggetto citato, ad esempio l'organismo che ha rilasciato la certificazione. | Autocomplete enti/organismi di certificazione. | Relazione a ente nullable. |
| Data del provvedimento/rilascio | Data associata all'informazione, se presente. | Date picker. | `DATE` nullable. |
| Data di scadenza | Termine di validità riportato dal Casellario. | Date picker. | `DATE` nullable. |
| Stato | Stato dell'informazione o provvedimento quando disponibile. | Menu catalogato dipendente dalla tipologia; in assenza usare **Non determinato** e conservare il testo. | Riferimento a catalogo nullable. |

### 8.8 Certificazioni in corso di validità

Le certificazioni sono record autonomi e storici. Non devono essere rappresentate da semplici flag ISO. Devono collegarsi al catalogo delle certificazioni della piattaforma e ai settori IAF senza creare duplicati.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Fonte | Fonte che comunica la certificazione, ad esempio Accredia. | Menu da catalogo fonti; per importazione automatica è sola lettura. | Riferimento a catalogo. |
| Data ultimo aggiornamento fonte | Data riportata dalla fonte per l'ultimo aggiornamento del blocco certificazioni. Non coincide con l'importazione. | Date picker/sola lettura in importazione. Deve applicarsi allo snapshot della fonte. | `DATE`. |
| Tipologia certificazione | Famiglia della certificazione, ad esempio sistema di gestione per qualità o salute e sicurezza. | Autocomplete dal catalogo `cat_certificazioni`. Deve mostrare codice interno, denominazione, descrizione e stato attivo. Se la certificazione ufficiale non è censita, conservarla da classificare e chiedere conferma prima di creare il catalogo. | Relazione a catalogo certificazioni. |
| Sigla/famiglia camerale | Sigla riportata dalla CCIAA, ad esempio SGQ o SCR. | Campo breve associato alla tipologia; normalmente derivato dal valore sorgente e non usato come chiave unica. | Stringa sorgente. |
| Norma | Norma e versione oggetto di certificazione, ad esempio UNI EN ISO 9001:2015. | Autocomplete dal catalogo norme, ricercabile per codice e titolo. Il menu deve distinguere le edizioni; non usare una voce generica “ISO 9001” quando la fonte indica l'edizione. | Relazione a catalogo norme. |
| Numero certificato | Numero attribuito dall'organismo, ad esempio `SC 17-4279`. | Input alfanumerico. L'univocità va valutata insieme a organismo e norma. | Stringa indicizzata. |
| Data prima emissione | Data della prima certificazione nel ciclo storico indicato dalla fonte. | Date picker. Non deve essere sovrascritta dalla data di rinnovo. | `DATE` nullable. |
| Data emissione corrente | Data di emissione della versione/ciclo corrente, se disponibile. | Date picker; uguale o successiva alla prima emissione. | `DATE` nullable. |
| Data di scadenza | Data di fine validità del certificato corrente. | Date picker; alimenta scadenze e avvisi. | `DATE` nullable. |
| Organismo certificatore | Organismo che ha emesso il certificato. | Autocomplete dal catalogo organismi, con ricerca per denominazione e codice fiscale. Se assente, proporre classificazione senza duplicarlo. | Relazione a ente. |
| Codice fiscale organismo | Identificativo fiscale dell'organismo, ad esempio `07497701008`. | Campo derivato dall'ente selezionato; può essere usato per riconciliare il soggetto importato. Validazione formale. | Identificativo dell'ente. |
| Stato della certificazione | Stato ufficiale e operativo della certificazione. | Menu: **Valida**, **Sospesa**, **Revocata**, **Scaduta**, **In rinnovo**, **Non determinata**. Separare lo stato ufficiale dallo stato calcolato in base alla data. | Riferimento a catalogo + calcolo. |
| Scopo della certificazione | Campo testuale che descrive le attività/sedi coperte, se disponibile. | Area di testo estesa. Non dedurre automaticamente dall'attività prevalente. | Testo nullable. |

#### 8.8.1 Settori certificati

Il blocco è molti-a-molti: una certificazione può coprire più settori IAF e uno stesso settore può appartenere a più certificazioni.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Settore IAF | Codice e descrizione del settore certificato, ad esempio `28 — Costruzione`. | Multi-select ricercabile da `cat_settori_iaf`, mostrando codice, descrizione e stato attivo. Non consentire valori fuori catalogo senza flusso di classificazione. | Relazione molti-a-molti. |
| Descrizione sorgente | Testo del settore così come riportato dalla fonte. | Sola lettura, conservato per audit e riconciliazione. | Testo sorgente. |
| Data inizio/fine copertura | Periodo in cui il settore risulta coperto dal certificato, se disponibile. | Due date picker con controllo fine ≥ inizio. | Intervallo nullable. |

### 8.9 Addetti

I dati degli addetti sono snapshot storici provenienti dall'INPS. Non devono aggiornare direttamente il modulo Personale né essere confusi con conteggi manuali o con la fotografia annuale al 31 dicembre. Ogni rilevazione conserva fonte, anno, trimestre e data.

#### 8.9.1 Rilevazione complessiva

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Fonte | Origine della rilevazione, nella visura “elaborazione da fonte INPS”. | Menu da catalogo fonti, sola lettura per importazione. | Riferimento a catalogo. |
| Anno di rilevazione | Anno cui appartiene il periodo osservato. | Selettore anno; non deve essere ricavato soltanto dalla data documento se la fonte indica un anno diverso. | Intero anno. |
| Trimestre | Trimestre della rilevazione. | Menu singolo: **I trimestre**, **II trimestre**, **III trimestre**, **IV trimestre**. Ogni opzione corrisponde a valori 1–4. | Enum/intero. |
| Data di rilevazione | Data puntuale “dati rilevati al”, ad esempio 31/03/2026. | Date picker. Deve essere coerente con anno e trimestre; le incoerenze importate vanno segnalate. | `DATE`. |
| Dipendenti | Numero di lavoratori dipendenti rilevati dalla fonte. | Intero non negativo. `NULL` se non presente. | Intero nullable. |
| Indipendenti | Numero di addetti indipendenti rilevati. | Intero non negativo. | Intero nullable. |
| Totale addetti | Totale ufficiale riportato. | Intero non negativo. Calcolare anche dipendenti + indipendenti e segnalare differenze; non sovrascrivere lo snapshot ufficiale. | Snapshot + calcolo di controllo. |
| Collaboratori | Numero dei collaboratori riportato separatamente. Non deve essere sommato al totale senza una regola della fonte. | Intero non negativo. | Intero nullable. |

#### 8.9.2 Distribuzione dei dipendenti per contratto

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia contrattuale | Categoria contrattuale usata dalla fonte. | Menu da catalogo iniziale: **Tempo determinato**, **Tempo indeterminato**, **Altra tipologia**, collegato alla rilevazione. Il catalogo deve essere estendibile. | Record ripetibile, riferimento a catalogo. |
| Valore percentuale | Percentuale dei dipendenti appartenenti alla categoria. | Percentuale 0–100. Per lo stesso gruppo e rilevazione, la somma dovrebbe essere 100 entro tolleranza; segnalare ma non scartare dati ufficiali difformi. | Decimal percentuale. |
| Numero addetti | Conteggio assoluto, se reso disponibile dalla fonte o calcolabile senza ambiguità. | Intero non negativo. Se calcolato da percentuale, marcarlo come derivato e gestire l'arrotondamento. | Intero nullable/calcolato. |

#### 8.9.3 Distribuzione per orario di lavoro

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Tipologia orario | Categoria di orario della fonte. | Menu: **Tempo pieno**, **Tempo parziale**, **Altra tipologia**. | Record ripetibile, riferimento a catalogo. |
| Valore percentuale | Percentuale dei dipendenti nella categoria. | Percentuale 0–100 con controllo di somma del gruppo. | Decimal. |
| Numero addetti | Conteggio assoluto, se disponibile o derivabile. | Intero non negativo; indicare origine ufficiale o calcolata. | Intero nullable/calcolato. |

#### 8.9.4 Distribuzione per qualifica

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Qualifica | Qualifica INPS usata nella distribuzione, nella visura apprendista, operaio e impiegato. | Menu da catalogo che includa almeno **Apprendista**, **Operaio**, **Impiegato**, **Quadro**, **Dirigente**, **Altra qualifica**, senza assumere che tutte siano sempre presenti. | Record ripetibile, riferimento a catalogo. |
| Valore percentuale | Percentuale dei dipendenti con la qualifica. | Percentuale 0–100; controllo di somma con tolleranza. | Decimal. |
| Numero addetti | Conteggio assoluto, se disponibile o derivabile. | Intero non negativo, con indicazione della provenienza. | Intero nullable/calcolato. |

#### 8.9.5 Distribuzione territoriale degli addetti

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Comune | Comune cui la fonte attribuisce gli addetti. | Autocomplete comuni italiani. | Riferimento territoriale. |
| Provincia | Provincia del comune. | Derivata dal comune; conservare testo sorgente. | Derivato. |
| Sedi/unità comprese | Elenco delle sedi o unità locali incluse nel conteggio, ad esempio “Sede e Unità locali: 1-2”. | Multi-select delle sedi/unità dell'impresa. Il parser deve tradurre i numeri della visura negli identificatori stabili delle unità, mantenendo il testo sorgente quando la corrispondenza è incerta. | Relazione molti-a-molti. |
| Dipendenti | Dipendenti attribuiti al territorio. | Intero non negativo. | Intero nullable. |
| Indipendenti | Indipendenti attribuiti al territorio. | Intero non negativo. | Intero nullable. |
| Totale | Totale ufficiale territoriale. | Intero non negativo; confronto con dipendenti + indipendenti. | Snapshot + controllo calcolato. |

---

## 9. Sedi secondarie ed unità locali

Ogni unità locale deve essere un record autonomo con identificatore stabile. L'identificativo progressivo camerale non deve essere usato come unica chiave tecnica perché può dipendere dalla Camera o dal documento. Attività e classificazioni sono record collegati all'unità.

### 9.1 Identificazione dell'unità locale

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Sigla territoriale unità | Prefisso territoriale dell'identificativo, ad esempio `TV`. | Derivato dalla Camera/REA competente quando possibile; input breve catalogato per importazioni storiche. | Stringa/catalogo territoriale. |
| Numero progressivo unità | Progressivo camerale dell'unità, ad esempio `1` o `2`. | Input intero positivo. L'univocità deve essere valutata con impresa, sigla territoriale e periodo. | Intero indicizzato. |
| Identificativo visuale completo | Forma mostrata in visura, ad esempio `TV/1`. | Campo derivato da sigla + progressivo; conservare la stringa originale per audit. | Derivato + testo sorgente. |
| Tipologia dell'unità | Funzione della sede, ad esempio Sede operativa oppure Deposito, Magazzino. Un'unità può avere più qualificazioni contemporanee. | Multi-select da catalogo delle tipologie: **Sede secondaria**, **Sede operativa**, **Filiale**, **Succursale**, **Ufficio**, **Stabilimento**, **Laboratorio**, **Negozio**, **Deposito**, **Magazzino**, **Cantiere stabile**, **Altra unità locale**. Ogni opzione deve descrivere il significato; “Altra” richiede testo. | Relazione molti-a-molti a catalogo. |
| Denominazione dell'unità | Nome interno o camerale specifico dell'unità, quando presente. Non coincide con la tipologia. | Testo breve opzionale. | Stringa nullable. |
| Numero REA dell'unità | Eventuale identificativo REA specifico riportato per l'unità. | Controllo composto sigla + progressivo. Può essere `NULL`. | Stringa composta nullable. |
| Data di apertura | Data di apertura dichiarata dell'unità locale. | Date picker. Non può essere futura rispetto alla visura; segnalare date precedenti alla costituzione senza modificare l'importato. | `DATE`. |
| Data di chiusura | Data di chiusura dell'unità, se cessata. | Date picker; deve essere successiva o uguale all'apertura. | `DATE` nullable. |
| Stato dell'unità | Stato corrente/storico della sede. | Menu: **Attiva**, **Inattiva**, **Sospesa**, **Cessata**, **Non determinata**. Lo stato può essere calcolato dalla chiusura ma il valore ufficiale resta separato. | Riferimento a catalogo, storico. |

### 9.2 Indirizzo dell'unità locale

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Comune | Comune dell'unità locale. | Autocomplete comuni/territori secondo le regole della sede legale. | Riferimento territoriale. |
| Provincia | Provincia dell'unità. | Derivata dal comune, con conservazione del testo sorgente. | Derivato. |
| Toponimo | Tipo di area di circolazione. | Autocomplete catalogo toponimi. | Riferimento a catalogo. |
| Denominazione stradale | Nome della via/località. | Testo breve. | Stringa. |
| Numero civico | Civico e suffisso, ad esempio `3/2`. | Testo breve alfanumerico. | Stringa. |
| CAP | Codice postale. | Stringa validata in base alla nazione, preservando zeri iniziali. | Stringa. |
| Nazione | Stato della sede. | Autocomplete ISO 3166. | Riferimento a Paese. |
| Indirizzo completo originale | Testo così come presente nella visura. | Sola lettura per l'importato. | Testo sorgente. |

### 9.3 Attività esercitata presso l'unità locale

Il blocco è ripetibile per unità e periodo.

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Descrizione dell'attività | Attività ufficialmente esercitata presso la specifica unità. | Area di testo; non sostituire con la descrizione ATECO. | Testo storico. |
| Data di inizio dell'attività | Data di avvio della specifica attività presso l'unità. | Date picker; uguale o successiva all'apertura dell'unità salvo dato ufficiale anomalo. | `DATE` nullable. |
| Data di fine dell'attività | Data di cessazione della specifica attività presso l'unità. | Date picker; successiva o uguale all'inizio. | `DATE` nullable. |
| Ruolo dell'attività nell'unità | Indica se l'attività è primaria, secondaria o di altra importanza nell'unità. | Menu dal catalogo delle importanze: **Primaria Registro Imprese**, **Secondaria Registro Imprese**, **Prevalente svolta dall'impresa**, **Altra**, **Non indicata**. | Riferimento a catalogo. |

### 9.4 Classificazioni dell'attività dell'unità

I campi **Sistema di classificazione**, **Codice**, **Descrizione**, **Importanza**, **Fonte**, **Riclassificato d'ufficio**, **Data inizio** e **Data fine** seguono integralmente le regole della sezione 8.2. Ogni record deve avere obbligatoriamente il riferimento all'unità locale e, quando applicabile, alla specifica attività dell'unità.

| Campo aggiuntivo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Unità locale collegata | Istanza cui appartiene la classificazione. | Autocomplete limitato alle unità dell'impresa, mostrando identificativo `sigla/progressivo`, tipologia e indirizzo. Obbligatorio. | Chiave esterna/relazione. |
| Attività locale collegata | Specifica attività dell'unità classificata dal codice. | Menu/autocomplete delle attività attive per l'unità; può essere `NULL` se la fonte collega il codice all'unità in generale. | Relazione nullable. |

### 9.5 Albi, ruoli, licenze e autorizzazioni dell'unità

Le iscrizioni o autorizzazioni riferite a una specifica unità utilizzano i campi e i cataloghi delle sezioni 8.3 e 8.4, aggiungendo obbligatoriamente il collegamento all'unità locale. La stessa iscrizione non deve essere duplicata a livello impresa e unità: se ha ambiti multipli, utilizzare relazioni agli ambiti coperti.

---

## 10. Aggiornamento impresa

### 10.1 Data ultimo protocollo

| Campo | Informazione e funzionamento | Controllo e validazione | Natura del dato |
|---|---|---|---|
| Data ultimo protocollo | Data dell'ultima pratica protocollata che la visura indica come aggiornamento più recente dell'impresa. Non coincide con data di estrazione, data di importazione o `updated_at` tecnico. | Date picker/sola lettura per importato. Non può essere successiva alla data di estrazione della visura; se lo fosse, segnalare l'anomalia senza perdere il dato. | `DATE`, snapshot per documento. |

### 10.2 Metadati tecnici di acquisizione

Questi dati non sono voci della visura e non devono essere mostrati come campi camerali ordinari, ma sono necessari al funzionamento della piattaforma e alla revisione del database.

| Campo tecnico | Funzione | Regola |
|---|---|---|
| Documento sorgente | Collega ogni importazione al PDF/JSON originale. | Relazione obbligatoria per dati importati, con hash del file e identificativo documento quando disponibili. |
| Data e ora di importazione | Momento in cui il sistema ha acquisito il documento. | Timestamp con fuso orario, valorizzato dal backend. |
| Stato dell'importazione | Esito del processo di estrazione e riconciliazione. | Menu tecnico: **Caricato**, **In elaborazione**, **Elaborato**, **Elaborato con anomalie**, **Fallito**, **Annullato**. Ogni stato deve avere descrizione ed eventuale dettaglio errore. |
| Versione del parser/tracciato | Versione del componente o schema usato per interpretare il documento. | Stringa tecnica immutabile per importazione, utile a riprocessamenti e audit. |
| Valore sorgente | Rappresentazione originale da cui è stato prodotto un campo normalizzato. | Conservare per i campi importati senza usarla come unica fonte operativa. |
| Stato di riconciliazione | Esito del confronto tra record importato ed esistente. | Menu tecnico: **Nuovo**, **Invariato**, **Modificato**, **Non riconciliato**, **Duplicato potenziale**, **Scartato con motivazione**. |
| Data ultima conferma | Momento in cui il valore corrente è stato approvato. | Timestamp derivato dal sistema di verifica; si invalida soltanto quando cambia il valore rilevante. |

---

# 4. Cataloghi e menu richiesti

La rielaborazione del database dovrà verificare se i seguenti cataloghi esistono già e possono essere riutilizzati. Non devono essere create nuove tabelle senza conferma.

| Catalogo funzionale | Utilizzo principale | Caratteristiche richieste |
|---|---|---|
| Tipi di visura | Sezione 0 | Tipologia ordinaria/storica, categoria soggetto, denominazione ufficiale, validità. |
| CCIAA e Registri Imprese | Sezioni 0, 1, 2, 7 | Codice, denominazione, territorio, stato attivo e periodo di validità. |
| Stati camerali dell'impresa | Sezione 0 | Stato ufficiale, descrizione, compatibilità e ordine. |
| Paesi ISO 3166 | Indirizzi, cittadinanza, nascita | Codici alpha-2/alpha-3, denominazione, stato attivo. |
| Forme giuridiche | Sezione 2 | Codice ufficiale, sigla, denominazione, famiglia e validità. |
| Sezioni Registro Imprese | Sezione 2 | Ordinaria, speciali/autonome e future estensioni, con descrizione. |
| Sistemi e organi amministrativi | Sezioni 2 e 5 | Modello monocratico/collegiale, forma giuridica compatibile, componenti. |
| Organi e cariche di controllo | Sezione 6 | Tipologie, effettivo/supplente, soggetto persona/organizzazione. |
| Tipi di durata | Sezioni 2, 5 e 6 | Data, indeterminata, esercizi, approvazione bilancio, revoca, altra. |
| Diritti su partecipazioni | Sezione 4 | Proprietà, usufrutto, nuda proprietà, pegno, sequestro, contitolarità e altri. |
| Cariche camerali | Sezioni 5 e 6 | Codice, denominazione, famiglia, rappresentanza potenziale e compatibilità. |
| Operazioni societarie e ruoli | Sezione 7 | Famiglie, sottotipi e ruoli consentiti per ogni evento. |
| ATECO/ATECORI/NACE versionati | Sezioni 0, 8 e 9 | Versione, codice, descrizione, gerarchia, validità e mapping tra versioni. |
| Fonti informative | Tutte le sezioni | CCIAA, Registro Imprese, Agenzia Entrate, INPS, ANAC, Accredia, manuale, generato. |
| Albi, ruoli, registri e autorizzazioni | Sezioni 0, 8 e 9 | Ente, ambito, sezioni/categorie, stato e validità. |
| Categorie e classifiche SOA | Sezione 8 | Codice, descrizione, OG/OS, classe, limite economico, normativa e validità. |
| Certificazioni e norme | Sezione 8 | Riutilizzo di `cat_certificazioni`, norme/edizioni, organismi e stato. |
| Settori IAF | Sezione 8 | Riutilizzo di `cat_settori_iaf`, codici e descrizioni ufficiali. |
| Tipologie contrattuali, orari e qualifiche INPS | Sezione 8 | Codice sorgente, descrizione, gruppo distributivo e validità. |
| Tipologie di unità locale | Sezione 9 | Tipologie multiple, descrizione e compatibilità. |
| Stati di verifica | Tutti i campi | `DA_VERIFICARE`, `APPROVATO`, `IN_REVISIONE`, ordine, descrizione e regole di transizione. |

---

# 5. Informazioni necessarie per la successiva rielaborazione del database

Per ogni campo e blocco descritto dovrà essere prodotta una tabella di corrispondenza con almeno:

1. percorso funzionale completo del campo;
2. tabella e colonna attualmente utilizzate;
3. API, servizio e componente frontend che leggono o modificano il dato;
4. natura scalare, ripetibile, storica, catalogata o calcolata;
5. chiave con cui un record importato viene riconciliato;
6. provenienza e valore sorgente conservati;
7. stato di verifica e nota collegati alla corretta istanza;
8. eventuale riuso da altri moduli;
9. anomalia o differenza rispetto alla presente specifica;
10. intervento proposto: mantenimento, rinomina, spostamento, relazione, migrazione o nuova struttura.

Claude Code dovrà prima consegnare questa mappatura e chiedere conferma per qualsiasi nuova tabella o modifica strutturale non già prevista. Non dovrà cancellare, duplicare o ricreare tabelle esistenti per adattarle meccanicamente alla nuova gerarchia visuale.

Ogni migrazione approvata dovrà inoltre:

- preservare i dati esistenti;
- essere incrementale e ripetibile;
- registrare sezioni, blocchi e campi in `sys_elementi`;
- utilizzare `sys_elementi.descrizione` per rendere disponibili le descrizioni del presente documento nel tasto Info;
- mantenere le relazioni con certificazioni e settori IAF attraverso le strutture già esistenti;
- gestire correttamente isolamento multi-azienda, audit, timestamp e autorizzazioni;
- prevedere test di importazione nuova, importazione invariata, modifica, record multipli, valori nulli e riconciliazione storica.
