# PROMPT MASTER PER CLAUDE CODE

## Implementazione del modello grafico e funzionale del modulo “Anagrafica Aziendale” nella piattaforma esistente

> **Come usare questo documento**  
> Apri in Claude Code la cartella principale della piattaforma reale. Fornisci a Claude anche il progetto HTML/React realizzato come prototipo grafico e comportamentale. Chiedigli di leggere interamente questo documento prima di modificare qualsiasi file. Questo documento è un prompt operativo e un capitolato di implementazione: deve essere eseguito, non soltanto riassunto.

---

# 1. Mandato generale

Devi integrare nella piattaforma esistente il modello grafico, funzionale e di interazione rappresentato dal prototipo HTML fornito insieme a questo documento.

Il prototipo non deve diventare una nuova applicazione parallela, un iframe, una pagina statica o una demo scollegata. Deve essere utilizzato come **riferimento vincolante per grafica, gerarchia, stati e comportamento**, mentre l’implementazione finale deve essere inserita nell’architettura, nelle rotte, nei componenti, nei servizi, nelle API, nei modelli, nelle autorizzazioni e nelle convenzioni già presenti nella piattaforma.

L’obiettivo non è copiare alla cieca i nomi e i dati dimostrativi del prototipo. L’obiettivo è importare nella piattaforma reale:

- la medesima home del modulo;
- la medesima gerarchia tra modulo, macrosezioni, sezioni e campi;
- i medesimi layout di apertura, affiancamento e visualizzazione a tutta larghezza;
- la gestione della visibilità di ogni informazione;
- la gestione dello stato di verifica di ogni informazione;
- le note associate a ogni informazione;
- il calcolo reale degli indicatori di completezza e qualità;
- gli stati di caricamento, errore, modifica, salvataggio e abbandono;
- le stesse regole di interazione per tutte le parti del modulo, non soltanto per gli esempi presenti nel prototipo.

## 1.1 Regola fondamentale di adattamento

La piattaforma reale potrebbe avere:

- nomi diversi per macrosezioni, sezioni o campi;
- un numero maggiore o minore di informazioni;
- componenti e design token già esistenti;
- API e servizi già funzionanti;
- modelli e tabelle con una struttura differente;
- permessi e ruoli già definiti;
- cataloghi di elementi, moduli, certificazioni o settori già presenti.

Non devi forzare la piattaforma a usare i dati dimostrativi del prototipo. Devi invece **mappare le entità reali nel comportamento del prototipo**.

Esempio: se nella piattaforma la macrosezione equivalente a “Informazioni societarie” ha un nome diverso o contiene sezioni aggiuntive, mantieni il nome e i dati reali ma applica lo stesso comportamento di apertura, verifica, visibilità, modifica, caricamento, errore, affiancamento e visualizzazione completa.

Non eliminare campi reali perché non compaiono nel prototipo. Non creare duplicati di campi già presenti. Non rinominare indiscriminatamente entità di dominio già utilizzate da backend, database o API.

---

# 2. Ordine di priorità delle fonti

Quando trovi differenze tra piattaforma reale, prototipo HTML e questo documento, usa il seguente ordine di priorità:

1. **Il modello di dominio e i dati reali della piattaforma** determinano quali informazioni esistono e come sono nominate internamente.
2. **Questo documento** determina comportamento, regole funzionali, persistenza, controlli, stati, calcoli e correzioni esplicitamente richieste.
3. **Il prototipo HTML** determina aspetto visivo, proporzioni, gerarchia, disposizione degli elementi, animazioni e microinterazioni, salvo le correzioni esplicite indicate in questo documento.

Le seguenti correzioni di questo documento prevalgono sul prototipo, se il prototipo non è ancora stato aggiornato:

- il comando della prima macrosezione non deve mostrare il testo “Comprimi” o “Espandi”: deve essere una **freccetta coerente con le macrosezioni sottostanti**;
- nella scheda a tutta larghezza non deve apparire il pallino arancione accanto al nome della scheda;
- nel footer della scheda a tutta larghezza deve apparire la legenda degli stati, non la scritta “Modifiche non salvate”;
- anche nella scheda a tutta larghezza ogni campo deve avere occhietto e indicatore di stato;
- la nota deve essere presente in tutti e tre gli stati del campo.

---

# 3. Procedura obbligatoria prima dell’implementazione

## 3.1 Analisi del repository

Prima di modificare il codice:

1. leggi gli eventuali file di istruzioni del repository;
2. identifica stack frontend, backend e database realmente usati;
3. identifica package manager, routing, sistema di componenti, libreria di icone e design system;
4. individua la pagina e la rotta attuale di “Anagrafica Aziendale” o del modulo equivalente;
5. individua componenti, hook, store, query, API client e servizi già usati da quella pagina;
6. individua modelli ORM, schema database, migrazioni e convenzioni di naming;
7. individua il sistema di autenticazione e i ruoli applicativi;
8. individua eventuali cataloghi di moduli, sezioni, elementi, certificazioni e settori;
9. individua test esistenti e convenzioni per unit test, integration test ed end-to-end test;
10. individua come la piattaforma gestisce errori, notifiche, loading, modali e modifiche non salvate.

Non creare una nuova app, non sostituire lo stack e non inizializzare un nuovo progetto.

## 3.2 Matrice di corrispondenza obbligatoria

Prima dell’implementazione prepara una matrice interna con almeno queste colonne:

| Requisito del prototipo | Componente/servizio esistente | Dato o tabella esistente | Intervento necessario | Blocco o rischio |
|---|---|---|---|---|
| Home del modulo | percorso reale | sorgente dati reale | adattamento UI | eventuali dipendenze |
| Macrosezioni | componente reale | catalogo reale | componente riutilizzabile | differenze di naming |
| Sezioni | componente reale | catalogo reale | replica comportamento | campi aggiuntivi |
| Stato del campo | componente reale | tabella/colonna reale | mapping | eventuale schema mancante |
| Visibilità del campo | componente reale | tabella/colonna reale | mapping | eventuale schema mancante |
| Nota del campo | componente reale | tabella/colonna reale | mapping | eventuale schema mancante |
| Audit verifica | servizio reale | tabella log reale | mapping | eventuale schema mancante |
| Qualità dati | servizio reale | query/campi reali | calcolo | denominatore applicabile |

Questa matrice deve guidare l’integrazione e impedire la creazione di funzioni duplicate.

---

# 4. Blocco obbligatorio prima di creare o modificare tabelle

## 4.1 Regola inderogabile

Non è garantito che nel database esistano tutte le tabelle o le colonne necessarie per ottenere il comportamento richiesto.

**Non devi creare nuove tabelle, aggiungere colonne, introdurre enum, creare migrazioni o modificare vincoli senza aver prima chiesto conferma esplicita all’utente.**

Prima verifica se le capacità richieste possono essere soddisfatte riutilizzando correttamente:

- tabelle dati del modulo;
- cataloghi di elementi o campi;
- tabelle di relazione tra aziende e moduli;
- tabelle di stato, presa visione, approvazione o revisione;
- log o audit trail;
- tabelle utenti e ruoli;
- eventuali strutture già dedicate a visibilità, note o verifiche.

Se il progetto contiene già strutture concettualmente equivalenti, per esempio un catalogo generale degli elementi come `sys_elementi`, relazioni con certificazioni o settori, oppure una tabella di presa visione e revisione, riutilizzale quando il significato è compatibile. Non creare tabelle parallele soltanto perché il nome è diverso.

## 4.2 Cosa fare quando manca qualcosa

Se manca anche una sola capacità persistente necessaria:

1. completa l’analisi senza applicare la modifica allo schema;
2. indica chiaramente cosa esiste e cosa manca;
3. proponi la soluzione minima coerente con le convenzioni del repository;
4. elenca tabelle, colonne, chiavi, vincoli, indici e migrazioni che vorresti introdurre;
5. descrivi l’impatto su dati, API e rollback;
6. chiedi conferma esplicita;
7. fermati prima di creare o eseguire la migrazione.

Usa una richiesta simile alla seguente:

> Ho completato l’analisi. Per implementare stato, visibilità e note dei campi posso riutilizzare [...]. Manca invece [...]. Propongo di creare/modificare [...] con le seguenti colonne e relazioni: [...]. La migrazione avrebbe questo impatto: [...]. Vuoi che proceda con questa modifica al database?

Se l’utente non conferma, non creare lo schema e non simulare silenziosamente la persistenza con stato locale, mock permanenti o `localStorage`.

Se tutte le capacità necessarie esistono già, procedi senza chiedere una conferma superflua, documentando il mapping usato.

