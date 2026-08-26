# Confronto delle due versioni HTML e istruzioni operative per Claude Code

## 1. Scopo del documento

Questo documento deve essere consegnato a Claude Code insieme ai due prototipi HTML:

- `ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(1) (14).html`
- `ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(2).html`

L'obiettivo non è copiare il contenuto del bundle HTML nella piattaforma, ma trasferire nella piattaforma esistente la grafica e i comportamenti della versione più evoluta senza danneggiare backend, database, permessi, rotte, validazioni, componenti e funzioni già presenti.

Il presente file è contemporaneamente:

1. un confronto verificato tra i due HTML;
2. una specifica funzionale e grafica della versione da ottenere;
3. un protocollo di sicurezza per l'integrazione;
4. un prompt eseguibile da Claude Code.

---

## 2. Identificazione certa degli artefatti

### Artefatto A — versione evoluta da usare come riferimento finale

- File: `ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(1) (14).html`
- Dimensione: 1.580.626 byte
- Righe: 28.761
- SHA-256: `992bd3e8fb465e4006f57dcfb3ff8dc543ccffcb0babf5fce0edf7a0aad2a799`
- Ruolo: riferimento grafico e comportamentale principale.

### Artefatto B — versione precedente da usare come riferimento delle funzioni da preservare

- File: `ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(2).html`
- Dimensione: 765.202 byte
- Righe: 14.543
- SHA-256: `d2b93ba86105c3f6524851b0d927fa5c02f1ca9c9839df8ce0d87db2613bfcd5`
- Ruolo: riferimento della precedente macrosezione “Informazioni societarie” e dei comportamenti già progettati.

### Conclusione del confronto

L'Artefatto A è un'evoluzione sostanziale dell'Artefatto B. Non è una semplice variante CSS: aggiunge l'intero dominio CCIAA, la sintesi camerale, il dettaglio per sezione, le tabelle ripetibili, i campi dinamici, la conferma massiva e la vista completa.

L'Artefatto A, tuttavia, conserva nel proprio JavaScript gran parte delle funzioni della precedente “Informazioni societarie”. Queste funzioni non devono essere considerate automaticamente obsolete o eliminate: nella piattaforma reale potrebbero essere collegate ad altre rotte, permessi o macrosezioni.

---

## 3. Differenze di build da ignorare

Le seguenti differenze non rappresentano requisiti grafici e non devono essere replicate:

| Aspetto | Artefatto A | Artefatto B | Regola per l'integrazione |
|---|---|---|---|
| React | bundle di sviluppo | bundle di produzione | usare la configurazione già presente nel progetto |
| Montaggio | markup iniziale prerenderizzato e `hydrateRoot` | root vuota e `createRoot` | non cambiare SSR/CSR della piattaforma solo per imitare il prototipo |
| CSS | regole leggibili e non minificate | reset Tailwind e CSS minificato | usare design system e pipeline CSS esistenti |
| Dimensione | circa 1,58 MB | circa 765 KB | non usare la dimensione come indicatore di qualità |
| JSX compilato | `createElement` | JSX runtime | lavorare sui sorgenti, non sul JavaScript compilato |

È vietato modificare direttamente il bundle incorporato negli HTML e poi copiarlo nell'applicazione. Gli HTML sono un oracolo visivo e comportamentale, non una base di codice di produzione.

---

## 4. Sintesi delle differenze funzionali

| Area | Artefatto B | Artefatto A |
|---|---|---|
| Macrosezione principale della home | “Informazioni societarie” | “Dati CCIAA” |
| Riquadri principali | 4 schede | 10 schede camerali in griglia 3-3-3-1 |
| Contenuto dei riquadri | anteprima di alcuni dati o stato vuoto | numero informazioni presenti e tre conteggi di stato |
| Stato del riquadro | pill “Completato/Da verificare” | indicatore circolare verde e conteggi confermate/da verificare/da revisionare |
| Sintesi camerale | assente | pannello dedicato, modificabile solo nei campi autonomi |
| Vista completa CCIAA | assente | tutte le sezioni, banner impresa, conferma globale e conferma sezione |
| Dettaglio singola sezione CCIAA | assente | pannello al 50% e vista a tutta larghezza |
| Tabelle dinamiche | assenti | righe aggiungibili/eliminabili e stato per riga |
| Personale | assente | dashboard con indicatori circolari |
| Campi dinamici amministratori/controllo | assenti | select e campi/tabelle condizionali |
| Conferma massiva | assente | tutta la visura e singola sezione |
| Audit ultima conferma | solo campo verificato | indicatore con popover per sezione e visura |
| Espansione sintesi | assente | il solo pannello Sintesi passa da 50% a 100% e torna con “Affianca” |
| Sezioni secondarie home | Sedi, Contatti, Dati CCIAA | Organizzazione separata dalla CCIAA |

