# Mappatura vincolante dei campi nelle sezioni CCIAA

## 1. Scopo del documento

Questo documento corregge la collocazione dei campi nella nuova vista CCIAA della piattaforma.

Il prototipo `ANAGRAFICA_AZIENDALE_PROTOTIPO_INTERATTIVO 25-08-26(2).html` rimane il riferimento per l'impostazione grafica generale, per le tabelle ripetibili e per il modo in cui vengono aperte e consultate le sezioni. Non è però una fonte autorevole per stabilire a quale sezione appartenga ogni informazione.

La presente mappatura stabilisce:

- l'ordine corretto delle sezioni;
- i campi che devono comparire in ciascuna sezione;
- i campi che devono essere rappresentati come tabelle ripetibili;
- i valori che devono essere derivati o conteggiati;
- i dati che appartengono soltanto alla vista di sintesi;
- le principali collocazioni errate presenti nel prototipo.

La grafica delle tabelle già realizzate può essere conservata e adattata. Devono invece essere corretti contenuto, colonne, provenienza dei valori e appartenenza alle sezioni.

## 2. Direttiva fondamentale per Claude Code

La suddivisione riportata in questo documento è una **suddivisione della vista**, non una nuova suddivisione del database.

Per ogni campo elencato Claude deve:

1. cercare il dato nello schema e nel codice esistenti;
2. identificare la tabella, la colonna, la relazione, il servizio e l'endpoint che lo gestiscono;
3. verificare se il dato è già presente con un nome differente;
4. verificare se il valore è autorevole, derivato o soltanto dimostrativo;
5. collegare il campo alla sezione visiva indicata in questo documento;
6. mantenere il salvataggio nella tabella proprietaria corretta;
7. evitare qualsiasi duplicazione introdotta soltanto per riprodurre l'ordine della visura.

Una stessa sezione visiva può recuperare informazioni da molte tabelle differenti. Una stessa tabella del database può alimentare più sezioni visive.

Gli identificativi JavaScript, i valori dimostrativi e le righe statiche presenti nel prototipo HTML non devono essere considerati nomi reali di colonne o record da inserire nel database.

## 3. Analisi obbligatoria prima della correzione

Prima di modificare il codice Claude deve produrre una matrice con queste colonne:

| Sezione UI | Sottosezione o tabella UI | Campo richiesto | Tabella individuata | Colonna o relazione individuata | API/servizio | Stato | Intervento proposto |
|---|---|---|---|---|---|---|---|

Lo stato deve essere uno dei seguenti:

- **Esistente e correttamente utilizzabile**;
- **Esistente ma collegato alla sezione sbagliata**;
- **Esistente ma con funzionamento da correggere**;
- **Esistente in un'altra tabella o modulo**;
- **Derivabile da dati esistenti**;
- **Mancante**;
- **Ambiguo o non individuato**.

Per ogni campo mancante, ambiguo o non individuato Claude deve chiedere conferma prima di:

- creare una colonna;
- creare una tabella;
- creare una relazione;
- creare un catalogo;
- creare una migrazione;
- utilizzare un campo alternativo non perfettamente equivalente.

La richiesta non deve essere generica. Per ogni campo non trovato Claude deve presentare una proposta con:

| Informazione richiesta | Contenuto obbligatorio |
|---|---|
| Campo mancante | Denominazione e significato del campo previsto da questo documento |
| Verifiche eseguite | Tabelle, colonne, modelli, API e sinonimi già controllati |
| Necessità effettiva | Motivo per cui il dato non è ricavabile o riutilizzabile da strutture esistenti |
| Collocazione consigliata | Tabella esistente ritenuta più pertinente oppure proposta di nuova tabella |
| Nome tecnico proposto | Nome della colonna o della relazione, coerente con le convenzioni del progetto |
| Tipo di dato | Tipo SQL, nullabilità, valore predefinito ed eventuale vincolo |
| Relazioni | Chiavi esterne, cataloghi o entità collegate |
| Impatto | Backend, API, frontend, importazione, storico e migrazione coinvolti |
| Alternative | Eventuali collocazioni alternative con vantaggi e svantaggi |
| Decisione richiesta | Creare / Non creare / Posticipare / Usare una struttura alternativa |

Claude deve quindi chiedere esplicitamente: **“Vuoi creare questo campo? Se sì, confermi la tabella proposta oppure vuoi collocarlo altrove?”**

Se ritiene che il campo debba appartenere a una nuova tabella, deve spiegare perché nessuna tabella esistente è semanticamente adatta. Non può creare la nuova tabella finché non riceve conferma sia sulla necessità del campo sia sulla sua collocazione.

L'analisi deve essere presentata e approvata prima di apportare modifiche strutturali al database.

## 4. Ordine corretto delle sezioni

La vista completa deve rispettare questo ordine:

0. Dati della sintesi non presenti nelle sezioni successive;
1. Sede;
2. Informazioni da statuto/atto costitutivo;
3. Capitale e strumenti finanziari;
4. Soci e titolari di diritti su azioni e quote;
5. Amministratori;
6. Sindaci e membri degli organi di controllo;
7. Trasferimenti d'azienda, fusioni, scissioni e subentri;
8. Attività, albi, ruoli e licenze;
9. Personale e occupazione;
10. Sedi secondarie e unità locali;
11. Aggiornamento impresa.

### Conferma della sezione autonoma “Personale e occupazione”

Nel prototipo HTML è stata creata una sezione autonoma denominata **Personale e occupazione**. Questa impostazione deve essere mantenuta.

I dati relativi ad addetti, dipendenti, indipendenti, collaboratori e distribuzioni INPS devono essere riportati nella sezione autonoma **9. Personale e occupazione**.

Di conseguenza:

- `Personale e occupazione` deve essere la sezione 9;
- `Sedi secondarie e unità locali` deve essere la sezione 10;
- `Aggiornamento impresa` deve essere la sezione 11.

Il blocco grafico già realizzato per i dati occupazionali può essere conservato e corretto nei collegamenti ai campi reali del database.

---

# 0. Dati della sintesi non presenti nelle sezioni successive

## 0.1 Funzione della sezione

La sezione 0 deve contenere soltanto dati presenti nella prima pagina o nel blocco iniziale della visura che non possiedono già una collocazione nei capitoli 1–11.