## 4.3 Capacità dati minime richieste

I nomi fisici non sono prescrittivi: adattali allo schema reale. Devono però esistere logicamente le seguenti capacità.

### A. Catalogo degli elementi del modulo

Ogni campo gestibile deve avere un identificatore stabile e deve essere collegabile a:

- modulo;
- macrosezione;
- sezione;
- eventuale elemento padre;
- ordine di visualizzazione;
- descrizione o testo informativo;
- obbligatorietà;
- applicabilità;
- eventuali certificazioni e settori che lo abilitano;
- tipo di dato e regole di validazione, quando già previste dall’architettura.

### B. Stato di revisione per azienda e campo

Per ogni azienda e campo applicabile deve essere possibile persistere almeno:

- identificativo azienda/tenant;
- identificativo stabile del campo o elemento;
- stato: `verified`, `review`, `pending`, oppure gli equivalenti già usati;
- visibilità verso l’azienda;
- nota, sempre disponibile in tutti gli stati;
- data e autore dell’ultima verifica;
- data e autore dell’ultima richiesta di revisione, se prevista;
- `created_at` e `updated_at`;
- eventuale versione o meccanismo di concorrenza ottimistica;
- impronta o versione del valore verificato, se necessaria per invalidare automaticamente la verifica quando il valore cambia.

Deve esistere un vincolo univoco equivalente a `azienda + elemento`, salvo diversa modellazione già presente.

### C. Audit trail

Deve essere possibile ricostruire almeno:

- cambio di valore;
- cambio di stato;
- cambio di visibilità;
- modifica della nota;
- utente che ha eseguito l’azione;
- data e ora;
- valore precedente e nuovo valore, oppure un riferimento alle relative versioni.

Riutilizza l’audit già esistente se copre questi requisiti.

---

# 5. Vincolo assoluto sulla home del modulo

La home di “Anagrafica Aziendale” realizzata nel prototipo deve rimanere **visivamente e strutturalmente identica**, salvo adattamento dei testi, dei valori e del numero di elementi ai dati reali della piattaforma.

Non ridisegnare la home. Non trasformarla in una tabella generica. Non aggiungere una sidebar interna non prevista. Non spostare i KPI. Non sostituire le card con componenti standard che alterino il risultato visivo. Non introdurre un hero marketing.

Devono essere conservati:

- intestazione con icona, titolo e descrizione;
- prima riga di indicatori;
- card “Completamento scheda”;
- card “Qualità dei dati”;
- card “Ultime modifiche”;
- macrosezione inizialmente aperta con card delle sezioni;
- righe compatte delle macrosezioni sottostanti;
- gerarchia tipografica;
- colori, bordi, raggi, ombre e densità;
- comportamento responsive;
- microinterazioni e stati hover/focus.

I dati dimostrativi del prototipo devono essere sostituiti dai dati reali restituiti dal backend.

## 5.1 Correzione del comando della prima macrosezione

Il comando in alto a destra della prima macrosezione, attualmente rappresentato nel prototipo da “Comprimi/Espandi”, deve diventare un controllo **solo icona**:

- usa la stessa freccetta/chevron delle macrosezioni sottostanti;
- mantieni forma, peso e dimensione coerenti con le altre righe;
- ruota la freccia in modo coerente con lo stato aperto/chiuso;
- mantieni `aria-expanded`, `aria-controls` e un’etichetta accessibile “Espandi [nome]”/“Comprimi [nome]”;
- non mostrare testo visibile “Comprimi” o “Espandi”.

---

# 6. Gerarchia funzionale da applicare all’intero modulo

La UI deve essere guidata dai dati e non da componenti codificati soltanto per gli esempi.

Gerarchia:

```text
Modulo Anagrafica Aziendale
└── Macrosezione
    └── Sezione
        └── Campo/elemento
```

## 6.1 Replica del comportamento delle macrosezioni

“Informazioni societarie” è il modello comportamentale. Lo stesso comportamento deve essere disponibile per **tutte le altre macrosezioni del modulo**, comprese quelle che nella piattaforma hanno nomi diversi da quelli del prototipo.

Ogni macrosezione deve poter offrire, quando applicabile:

- riepilogo nella home;
- stato complessivo;
- conteggio sezioni completate;
- espansione e compressione tramite chevron;
- card delle sezioni quando è aperta;
- apertura del dettaglio laterale;
- visualizzazione e modifica;
- apertura a tutta larghezza;
- affiancamento con la home;
- affiancamento con un’altra sezione o macrosezione;
- caricamento, errore e retry;
- protezione delle modifiche non salvate;
- visibilità e stato dei campi;
- legenda coerente;
- permessi coerenti con il ruolo.

Non duplicare la logica per ogni macrosezione. Crea o estendi componenti riutilizzabili alimentati da configurazione e dati reali.

## 6.2 Replica del comportamento delle sezioni

“Identificazione camerale” è il modello comportamentale. Lo stesso comportamento deve essere applicato a **tutte le sezioni del modulo**.

Ogni sezione deve avere:

- titolo e icona coerenti;
- eventuale stato complessivo della sezione;
- controllo di visibilità dell’intera sezione, se consentito;
- griglia dei campi;
- occhietto su ogni campo;
- indicatore di stato su ogni campo;
- popup ancorato all’indicatore selezionato;
- nota persistente in ogni stato;
- regole di modifica, validazione e salvataggio;
- audit delle operazioni;
- comportamento coerente nelle viste laterale, affiancata e completa.

La visibilità di sezione è un’azione bulk sui campi della sezione. Non deve cancellare i singoli stati di verifica.

---

# 7. Modello visivo

Riutilizza i token e i componenti del design system esistente quando producono lo stesso risultato. Non cambiare il font globale dell’intera piattaforma. Se occorrono token locali al modulo, usa come riferimento questi valori:

| Token | Valore di riferimento | Utilizzo |
|---|---:|---|
| Testo principale | `#0f194e` | titoli, valori, testi forti |
| Testo secondario | `#23346f` | descrizioni e sottotitoli |
| Testo attenuato | `#5e6f9f` | metadati e testi secondari |
| Blu primario | `#075eff` | azioni primarie, icone, focus |
| Blu scuro | `#0046d8` | hover azione primaria |
| Blu chiaro | `#eef4ff` | sfondi informativi |
| Verde verificato | `#08a77e` / `#00a47b` | stato confermato |
| Verde chiaro | `#eaf8f3` | sfondi verificati |
| Rosso da verificare | `#d7192d` | stato pendente/errore di verifica |
| Arancione revisione | `#ee7203` / `#ef6b00` | stato da revisionare |
| Arancione chiaro | `#fff1df` | badge revisione |
| Bordo | `#dfe6f2` | card, input e separatori |
| Sfondo pagina | `#f7f9fd` | pagina modulo |
| Ombra card | `0 7px 18px rgba(25,46,98,.08), 0 2px 5px rgba(25,46,98,.04)` | profondità leggera |

Indicazioni dimensionali desktop:

- contenitore home: massimo circa `1408px`, centrato;
- padding pagina: circa `24px 48px 48px`;
- card principali: raggio circa `15px`;
- griglia KPI: tre colonne, gap circa `22px`;
- griglia sezioni prima macrosezione: quattro colonne, gap circa `14px`;
- drawer laterale: `50vw`, minimo circa `720px`;
- affiancamento home/dettaglio: `50% / 50%`;
- popup stato campo: larghezza massima circa `356px`;
- indicatori stato: cerchio `21px`, legenda `18px`;
- transizioni: circa `150–210ms`, senza animazioni invasive.

Non usare emoji per le icone. Usa la libreria di icone già presente oppure icone SVG coerenti per spessore, dimensione e significato.

Gli stati non devono essere distinguibili soltanto dal colore:

- **Confermato**: verde + spunta;
- **Da verificare**: rosso + punto esclamativo;
- **Da revisionare**: arancione + frecce circolari;
- **Oscurato**: occhio barrato + fondo grigio leggero nella vista consulente.

---

# 8. Specifica schermata per schermata

## 8.1 Schermata A — Home del modulo

### Contenuto

1. Intestazione “Anagrafica Aziendale” o nome reale equivalente.
2. Sottotitolo esplicativo.
3. Indicatore completamento scheda.
4. Indicatore qualità dati.
5. Ultime modifiche.
6. Prima macrosezione espansa.
7. Macrosezioni successive in righe compatte.

### Interazioni