---

## 5. Funzioni della versione precedente da preservare

La versione B contiene comportamenti che non devono subire regressioni se esistono nella piattaforma:

- apertura della sezione in drawer;
- vista in sola lettura e modalità modifica;
- vista affiancata al 50%;
- apertura a tutta larghezza;
- affiancamento di due sezioni;
- caricamento con skeleton;
- errore di caricamento con azione “Riprova”;
- validazioni di campo;
- stato “modifiche non salvate”;
- dialogo con “Continua a modificare”, “Esci senza salvare” e “Salva ed esci”;
- stato di verifica di ogni campo;
- visibilità del campo verso l'azienda;
- nota conservata in tutti gli stati;
- popup di verifica ancorato all'indicatore selezionato;
- legenda degli stati;
- gestione delle sezioni “Sedi operative”.

L'Artefatto A conserva questi componenti nel bundle, anche se la nuova home non offre lo stesso punto di ingresso. Claude deve verificare dove siano usati nella piattaforma reale prima di rinominare, spostare o rimuovere qualsiasi componente.

---

## 6. Specifica grafica della home da ottenere

### 6.1 Parti da lasciare visivamente invariate

Devono rimanere uguali alla home esistente, salvo il collegamento ai dati reali:

- intestazione “Anagrafica Aziendale”;
- sottotitolo;
- icona principale;
- card “Completamento scheda”;
- card “Qualità dei dati”;
- card “Ultime modifiche”;
- sfondo, bordi, ombre, raggi, spaziature e tipografia generale;
- comportamento responsive generale della pagina.

Non ridisegnare l'intera home. L'intervento deve essere confinato alla macrosezione CCIAA e ai pannelli da essa aperti, riutilizzando i token grafici già presenti.

### 6.2 Header della macrosezione

La macrosezione deve mostrare:

- titolo `Dati CCIAA`;
- badge di avanzamento, nell'esempio `10 di 10 sezioni completate`;
- pulsante `Visualizza sintesi` con icona documento;
- pulsante di espansione/compressione solo iconico, circolare, con freccetta;
- nessun testo “Comprimi” o “Espandi” visibile dentro il pulsante;
- testo accessibile e `title` aggiornati in base allo stato.

Misure di riferimento dell'Artefatto A:

- pulsante `Visualizza sintesi`: altezza minima 38 px, font 11 px, padding orizzontale 15 px;
- pulsante freccetta: 38 × 38 px, circolare;
- badge avanzamento: font 12 px, altezza minima 24 px.

### 6.3 Griglia dei riquadri

La home mostra 10 riquadri, non 4:

1. Sede;
2. Informazioni da statuto/atto costitutivo;
3. Capitale sociale;
4. Soci e titolari di diritti su azioni e quote;
5. Amministratori;
6. Sindaci e membri degli organi di controllo;
7. Attività, albi, ruoli e licenze;
8. Personale e occupazione;
9. Sedi secondarie e unità locali;
10. Aggiornamento impresa.

La sezione `Trasferimenti d'azienda, fusioni, scissioni e subentri` non compare nella home. Nell'Artefatto A rimane disponibile nella vista camerale completa: mantenere questa distinzione salvo diversa struttura della piattaforma.

Layout desktop:

- 3 colonne;
- distribuzione visiva 3-3-3-1;
- gap 14 px;
- padding contenitore `0 14px 16px`;
- altezza minima riquadro 164 px;
- bordo `#dce5f3`;
- raggio 11 px;
- fondo bianco;
- hover con lieve sollevamento e bordo più marcato.

Layout con pannello affiancato:

- la porzione sinistra passa a 2 colonne;
- riquadri leggermente più compatti;
- il pannello destro occupa il 50% della viewport;
- non deve comparire una barra di tab aggiuntiva sopra la home nella sola modalità affiancata.

Responsive:

- sotto 1180 px: 2 colonne;
- sotto 760 px: 1 colonna;
- il testo di `Visualizza sintesi` può essere nascosto su mobile mantenendo icona e nome accessibile.

### 6.4 Contenuto di ogni riquadro

Ogni card deve contenere, nell'ordine:

1. icona della sezione;
2. titolo;
3. indicatore generale circolare;
4. testo `N di N informazioni presenti`;
5. una riga unica con:
   - pallino verde + `N confermate`;
   - pallino rosso + `N da verificare`;
   - pallino arancione + `N da revisionare`;
6. azione `Visualizza dettagli` con freccia.

Specifiche degli indicatori:

- pallini da 8 px nella home desktop e 7 px nella home compressa;
- verde `#08a77e`;
- rosso `#d7192d`;
- arancione `#ee7203`;
- testi e pallini centrati verticalmente tra “informazioni presenti” e “Visualizza dettagli”;
- nessuna icona interna ai tre pallini della riga;
- l'indicatore generale del riquadro può mantenere l'icona bianca su fondo verde.

I conteggi non devono essere scritti a mano. Devono derivare dallo stato effettivo dei campi applicabili della sezione.

---

## 7. Stati, visibilità e note dei campi

### 7.1 Stati canonici

Ogni istanza di campo deve avere uno e un solo stato:

| Chiave consigliata | Etichetta | Colore | Significato |
|---|---|---|---|
| `verified` | Confermato | verde | informazione verificata dal consulente |
| `review` | Da revisionare | arancione | è stata richiesta una correzione/integrazione |
| `pending` | Da verificare | rosso | informazione presente o appena modificata ancora da verificare |

Non dedurre lo stato dalla sola presenza del valore. Presenza, verifica e visibilità sono concetti distinti.

### 7.2 Visibilità verso l'azienda

Ogni campo deve avere un controllo “occhio/occhio barrato” indipendente dallo stato.

- `hidden = false`: il campo è visibile all'azienda;
- `hidden = true`: il campo è oscurato e non visibile all'azienda;
- nascondere un campo non deve cancellarne valore, nota, audit o stato;
- un campo nascosto continua a concorrere ai conteggi e alla qualità, se applicabile;
- la UI del consulente deve continuare a mostrare il campo in stile attenuato;
- l'API destinata all'azienda deve filtrare i campi nascosti lato server, non solo tramite CSS.

### 7.3 Popup di gestione

Il popup deve essere ancorato all'indicatore di stato cliccato:

- la punta deve indicare esattamente il campo;
- il popup si posiziona sotto il campo quando c'è spazio;
- passa sopra il campo quando manca spazio in basso;
- resta dentro i margini della viewport;
- ricalcola la posizione al resize e, se il contenitore scorre, anche durante lo scroll;
- chiusura con pulsante X ed Escape;
- mantenere focus management e attributi ARIA corretti.

Contenuti comuni a tutti gli stati:

- titolo con il nome del campo;
- valore attuale;
- nota sempre disponibile e persistita;
- eventuale nota precedente;
- storico minimo di autore e data.

Azioni per stato:

| Stato corrente | Azione secondaria | Azione primaria |
|---|---|---|
| Confermato | Richiedi revisione | Salva nota |
| Da revisionare | Aggiorna richiesta | Conferma correzione |
| Da verificare | Richiedi revisione | Verifica |

Non mostrare “Verifica” come azione primaria quando il campo è già confermato.

---

## 8. Sintesi camerale

### 8.1 Apertura e dimensionamento

`Visualizza sintesi` apre la Sintesi camerale in un pannello laterale al 50% mantenendo la home visibile a sinistra.

Il pulsante `A tutta larghezza` della Sintesi deve:

- espandere lo stesso pannello Sintesi a `100vw`;
- non aprire la pagina dei dati camerali completi;
- non cambiare il contenuto visualizzato;
- cambiare etichetta in `Affianca`;
- ripristinare il pannello al 50% quando premuto di nuovo;
- mantenere stato di modifica, scroll, note e valori non ancora salvati.

L'unico comando che apre tutte le sezioni è `Apri dati camerali completi`, nel footer della Sintesi.

### 8.2 Header e banner

Header:

- `Sintesi camerale`;
- badge `Aggiornata`;
- sottotitolo `VISURA ORDINARIA SOCIETA' DI CAPITALE`;
- `Modifica` solo quando non si è già in modifica;
- `A tutta larghezza/Affianca`;
- chiusura X.

Banner impresa:

- `FIDA EDILE S.R.L.`;
- Camera di Commercio di Treviso - Belluno;
- Registro Imprese - Archivio ufficiale della CCIAA;
- stato `Attiva`;
- nessun QR code.

### 8.3 Gruppi della Sintesi

I titoli devono corrispondere a quelli del modello camerale:

1. `DATI ANAGRAFICI`;
2. `ATTIVITA'`;
3. `L'IMPRESA IN CIFRE (1)`;
4. `CERTIFICAZIONE D'IMPRESA`.