Non deve duplicare ragione sociale, indirizzo, PEC, partita IVA, codice fiscale, forma giuridica, capitale, addetti, numero soci, numero amministratori, numero componenti di controllo o numero unità locali quando tali valori sono già ricavabili dalle sezioni di dettaglio.

## 0.2 Identificazione e verifica del documento

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Tipo di visura | Campo singolo collegato al documento importato |
| 2 | Camera di Commercio emittente | Campo singolo collegato al documento |
| 3 | Numero del documento | Campo singolo normalmente in sola lettura |
| 4 | Data di estrazione | Data del documento, distinta dall'importazione |
| 5 | QR Code o riferimento di verifica | Azione o riferimento di verifica, se disponibile |

Non devono essere collocati in questo blocco come normali campi camerali:

- percorso del file nel sistema;
- data e ora di caricamento;
- stato tecnico del parser;
- versione del parser;
- esito della riconciliazione.

Questi elementi appartengono ai metadati tecnici della sezione 11.

## 0.3 Informazioni sull'attività presenti soltanto nella sintesi

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Stato attività dell'impresa | Campo singolo |
| 2 | Codice NACE | Campo singolo o relazione a classificazione versionata |
| 3 | Versione NACE | Campo collegato al codice NACE |
| 4 | Attività import/export | Valore Sì/No/Non disponibile |
| 5 | Contratto di rete | Valore Sì/No/Non disponibile |
| 6 | Presenza di albi, ruoli e licenze | Indicatore Sì/No/Non disponibile |
| 7 | Presenza di albi e registri ambientali | Indicatore Sì/No/Non disponibile |

Questi indicatori sintetici non sostituiscono gli eventuali record di dettaglio presenti nella sezione 8.

## 0.4 Indicatori de “L'impresa in cifre” non disponibili altrove

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Numero titolari di cariche | Snapshot numerico della fonte |
| 2 | Pratiche inviate negli ultimi 12 mesi | Snapshot numerico della fonte |
| 3 | Trasferimenti di quote | Snapshot numerico della fonte |
| 4 | Trasferimenti di sede | Snapshot numerico della fonte |
| 5 | Partecipazioni in altre società | Sì/No/Non disponibile oppure collegamento al dettaglio, se esistente |

Questi campi non devono essere collocati nella sezione 11 soltanto perché descrivono eventi o aggiornamenti. Appartengono al riepilogo numerico della prima pagina.

## 0.5 Documenti consultabili

Il blocco deve essere una tabella ripetibile e non un insieme rigido di campi separati per Bilanci, Fascicolo, Statuto e Altri atti.

| Colonna | Contenuto |
|---|---|
| Tipologia documento | Bilancio, Fascicolo, Statuto, Patti sociali, Altro atto o altro documento camerale |
| Disponibilità | Disponibile, Non disponibile oppure Informazione non presente |
| Numero documenti | Quantità, quando indicata |
| Anno o periodo | Annualità del bilancio o periodo del documento |
| Documento acquisito | Collegamento al file realmente presente nella piattaforma |
| Azioni | Apertura o download, se il file è disponibile |

Le annualità dei bilanci devono essere righe separate o record collegati, non una stringa unica come `2025 - 2024 - 2023 - ...`.

---

# 1. Sede

## 1.1 Indirizzo della sede legale

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Comune | Campo strutturato |
| 2 | Provincia | Valore collegato o derivato dal Comune |
| 3 | Toponimo | Via, Viale, Piazza, Località ecc. |
| 4 | Denominazione stradale | Campo testuale strutturato |
| 5 | Numero civico | Campo alfanumerico |
| 6 | CAP | Stringa postale |
| 7 | Nazione | Campo da catalogo Paesi |
| 8 | Indirizzo completo originale | Valore sorgente della visura, in sola lettura |

L'eventuale campo visuale **Indirizzo sede legale** deve essere una composizione dei componenti precedenti. Non deve sostituirli né diventare l'unico valore salvato.

## 1.2 Domicilio digitale

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Domicilio digitale/PEC dell'impresa | Campo PEC ufficiale dell'impresa |

La PEC aziendale deve rimanere distinta dalle PEC personali o professionali di amministratori, sindaci e revisori.

## 1.3 Dati camerali e fiscali propri della sezione

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Partita IVA | Campo singolo |
| 2 | Numero REA attuale | Valore composto da sigla territoriale e progressivo |

## 1.4 Trasferimento da altra provincia

Il blocco deve essere condizionale e mostrato soltanto se applicabile.

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Presenza del trasferimento | Sì/No/Non disponibile |
| 2 | Provincia di provenienza | Campo territoriale |
| 3 | Numero REA precedente | Sigla e progressivo |
| 4 | Data del trasferimento | Data, se presente |

## 1.5 Collocazioni da correggere rispetto al prototipo

- **Codice fiscale** non deve essere duplicato nella sezione Sede: la sua collocazione camerale è nella sezione 2.1, riutilizzando comunque il dato identificativo autorevole dell'impresa.
- **Camera di Commercio competente** non deve essere duplicata come campo generico della sede. La Camera emittente appartiene alla sezione 0; il Registro Imprese competente appartiene alla sezione 2.1; l'eventuale sigla REA resta parte del Numero REA.

---

# 2. Informazioni da statuto/atto costitutivo

## 2.1 Iscrizione al Registro delle Imprese

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Codice fiscale e numero di iscrizione | Campo identificativo camerale |
| 2 | Registro delle Imprese competente | Campo collegato alla CCIAA/Registro |
| 3 | Data di iscrizione | Data |

Se il codice fiscale e il numero di iscrizione coincidono, la vista può mostrare un solo valore, ma non deve creare una copia incoerente nel database.

## 2.2 Sezioni del Registro delle Imprese

Conservare la tabella ripetibile del prototipo, correggendone e completandone le colonne.

| Colonna | Contenuto |
|---|---|
| Sezione | Sezione ordinaria, speciale o autonoma |
| Stato iscrizione | Attiva, cessata, sospesa o non determinata |
| Data di iscrizione | Decorrenza della specifica iscrizione |
| Data di cessazione | Se disponibile |
| Note o denominazione sorgente | Testo originale per sezioni non riconosciute |