- clic sul dettaglio di una sezione: apre il relativo pannello;
- clic sul chevron della macrosezione: espande/comprime;
- la prima macrosezione usa lo stesso chevron delle successive, senza testo;
- le ultime modifiche devono provenire dall’audit reale;
- i KPI devono aggiornarsi dopo salvataggi e cambi di stato riusciti;
- l’home non deve perdere scroll o stato senza motivo quando si apre e chiude un pannello.

## 8.2 Schermata B — Drawer laterale di dettaglio

Il drawer occupa circa metà viewport e sovrappone il lato destro. Il contenuto sottostante resta riconoscibile e viene attenuato quando previsto dal prototipo.

Header:

- icona;
- nome macrosezione;
- badge complessivo;
- azione “Affianca”;
- azione “Apri in scheda”/“A tutta larghezza”;
- chiusura.

Contenuto:

- sezioni verticali separate;
- titolo sezione con icona e controllo visibilità di sezione;
- campi in due colonne quando lo spazio lo permette;
- occhietto e indicatore di stato per ciascun campo;
- legenda persistente nel footer;
- azione di modifica quando l’utente è autorizzato.

## 8.3 Schermata C — Drawer in modifica

- usa i controlli reali coerenti con il tipo di dato;
- mostra i campi obbligatori;
- mostra errori inline sotto il campo;
- disabilita il salvataggio finché esistono errori bloccanti;
- “Annulla” ripristina l’ultimo valore salvato;
- “Salva modifiche” chiama il backend e aggiorna audit, stato e KPI;
- non modificare lo stato di verifica prima della risposta positiva del backend;
- una modifica del valore precedentemente verificato deve riportare automaticamente il campo a “Da verificare”, salvo una diversa regola di dominio già esplicitamente prevista.

## 8.4 Schermata D — Affiancamento home + dettaglio

- home a sinistra, dettaglio a destra;
- divisione iniziale circa `50% / 50%`;
- non inserire una barra di schede sopra l’home nel semplice affiancamento;
- l’home si ricompone con griglie più compatte, senza perdere funzioni;
- il dettaglio conserva intestazione, sezioni, stati, legenda e azioni;
- “A tutta larghezza” apre la stessa entità nella vista completa;
- la chiusura ripristina l’home a larghezza intera.

## 8.5 Schermata E — Affiancamento di due sezioni

Quando, dalla parte sinistra, viene selezionata un’altra sezione da confrontare o compilare:

- mostra due pannelli affiancati;
- ogni pannello ha titolo, badge e azione “A tutta larghezza”;
- mantieni una scheda logica per Panoramica e per le sezioni aperte, se previsto dal flusso del prototipo;
- ciascun pannello mantiene scroll indipendente;
- ciascun pannello mantiene il proprio dirty state;
- le azioni di chiusura o cambio vista devono verificare separatamente eventuali modifiche non salvate;
- non confondere il semplice affiancamento home/dettaglio con la vista a due sezioni.

## 8.6 Schermata F — Scheda a tutta larghezza

La vista completa deve includere:

- barra superiore con “Panoramica” e nome della scheda attiva;
- nessun pallino arancione accanto al nome della scheda;
- titolo, badge e azione “Affianca”;
- sezioni e campi a tutta larghezza;
- occhietto e indicatore di stato per ogni campo;
- popup ancorato identico alle altre viste;
- footer con legenda completa: Confermato, Da revisionare, Da verificare e campo oscurato;
- azioni “Annulla” e “Salva modifiche” separate dalla legenda;
- protezione dalle modifiche non salvate anche se il testo non è mostrato nel footer.

Spaziatura delle sezioni:

- la riga separatrice appartiene visivamente alla sezione precedente;
- il titolo della sezione successiva deve essere più distante dalla riga;
- il titolo deve essere più vicino ai propri campi;
- come riferimento: padding superiore sezione circa `34px`, distanza titolo-campi circa `10px`.

## 8.7 Schermata G — Modifiche non salvate

Quando l’utente tenta di chiudere, cambiare scheda, passare all’affiancamento o tornare alla panoramica con modifiche non salvate, mostra una modale con:

- titolo “Modifiche non salvate”;
- spiegazione riferita alla sezione corretta;
- “Continua a modificare”;
- “Esci senza salvare”;
- “Salva ed esci”.

“Salva ed esci” deve essere disabilitato se il form contiene errori. `Escape` equivale a continuare la modifica. Dopo salvataggio positivo esegui l’azione di uscita richiesta; dopo errore resta nella schermata e mostra il problema.

## 8.8 Schermata H — Caricamento

Durante il caricamento del dettaglio:

- lascia l’home utilizzabile/visibile nella parte non interessata;
- mostra spinner e testo “Caricamento dati…”;
- usa skeleton che riproducono struttura di titoli, campi e footer;
- evita salti di layout;
- disabilita azioni che richiedono dati completi;
- usa `aria-busy` e messaggio accessibile.

## 8.9 Schermata I — Errore di caricamento

In caso di errore:

- mostra l’errore nel pannello interessato, non distruggere l’intera home;
- usa icona rossa chiaramente leggibile;
- titolo “Impossibile caricare i dati”;
- testo breve e comprensibile;
- pulsante “Riprova”;
- il retry deve ripetere la query reale e non ricaricare inutilmente tutta l’app;
- registra l’errore secondo il sistema di logging già esistente.

---

# 9. Stato, visibilità e nota di ogni campo

## 9.1 Stati ammessi

Usa i valori già esistenti se semanticamente equivalenti. La UI deve comunque distinguere tre stati:

| Stato UI | Significato | Icona | Colore |
|---|---|---|---|
| Confermato | il consulente ha verificato il valore attuale | spunta | verde |
| Da verificare | il valore non è ancora stato confermato o è cambiato | esclamativo | rosso |
| Da revisionare | è stata richiesta una correzione o integrazione | frecce circolari | arancione |

## 9.2 Regole di transizione

1. Un campo nuovo o modificato entra in “Da verificare”.
2. Il consulente può passare da “Da verificare” a “Confermato”.
3. Il consulente può passare da “Da verificare” a “Da revisionare”.
4. Dopo la correzione, un campo “Da revisionare” torna almeno a “Da verificare” oppure viene confermato esplicitamente dal consulente, secondo il flusso già adottato dalla piattaforma.
5. Un campo “Confermato” può ricevere una richiesta di revisione e passare a “Da revisionare”.
6. Salvare soltanto una nota su un campo confermato non deve aggiornare falsamente la data di verifica.
7. La modifica del valore di un campo confermato invalida la verifica precedente e conserva lo storico.
8. Il cambio di visibilità non modifica lo stato di verifica.

## 9.3 Visibilità

L’occhietto controlla la visibilità del dato verso l’azienda:

- occhio aperto: visibile;
- occhio barrato: non visibile;
- il consulente continua a vedere il campo oscurato, con sfondo grigio leggero;
- il backend non deve inviare il dato oscurato a utenti aziendali non autorizzati: non è sufficiente nasconderlo via CSS;
- l’oscuramento non elimina valore, stato, nota o audit;
- il controllo di sezione applica l’operazione ai campi appartenenti alla sezione;
- rispetta eventuali campi che per legge o configurazione non possono essere oscurati.

## 9.4 Nota presente in tutti gli stati

Il campo nota deve essere sempre presente, persistente e modificabile nei tre stati.

### Campo “Da verificare”

- titolo: “Verifica [nome campo]”;
- valore attuale;
- nota facoltativa;
- azioni: “Richiedi revisione” e “Verifica”.

### Campo “Da revisionare”

- titolo: “Revisione [nome campo]”;
- valore attuale;
- indicazione che la revisione è stata richiesta;
- nota della revisione, precompilata e modificabile;
- azioni: “Aggiorna richiesta” e “Conferma correzione”.

### Campo “Confermato”

- titolo: “[nome campo] verificata/o”, adattato grammaticalmente quando possibile;
- valore attuale;
- riquadro verde “Informazione confermata”;
- data e autore della verifica;
- nota facoltativa, sempre visibile e modificabile;
- azioni: “Richiedi revisione” e “Salva nota”;
- non mostrare nuovamente il pulsante “Verifica”.

---

# 10. Popup ancorato all’informazione

Il popup deve essere collegato all’indicatore di stato realmente selezionato. La punta deve orientarsi verso il campo e il popup deve spostarsi in base alla posizione del campo nella viewport.

Requisiti:

- usa il bounding rectangle dell’elemento attivatore o una libreria di floating positioning già presente;
- preferisci l’apertura sotto il campo se c’è spazio;
- apri sopra il campo quando lo spazio inferiore è insufficiente;
- limita la posizione entro i margini della viewport;
- allinea la punta al centro dell’indicatore, con clamp per evitare gli angoli;
- ricalcola posizione su resize, scroll del contenitore e variazioni dimensionali del popup;
- larghezza di riferimento `356px`, margine viewport circa `14px`, distanza dall’ancora circa `15px`;
- overlay scuro traslucido coerente con il prototipo;
- `Escape` chiude il popup;
- intrappola correttamente il focus e restituiscilo all’elemento attivatore alla chiusura;
- non posizionare il popup con coordinate hardcoded per un singolo mockup.

---

# 11. Indicatore “Qualità dei dati”

## 11.1 Formula vincolante

La qualità dei dati deve essere calcolata sull’intero modulo, non soltanto sulla macrosezione o sulla sezione aperta.

```text
qualità percentuale =
    numero di informazioni applicabili con stato Confermato
    -------------------------------------------------------- × 100
    numero totale di informazioni applicabili da inserire nel modulo
```

Arrotonda all’intero più vicino in modo coerente tra backend e frontend.

## 11.2 Denominatore

Nel totale devono rientrare tutti i campi applicabili all’azienda in base alla configurazione reale del modulo, inclusi:

- campi obbligatori;
- campi facoltativi comunque previsti e applicabili;
- campi vuoti ancora da inserire;
- campi da verificare;
- campi da revisionare;
- campi oscurati all’azienda.

Devono essere esclusi soltanto i campi esplicitamente “non applicabili” o non abilitati per quella azienda in base a configurazione, settore, certificazione, modulo acquistato o altra regola di dominio.

La semplice assenza di un valore non rende il campo non applicabile.

## 11.3 Numeratore

Contribuiscono al numeratore soltanto i campi con stato “Confermato” riferito al valore corrente.

Non contribuiscono:

- “Da verificare”;
- “Da revisionare”;
- campi vuoti;
- verifiche invalidate da una modifica successiva;
- campi mai verificati.

## 11.4 Conteggi mostrati

Accanto all’anello mostra conteggi reali e coerenti:

- elementi verificati;
- elementi da verificare;
- elementi da revisionare.

La somma dei tre conteggi deve coincidere con il totale dei campi applicabili, salvo la presenza di altri stati di dominio esplicitamente mappati.

Non hardcodare percentuali o conteggi nel frontend. Il backend deve essere la fonte autorevole oppure deve fornire tutti i dati necessari a un calcolo univoco e testato.

Se il totale applicabile è zero, mostra `0%` e uno stato esplicativo, evitando divisioni per zero.

## 11.5 Differenza rispetto al completamento

“Completamento scheda” e “Qualità dei dati” sono indicatori diversi.

- **Completamento scheda**: misura quante sezioni o informazioni richieste sono state compilate secondo le regole di completezza.
- **Qualità dei dati**: misura quante informazioni applicabili sono state confermate dal consulente.

Una sezione può essere completa ma contenere campi ancora da verificare. Non derivare un indicatore dall’altro.

---

# 12. Backend e contratti API

Adatta endpoint, controller, service e serializer allo stile già esistente. Non introdurre necessariamente i percorsi indicati qui sotto: sono capacità logiche.

Devono essere disponibili operazioni equivalenti a:

1. recupero panoramica del modulo con KPI, macrosezioni, sezioni, conteggi e ultime modifiche;
2. recupero dettaglio di una macrosezione/sezione;
3. aggiornamento dei valori del modulo;
4. aggiornamento dello stato di un campo;
5. salvataggio della nota senza cambiare stato;
6. richiesta o aggiornamento revisione;
7. conferma del campo o della correzione;
8. modifica visibilità singolo campo;
9. modifica visibilità bulk di una sezione;
10. recupero audit o cronologia;
11. ricalcolo/ritorno dei KPI aggiornati.

## 12.1 Requisiti delle mutazioni

- valida input lato server;
- verifica permessi lato server;
- usa transazioni quando un’azione modifica valore, stato e audit;
- restituisci il record aggiornato e i KPI aggiornati oppure invalida le query corrette;
- evita race condition e lost update usando la strategia già presente;
- non affidarti al solo stato del client;
- non modificare la data di verifica quando si salva soltanto la nota;
- registra autore e timestamp reali dal contesto autenticato;
- non hardcodare nomi utenti come “Marco R.”.

## 12.2 Caricamento ed errori

- usa il sistema di query/caching già presente;
- prevedi retry controllato;
- mantieni separato l’errore del pannello dal resto della pagina;
- mostra notifiche di successo solo dopo risposta positiva;
- su errore di salvataggio conserva i dati inseriti dall’utente.

---

# 13. Permessi e separazione delle viste

Usa i ruoli reali della piattaforma. In linea generale:

- il consulente o ruolo equivalente può verificare, richiedere revisione, gestire note e visibilità;
- l’admin aziendale o operatore può modificare soltanto i dati consentiti;
- gli utenti aziendali non autorizzati non vedono campi oscurati;
- l’audit deve identificare l’utente reale;
- il frontend nasconde/disabilita azioni non consentite, ma il backend applica comunque l’autorizzazione;
- le risposte API destinate all’azienda devono filtrare i dati oscurati lato server.

Non inventare nuovi ruoli se quelli esistenti possono essere mappati.

---

# 14. Architettura frontend

Implementa il comportamento con componenti riutilizzabili. I nomi seguenti sono esemplificativi e devono adattarsi alle convenzioni del progetto:

- `ModuleOverview`;
- `QualityIndicator`;
- `MacroSectionAccordion`;
- `SectionCard`;
- `SectionDetail`;
- `ReviewableField`;
- `FieldVisibilityButton`;
- `FieldStatusButton`;
- `FieldReviewPopover`;
- `DetailDrawer`;
- `SplitWorkspace`;
- `FullPageWorkspace`;
- `UnsavedChangesDialog`;
- `LoadingSkeleton`;
- `LoadErrorState`.

Requisiti:

- configurazione data-driven;
- nessun componente duplicato per ciascuna macrosezione;
- stato server gestito con la soluzione già adottata;
- stato UI locale soltanto per apertura, focus, bozze e layout;
- niente valori dimostrativi hardcoded nel codice di produzione;
- chiavi stabili basate su identificativi reali, non su etichette tradotte;
- riuso dei componenti form e validazione esistenti;
- nessuna riscrittura globale non necessaria.

---

# 15. Responsive e accessibilità

## Desktop ampio

- tre KPI sulla prima riga;
- quattro card nella macrosezione aperta;
- drawer e split al 50%;
- campi su due colonne;
- footer e legenda su una riga quando lo spazio lo consente.

## Tablet/intermedio

- KPI in due colonne con “Ultime modifiche” a tutta larghezza;
- card delle sezioni in due colonne;
- drawer più ampio;
- footer e legenda possono andare a capo.

## Mobile

- una colonna;
- drawer a tutta larghezza;
- azioni principali sempre raggiungibili;
- popup entro la viewport;
- legenda leggibile e avvolta;
- per due sezioni affiancate usa una strategia mobile coerente, per esempio pannelli navigabili, senza comprimere il contenuto fino a renderlo inutilizzabile.

## Accessibilità

- usa elementi semantici;
- `aria-expanded` e `aria-controls` per macrosezioni;
- etichette accessibili per occhi, stati, chiusure e icone;
- focus visibile;
- navigazione da tastiera;
- focus trap nelle modali;
- `aria-live` per notifiche e loading;
- non usare il colore come unico segnale;
- rispetta `prefers-reduced-motion`;
- mantieni contrasto adeguato;
- associa errori e descrizioni ai campi.

---

# 16. Test obbligatori

## 16.1 Unit test

Testa almeno:

- formula qualità dati;
- esclusione dei campi non applicabili;
- inclusione dei campi oscurati nel denominatore;
- invalidazione della verifica quando cambia il valore;
- salvataggio nota senza cambiare data di verifica;
- transizioni di stato consentite;
- calcolo completezza separato dalla qualità;
- mapping tra entità reali e componenti generici.

## 16.2 Test backend/integration

- lettura panoramica;
- aggiornamento campo;
- verifica;
- richiesta revisione;
- aggiornamento nota;
- modifica visibilità;
- operazione bulk di sezione;
- filtro server-side dei campi oscurati;
- permessi dei ruoli;
- audit;
- concorrenza o versione, se prevista;
- rollback della transazione in caso di errore.

## 16.3 Test frontend