La sezione “Documenti consultabili” non deve comparire.

`CERTIFICAZIONE D'IMPRESA` deve mostrare la stessa tabella di qualificazioni/certificazioni proveniente da “Attività, albi, ruoli e licenze”, non una copia indipendente.

### 8.4 Modalità lettura e modifica della Sintesi

In lettura:

- aspetto normale;
- nessun riferimento alla sorgente visibile;
- nessun interruttore Sì/No visibile;
- valori derivati e autonomi devono apparire in modo uniforme.

In modifica:

- i campi derivati da altre sezioni diventano leggermente oscurati;
- i campi derivati sono non modificabili;
- compare un badge `Da: [nome sezione sorgente]`;
- la tabella certificazioni indica che proviene da “Attività, albi, ruoli e licenze”;
- soltanto i campi autonomi mostrano il selettore Sì/No.

Campi autonomi modificabili dalla Sintesi:

- Attività import export;
- Contratto di rete;
- Albi ruoli e licenze;
- Albi e registri ambientali.

Questi controlli sono booleani reali e devono essere salvati come valore di dominio coerente con la piattaforma, non come semplice testo decorativo.

### 8.5 Uscita con modifiche non salvate

Se si tenta di chiudere la Sintesi o aprire i dati completi mentre sono presenti modifiche:

- mostrare il dialogo di modifiche non salvate;
- consentire di continuare a modificare;
- consentire di uscire senza salvare;
- consentire di salvare e poi eseguire l'azione richiesta;
- non perdere la destinazione originale richiesta dall'utente.

---

## 9. Dettaglio di una sezione CCIAA

`Visualizza dettagli` apre la sola sezione selezionata al 50%.

Il pannello deve contenere:

- icona e titolo;
- indicatore “Sezione completa e verificata” calcolato;
- numero della sezione camerale;
- pulsante `A tutta larghezza`;
- chiusura X;
- campi in due colonne;
- cornice visibile per ogni valore;
- occhio e stato per ogni campo;
- legenda;
- `Modifica dati`;
- `Conferma tutta la sezione`;
- indicatore dell'ultima conferma della sezione.

Il testo dei pulsanti contestuali deve rimanere proporzionato al riquadro; nell'Artefatto A `Modifica sezione` e `Visualizza sintesi` sono a 11 px.

Le voci multiple non devono essere compresse in due colonne: diventano tabelle a tutta larghezza.

Durante la modifica:

- campi semplici in griglia a due colonne;
- textarea per testi lunghi;
- input numerico incrementale per conteggi;
- select per valori enumerati;
- campi derivati in sola lettura con indicazione della derivazione;
- tabelle con aggiunta ed eliminazione righe;
- annulla e salva;
- salvataggio disabilitato se non ci sono modifiche o se la validazione fallisce;
- conferma esplicita prima di uscire con modifiche non salvate.

Nota: l'Artefatto A protegge bene l'uscita dalla Sintesi, ma non applica lo stesso guard in ogni percorso del dettaglio CCIAA. Nella piattaforma reale il guard deve essere uniforme per chiusura, cambio sezione, passaggio al full width, back e cambio rotta.

---

## 10. Vista “Dati camerali completi”

La pagina completa deve contenere:

- tab `Panoramica`;
- tab attivo `Dati CCIAA` senza pallino arancione decorativo;
- titolo `Dati camerali completi`;
- comando `Scarica visura`;
- banner azienda al posto di “Dati generali della visura”;
- pulsante `Conferma tutta la visura` nel banner;
- indicatore cliccabile dell'ultima conferma globale;
- tutte le sezioni complete, inclusa la sezione trasferimenti se questa distinzione esiste nel dominio reale;
- per ogni sezione: `Conferma sezione`, audit ultima conferma e `Modifica sezione`;
- legenda finale: Confermato, Da revisionare, Da verificare, Nascosto all'azienda.

Il banner sostitutivo deve mostrare:

- ragione sociale;
- Camera di Commercio;
- Registro Imprese/archivio ufficiale;
- stato impresa;
- conferma globale;
- audit globale.

La conferma globale deve:

- portare a `verified` tutti i campi applicabili della visura;
- salvare autore e timestamp;
- non rendere visibili campi nascosti;
- non cancellare le note;
- non sovrascrivere i valori;
- produrre audit lato server.

La conferma di sezione applica le stesse regole soltanto ai campi applicabili della sezione.

L'indicatore di audit deve mostrare in un popover:

- “Ultima conferma”;
- data e ora;
- utente;
- perimetro confermato.

---

## 11. Tabelle e sezioni dinamiche

L'Artefatto A introduce tabelle ripetibili per:

- sezioni del Registro delle Imprese;
- soci e titolari di quote;
- amministratori;
- componenti degli organi di controllo;
- operazioni societarie;
- qualificazioni, certificazioni, albi e licenze;
- sedi secondarie e unità locali;
- cronologia aggiornamenti e protocolli.

Requisiti comuni:

- tabella a tutta larghezza;
- header accessibile;
- stato per riga;
- aggiunta riga in modifica;
- eliminazione riga con conferma se previsto dal design system;
- conteggio righe sincronizzato con il relativo campo numerico;
- ID stabile fornito dal backend, mai `Date.now()` in produzione;
- ordinamento stabile;
- salvataggio atomico o gestione esplicita degli errori parziali;
- righe nuove inizialmente `pending`;
- nessun dato della tabella deve essere duplicato in un secondo archivio solo per alimentare la Sintesi.

---

## 12. Amministratori e organi di controllo

### 12.1 Amministratori

La UI deve supportare almeno:

- amministratore unico;
- consiglio di amministrazione;
- amministrazione pluripersonale congiuntiva;
- amministrazione pluripersonale disgiuntiva.

Il cambio di organo deve aggiornare in modo coerente:

- numero componenti;
- righe della tabella;
- ruolo dei componenti;
- rappresentanza;
- firma;
- campi condizionali per decisioni, deleghe e opposizione.

Il numero componenti deve essere un input incrementale. I campi derivati dalla scelta dell'organo devono essere read-only o aggiornati tramite regole di dominio, senza causare loop nel form.

### 12.2 Sindaci e membri degli organi di controllo

La UI deve supportare almeno:

- nessun organo di controllo o revisore;
- sindaco unico;
- collegio sindacale;
- revisore legale persona fisica;
- società di revisione legale;
- sindaco unico più revisore esterno;
- collegio sindacale più revisore esterno.

Campi e righe devono apparire o scomparire coerentemente con la scelta. Conteggi, effettivi, supplenti, ruolo e funzione devono rimanere sincronizzati.

Non incorporare queste regole soltanto nel JSX. Centralizzarle in uno schema/configurazione di dominio testabile.

---

## 13. Personale e occupazione

La sezione contiene la totalità dei dati analitici disponibili:

- addetti totali;
- anno, trimestre/data di rilevazione e fonte;
- dipendenti;
- indipendenti;
- collaboratori;
- tempo determinato/indeterminato;
- tempo pieno/parziale;
- apprendisti, operai, impiegati;
- distribuzione territoriale;
- dipendenti, indipendenti e totale nel comune.

I rapporti percentuali devono essere rappresentati con grafici circolari coerenti con gli indicatori della home. Devono avere anche un equivalente testuale accessibile. Non disegnare grafici con valori hard-coded: derivarli dai dati.

---

## 14. Qualità dei dati

L'indicatore “Qualità dei dati” deve essere dinamico.

Formula:

```text
qualitaPercentuale = round(
  numeroInformazioniApplicabiliConStatoVerified
  / numeroTotaleInformazioniApplicabiliDaCompilareNellInteroModulo
  * 100
)
```

Regole:

- il numeratore contiene soltanto campi `verified`;
- il denominatore comprende l'intero modulo, non soltanto la macrosezione aperta;
- i campi condizionali non applicabili sono esclusi;
- i campi nascosti all'azienda restano inclusi;
- i campi derivati non devono essere contati due volte;
- una tabella va conteggiata secondo le istanze informative reali definite dal modello dati; scegliere una sola strategia coerente e usarla in backend e frontend;
- le righe eliminate non contano;
- i campi vuoti ma applicabili contano nel denominatore e non nel numeratore;
- se il denominatore è zero, mostrare 0% e non `NaN`;
- percentuale, conteggi e card devono aggiornarsi dopo salvataggio, verifica, richiesta revisione, aggiunta/eliminazione riga e cambio di un campo condizionale.

Il valore `86%` presente negli HTML è dimostrativo e non deve diventare una costante nell'applicazione.

Raccomandazione: il backend deve restituire sia il dettaglio degli stati sia un riepilogo calcolato o calcolabile deterministicamente. Evitare formule diverse tra pagina, API e report.

---

## 15. Caricamento, errore e assenza dati

Per home, Sintesi, dettaglio e pagina completa gestire esplicitamente:

- `idle`;
- `loading` con skeleton;
- `success`;
- `empty` con messaggio e azione appropriata;
- `error` con “Impossibile caricare i dati” e pulsante `Riprova`;
- `saving` con prevenzione dei doppi invii;
- `saveError` senza perdita delle modifiche locali.

Il retry deve rilanciare realmente la richiesta. Nessuna schermata deve restare in skeleton indefinitamente. Errori di una sezione non devono azzerare le altre sezioni già caricate se l'API consente un recupero parziale.

---

## 16. Integrazione backend e database

### 16.1 Regola inderogabile

Prima di creare tabelle, colonne, enum, indici o migrazioni, Claude deve chiedere conferma esplicita all'utente.

Claude può ispezionare schema, ORM, migration history e API senza modifiche. Se individua una lacuna deve fermarsi e presentare:

1. cosa manca;
2. perché è necessario;
3. tabelle/colonne/enum proposti;
4. relazioni e indici;
5. strategia di backfill;
6. impatto su dati esistenti;
7. rollback;
8. alternativa senza modifica schema;
9. richiesta esplicita di approvazione.

Senza approvazione non deve generare né eseguire migrazioni.

### 16.2 Concetti che devono essere mappati sul modello esistente

Non imporre questi nomi: cercare prima gli equivalenti semantici già presenti.

- azienda/tenant;
- macrosezione;
- sezione;
- definizione campo;
- istanza del valore;
- tipo del campo;
- obbligatorietà e applicabilità;
- sorgente del dato;
- valore derivato;
- visibilità verso l'azienda;
- stato di verifica;
- nota;
- verificato da/verificato il;
- conferma di sezione;
- conferma globale;
- righe ripetibili;
- audit log;
- versione/concorrenza del record.

La piattaforma potrebbe usare nomi diversi. Adattare la UI al dominio esistente; non rinominare entità stabili solo per farle coincidere con il prototipo.

### 16.3 Requisiti API

Riutilizzare gli endpoint esistenti quando semanticamente corretti. Se servono estensioni, progettare contratti espliciti per:

- lettura del catalogo sezioni/campi;
- lettura dei valori;
- modifica valori semplici;
- CRUD delle righe ripetibili;
- cambio stato;
- cambio visibilità;
- salvataggio nota;
- conferma sezione;
- conferma globale;
- audit ultima conferma;
- download visura;
- riepilogo qualità e completezza.

Ogni operazione deve rispettare autorizzazioni, tenant isolation, validazione server-side, audit e gestione della concorrenza già in uso.

---

## 17. Strategia di implementazione sicura

### Fase 0 — ispezione senza modifiche

Claude deve prima individuare:

- framework e versione;
- entry point della pagina;
- componenti della home;
- design system e token;
- router;
- gestione stato e query cache;
- form library e validazione;
- modelli ORM/schema database;
- API e servizi;
- ruoli e permessi;
- audit esistente;
- test e storybook;
- eventuali feature flag;
- utilizzi attuali di “Informazioni societarie”.

Output obbligatorio della Fase 0:

- elenco dei file sorgente rilevanti;
- mappa `requisito del prototipo -> componente/servizio esistente`;
- elenco delle differenze;
- rischi di regressione;
- eventuali gap di database;
- piano di modifica in piccoli passi.

### Fase 1 — componenti presentazionali

Creare o estendere componenti riusabili senza collegarli ancora a mutazioni distruttive:

- `CciaaMacroSection`;
- `CciaaSectionCard`;
- `CciaaSummaryPanel`;
- `CciaaSectionPanel`;
- `CciaaFullPage`;
- `ReviewableField`;
- `FieldVerificationPopover`;
- `ConfirmScopeControl`;
- `LastVerificationIndicator`;
- `RepeatableFieldTable`;
- `PersonnelOverview`;
- `UnsavedChangesDialog`.

Usare i nomi convenzionali del progetto se diversi.

### Fase 2 — adapter dei dati

Creare un adapter tra il dominio esistente e il view model della UI. Il componente grafico non deve conoscere direttamente tabelle o nomi ORM.

Il view model deve esporre almeno:

```ts
type FieldStatus = 'verified' | 'review' | 'pending';

type ReviewableFieldVM = {
  id: string;
  sectionId: string;
  label: string;
  value: unknown;
  displayValue: string;
  status: FieldStatus;
  hiddenToCompany: boolean;
  note: string;
  verifiedAt?: string;
  verifiedBy?: string;
  sourceLabel?: string;
  editable: boolean;
  derived: boolean;
  applicable: boolean;
};
```

### Fase 3 — lettura e navigazione