## 2.3 Estremi e informazioni di costituzione

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Denominazione legale | Campo singolo autorevole |
| 2 | Forma giuridica | Campo da catalogo |
| 3 | Data dell'atto di costituzione | Data |
| 4 | Notaio o pubblico ufficiale | Collegamento a soggetto oppure valore strutturato |
| 5 | Numero di repertorio | Campo alfanumerico |
| 6 | Località dell'atto | Comune o Stato |

## 2.4 Sistema di amministrazione e controllo previsto dallo statuto

### 2.4.1 Durata della società

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Tipo di durata della società |
| 2 | Data termine della società |
| 3 | Regola o descrizione della durata |

### 2.4.2 Scadenza degli esercizi

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Scadenza del primo esercizio |
| 2 | Scadenza degli esercizi successivi |
| 3 | Giorni di proroga per l'approvazione del bilancio |

### 2.4.3 Sistema di amministrazione adottato e controllo contabile

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Sistema di amministrazione adottato |
| 2 | Soggetto o funzione che esercita il controllo contabile |

### 2.4.4 Organi amministrativi previsti

Il blocco deve essere ripetibile perché lo statuto può ammettere più configurazioni alternative.

| Colonna | Contenuto |
|---|---|
| Tipologia organo previsto | Amministratore unico, più amministratori, consiglio di amministrazione ecc. |
| In carica | Indica se quella configurazione è attualmente adottata |
| Numero minimo componenti | Minimo previsto |
| Numero massimo componenti | Massimo previsto |
| Regole decisionali | Collegiali, congiuntive, disgiuntive o altre regole statutarie |
| Deleghe previste | Possibilità e limiti delle deleghe |
| Regime di rappresentanza previsto | Regola generale prevista dallo statuto |
| Gestione dell'opposizione | Se applicabile all'amministrazione disgiuntiva |

## 2.5 Oggetto sociale

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Oggetto sociale completo | Testo esteso, senza riassunto sostitutivo |

## 2.6 Poteri da statuto

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Poteri da statuto | Testo esteso o blocchi strutturati quando già disponibili |

## 2.7 Ripartizione degli utili e delle perdite

| Colonna | Contenuto |
|---|---|
| Riferimento statutario | Articolo, clausola o riferimento |
| Regola | Testo della regola di ripartizione |

## 2.8 Altri riferimenti statutari

Il blocco deve essere una tabella ripetibile.

| Colonna | Contenuto |
|---|---|
| Tipologia clausola | Recesso, esclusione, prelazione o altra clausola |
| Presenza | Presente, assente oppure non determinata |
| Testo o riferimento | Contenuto o riferimento statutario |

## 2.9 Collocazioni da correggere rispetto al prototipo

Le seguenti informazioni non descrivono la persona attualmente nominata e devono rimanere in questa sezione quando derivano dallo statuto:

- modalità delle decisioni del consiglio;
- possibilità e limiti delle deleghe;
- modalità congiuntiva o disgiuntiva di esercizio dei poteri;
- gestione dell'opposizione;
- regole generali di rappresentanza;
- organi amministrativi alternativi previsti.

La sezione 5 deve invece contenere l'organo effettivamente in carica e le cariche attribuite alle persone.

---

# 3. Capitale e strumenti finanziari

## 3.1 Capitale sociale

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Capitale deliberato | Importo e valuta |
| 2 | Capitale sottoscritto | Importo e valuta |
| 3 | Capitale versato | Importo e valuta |
| 4 | Valuta | Campo comune agli importi, se non incorporato nella visualizzazione |
| 5 | Data di riferimento | Data dello snapshot o dell'atto |

Il titolo corretto della sezione è **Capitale e strumenti finanziari**. La dicitura breve **Capitale sociale** può essere usata soltanto come titolo del primo blocco interno.

## 3.2 Strumenti finanziari previsti dallo statuto

Il blocco deve essere ripetibile e mostrato soltanto se applicabile.

| Colonna | Contenuto |
|---|---|
| Tipologia strumento | Categoria dello strumento finanziario |
| Riferimento statutario | Articolo o clausola |
| Descrizione | Caratteristiche e diritti previsti |

---

# 4. Soci e titolari di diritti su azioni e quote

## 4.1 Riepilogo dell'assetto societario

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Numero dei soci o titolari | Conteggio derivato dalle relazioni attive, confrontabile con lo snapshot CCIAA |
| 2 | Data di riferimento della composizione | Data dello snapshot societario |
| 3 | Capitale sociale rappresentato | Importo dichiarato nell'elenco |

## 4.2 Estremi dell'elenco soci

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Data di riferimento dell'elenco |
| 2 | Data dell'atto |
| 3 | Data di deposito |
| 4 | Data di protocollo |
| 5 | Numero di protocollo |
| 6 | Capitale sociale dichiarato |

## 4.3 Tabella “Elenco soci e titolari di diritti”

Conservare l'impostazione tabellare del prototipo, ma la riga deve rappresentare la relazione tra un soggetto e una partecipazione o un diritto.

| Colonna o dato della riga | Contenuto | Proprietà logica |
|---|---|---|
| Soggetto | Selettore ricercabile della persona o persona giuridica | Relazione al soggetto autorevole |
| Tipo di soggetto | Persona fisica, persona giuridica o altro soggetto | Dato del soggetto |
| Nome e cognome / Denominazione | Dato compilato dal soggetto selezionato | Sola lettura nella tabella CCIAA |
| Codice fiscale o identificativo | Dato compilato dal soggetto selezionato | Sola lettura nella tabella CCIAA |
| Cittadinanza | Per persona fisica, se presente | Dato del soggetto |
| Stato di costituzione | Per persona giuridica | Dato del soggetto |
| Tipologia della partecipazione | Quota, azione o altra partecipazione | Dato CCIAA della relazione |
| Valore nominale | Valore della partecipazione | Dato CCIAA della relazione |
| Importo versato | Importo effettivamente versato | Dato CCIAA della relazione |
| Numero di azioni o quote | Quantità, quando prevista | Dato CCIAA della relazione |
| Percentuale | Percentuale sul capitale o sul diritto | Dato CCIAA della relazione |
| Tipo di diritto | Proprietà, usufrutto, pegno, nuda proprietà ecc. | Dato CCIAA della relazione |
| Quota del diritto | Percentuale o frazione riferita al diritto | Dato CCIAA della relazione |
| Titolarità | Individuale, congiunta o altra configurazione | Dato CCIAA della relazione |
| Domicilio | Domicilio del titolare riportato in visura | Dato collegato con periodo e fonte |
| Rappresentante comune | Soggetto collegato, se applicabile | Relazione CCIAA |
| Estremi della nomina | Riferimenti del rappresentante comune | Dato CCIAA |
| Vincoli o note | Ulteriori limitazioni ufficiali | Dato CCIAA |
| Stato della relazione | Attiva, cessata o altra condizione | Dato storico della relazione |
| Azioni | Apri scheda soggetto, modifica relazione, cessa relazione | Comandi UI |