- apertura/chiusura macrosezioni;
- freccetta coerente della prima macrosezione;
- apertura drawer;
- affiancamento home/dettaglio senza barra superiore;
- affiancamento di due sezioni;
- apertura a tutta larghezza;
- assenza del pallino arancione nella scheda completa;
- legenda nel footer completo;
- occhietto e stato su ogni campo;
- popup ancorato sopra/sotto in base allo spazio;
- nota presente nei tre stati;
- loading, errore e retry;
- modale modifiche non salvate;
- disabilitazione salvataggio con errori;
- aggiornamento KPI dopo mutazione riuscita.

## 16.4 Test visivi/regressione

Verifica che la home non cambi involontariamente. Confronta almeno:

- desktop ampio;
- larghezza intermedia;
- mobile;
- home normale;
- home affiancata;
- drawer;
- scheda completa;
- popup per i tre stati;
- loading;
- errore;
- modale modifiche non salvate.

---

# 17. Criteri di accettazione finali

L’attività è conclusa soltanto quando:

1. la home mantiene lo stesso aspetto del prototipo;
2. la prima macrosezione usa una freccetta uguale alle successive;
3. il comportamento di “Informazioni societarie” è riutilizzabile da tutte le macrosezioni;
4. il comportamento di “Identificazione camerale” è riutilizzabile da tutte le sezioni;
5. ogni campo applicabile ha visibilità, stato e nota persistenti;
6. gli stati sono leggibili e non dipendono soltanto dal colore;
7. il popup punta al campo selezionato e si riposiziona correttamente;
8. la nota è presente in tutti e tre gli stati;
9. un campo verificato non ripropone “Verifica” ma permette “Salva nota” o “Richiedi revisione”;
10. la scheda a tutta larghezza non mostra il pallino arancione;
11. la scheda a tutta larghezza mostra la legenda e i controlli su tutti i campi;
12. la qualità dati usa la formula definita sull’intero modulo;
13. la completezza rimane separata dalla qualità;
14. loading, errore, retry e modifiche non salvate funzionano realmente;
15. i dati oscurati sono filtrati lato server per gli utenti non autorizzati;
16. il backend registra autore, data e audit;
17. non sono stati introdotti mock permanenti o percentuali hardcoded;
18. non sono state create tabelle o migrazioni senza conferma esplicita;
19. l’implementazione rispetta stack, naming, ruoli e convenzioni della piattaforma;
20. test e build del progetto risultano superati.

---

# 18. Modalità di esecuzione richiesta a Claude Code

Segui quest’ordine:

## Fase 1 — Analisi

- leggi repository e prototipo;
- produci la matrice di corrispondenza;
- individua riusi e lacune;
- non modificare lo schema.

## Fase 2 — Verifica database

- se lo schema è sufficiente, dichiaralo e passa alla fase 3;
- se servono tabelle, colonne, enum, vincoli o migrazioni, presenta la proposta e chiedi conferma;
- non proseguire con quelle modifiche fino alla risposta.

## Fase 3 — Piano di integrazione

Presenta un piano conciso con:

- componenti da riusare o creare;
- servizi/API da adattare;
- mapping dati;
- test da aggiungere;
- ordine di implementazione.

Non chiedere approvazione per normali modifiche reversibili al codice, salvo che il repository o l’utente lo richiedano. La conferma obbligatoria riguarda soprattutto lo schema dati e le operazioni distruttive.

## Fase 4 — Implementazione

- integra nel codice reale;
- mantieni la home invariata;
- rendi macrosezioni e sezioni data-driven;
- collega backend e persistenza;
- aggiungi stati e gestione errori;
- non lasciare TODO critici o mock.

## Fase 5 — Verifica

- esegui lint, typecheck, test e build previsti dal progetto;
- esegui i test funzionali e visivi pertinenti;
- correggi regressioni introdotte.

## Fase 6 — Consegna

Nel resoconto finale indica:

- cosa è stato implementato;
- come sono state mappate le entità reali;
- file principali modificati;
- API e servizi coinvolti;
- eventuali migrazioni approvate;
- test eseguiti e risultati;
- eventuali differenze deliberate rispetto al prototipo e relativa motivazione;
- eventuali punti ancora bloccati.

Non limitarti a descrivere il codice che sarebbe necessario: implementalo, salvo i blocchi di conferma esplicitamente previsti.

---

# 19. Istruzione iniziale da usare con questo file

Utilizza questo testo come messaggio iniziale in Claude Code dopo aver aperto il repository reale e aver reso disponibile il prototipo HTML:

> Leggi integralmente il file `PROMPT_MASTER_CLAUDE_CODE_ANAGRAFICA_AZIENDALE.md` e analizza il prototipo HTML fornito insieme al file. Devi integrare quel modello grafico e comportamentale nella piattaforma già esistente, adattandolo ai dati, ai nomi, alle tabelle, alle API, ai ruoli e all’architettura reali. Non creare una nuova applicazione e non sostituire la piattaforma esistente. Esegui prima la fase di analisi e la verifica dello schema dati previste dal documento. Se mancano tabelle, colonne o altre strutture persistenti, presenta la proposta e chiedimi conferma esplicita prima di creare migrazioni o modificare il database. Se lo schema è sufficiente, procedi con l’implementazione completa e con i test, rispettando tutti i criteri di accettazione del documento.

---

# 20. Artefatti di riferimento forniti

Insieme a questo documento viene fornito il file:

```text
ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO.html
```

Il file HTML è autonomo: contiene struttura, fogli di stile e comportamento dimostrativo. Deve essere aperto in un browser e usato per comprendere proporzioni, gerarchie, stati e passaggi tra le schermate.

Il file HTML non è il codice di produzione da copiare integralmente. In particolare:

- non importarlo come iframe;
- non inserirlo come blob statico nella piattaforma;
- non copiare il suo stato dimostrativo al posto del backend;
- non mantenere nomi, valori o utenti fittizi quando esistono dati reali;
- non introdurre un secondo sistema di routing;
- non sostituire componenti già funzionanti senza necessità;
- non copiare bundle o codice compilato nel codice sorgente della piattaforma.

Usalo per confrontare il risultato durante l’implementazione. Il documento resta vincolante per logica, persistenza, sicurezza e correzioni successive.

## 20.1 Percorsi dimostrativi da provare nell’HTML

Esegui almeno questi percorsi per comprendere il modello:

1. apri la prima macrosezione e richiudila con la freccetta;
2. apri “Identificazione camerale” o “Visualizza dettagli”;
3. osserva il caricamento del pannello;
4. apri e chiudi gli occhietti dei campi;
5. apri un campo rosso, uno arancione e uno verde;
6. modifica e salva la nota nei tre stati;
7. chiedi la revisione di un campo verificato;
8. verifica un campo pendente;
9. apri la modifica dei dati e genera un errore di validazione;
10. tenta di uscire con modifiche non salvate;
11. prova “Continua a modificare”, “Esci senza salvare” e “Salva ed esci”;
12. passa alla vista affiancata;
13. passa alla vista a tutta larghezza;
14. verifica occhietti, stati e legenda nella vista completa;
15. dall’affiancamento seleziona un’altra sezione dalla parte sinistra;
16. verifica la vista a due sezioni;
17. apri il file con `?scenario=errore-caricamento` per osservare errore e retry, se il browser consente i parametri su file locali.

---

# 21. Vocabolario canonico e mapping obbligatorio

Per evitare ambiguità usa questi significati, anche quando i nomi reali differiscono.

| Termine del documento | Significato | Esempio del prototipo | Possibile equivalente reale |
|---|---|---|---|
| Modulo | area funzionale acquistabile/configurabile | Anagrafica Aziendale | modulo anagrafico reale |
| Macrosezione | gruppo principale mostrato nella home | Informazioni societarie | categoria principale reale |
| Sezione | gruppo omogeneo di campi | Identificazione camerale | sottosezione/form reale |
| Campo/elemento | singola informazione gestibile | Partita IVA | proprietà o record reale |
| Valore | contenuto corrente del campo | 01234567890 | dato persistito reale |
| Stato verifica | valutazione del consulente sul valore corrente | Confermato | enum/stato equivalente |
| Visibilità | possibilità per l’azienda di vedere il campo | occhio aperto/chiuso | ACL o flag equivalente |
| Nota | commento associato al campo e al suo stato | nota facoltativa | commento/revisione reale |
| Applicabilità | campo previsto per quella specifica azienda | campo conteggiato nei KPI | regola IAF/certificazione/modulo |
| Completezza | dato o sezione compilati | 4 di 14 sezioni | regola di compilazione reale |
| Qualità | campi confermati / campi applicabili | 86% | calcolo autorevole reale |

Claude deve produrre un mapping esplicito tra questo vocabolario e i nomi reali del repository. Non è accettabile dedurre il mapping solo dal testo visibile senza verificare il significato dei modelli.