Implementare prima:

- home;
- apertura/chiusura pannelli;
- Sintesi 50%/100%;
- dettaglio 50%/100%;
- pagina completa;
- loading/error/empty.

### Fase 4 — modifica e verifica

Implementare:

- edit dei campi;
- campi condizionali;
- tabelle;
- stati;
- visibilità;
- note;
- conferme massive;
- audit;
- guard modifiche non salvate.

### Fase 5 — indicatori e rifinitura

Collegare:

- completezza;
- qualità dei dati;
- conteggi per riquadro;
- indicatori personali;
- responsive;
- accessibilità;
- test visivi.

---

## 18. Divieti di regressione

Claude non deve:

- sostituire l'intera pagina con l'HTML standalone;
- copiare React, ReactDOM o Tailwind dal bundle;
- rimuovere funzioni perché non visibili nella nuova home;
- rinominare rotte o modelli pubblici senza necessità;
- creare tabelle o migrazioni senza approvazione;
- eliminare dati esistenti;
- trasformare campi tipizzati in blob JSON solo per velocizzare;
- simulare salvataggi con solo stato locale nella piattaforma reale;
- nascondere dati sensibili soltanto lato client;
- hard-codificare conteggi, percentuali o timestamp;
- usare indici di array come identità persistente;
- perdere modifiche durante espansione, resize o cambio vista;
- duplicare i dati della Sintesi;
- cambiare design globale, font o reset CSS del progetto;
- introdurre dipendenze se il design system offre già la funzione necessaria.

---

## 19. Limiti del prototipo da non trasferire in produzione

L'Artefatto A è un prototipo interattivo e contiene semplificazioni intenzionali. Claude deve riconoscerle e sostituirle con integrazioni reali:

- il badge generale dei riquadri è sempre verde e i conteggi della home sono costruiti dalla lunghezza degli array, non dagli stati correnti;
- il KPI `86%` è statico;
- i dati e gli audit vivono in stato React locale;
- l'utente verificatore è hard-coded come `Marco R.`;
- alcune date sono generate nel browser;
- le righe aggiunte usano un ID temporaneo basato su `Date.now()`;
- il download funziona soltanto se esiste la variabile globale dimostrativa `window.__CCIAA_PDF_DATA__`;
- la gestione dell'errore è completa nel flusso precedente “Informazioni societarie”, ma non in ogni pannello CCIAA;
- il guard per modifiche non salvate non copre uniformemente tutti i percorsi del dettaglio e della pagina completa;
- lo stato delle righe di tabella viene cambiato ciclicamente nel prototipo, senza popup, nota e audit completi;
- la visibilità è soltanto locale e non costituisce un filtro di sicurezza server-side;
- le conferme massive non effettuano una mutazione API atomica;
- non esiste gestione reale dei conflitti di modifica concorrente.

Queste semplificazioni non sono requisiti: sono gap da colmare usando l'architettura reale della piattaforma.

---

## 20. Verifiche obbligatorie

### Test funzionali

- apertura e chiusura di ogni riquadro;
- Sintesi al 50%;
- `A tutta larghezza` espande solo la Sintesi;
- `Affianca` torna al 50%;
- `Apri dati camerali completi` apre la pagina completa;
- `Modifica sezione` apre soltanto la sezione scelta;
- stato e visibilità persistono dopo reload;
- nota persiste in tutti e tre gli stati;
- popup ancorato correttamente vicino ai bordi viewport;
- conferma campo, sezione e visura;
- audit aggiornato;
- modifica dei booleani della Sintesi;
- campi derivati non modificabili;
- aggiunta/eliminazione righe;
- regole condizionali amministratori e controllo;
- annullamento e salvataggio;
- dialogo modifiche non salvate su tutte le vie di uscita;
- loading, error, retry, empty e save error;
- qualità e conteggi aggiornati.

### Test di regressione

- home esterna alla CCIAA invariata;
- Informazioni societarie esistenti ancora raggiungibili dove previste;
- Sedi operative ancora funzionanti;
- permessi invariati;
- filtri di tenant invariati;
- API preesistenti compatibili;
- nessuna perdita di dati;
- nessuna migrazione non approvata.

### Test accessibilità

- navigazione da tastiera;
- focus visibile;
- Escape chiude popup/dialog;
- focus restituito al trigger;
- `aria-expanded`, `aria-pressed`, `aria-haspopup`, `aria-modal` corretti;
- etichette accessibili per pulsanti iconici;
- stato non comunicato soltanto dal colore;
- alternativa testuale ai grafici.