Per evitare una tabella eccessivamente larga, la UI può mantenere come colonne immediatamente visibili **Soggetto**, **Codice fiscale**, **Quota**, **Valore nominale**, **Tipo di diritto**, **Versamento**, **Domicilio** e **Stato**. Gli altri dati devono rimanere disponibili nell'espansione della riga o nella scheda di modifica, non essere eliminati.

## 4.4 Regola persone e soggetti

I dati anagrafici devono essere letti dalle tabelle autorevoli del modulo Personale o dalla struttura generale dei soggetti. La tabella CCIAA deve salvare la relazione, la partecipazione e il diritto, non una copia di nome, cognome e codice fiscale.

La rimozione della riga non deve eliminare la persona o la società collegata.

---

# 5. Amministratori

## 5.1 Organo amministrativo attualmente in carica

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Tipologia dell'organo in carica | Campo da catalogo |
| 2 | Numero dei componenti | Conteggio derivato o controllato rispetto alle righe attive |
| 3 | Tipo di durata dell'organo | Campo da catalogo |
| 4 | Data di scadenza | Data, se applicabile |
| 5 | Bilancio o esercizio di riferimento della scadenza | Campo strutturato |
| 6 | Descrizione della durata | Testo ufficiale, quando necessario |

## 5.2 Tabella “Amministratori in carica”

Conservare la tabella realizzata nel prototipo, correggendone il funzionamento.

| Colonna o dato della riga | Contenuto | Proprietà logica |
|---|---|---|
| Persona | Autocomplete della persona presente nel modulo Personale | Relazione stabile alla persona |
| Nome | Compilato dalla persona selezionata | Sola lettura nella vista CCIAA |
| Cognome | Compilato dalla persona selezionata | Sola lettura nella vista CCIAA |
| Luogo di nascita | Compilato dalla persona selezionata | Sola lettura nella vista CCIAA |
| Stato di nascita | Compilato dalla persona selezionata | Sola lettura nella vista CCIAA |
| Data di nascita | Compilata dalla persona selezionata | Sola lettura nella vista CCIAA |
| Codice fiscale | Compilato dalla persona selezionata | Sola lettura nella vista CCIAA |
| Cittadinanza | Compilata dalla persona selezionata | Sola lettura nella vista CCIAA |
| Domicilio | Domicilio riportato per la carica o collegato alla persona con fonte e validità | Verificare la struttura esistente |
| PEC personale/professionale | PEC della persona, distinta dalla PEC aziendale | Dato persona/contatto |
| Carica | Amministratore unico, presidente, consigliere, amministratore delegato ecc. | Dato CCIAA della carica |
| Rappresentante dell'impresa | Sì/No/Non disponibile | Dato CCIAA della carica |
| Data dell'atto di nomina | Data | Dato CCIAA della carica |
| Data di iscrizione della nomina | Data | Dato CCIAA della carica |
| Tipo di durata | Catalogo durate | Dato CCIAA della carica |
| Data di scadenza | Data, se applicabile | Dato CCIAA della carica |
| Esercizio di scadenza | Esercizio o bilancio di riferimento | Dato CCIAA della carica |
| Poteri specifici o deleghe | Poteri attribuiti alla singola carica | Dato CCIAA della carica |
| Limitazioni | Limiti riferiti alla singola carica | Dato CCIAA della carica |
| Modalità di firma | Individuale, congiunta, disgiunta o altra | Dato CCIAA della carica |
| Stato della carica | In carica, cessata, sospesa o altro stato catalogato | Dato storico della carica |
| Azioni | Apri persona, modifica carica, cessa carica | Comandi UI |

La modifica della persona selezionata deve aggiornare i dati anagrafici mostrati senza cancellare o riscrivere automaticamente i dati della carica.

## 5.3 Collocazioni da correggere rispetto al prototipo

- **Numero titolari di cariche** appartiene alla sezione 0 come indicatore della sintesi, salvo futura presenza di un elenco dettagliato specifico.
- Le regole generali previste dallo statuto su decisioni, deleghe, opposizione e rappresentanza appartengono alla sezione 2.
- In questa sezione devono rimanere soltanto l'organo effettivamente in carica e i dati delle singole nomine.

---

# 6. Sindaci e membri degli organi di controllo

## 6.1 Assetto di controllo in carica

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Tipologia di organo o funzione di controllo | Nessuno, sindaco unico, collegio sindacale, revisore persona fisica, società di revisione o configurazione combinata |
| 2 | Numero dei componenti effettivi | Conteggio strutturato |
| 3 | Numero dei componenti supplenti | Conteggio strutturato |
| 4 | Funzione esercitata dall'organo interno | Campo da catalogo o testo ufficiale |
| 5 | Soggetto cui è affidata la revisione legale | Configurazione dell'incarico |
| 6 | Titolo o presupposto della nomina | Se presente |
| 7 | Tipo di durata | Campo da catalogo |
| 8 | Data o esercizio di scadenza | Campo strutturato |

I conteggi devono essere confrontati con le righe attive della tabella, senza eliminare automaticamente un valore ufficiale della visura in caso di discrepanza.

## 6.2 Tabella “Componenti degli organi di controllo”