## 21.1 Identità stabile dei campi

Lo stato, la nota e la visibilità devono riferirsi a un identificatore stabile del campo, non alla label italiana mostrata nella UI.

Requisiti:

- l’identificatore non cambia se viene tradotta la label;
- l’identificatore non dipende dalla posizione nella pagina;
- l’identificatore distingue campi omonimi presenti in sezioni diverse;
- l’identificatore deve poter essere collegato al record o alla proprietà reale;
- per strutture ripetibili deve distinguere definizione del campo e istanza del record;
- il mapping deve essere deterministico e testabile.

Esempio logico per dati ripetibili:

```text
element_key = "sedi.indirizzo"
record_id   = identificativo della sede
company_id  = identificativo azienda
```

Non concatenare liberamente stringhe di label per costruire chiavi persistenti.

---

# 22. Contratto dati frontend di riferimento

Adatta questi contratti al linguaggio e agli schemi del progetto. Sono requisiti semantici, non obblighi di naming.

```ts
type ReviewStatus = "verified" | "review" | "pending";

type FieldPermission = {
  canView: boolean;
  canEditValue: boolean;
  canChangeVisibility: boolean;
  canVerify: boolean;
  canRequestReview: boolean;
  canEditNote: boolean;
};

type FieldReview = {
  status: ReviewStatus;
  visibleToCompany: boolean;
  note: string | null;
  verifiedAt: string | null;
  verifiedBy: UserSummary | null;
  reviewRequestedAt: string | null;
  reviewRequestedBy: UserSummary | null;
  valueVersion: string | number | null;
  updatedAt: string;
};

type ModuleField = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  value: unknown;
  formattedValue: string;
  dataType: string;
  required: boolean;
  applicable: boolean;
  empty: boolean;
  order: number;
  validation: unknown;
  permissions: FieldPermission;
  review: FieldReview;
};

type ModuleSection = {
  id: string;
  key: string;
  title: string;
  icon: string | null;
  order: number;
  applicable: boolean;
  complete: boolean;
  fields: ModuleField[];
};

type ModuleMacroSection = {
  id: string;
  key: string;
  title: string;
  icon: string | null;
  order: number;
  applicable: boolean;
  statusLabel: string;
  completedSections: number;
  totalSections: number;
  sections: ModuleSection[];
};

type ModuleQuality = {
  percentage: number;
  verified: number;
  pending: number;
  review: number;
  totalApplicable: number;
  calculatedAt: string;
};

type ModuleOverview = {
  moduleId: string;
  companyId: string;
  completion: {
    percentage: number;
    completedSections: number;
    totalSections: number;
  };
  quality: ModuleQuality;
  recentChanges: AuditSummary[];
  macroSections: ModuleMacroSection[];
};
```

## 22.1 Invarianti del contratto

- `quality.totalApplicable = verified + pending + review`, salvo stati aggiuntivi esplicitamente documentati;
- `quality.percentage` deve coincidere con la formula del capitolo 11;
- un campo `applicable = false` non deve incidere sui KPI;
- un campo `visibleToCompany = false` continua a incidere sui KPI se applicabile;
- un campo confermato deve avere autore e data di verifica, salvo dati legacy da gestire esplicitamente;
- un campo modificato dopo la verifica non può rimanere confermato sulla vecchia versione del valore;
- `formattedValue` è usato per la visualizzazione, il valore grezzo per editing e salvataggio;
- i permessi restituiti dal server non sostituiscono i controlli di autorizzazione sulle mutazioni.

---

# 23. Macchina a stati del campo

## 23.1 Tabella delle transizioni

| Stato iniziale | Evento | Stato finale | Effetti obbligatori |
|---|---|---|---|
| pending | verifica | verified | salva autore/data/versione valore; audit; ricalcolo qualità |
| pending | richiedi revisione | review | salva nota e richiedente; audit; ricalcolo qualità |
| pending | salva valore modificato | pending | salva valore; audit; completezza aggiornata |
| review | aggiorna richiesta | review | aggiorna nota senza perdere storia; audit |
| review | conferma correzione | verified | salva autore/data/versione valore; audit; ricalcolo qualità |
| review | azienda modifica valore | pending o review | applica regola reale documentata; mai verified automatico |
| verified | salva nota | verified | aggiorna nota; non cambiare `verified_at`; audit nota |
| verified | richiedi revisione | review | conserva verifica nello storico; salva nuova richiesta; audit |
| verified | modifica valore | pending | invalida verifica corrente; conserva storico; ricalcolo qualità |
| qualunque | nascondi/mostra | invariato | cambia visibilità; audit; qualità invariata |

## 23.2 Transizioni vietate

- un utente aziendale non può auto-verificare un proprio dato se il ruolo non lo consente;
- un errore di rete non deve produrre una transizione soltanto locale;
- un salvataggio nota non deve confermare implicitamente un campo;
- mostrare o nascondere un campo non deve modificarne lo stato;
- cambiare la label non deve perdere stato o nota;
- un campo non applicabile non deve ricevere interazioni di verifica ordinarie;
- non sovrascrivere l’autore reale con un nome dimostrativo.

## 23.3 Gestione del valore verificato

Per sapere se la verifica è ancora valida usa una strategia coerente con il progetto:

- versione incrementale del record;
- `updated_at` confrontato con `verified_at`, se affidabile;
- hash canonico del valore verificato;
- riferimento a una revisione/versione storica.

Normalizza il valore prima di calcolare un hash: date, numeri, spazi e casing devono seguire le regole di dominio. Documenta la strategia scelta.

---

# 24. Contratti API di riferimento

Non imporre questi URL se il progetto adotta RPC, GraphQL o naming differente. Mantieni però le stesse capacità e atomicità.

## 24.1 Lettura panoramica

```http
GET /companies/{companyId}/modules/company-registry/overview
```

Risposta logica:

```json
{
  "moduleId": "...",
  "companyId": "...",
  "completion": {
    "percentage": 29,
    "completedSections": 4,
    "totalSections": 14
  },
  "quality": {
    "percentage": 86,
    "verified": 32,
    "pending": 3,
    "review": 2,
    "totalApplicable": 37,
    "calculatedAt": "2026-08-22T10:42:00Z"
  },
  "recentChanges": [],
  "macroSections": []
}
```

Non copiare questi numeri: sono soltanto un esempio coerente della struttura.

## 24.2 Aggiornamento valore

```http
PATCH /companies/{companyId}/module-fields/{fieldId}/value
If-Match: <versione oppure etag se adottato>
```

```json
{
  "value": "nuovo valore",
  "recordId": "eventuale-id-istanza"
}
```

La risposta deve includere:

- valore salvato e formattato;
- nuova versione;
- stato aggiornato;
- completezza e qualità aggiornate oppure informazioni sufficienti a invalidare le query;
- audit/event id quando previsto.

## 24.3 Aggiornamento revisione

```http
PATCH /companies/{companyId}/module-fields/{fieldId}/review
```

```json
{
  "action": "verify | request_review | update_review | confirm_correction | save_note",
  "note": "testo facoltativo",
  "expectedValueVersion": "...",
  "recordId": "eventuale-id-istanza"
}
```

Il backend deve validare che l’azione sia compatibile con stato e ruolo.

## 24.4 Aggiornamento visibilità

```http
PATCH /companies/{companyId}/module-fields/{fieldId}/visibility
```

```json
{
  "visibleToCompany": false,
  "recordId": "eventuale-id-istanza"
}
```

Operazione bulk di sezione:

```http
PATCH /companies/{companyId}/module-sections/{sectionId}/visibility
```

```json
{
  "visibleToCompany": false,
  "excludeLockedFields": true
}
```

La risposta bulk deve indicare campi aggiornati, campi esclusi e motivi.

## 24.5 Errori API

Mappa gli errori secondo lo standard esistente. Devono essere distinguibili almeno:

- `400/422`: validazione;
- `401`: sessione mancante/scaduta;
- `403`: permesso negato;
- `404`: azienda, sezione, campo o record non trovato;
- `409/412`: conflitto di versione o transizione non più valida;
- `500/503`: errore interno o dipendenza indisponibile.

Il client deve:

- associare errori di validazione ai campi;
- mostrare un messaggio chiaro per i conflitti;
- ricaricare il dato corrente dopo conflitto, senza perdere silenziosamente la bozza;
- non trasformare un `403` in un generico errore di caricamento;
- non esporre stack trace o dettagli sensibili.

---

# 25. Modello logico database da verificare, non da creare automaticamente

Questa sezione serve a controllare la copertura dello schema. Non autorizza la creazione di tabelle.