### Test responsive

Verificare almeno:

- 1600 × 1000;
- 1440 × 900;
- 1180 × 800;
- 768 × 1024;
- 390 × 844.

### Test visivi

Produrre screenshot prima/dopo e confrontare:

- home;
- home con Sintesi al 50%;
- Sintesi al 100%;
- dettaglio sezione al 50%;
- dettaglio sezione al 100%;
- pagina completa;
- popup in alto e in basso;
- modifica Sintesi;
- modifica tabella;
- loading;
- errore;
- modifiche non salvate.

---

## 21. Criteri di accettazione finali

Il lavoro è accettabile soltanto se:

1. la home resta visivamente identica fuori dalla macrosezione CCIAA;
2. la griglia CCIAA è 3-3-3-1 su desktop;
3. i conteggi di stato sono dinamici;
4. la Sintesi si espande da sola a tutta larghezza;
5. la pagina completa si apre esclusivamente dal comando dedicato;
6. ogni campo ha stato, visibilità, nota e audit;
7. le tabelle sono editabili senza duplicare la sorgente dati;
8. la qualità dati segue la formula globale;
9. conferma campo/sezione/visura è persistita e auditabile;
10. non è stata eseguita alcuna modifica schema non approvata;
11. non sono state rimosse o interrotte funzioni preesistenti;
12. test automatici, typecheck, lint e build passano.

---

## 22. Prompt operativo da eseguire in Claude Code

Di seguito il testo da incollare in Claude Code dopo avere copiato nel repository questo documento e i due HTML.

```text
Devi integrare nella piattaforma esistente la grafica e i comportamenti descritti nel file:

CONFRONTO_HTML_E_PROMPT_CLAUDE_CODE.md

Usa come riferimento visivo e comportamentale principale:

ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(1) (14).html

Usa come riferimento delle funzioni precedenti da preservare:

ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO(2).html

Non modificare direttamente i bundle HTML e non copiarne React, ReactDOM, CSS reset o JavaScript compilato nel progetto. Devi lavorare esclusivamente sui sorgenti reali della piattaforma, rispettandone framework, design system, routing, servizi, form, validazioni, permessi, audit, API e database.

Prima di modificare il codice esegui la Fase 0 del documento:

1. ispeziona il repository;
2. trova componenti, rotte, servizi, API, schema, migrazioni, permessi e test pertinenti;
3. individua tutti gli utilizzi correnti di Informazioni societarie, Dati CCIAA, Sedi e Anagrafica Aziendale;
4. crea una mappa precisa tra requisiti e codice esistente;
5. segnala rischi e differenze;
6. proponi il piano in piccoli passi.

Regola vincolante: se per completare l'integrazione ritieni necessaria una nuova tabella, colonna, relazione, enum, indice o migrazione, fermati prima di crearla o eseguirla. Presenta schema proposto, motivazione, impatto, backfill, rollback e alternativa senza migrazione, quindi chiedi conferma esplicita. Senza conferma non toccare lo schema.

Se i nomi e la struttura della piattaforma sono diversi dal prototipo, adatta il comportamento alle entità esistenti per significato. Non imporre i nomi del prototipo e non duplicare dati già disponibili.

Preserva integralmente le funzioni esistenti anche se non appaiono nella nuova home. Non eliminare codice soltanto perché non è raggiungibile dai due HTML. Prima di rimuovere o rinominare qualcosa, verifica riferimenti, rotte, test, permessi e utilizzi indiretti.

Dopo la Fase 0:

- se non sono necessarie modifiche al database, procedi con l'implementazione per fasi;
- se sono necessarie modifiche al database, attendi la mia approvazione;
- mantieni l'intervento circoscritto;
- riusa i componenti e i token esistenti;
- aggiungi test prima o insieme alle modifiche;
- esegui typecheck, lint, test e build;
- produci screenshot delle viste elencate nel documento;
- consegna un riepilogo dei file cambiati, delle decisioni e di ciò che è rimasto invariato.

La priorità è ottenere la fedeltà grafica e funzionale dell'Artefatto A senza regressioni e senza alterazioni non autorizzate del modello dati.
```

---

## 23. Nota conclusiva per l'implementatore

Il confronto mostra che la parte comune tra i due prototipi è sostanzialmente stabile: token, home superiore, dialoghi, drawer, full page, split view e gestione dello stato campo sono già coerenti. La vera differenza è il nuovo livello CCIAA. La strategia più sicura è quindi estendere l'architettura esistente con componenti e adapter dedicati, non riscrivere la pagina.