| Colonna o dato della riga | Contenuto | Proprietà logica |
|---|---|---|
| Soggetto | Persona fisica o società di revisione selezionata | Relazione stabile al soggetto |
| Nominativo o denominazione | Compilato dal soggetto selezionato | Sola lettura nella vista CCIAA |
| Tipo di soggetto | Persona fisica o persona giuridica | Dato del soggetto |
| Codice fiscale/identificativo | Compilato dal soggetto selezionato | Sola lettura nella vista CCIAA |
| Luogo e Stato di nascita | Solo per persona fisica | Dato della persona |
| Data di nascita | Solo per persona fisica | Dato della persona |
| Domicilio | Dato del soggetto o domicilio associato all'incarico | Verificare la struttura esistente |
| Carica | Presidente, sindaco effettivo, sindaco supplente, sindaco unico, revisore unico, revisore esterno ecc. | Dato CCIAA della carica |
| Funzione | Vigilanza sulla gestione, revisione legale o altra funzione | Dato CCIAA dell'incarico |
| Data dell'atto di nomina | Data | Dato CCIAA dell'incarico |
| Data di iscrizione | Data | Dato CCIAA dell'incarico |
| Tipo di durata | Catalogo durate | Dato CCIAA dell'incarico |
| Data o esercizio di scadenza | Termine dell'incarico | Dato CCIAA dell'incarico |
| Registro o albo professionale | Registro revisori o altro albo | Dato professionale collegato |
| Numero di iscrizione professionale | Estremo dell'iscrizione | Dato professionale collegato |
| Stato della carica | In carica, cessata o altro stato | Dato storico dell'incarico |
| Azioni | Apri soggetto, modifica incarico, cessa incarico | Comandi UI |

La rimozione della riga deve cessare o disattivare l'incarico secondo il modello esistente, senza eliminare la persona o la società collegata.

---

# 7. Trasferimenti d'azienda, fusioni, scissioni e subentri

## 7.1 Tabella “Operazioni societarie”

La tabella deve contenere una riga per ogni evento o fase giuridicamente distinta. Un progetto, una delibera e un atto di esecuzione non devono essere uniti arbitrariamente se il database li gestisce come eventi separati.

| Colonna o dato della riga | Contenuto |
|---|---|
| Famiglia dell'operazione | Trasferimento d'azienda, fusione, scissione, subentro o altra famiglia |
| Tipo di atto o operazione | Tipologia puntuale dell'evento |
| Descrizione | Testo ufficiale o descrizione strutturata |
| Data dell'atto | Data, se applicabile |
| Data della delibera | Data, se applicabile |
| Data di deposito | Data, se disponibile |
| Data di iscrizione | Data di iscrizione nel Registro Imprese |
| Data dell'atto di esecuzione | Data, se applicabile |
| Data di efficacia | Data, se distinta |
| Data di modifica | Data, se presente |
| Numero di protocollo o pratica | Identificativo della pratica |
| Camera o Registro competente | Ente territoriale competente |
| Documento o atto collegato | Collegamento documentale, se disponibile |
| Stato dell'evento | Stato corrente o storico |

## 7.2 Soggetti coinvolti nell'operazione

Ogni evento può collegare più soggetti. Il dettaglio deve essere una sottotabella o una relazione espandibile.

| Colonna | Contenuto |
|---|---|
| Società o soggetto coinvolto | Collegamento al soggetto autorevole |
| Ruolo nell'operazione | Incorporante, incorporata, beneficiaria, scissa, cedente, cessionaria, subentrante ecc. |
| Codice fiscale o identificativo | Letto dal soggetto selezionato |
| Sede | Sede risultante dall'atto o dalla visura |

La colonna generica **Società interessata** del prototipo può essere conservata come riepilogo, ma non deve impedire la gestione di più soggetti e ruoli nella stessa operazione.

---

# 8. Attività, albi, ruoli e licenze

## 8.1 Attività dell'impresa

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Data di inizio dell'attività dell'impresa |
| 2 | Attività prevalente esercitata dall'impresa |
| 3 | Attività esercitata presso la sede legale |
| 4 | Data di inizio dell'attività presso la sede legale |

Lo **Stato attività** non deve essere duplicato qui quando è un'informazione presente soltanto nel riepilogo iniziale: la sua collocazione è la sezione 0.

## 8.2 Tabella “Classificazioni delle attività economiche”

Non utilizzare un singolo campo rigido per ATECO 2025 e un altro per ATECORI. Le classificazioni devono essere record ripetibili e versionati.

| Colonna o dato della riga | Contenuto |
|---|---|
| Ambito | Impresa, sede legale o altro ambito |
| Sistema di classificazione | ATECO 2025, ATECORI 2007-2022 o altra classificazione |
| Versione | Versione del sistema |
| Codice attività | Codice ufficiale |
| Descrizione ufficiale | Descrizione del catalogo |
| Importanza | Prevalente, primaria, secondaria o altra classificazione ufficiale |
| Fonte originaria | Registro Imprese, Agenzia Entrate o altra fonte |
| Riclassificato d'ufficio | Sì/No/Non disponibile |
| Data di inizio validità | Data |
| Data di fine validità | Data, se cessata |
| Testo originale | Valore sorgente della visura |

Il Codice NACE e la relativa versione restano nella sezione 0 quando compaiono soltanto nella pagina di sintesi.

## 8.3 Tabella “Albi, ruoli e registri”

| Colonna | Contenuto |
|---|---|
| Tipologia | Albo, ruolo o registro |
| Ente competente | Ente che gestisce l'iscrizione |
| Numero di iscrizione | Estremo identificativo |
| Sezione o categoria | Classificazione interna |
| Data di iscrizione | Data |
| Data di scadenza | Data, se prevista |
| Stato | Attiva, sospesa, cessata, scaduta o altro stato |

## 8.4 Tabella “Licenze e autorizzazioni”

| Colonna | Contenuto |
|---|---|
| Tipologia | Tipo di licenza o autorizzazione |
| Ente rilasciante | Ente competente |
| Numero del provvedimento | Identificativo |
| Data del provvedimento o rilascio | Data |
| Data di scadenza | Data, se prevista |
| Attività autorizzata | Descrizione o collegamento all'attività |
| Stato | Stato dell'autorizzazione |

## 8.5 Tabella “Categorie di opere generali e specializzate”

| Colonna | Contenuto |
|---|---|
| Fonte | Casellario ANAC o altra fonte |
| Categoria SOA | Codice e descrizione della categoria |
| Tipo categoria | Generale o specializzata |
| Classifica | Livello della classifica |
| Importo limite | Importo previsto dalla classifica |
| Data di riferimento o validità | Data o intervallo |
| Attestazione collegata | Relazione all'attestazione SOA |

Le categorie OG1, OG3 e OS7 del prototipo sono valori di esempio e devono essere righe provenienti dal database, non colonne o campi rigidi.

## 8.6 Tabella “Attestazioni SOA”