## 25.1 Entità logiche

### Definizione dell’elemento

| Attributo logico | Necessità |
|---|---|
| id elemento | identificatore stabile |
| modulo | appartenenza al modulo |
| macrosezione | gerarchia home |
| sezione | gruppo di campi |
| elemento padre | gerarchie ulteriori |
| chiave tecnica | mapping stabile |
| label/descrizione | visualizzazione e tasto info |
| tipo dato | rendering/validazione |
| obbligatorietà | completezza |
| ordine | presentazione |
| attivo | dismissione senza cancellazione |

### Applicabilità

Deve essere derivabile da relazioni già presenti con:

- azienda;
- modulo;
- settore IAF;
- certificazione;
- configurazione specifica;
- validità temporale, se prevista.

### Stato azienda-elemento

| Attributo logico | Regola |
|---|---|
| company/tenant id | sempre presente |
| element id | sempre presente |
| record/instance id | necessario per dati ripetibili |
| status | enum o vincolo equivalente |
| visible_to_company | boolean o policy equivalente |
| note | nullable ma disponibile sempre |
| verified_at/by | presenti solo per verifica valida |
| review_requested_at/by | presenti quando rilevante |
| verified_value_version/hash | protegge validità verifica |
| created_at/updated_at | audit tecnico |
| row version | concorrenza, se adottata |

### Storico eventi

Eventi minimi consigliati:

```text
FIELD_VALUE_CHANGED
FIELD_VERIFIED
FIELD_REVIEW_REQUESTED
FIELD_REVIEW_UPDATED
FIELD_CORRECTION_CONFIRMED
FIELD_NOTE_UPDATED
FIELD_HIDDEN
FIELD_SHOWN
SECTION_HIDDEN
SECTION_SHOWN
```

Non duplicare un sistema eventi già esistente.

## 25.2 Vincoli da verificare

- foreign key verso azienda e definizione elemento;
- unique coerente per azienda, elemento e istanza;
- check sui valori di stato;
- indici per azienda/modulo/stato;
- indici per timeline audit;
- cancellazione coerente con retention e multi-tenancy;
- timezone coerente, preferibilmente timestamp con zona;
- nessuna perdita di storico in caso di cancellazione logica;
- migrazione reversibile e backfill documentato.

## 25.3 Dati legacy

Se esistono valori senza stato:

- non marcarli automaticamente come verificati;
- definisci una strategia di backfill prudente;
- proponi lo stato iniziale “Da verificare” salvo evidenza di approvazione già registrata;
- non attribuire verifiche a utenti inventati;
- segnala conteggi e impatto prima dell’esecuzione;
- chiedi conferma per il backfill se modifica dati persistenti.

---

# 26. Matrice ruoli e azioni

Compilala con i ruoli reali. Questa è la baseline funzionale.

| Azione | Consulente | Admin aziendale | Operatore aziendale | Superadmin |
|---|---:|---:|---:|---:|
| vedere campi visibili | sì | sì | secondo permessi | secondo policy |
| vedere campi oscurati | sì | no, salvo permesso | no | secondo policy |
| modificare valori aziendali | secondo dominio | sì | secondo permessi | non implicito |
| cambiare visibilità | sì | no, salvo policy | no | secondo policy |
| verificare | sì | no | no | secondo policy |
| richiedere revisione | sì | no | no | secondo policy |
| modificare nota di verifica | sì | eventuale sola risposta separata | eventuale sola risposta separata | secondo policy |
| vedere audit | sì | versione filtrata | versione filtrata | secondo policy |

Non assumere che “Superadmin” possa compiere automaticamente ogni operazione di dominio. Usa le policy reali.

---

# 27. Matrice delle viste e delle transizioni

| Vista corrente | Azione | Destinazione | Gestione dirty state |
|---|---|---|---|
| Home | apri sezione | Drawer dettaglio | non applicabile |
| Drawer dettaglio | modifica dati | Drawer form | crea baseline form |
| Drawer dettaglio | affianca | Home + dettaglio | nessuna perdita di stato |
| Drawer dettaglio | apri in scheda | Tutta larghezza | preserva entità e scroll utile |
| Drawer form | chiudi | Home | modale se dirty |
| Drawer form | affianca | Home + dettaglio | modale se dirty |
| Home + dettaglio | chiudi dettaglio | Home | modale se editor dirty |
| Home + dettaglio | seleziona altra sezione | Due pannelli | preserva primo pannello |
| Home + dettaglio | tutta larghezza | Scheda completa | preserva contesto |
| Due pannelli | chiudi uno | Home + pannello rimasto | verifica dirty del pannello chiuso |
| Due pannelli | panoramica | Home | verifica entrambi i dirty state |
| Due pannelli | tutta larghezza | Scheda completa scelta | verifica dirty dell’altro pannello |
| Scheda completa | panoramica/chiudi | Home | modale se dirty |
| Scheda completa | affianca | Home + dettaglio | modale se dirty |

Ogni transizione deve essere esplicita e testata. Evita combinazioni di booleani non controllate che permettano viste incompatibili contemporaneamente; preferisci una state machine o uno stato discriminato se compatibile con l’architettura.

---

# 28. Specifica dei componenti e delle loro responsabilità

## 28.1 Indicatore qualità

Input minimi:

- conteggi autorevoli;
- percentuale;
- stato di caricamento;
- errore;
- callback dettaglio verifiche.

Non deve conoscere l’intero form né calcolare applicabilità da label.

## 28.2 Macrosezione

Input minimi:

- identificatore;
- titolo, icona e stato;
- sezioni ordinate;
- stato open/closed controllato;
- permessi;
- callback apertura sezione.

La prima macrosezione e le successive devono usare lo stesso comportamento di espansione, anche se la prima mostra card e le altre una riga compatta quando chiuse.

## 28.3 Campo revisionabile

Deve ricevere:

- id stabile;
- label e descrizione;
- valore formattato;
- stato;
- visibilità;
- nota e audit sintetico;
- permessi;
- callback separate per valore, stato, nota e visibilità.

Non deve salvare direttamente in `localStorage` e non deve conoscere endpoint hardcoded.

## 28.4 Popup

Responsabilità:

- rendering variante stato;
- gestione bozza nota;
- posizionamento e focus;
- chiamata dell’azione semantica corretta;
- loading della mutazione;
- errori inline;
- prevenzione doppio submit;
- chiusura solo dopo successo, salvo annullamento esplicito.

## 28.5 Workspace

La logica di drawer, split e full page deve riutilizzare lo stesso contenuto di dominio. Non mantenere tre copie divergenti delle sezioni.

Separare:

- contenuto della macrosezione;
- contenitore/presentazione della vista;
- stato di navigazione;
- stato server;
- bozza di modifica.

---

# 29. Regole di validazione e dati speciali

## 29.1 Valori nulli o vuoti

- visualizza `—` in lettura;
- usa input vuoto in modifica;
- non confondere `0`, `false` o data valida con valore assente;
- un campo vuoto applicabile è normalmente “Da verificare” e incide sul denominatore;
- una nota vuota è ammessa se il dominio la considera facoltativa;
- non inviare stringhe vuote quando l’API richiede `null`, o viceversa: usa le convenzioni reali.

## 29.2 Date

- mostra date nel formato locale italiano quando la piattaforma lo prevede;
- invia al backend il formato canonico esistente;
- evita conversioni UTC che cambiano il giorno per date senza orario;
- data e ora audit devono includere timezone;
- non usare la data del client come fonte autorevole per `verified_at`.

## 29.3 Dati ripetibili

Sedi, iscrizioni, contatti o altri record multipli richiedono:

- identificatore dell’istanza;
- stato e visibilità per campo e istanza;
- gestione aggiunta/rimozione senza collidere con altri record;
- audit del record corretto;
- qualità calcolata sulle istanze applicabili secondo la regola di dominio.

Definisci con il proprietario del dominio se un nuovo record opzionale non creato debba entrare nel denominatore. Non inventare la regola.

## 29.4 Campi derivati o di sola lettura

- mostra comunque stato e visibilità se devono essere verificati;
- non mostrare input di modifica se il dato proviene da fonte autorevole non editabile;
- indica la provenienza quando già prevista;
- una richiesta di revisione può generare un flusso diverso: mappalo al sistema reale;
- non scrivere direttamente in tabelle derivate.

## 29.5 Dati CCIAA/importati