| Colonna o dato della riga | Contenuto |
|---|---|
| Codice identificativo SOA | Codice dell'organismo |
| Denominazione SOA | Organismo che ha rilasciato l'attestazione |
| Numero attestazione | Numero identificativo |
| Data di rilascio | Data |
| Data di scadenza | Data |
| Regolamento | Riferimento applicabile |
| Stato dell'attestazione | Valida, scaduta, sospesa, revocata o altro stato |
| Fonte | Origine del dato |

## 8.7 Tabella “Informazioni dal Casellario ANAC”

| Colonna | Contenuto |
|---|---|
| Tipologia informazione | Certificazione di qualità, annotazione, provvedimento, requisito o altro |
| Descrizione | Testo ufficiale |
| Ente o organismo collegato | Soggetto citato |
| Data del provvedimento o rilascio | Data |
| Data di scadenza | Data, se presente |
| Stato | Stato dell'informazione o provvedimento |

## 8.8 Tabella “Certificazioni in corso di validità”

Le certificazioni non devono essere campi rigidi denominati `ISO 9001` o `ISO 45001`. Ogni certificazione deve essere un record autonomo, storico e collegato ai cataloghi già esistenti.

| Colonna o dato della riga | Contenuto |
|---|---|
| Fonte | Fonte del dato camerale |
| Data ultimo aggiornamento della fonte | Data dello snapshot |
| Tipologia certificazione | Collegamento al catalogo certificazioni |
| Sigla o famiglia camerale | Sigla riportata dalla fonte |
| Norma ed edizione | Norma completa, ad esempio UNI EN ISO 9001:2015 |
| Numero certificato | Identificativo del certificato |
| Data prima emissione | Data storica iniziale |
| Data emissione corrente | Data del ciclo corrente, se presente |
| Data di scadenza | Termine di validità |
| Organismo certificatore | Collegamento all'organismo |
| Codice fiscale organismo | Letto dal soggetto collegato, se disponibile |
| Stato ufficiale | Valida, sospesa, revocata, scaduta, in rinnovo o non determinata |
| Stato calcolato | Valutato dalle date senza sovrascrivere lo stato ufficiale |
| Scopo della certificazione | Attività e sedi coperte, se riportate |

### 8.8.1 Settori IAF della certificazione

Ogni certificazione può essere associata a uno o più settori IAF.

| Colonna | Contenuto |
|---|---|
| Settore IAF | Codice e descrizione dal catalogo |
| Descrizione sorgente | Testo riportato dalla visura |
| Data inizio copertura | Data, se disponibile |
| Data fine copertura | Data, se disponibile |

La tabella grafica unica **Albi, ruoli, licenze e certificazioni** del prototipo può essere mantenuta come riepilogo di consultazione. In modifica deve però distinguere le diverse entità e aprire il form corretto per albo, licenza, categoria SOA, attestazione o certificazione.

## 8.9 Collocazioni da correggere rispetto al prototipo

- Stato attività, NACE, attività import/export e contratto di rete devono essere nella sezione 0 se disponibili soltanto nella sintesi.
- Gli indicatori generici di presenza di albi e registri devono essere nella sezione 0; i relativi record analitici restano nella sezione 8.
- OG1, OG3, OS7, ISO 9001 e ISO 45001 non sono campi fissi: sono righe di tabelle ripetibili.

---

# 9. Personale e occupazione

## 9.1 Funzione della sezione

La sezione autonoma **Personale e occupazione** conserva i dati statistici sugli addetti riportati dalla visura. Questi dati sono snapshot storici provenienti normalmente dalla fonte INPS e non devono creare, modificare o cessare le singole persone presenti nel modulo Personale.

Il blocco grafico realizzato nel prototipo può essere mantenuto, compresi indicatori, percentuali e distribuzioni, purché ogni valore sia collegato al campo o alla relazione corretta del database e conservi periodo e fonte della rilevazione.

## 9.2 Rilevazione complessiva

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Fonte della rilevazione |
| 2 | Anno di rilevazione |
| 3 | Trimestre |
| 4 | Data di rilevazione |
| 5 | Dipendenti |
| 6 | Indipendenti |
| 7 | Totale addetti |
| 8 | Collaboratori |

## 9.3 Distribuzione per contratto

| Colonna | Contenuto |
|---|---|
| Tipologia contrattuale | Tempo determinato, indeterminato o altra tipologia |
| Valore percentuale | Percentuale sul gruppo di riferimento |
| Numero addetti | Conteggio, se disponibile o derivabile |

## 9.4 Distribuzione per orario di lavoro

| Colonna | Contenuto |
|---|---|
| Tipologia orario | Tempo pieno, parziale o altra tipologia |
| Valore percentuale | Percentuale sul gruppo di riferimento |
| Numero addetti | Conteggio, se disponibile o derivabile |

## 9.5 Distribuzione per qualifica

| Colonna | Contenuto |
|---|---|
| Qualifica | Apprendista, operaio, impiegato, quadro, dirigente o altra qualifica |
| Valore percentuale | Percentuale sul gruppo di riferimento |
| Numero addetti | Conteggio, se disponibile o derivabile |

## 9.6 Distribuzione territoriale

| Colonna | Contenuto |
|---|---|
| Comune | Comune della rilevazione |
| Provincia | Provincia collegata |
| Sedi e unità comprese | Collegamento alle sedi interessate |
| Dipendenti | Conteggio territoriale |
| Indipendenti | Conteggio territoriale |
| Totale | Totale ufficiale territoriale |

## 9.7 Regole specifiche

- Ogni rilevazione deve conservare fonte, anno, trimestre e data puntuale.
- I dati del periodo più recente non devono sovrascrivere le rilevazioni precedenti.
- Totali, percentuali e conteggi devono essere collegati alla stessa rilevazione.
- Le percentuali devono essere controllate per gruppo, segnalando eventuali somme diverse da 100 senza alterare il dato ufficiale.
- I conteggi eventualmente ricavati dalle percentuali devono essere marcati come derivati.
- Questi snapshot non devono essere confusi con la fotografia annuale del personale al 31 dicembre né con l'elenco nominativo dei lavoratori.

---

# 10. Sedi secondarie e unità locali

## 10.1 Tabella principale delle unità locali

Conservare l'impostazione della tabella del prototipo, ma ogni riga deve rappresentare un record autonomo e aprire il dettaglio completo dell'unità.

| Colonna immediatamente visibile | Contenuto |
|---|---|
| Riferimento | Identificativo visuale, ad esempio TV/1 |
| Tipologia | Una o più tipologie dell'unità |
| Denominazione | Nome specifico, se presente |
| Indirizzo | Composizione dell'indirizzo strutturato |
| Data di apertura | Data |
| Stato | Attiva, inattiva, sospesa, cessata o non determinata |
| Attività | Riepilogo delle attività dell'unità |
| ATECO | Riepilogo delle classificazioni attive |
| Azioni | Apri, modifica o consulta storico |

## 10.2 Dati completi dell'unità

### Identificazione

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Sigla territoriale dell'unità |
| 2 | Numero progressivo dell'unità |
| 3 | Identificativo visuale completo |
| 4 | Tipologia o tipologie dell'unità |
| 5 | Denominazione dell'unità |
| 6 | Numero REA dell'unità, se presente |
| 7 | Data di apertura |
| 8 | Data di chiusura |
| 9 | Stato dell'unità |

### Indirizzo

| Ordine | Campo da visualizzare |
|---:|---|
| 1 | Comune |
| 2 | Provincia |
| 3 | Toponimo |
| 4 | Denominazione stradale |
| 5 | Numero civico |
| 6 | CAP |
| 7 | Nazione |
| 8 | Indirizzo completo originale |

### Attività esercitate presso l'unità

Il blocco è ripetibile.

| Colonna | Contenuto |
|---|---|
| Descrizione attività | Testo ufficiale dell'attività locale |
| Data inizio | Data di inizio presso l'unità |
| Data fine | Data di cessazione, se presente |
| Ruolo o importanza | Primaria, secondaria, prevalente o altra classificazione |

### Classificazioni dell'attività dell'unità

Il blocco utilizza le stesse colonne della sezione 8.2 e deve aggiungere:

| Colonna | Contenuto |
|---|---|
| Unità locale collegata | Identificativo stabile dell'unità |
| Attività locale collegata | Specifica attività classificata, se la fonte consente il collegamento |

### Albi, ruoli, licenze e autorizzazioni dell'unità

Utilizzare le stesse strutture delle sezioni 8.3 e 8.4, aggiungendo il collegamento obbligatorio all'unità. Non duplicare il medesimo record a livello impresa e a livello unità quando è sufficiente una relazione agli ambiti coperti.

## 10.3 Collocazioni da correggere rispetto al prototipo

- Il numero delle unità locali deve essere un conteggio derivato o confrontato con lo snapshot della fonte, non una riga fissa.
- Le unità TV/1 e TV/2 sono esempi e non devono essere codificate nel componente.
- Tipologia, attività e ATECO possono essere multipli e non devono essere ridotti necessariamente a un unico testo.

---

# 11. Aggiornamento impresa

## 11.1 Dato camerale

| Ordine | Campo da visualizzare | Forma prevista |
|---:|---|---|
| 1 | Data dell'ultimo protocollo | Data dell'ultima pratica protocollata indicata dalla visura |

La data dell'ultimo protocollo non coincide con la data di estrazione della visura, con la data di importazione o con il generico `updated_at` del record.

## 11.2 Metadati tecnici dell'acquisizione

Questi dati servono alla piattaforma, ma non devono essere presentati come informazioni camerali ordinarie. Possono comparire in un blocco tecnico, in una cronologia o nel pannello dedicato al documento importato.

| Campo tecnico | Contenuto |
|---|---|
| Documento sorgente | Collegamento al PDF o JSON originale |
| Hash del documento | Impronta utilizzata per identificazione e duplicati |
| Data e ora di importazione | Timestamp di acquisizione nella piattaforma |
| Stato dell'importazione | Caricato, in elaborazione, elaborato, con anomalie, fallito o annullato |
| Versione del parser o tracciato | Versione utilizzata per interpretare il documento |
| Valore sorgente | Contenuto originale associato al dato normalizzato |
| Stato di riconciliazione | Nuovo, invariato, modificato, non riconciliato, duplicato potenziale o scartato |
| Data ultima conferma | Timestamp dell'ultima verifica valida |
| Utente che ha confermato | Soggetto che ha effettuato la verifica |
| Esito o dettaglio errore | Informazione tecnica dell'elaborazione |

## 11.3 Cronologia

La tabella **Cronologia aggiornamenti e protocolli** del prototipo può essere conservata con queste colonne:

| Colonna | Contenuto |
|---|---|
| Evento | Protocollo camerale, importazione, riconciliazione, conferma o altro evento tecnico |
| Data e ora | Timestamp dell'evento |
| Origine | Registro Imprese, PDF, parser, utente o altra fonte |
| Esito | Risultato dell'evento |
| Documento o versione | Collegamento alla fonte o alla versione interessata |
| Utente o processo | Autore umano o processo automatico |

## 11.4 Collocazioni da correggere rispetto al prototipo

I seguenti indicatori non devono stare nella sezione Aggiornamento impresa:

- Pratiche inviate negli ultimi 12 mesi;
- Trasferimenti di quote;
- Trasferimenti di sede;
- Partecipazioni in altre società.

Devono essere spostati nella sezione 0 perché appartengono al riepilogo **L'impresa in cifre**.

---

# 12. Vista di sintesi camerale

## 12.1 Regola generale

La sintesi è esclusivamente una vista frontend. Non deve possedere copie autonome dei valori già presenti nelle sezioni 0–11.

Ogni voce deve leggere il dato dalla relativa fonte e deve aggiornarsi quando cambia il record autorevole. Soltanto i dati definiti nella sezione 0 possono avere una propria origine perché non sono ripetuti nelle sezioni successive.

## 12.2 Banner iniziale

| Voce | Fonte |
|---|---|
| Denominazione dell'impresa | Sezione 2.3 / dato identificativo autorevole |
| Camera di Commercio | Sezione 0, Camera emittente |
| Registro Imprese / archivio ufficiale | Sezione 2.1 o testo istituzionale dell'interfaccia |
| Stato attività | Sezione 0 |
| Tipo di visura | Sezione 0 |

## 12.3 Dati anagrafici