- rispetta il flusso reale di importazione;
- quando un’importazione cambia un valore confermato, invalida la verifica della versione precedente;
- conserva la provenienza del valore;
- non confondere approvazione del dato con approvazione del documento sorgente;
- aggiorna audit e KPI dopo l’importazione;
- gestisci aggiornamenti idempotenti: se il valore non cambia, non invalidare la verifica.

---

# 30. Qualità e completezza: algoritmo di riferimento

## 30.1 Pseudocodice qualità

```ts
function calculateQuality(fields: ModuleField[]): ModuleQuality {
  const applicable = fields.filter((field) => field.applicable);

  const verified = applicable.filter(
    (field) => field.review.status === "verified" && verificationMatchesCurrentValue(field)
  ).length;

  const review = applicable.filter(
    (field) => field.review.status === "review"
  ).length;

  const pending = applicable.length - verified - review;
  const totalApplicable = applicable.length;

  return {
    verified,
    review,
    pending,
    totalApplicable,
    percentage: totalApplicable === 0
      ? 0
      : Math.round((verified / totalApplicable) * 100),
  };
}
```

La funzione reale deve essere server-side o condivisa in modo autorevole. Il calcolo non deve dipendere da quali sezioni sono montate nel DOM.

## 30.2 Pseudocodice completezza

La regola esatta deve essere mappata dal dominio. Esempio non prescrittivo:

```ts
const applicableSections = sections.filter((section) => section.applicable);
const completedSections = applicableSections.filter((section) =>
  section.fields
    .filter((field) => field.applicable && field.required)
    .every((field) => !field.empty && isValueValid(field))
);
```

Non richiedere che tutti i campi siano verificati per considerare una sezione compilata, a meno che questa sia una regola esplicita della piattaforma.

## 30.3 Aggiornamenti che richiedono ricalcolo

Ricalcola o invalida i KPI dopo:

- modifica di un valore;
- verifica;
- richiesta revisione;
- conferma correzione;
- cambio di applicabilità;
- aggiunta/rimozione di record ripetibili;
- abilitazione/disabilitazione di certificazioni, settori o moduli;
- importazione di nuovi dati.

Il cambio di sola visibilità e il cambio di sola nota non devono modificare la percentuale.

---

# 31. Cache, sincronizzazione e aggiornamento UI

- usa le chiavi query già adottate dalla piattaforma;
- dopo una mutazione aggiorna o invalida dettaglio, panoramica, qualità e cronologia pertinenti;
- evita refetch globali non necessari;
- usa aggiornamenti ottimistici solo se esiste rollback completo;
- per verifica e visibilità preferisci coerenza a un’animazione prematura;
- durante la mutazione disabilita l’azione specifica, non l’intera pagina senza necessità;
- se due viste mostrano lo stesso campo, entrambe devono riflettere lo stato aggiornato;
- non mantenere copie indipendenti e divergenti del medesimo dato nei pannelli;
- su sessione scaduta conserva la bozza secondo le convenzioni di sicurezza del progetto.

---

# 32. Sicurezza e multi-tenancy

Verifiche obbligatorie:

- ogni query è limitata all’azienda/tenant autorizzato;
- l’id del campo non consente accesso a dati di un’altra azienda;
- le operazioni bulk verificano ogni campo;
- i campi oscurati sono filtrati in serializzazione o query per ruoli aziendali;
- note e audit non espongono dati sensibili a ruoli non autorizzati;
- input nota è trattato come testo, senza rendering HTML non sanificato;
- log applicativi non contengono valori sensibili completi senza necessità;
- le API non accettano `verified_by` o timestamp arbitrari dal client;
- il server usa l’identità autenticata;
- proteggi da mass assignment;
- rispetta retention e cancellazione previste dalla piattaforma.

---

# 33. Prestazioni e robustezza

- evita una query per ogni campo;
- carica stati e definizioni con query aggregate o join appropriati;
- indicizza i filtri usati da panoramica e qualità;
- pagina o limita la cronologia;
- non renderizzare contemporaneamente pannelli chiusi pesanti;
- usa memoizzazione soltanto dove misurabile;
- evita layout shift durante loading;
- il popup deve restare fluido durante scroll;
- gestisci dataset con molte macrosezioni e sezioni senza assumere numeri fissi;
- non bloccare la home mentre carica un singolo dettaglio;
- cancella richieste obsolete quando l’utente cambia rapidamente sezione, se lo stack lo consente.

---

# 34. Copy e messaggi utente

Usa il lessico reale della piattaforma. Mantieni però questi significati:

| Situazione | Messaggio di riferimento |
|---|---|
| loading | Caricamento dati… |
| errore | Impossibile caricare i dati |
| retry | Riprova |
| salvataggio riuscito | Modifiche salvate correttamente |
| nota salvata | Nota salvata |
| verifica riuscita | Campo verificato |
| revisione richiesta | Revisione richiesta all’azienda |
| dirty guard | Modifiche non salvate |

Non mostrare conferme prima della risposta positiva. I messaggi devono indicare la sezione corretta quando più pannelli sono aperti.

---

# 35. Checklist di non regressione della piattaforma esistente

Prima della consegna verifica esplicitamente che l’integrazione non abbia:

- cambiato il menu principale non richiesto;
- rotto altre pagine o moduli;
- modificato il tema globale;
- alterato autorizzazioni esistenti;
- duplicato servizi o API;
- rimosso campi reali;
- cambiato rotte pubbliche senza migrazione;
- introdotto dipendenze non necessarie;
- inserito dati fittizi in produzione;
- esposto campi oscurati;
- alterato importazioni CCIAA esistenti;
- perso audit o storico;
- hardcodato il numero di sezioni;
- hardcodato il calcolo `86%`;
- legato stato e note alle label visibili;
- creato tabelle senza conferma.

---

# 36. Report preliminare richiesto a Claude

Prima di implementare Claude deve restituire un report breve ma completo con questo formato:

```markdown
## Architettura rilevata
- Frontend:
- Backend:
- Database/ORM:
- Autenticazione/ruoli:
- Query/cache:
- Test:

## Mapping del modulo
| Requisito | Implementazione esistente | Decisione |
|---|---|---|

## Copertura dati
| Capacità | Presente | Dove | Gap |
|---|---:|---|---|

## Schema
- Nuove tabelle necessarie: sì/no
- Nuove colonne o enum necessari: sì/no
- Migrazioni necessarie: sì/no

## Piano
1. ...
2. ...

## Conferma richiesta
[solo se esistono modifiche allo schema o operazioni distruttive]
```

Il report non deve diventare un modo per evitare l’implementazione. Se non esistono blocchi di conferma, dopo il report Claude deve proseguire.

---

# 37. Tracciabilità requisiti–test

Claude deve collegare ogni requisito critico ad almeno un test o controllo verificabile.

| ID | Requisito | Verifica minima |
|---|---|---|
| UI-01 | home invariata | confronto visivo desktop/tablet/mobile |
| UI-02 | chevron prima macrosezione | test DOM + interazione |
| UI-03 | drawer | test apertura/chiusura |
| UI-04 | split senza tab superiore | test layout |
| UI-05 | due pannelli | test navigazione e dirty state |
| UI-06 | full page senza pallino | test DOM |
| UI-07 | legenda full page | test DOM e responsive |
| FLD-01 | occhietto ogni campo | test su sezioni rappresentative |
| FLD-02 | tre stati | unit + UI |
| FLD-03 | nota nei tre stati | integration + UI |
| FLD-04 | popup ancorato | test posizionamento sopra/sotto |
| DAT-01 | qualità | unit test casi limite |
| DAT-02 | completezza separata | unit test |
| SEC-01 | filtro campi oscurati | integration test ruolo azienda |
| AUD-01 | audit | integration test evento/autore/data |
| DB-01 | conferma schema | evidenza nel report e cronologia attività |

---

# 38. Definition of Done rafforzata

Non dichiarare il lavoro completato se anche uno solo dei seguenti punti è falso:

- il prototipo HTML è stato analizzato in tutte le viste;
- la home reale è rimasta visivamente coerente;
- i dati sono reali e non dimostrativi;
- tutte le macrosezioni possono adottare lo stesso comportamento;
- tutte le sezioni possono adottare lo stesso comportamento;
- tutti i campi applicabili possono avere stato, visibilità e nota;
- la qualità è calcolata sull’intero modulo;
- il backend filtra i campi oscurati;
- la verifica è legata alla versione corrente del valore;
- il popup funziona vicino ai bordi della viewport;
- loading ed errori non distruggono il contesto;
- le modifiche non salvate sono protette in ogni transizione;
- lo schema non è stato modificato senza consenso;
- test, lint, typecheck e build richiesti sono superati;
- il report finale dichiara chiaramente eventuali limiti residui.