| Voce di sintesi | Fonte |
|---|---|
| Indirizzo sede legale | Composizione della sezione 1.1 |
| Domicilio digitale/PEC | Sezione 1.2 |
| Numero REA | Sezione 1.3 |
| Codice fiscale e numero di iscrizione | Sezione 2.1 |
| Partita IVA | Sezione 1.3 |
| Forma giuridica | Sezione 2.3 |
| Data atto di costituzione | Sezione 2.3 |
| Data di iscrizione | Sezione 2.1 |
| Data ultimo protocollo | Sezione 11.1 |
| Legale rappresentante o amministratore principale | Derivato dalle cariche attive della sezione 5 |

## 12.4 Attività

| Voce di sintesi | Fonte |
|---|---|
| Stato attività | Sezione 0 |
| Data inizio attività | Sezione 8.1 |
| Attività prevalente | Sezione 8.1 |
| Codice ATECO prevalente | Record attivo e prevalente della sezione 8.2 |
| Codice NACE e versione | Sezione 0 |
| Attività import/export | Sezione 0 |
| Contratto di rete | Sezione 0 |
| Presenza albi, ruoli e licenze | Sezione 0, eventualmente confrontata con il dettaglio della sezione 8 |
| Presenza albi e registri ambientali | Sezione 0, eventualmente confrontata con il dettaglio della sezione 8 |

## 12.5 L'impresa in cifre

| Voce di sintesi | Fonte |
|---|---|
| Capitale sociale sottoscritto | Sezione 3.1 |
| Addetti alla data della rilevazione | Sezione 9 |
| Numero soci e titolari di diritti | Conteggio delle relazioni attive della sezione 4, confrontato con lo snapshot |
| Numero amministratori | Conteggio delle cariche attive della sezione 5 |
| Numero titolari di cariche | Sezione 0 |
| Numero componenti degli organi di controllo | Sezione 6 |
| Numero unità locali | Conteggio delle unità attive della sezione 10 |
| Pratiche negli ultimi 12 mesi | Sezione 0 |
| Trasferimenti di quote | Sezione 0 |
| Trasferimenti di sede | Sezione 0 |
| Partecipazioni in altre società | Sezione 0 |

## 12.6 Certificazioni d'impresa

La tabella deve essere derivata dai record della sezione 8.8 e mostrare almeno:

| Colonna | Fonte |
|---|---|
| Tipologia | Catalogo certificazioni collegato al record |
| Norma | Norma ed edizione del record |
| Numero certificato | Record della certificazione |
| Organismo | Ente collegato |
| Prima emissione | Record della certificazione |
| Scadenza | Record della certificazione |
| Settori IAF | Relazioni della certificazione con i settori IAF |
| Stato | Stato ufficiale e/o calcolato |

## 12.7 Documenti consultabili

La vista deve leggere la tabella della sezione 0.5 e distinguere:

- documento indicato dalla visura come consultabile;
- documento realmente acquisito nella piattaforma;
- azione disponibile per apertura o download.

---

# 13. Regole specifiche per le tabelle già realizzate

## 13.1 Conservazione della grafica

Le tabelle del prototipo possono essere mantenute per:

- stile;
- intestazioni grafiche;
- scroll orizzontale controllato;
- stato della riga;
- azioni di aggiunta, apertura, modifica e rimozione;
- comportamento responsive;
- apertura della scheda di dettaglio.

Non devono essere mantenuti automaticamente:

- righe di esempio codificate nel frontend;
- conteggi fissi;
- valori testuali dimostrativi;
- colonne incomplete;
- input di testo libero per dati provenienti da cataloghi o relazioni;
- campi aggregati che impediscono il salvataggio strutturato.

## 13.2 Persone e cariche

Nelle tabelle di soci, amministratori, sindaci e revisori:

- la persona o il soggetto deve essere scelto tramite autocomplete;
- deve essere salvato l'identificativo stabile del soggetto;
- nome, cognome, denominazione, codice fiscale e dati anagrafici devono essere letti dalla fonte autorevole;
- soltanto partecipazione, diritto, carica, nomina, durata, poteri e stato devono essere modificati nella relazione CCIAA;
- il comando di rimozione non deve cancellare l'anagrafica;
- la stessa persona può avere più cariche o relazioni senza essere duplicata.

## 13.3 Dati derivati e conteggi

I seguenti valori devono essere calcolati dai record attivi quando la struttura lo consente:

- numero soci;
- numero amministratori;
- numero membri degli organi di controllo;
- numero unità locali;
- stato calcolato di certificazioni e attestazioni;
- composizione dell'indirizzo completo visuale.

Se la visura fornisce anche un conteggio ufficiale, il sistema deve conservare sia lo snapshot sorgente sia il valore calcolato e segnalare eventuali differenze. Non deve correggere silenziosamente il dato importato.

## 13.4 Valori assenti

L'assenza di un campo nella visura non equivale automaticamente a zero o a No.

Claude deve distinguere almeno:

- dato non applicabile;
- dato non presente nella fonte;
- dato presente ma non riconosciuto;
- dato pari a zero;
- risposta esplicita No;
- sezione non acquisita;
- errore di estrazione.

Le sezioni o sottosezioni non applicabili possono essere nascoste, ma i record esistenti non devono essere cancellati per effetto della sola visibilità.

---

# 14. Risultato atteso da Claude prima delle modifiche

Prima di correggere la piattaforma Claude deve consegnare:

1. la matrice completa campo → tabella → colonna/relazione → API → componente;
2. l'elenco dei campi attualmente collocati nella sezione sbagliata;
3. l'elenco dei campi già disponibili ma non ancora mostrati;
4. l'elenco dei campi derivabili;
5. l'elenco dei campi mancanti, indicando per ciascuno la tabella consigliata, il tipo di dato e la domanda esplicita se crearlo e dove;
6. l'elenco delle tabelle del prototipo che possono essere conservate senza modifiche grafiche;
7. l'elenco delle tabelle che richiedono nuove colonne o un dettaglio espandibile;
8. la verifica dei collegamenti e della storicizzazione della sezione Personale e occupazione;
9. l'elenco delle modifiche allo schema eventualmente necessarie, separate per tabella e ancora non autorizzate;
10. le domande che richiedono una decisione del proprietario del progetto.

Dopo aver presentato questa analisi Claude deve fermarsi e attendere l'approvazione. Soltanto dopo l'approvazione potrà correggere il collegamento dei campi, i componenti frontend, gli endpoint e le eventuali strutture dati autorizzate.
