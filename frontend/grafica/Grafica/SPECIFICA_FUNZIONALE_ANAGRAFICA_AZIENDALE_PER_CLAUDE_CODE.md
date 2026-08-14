# Webbapp — Anagrafica Aziendale

## Specifica funzionale e piano di implementazione per Claude Code

**Stato:** approvato per implementazione desktop  
**Versione:** 1.0  
**Data:** 13 agosto 2026  
**Ambito:** pagina “Anagrafica Aziendale”, navigazione interna, modifica dati, stati tecnici, verifica del consulente e visibilità dei campi.

---

## 1. Come usare questo documento

Questo documento è la fonte funzionale da consegnare a Claude Code insieme ai mockup approvati. Deve essere usato per:

1. analizzare il repository esistente;
2. individuare componenti, routing, stato, API e schema dati già disponibili;
3. proporre un piano di modifica coerente con lo stack trovato;
4. implementare l’interfaccia desktop e i relativi comportamenti;
5. aggiungere test automatici e verifiche visuali.

### Ordine di prevalenza

In caso di discrepanze:

1. prevalgono le **regole normative di questo documento**;
2. seguono i mockup finali S01–S10;
3. seguono componenti e convenzioni già presenti nel repository;
4. testi o dettagli presenti in mockup intermedi non approvati non sono vincolanti.

In particolare, eventuali asterischi o riferimenti a “campi obbligatori” presenti nelle immagini più vecchie devono essere ignorati: **in questa fase nessun campo è obbligatorio**.

---

## 2. Obiettivo del prodotto

La pagina consente a un’azienda e al relativo consulente di consultare e aggiornare l’anagrafica aziendale attraverso una Panoramica e più sezioni di dettaglio.

L’esperienza deve permettere di:

- consultare rapidamente stato, qualità e cronologia dei dati;
- aprire una sezione in un pannello temporaneo al 50%;
- trasformare la sezione in una scheda persistente a tutta larghezza;
- affiancare Panoramica e sezione oppure due sezioni;
- modificare i dati senza perdere il contesto;
- proteggere le modifiche non salvate;
- mantenere caricamenti ed errori locali alla singola sezione;
- consentire al consulente di verificare ogni dato compilato;
- consentire al consulente di nascondere singoli campi all’azienda senza cancellarne i dati.

---

## 3. Ambito e non-obiettivi

### Incluso

- interfaccia desktop;
- Panoramica;
- pannello temporaneo destro al 50%;
- schede interne persistenti;
- vista a tutta larghezza;
- vista affiancata 50/50;
- consultazione e modifica dei moduli;
- protezione delle modifiche non salvate;
- caricamento, errore e modulo non compilato;
- ruoli Azienda e Consulente;
- verifica dei singoli campi;
- configurazione della visibilità dei singoli campi;
- KPI di completamento e qualità;
- audit minimo delle azioni rilevanti;
- accessibilità e test.

### Escluso da questa fase

- tablet e smartphone;
- responsive completo;
- una modalità autonoma “sola lettura”;
- uno stato generico “contenuto vuoto”;
- obbligatorietà dei campi;
- redesign della navigazione globale della piattaforma;
- modifica delle altre pagine non necessaria al funzionamento di Anagrafica Aziendale.

La pagina deve comunque evitare rotture gravi sotto la larghezza desktop minima già supportata dal prodotto, ma non è richiesto progettare ora un comportamento mobile.

---

## 4. Inventario dei riferimenti grafici

Prima di implementare, copiare i mockup nel repository, preferibilmente in `docs/mockups/anagrafica-aziendale/`, rinominandoli come segue.

| ID | Nome consigliato | Riferimento caricato | Funzione normativa |
|---|---|---|---|
| S01 | `S01-panoramica-base.png` | `ChatGPT Image 11 ago 2026, 12_30_18.png` | Panoramica base, nessuna sezione aperta |
| S02A | `S02A-pannello-consultazione.png` | variante approvata della famiglia `18_51_38` | Sezione in consultazione nel 50% destro |
| S02B | `S02B-pannello-modifica.png` | variante approvata della famiglia `18_50_54` | Sezione in modifica nel 50% destro |
| S03 | `S03-scheda-intera-modifica.png` | `ChatGPT Image 11 ago 2026, 19_13_16.png` | Scheda a tutta larghezza in modifica |
| S04A | `S04A-panoramica-sezione.png` | `ChatGPT Image 11 ago 2026, 19_26_47.png` | Panoramica e sezione affiancate |
| S04B | `S04B-due-sezioni.png` | `ChatGPT Image 11 ago 2026, 19_16_37.png` | Due sezioni affiancate |
| S05 | `S05-modifiche-non-salvate.png` | `ChatGPT Image 11 ago 2026, 19_34_05.png` | Conferma globale di uscita |
| S06 | `S06-caricamento-locale.png` | `ChatGPT Image 11 ago 2026, 19_42_47.png` | Skeleton della sola sezione |
| S07 | `S07-errore-locale.png` | `ChatGPT Image 11 ago 2026, 19_45_43.png` | Errore e comando Riprova |
| S08 | `S08-stati-verifica.png` | versione completa della famiglia `23_49_35` | Indicatori di verifica del consulente |
| S09 | `S09-popup-verifica.png` | `ChatGPT Image 12 ago 2026, 00_09_20.png` | Pop-up ancorato a Partita IVA |
| S10 | `S10-visibilita-campi.png` | `ChatGPT Image 13 ago 2026, 22_50_09.png` | Occhio aperto/barrato e campi oscurati |

Le copie duplicate e le varianti precedenti non devono diventare baseline di test.

---

## 5. Regole definitive non negoziabili

1. **Nessun campo è obbligatorio.**
2. Un valore vuoto non mostra alcun indicatore di verifica.
3. Ogni valore compilato possiede esattamente uno stato di verifica.
4. Gli indicatori di verifica sono visibili esclusivamente al Consulente.
5. Gli stati di verifica non modificano lo stato funzionale della sezione.
6. Nascondere un campo ne modifica solo la visibilità per l’Azienda.
7. Nascondere un campo non cancella valore, stato, note o cronologia.
8. Nascondere un campo non modifica KPI, completezza o validazione.
9. Il controllo con l’occhio è visibile esclusivamente al Consulente e agisce sul singolo campo, non sull’intera sottosezione.
10. La Panoramica è permanente e non può essere chiusa.
11. Caricamento ed errore sono locali alla sezione interessata.
12. Il dialogo per modifiche non salvate è globale, bloccante e identico in tutte le modalità.
13. Il modulo non compilato mostra la struttura predefinita con campi vuoti; non usa una pagina vuota generica.
14. Le modalità desktop condividono lo stesso stato dati e la stessa bozza: cambiare layout non deve perdere valori o errori.
15. I campi nascosti devono essere esclusi lato server dalla risposta destinata all’Azienda; non basta nasconderli con CSS.

---

## 6. Ruoli e autorizzazioni

### 6.1 Ruoli

- **Azienda:** consulta e modifica i campi che il Consulente ha reso visibili.
- **Consulente:** consulta e modifica i dati, vede gli stati di verifica, verifica o richiede revisione e configura la visibilità dei campi.

### 6.2 Matrice dei permessi

| Capacità | Azienda | Consulente |
|---|:---:|:---:|
| Vedere Panoramica e sezioni consentite | Sì | Sì |
| Modificare campi visibili | Sì | Sì |
| Vedere campi nascosti | No | Sì, oscurati |
| Vedere il controllo occhio | No | Sì |
| Nascondere/riattivare un campo | No | Sì |
| Vedere indicatori rosso/verde/arancione | No | Sì |
| Verificare un dato | No | Sì |
| Richiedere revisione | No | Sì |
| Vedere KPI di qualità con conteggi di verifica | No, salvo diversa futura decisione | Sì |
| Aprire, modificare, affiancare e chiudere sezioni | Sì | Sì |

I permessi devono essere applicati anche nelle API. Un utente Azienda non deve poter ottenere campi nascosti, note di revisione interne o comandi da Consulente modificando richieste client.

---

## 7. Modello concettuale degli stati

### 7.1 Tipi logici

```ts
type UserRole = 'COMPANY' | 'CONSULTANT';

type WorkspaceMode =
  | 'OVERVIEW'
  | 'TEMPORARY_DRAWER'
  | 'FULL_SECTION'
  | 'SPLIT_VIEW';

type SectionMode = 'VIEW' | 'EDIT';
type AsyncState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'SAVING';

type CompletionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';

type VerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REVISION_REQUIRED';

type FieldValue = string | number | boolean | string[] | null;

interface FieldState {
  key: string;
  label: string;
  value: FieldValue;
  dataType: string;
  visibleToCompany: boolean;
  verificationStatus: VerificationStatus | null;
  revisionNote?: string | null;
  updatedAt?: string;
  updatedBy?: { id: string; displayName: string };
}
```

### 7.2 Invarianti del campo

Definire `isEmpty(value)` in un unico punto condiviso. Stringhe vuote o composte solo da spazi, array vuoti e `null` sono vuoti. Il valore numerico `0` e il booleano `false` non sono vuoti.

```ts
if (isEmpty(field.value)) {
  field.verificationStatus === null;
} else {
  field.verificationStatus !== null;
}
```

Per dati legacy compilati ma senza stato, la migrazione deve assegnare `PENDING_VERIFICATION`.

### 7.3 Ciclo di verifica

| Evento | Stato risultante |
|---|---|
| Campo vuoto | `null` |
| Creazione o modifica di un valore non vuoto | `PENDING_VERIFICATION` |
| Consulente seleziona “Verifica” | `VERIFIED` |
| Consulente seleziona “Richiedi revisione” | `REVISION_REQUIRED` |
| Campo da revisionare viene modificato | `PENDING_VERIFICATION` |
| Campo viene svuotato | `null` |
| Campo viene nascosto o riattivato | stato invariato |

Qualunque modifica semantica del valore invalida la verifica precedente. Se il Consulente modifica e verifica nello stesso flusso, il backend può accettare un’operazione atomica esplicita; in assenza di tale operazione, la modifica produce `PENDING_VERIFICATION`.

---

## 8. Architettura dell’interfaccia

### 8.1 Barra delle schede

- `Panoramica` è sempre la prima scheda, permanente e senza `×`.
- Ogni sezione aperta possiede una scheda persistente con titolo e `×`.
- Una scheda con bozza non salvata mostra un pallino arancione vicino al titolo.
- Il pallino segnala esclusivamente `dirty = true`; non rappresenta errore o stato di verifica.
- Passare fra schede o modalità conserva bozze, errori di validazione e scroll finché la sezione rimane aperta.
- Chiudere una scheda pulita la rimuove immediatamente.
- Chiudere una scheda sporca apre S05.

La persistenza richiesta è almeno per la durata della sessione della pagina. Se il router esistente supporta URL profondi, codificare sezione attiva e modalità nell’URL senza includere bozze o dati sensibili.

### 8.2 Panoramica — S01

La Panoramica mostra:

- intestazione `Anagrafica Aziendale`;
- sottotitolo `Informazioni generali e dati comunicati dall’azienda`;
- KPI `Completamento scheda`;
- KPI `Qualità dei dati` per il Consulente;
- card `Ultime modifiche` con accesso alla cronologia;
- gruppo espandibile `Informazioni societarie` con quattro sottosezioni;
- accordion `Sedi`;
- accordion `Contatti`;
- accesso separato a `Dati CCIAA`.

Le sottosezioni mostrano titolo, stato, breve riepilogo e una CTA coerente:

- `Visualizza dettagli` se esistono dati consultabili;
- `Compila sezione` se la struttura esiste ma non contiene dati.

L’assenza di dati non genera una pagina vuota: aprendo la sottosezione viene mostrato il modulo predefinito.

### 8.3 Pannello temporaneo destro — S02A/S02B

Ingresso: click su `Visualizza dettagli` o `Compila sezione` dalla Panoramica.

- occupa il 50% destro del viewport di lavoro;
- la Panoramica resta visibile sotto un overlay attenuato;
- solo il pannello è interattivo;
- conserva titolo, stato e comando `×`;
- espone `Affianca` e `Apri in scheda`;
- in consultazione mostra `Modifica dati`;
- in modifica mostra i campi editabili e la barra azioni locale;
- `×` chiude subito se pulito, oppure apre S05 se sporco.

`Affianca` rimuove l’overlay e produce S04A. `Apri in scheda` produce S03.

### 8.4 Scheda a tutta larghezza — S03

- la sezione occupa tutta la superficie sotto la barra delle schede;
- il modulo sfrutta la larghezza disponibile mantenendo una griglia leggibile;
- la scheda resta chiudibile;
- è disponibile il comando `Affianca`;
- le azioni di modifica sono persistenti in fondo alla superficie;
- la bozza è la stessa usata nel pannello temporaneo o nella vista affiancata.

Un click su un’altra scheda porta quella sezione a tutta larghezza; le altre restano aperte.

### 8.5 Vista affiancata — S04A/S04B

Regole comuni:

- divisione esatta 50%/50% del contenitore utile;
- nessun overlay;
- ciascun pannello gestisce autonomamente consultazione, modifica, caricamento, errore, bozza e azioni;
- ciascun pannello offre `A tutta larghezza` e, se chiudibile, `×`;
- `A tutta larghezza` espande il pannello selezionato; l’altro resta aperto come scheda;
- massimo due superfici visibili contemporaneamente.

S04A mostra Panoramica a sinistra e sezione a destra. La Panoramica si riadatta realmente:

- KPI in disposizione 2 + 1;
- sottosezioni in griglia 2 × 2;
- accordion inferiori a tutta larghezza;
- nessun semplice ritaglio della versione larga.

Se da S04A viene aperta una seconda sezione, si passa a S04B: la sezione già aperta occupa il pannello sinistro e la nuova il destro. Panoramica resta disponibile come scheda permanente.

### 8.6 Chiusura di un pannello affiancato

- pannello pulito: viene chiuso; il pannello rimanente torna a tutta larghezza;
- pannello sporco: mostra S05 riferito esclusivamente alla bozza di quel pannello;
- chiudere una sezione non chiude né scarta bozze di altre sezioni.

---

## 9. Consultazione, modifica e validazione

### 9.1 Modalità consultazione

- etichetta sopra al valore;
- valore vuoto rappresentato con un trattino (`—`);
- valori formattati in modo coerente per data, numero e codice;
- indicatori di verifica solo per il Consulente;
- controllo di visibilità solo per il Consulente;
- CTA primaria `Modifica dati`.

### 9.2 Modalità modifica

- stessa gerarchia e ordine della consultazione;
- input appropriati al tipo di dato;
- nessun asterisco;
- nessuna validazione `required`;
- validazioni di formato applicate solo ai valori non vuoti;
- messaggio di errore vicino al campo;
- riepilogo generico `Modifica i campi evidenziati` se almeno un campo non vuoto è invalido;
- `Salva modifiche` disabilitato durante salvataggio o se esistono errori di formato;
- `Salva modifiche` non deve essere disabilitato solo perché uno o più campi sono vuoti;
- `Annulla` ripristina l’ultimo snapshot salvato dopo eventuale conferma S05, se l’azione comporta perdita della bozza.

### 9.3 Dirty state

Una sezione è sporca quando la bozza normalizzata differisce dall’ultimo snapshot confermato dal server. Non usare il solo evento `onChange`: se l’utente ripristina esattamente i valori salvati, `dirty` torna `false`.

Lo stato di visibilità salvato immediatamente e le decisioni di verifica non devono sporcare la bozza del modulo dati. Devono avere proprie mutation, loading ed eventuale rollback.

---

## 10. Conferma per modifiche non salvate — S05

Il dialogo appare solo quando un’azione rischia di perdere una bozza sporca:

- click sulla `×` della sezione;
- chiusura del pannello;
- cambio di contesto che smonta la bozza;
- uscita dalla pagina o navigazione esterna intercettabile dall’app;
- annullamento della modifica se comporta scarto.

Non appare durante la semplice digitazione e non appare per cambi di layout che preservano la stessa bozza.

### UI

- overlay scuro su tutta l’interfaccia;
- dialogo centrale e bloccante;
- focus intrappolato nel dialogo;
- titolo `Modifiche non salvate`;
- tre azioni sempre identiche e nello stesso ordine semantico.

### Azioni

| Azione | Effetto |
|---|---|
| `Continua a modificare` | chiude il dialogo e lascia tutto invariato |
| `Esci senza salvare` | scarta la bozza e completa l’azione originaria |
| `Salva ed esci` | valida, salva e completa l’azione originaria solo dopo successo |
| `×` del dialogo | equivale a `Continua a modificare` |

Se `Salva ed esci` fallisce, il dialogo deve restare aperto o riportare alla sezione con errore esplicito; l’uscita non deve avvenire.

Per `beforeunload`, usare anche la protezione nativa del browser, poiché il testo del dialogo personalizzato non è garantito.

---

## 11. Stati tecnici

### 11.1 Caricamento locale — S06

- riguarda solo la sezione interessata;
- conserva titolo, tab, stato, dimensioni e struttura della superficie;
- mostra `Caricamento dati…` e skeleton con ingombri stabili;
- disabilita le azioni interne della sezione;
- non oscura né blocca la Panoramica o l’altro pannello;
- evita salti di layout al completamento.

### 11.2 Errore locale — S07

- riguarda solo la sezione interessata;
- mostra `Impossibile caricare i dati`;
- mostra una breve spiegazione non tecnica;
- espone `Riprova`;
- mantiene disponibili `×` e `A tutta larghezza` quando sicuro;
- non modifica `Completa / Da completare`;
- non oscura né blocca il resto della pagina.

`Riprova` deve rieseguire esclusivamente la richiesta fallita e impedire doppi invii.

### 11.3 Sezione non compilata

- usa lo stesso componente modulo della sezione compilata;
- mostra tutti i campi previsti, inizialmente vuoti;
- non mostra indicatori di verifica sui campi vuoti;
- non mostra un’illustrazione generica `Nessun dato disponibile`;
- consente salvataggi parziali, purché gli eventuali valori inseriti siano formalmente validi.

### 11.4 Sola lettura

Non implementare un mockup o uno stato autonomo. Eventuali futuri permessi di sola lettura saranno una variante dei controlli, non una nuova architettura della pagina.

---

## 12. Verifica dei dati del Consulente — S08/S09

### 12.1 Indicatori

| Stato | Icona | Colore semantico | Etichetta accessibile |
|---|---|---|---|
| `PENDING_VERIFICATION` | `!` | rosso | `Da verificare` |
| `VERIFIED` | spunta | verde | `Verificata` |
| `REVISION_REQUIRED` | freccia circolare | arancione | `Da revisionare` |

- mostrare un solo indicatore per valore compilato;
- non mostrare indicatori per valori vuoti;
- non usare il solo colore: icona, tooltip e testo accessibile devono distinguere lo stato;
- non mostrare indicatori all’Azienda;
- mantenere una legenda nella parte inferiore della sezione per il Consulente.

### 12.2 KPI Qualità dei dati

Per il Consulente mostrare:

- numero di elementi verificati;
- numero di elementi da verificare;
- numero di elementi da revisionare;
- percentuale di qualità.

Formula consigliata:

```text
qualityPercentage = verifiedCount / filledFieldCount * 100
filledFieldCount = verifiedCount + pendingCount + revisionRequiredCount
```

Arrotondare secondo la convenzione del prodotto. I numeri illustrativi dei mockup non devono produrre conteggi matematicamente incoerenti. I campi vuoti sono esclusi; i campi nascosti restano inclusi, perché la visibilità non deve modificare i KPI.

### 12.3 Apertura del pop-up — S09

Il flusso approvato parte dal click sul `!` rosso.

- il pop-up è ancorato all’indicatore del campo, non centrato;
- una punta/freccia rende esplicito il collegamento con il campo;
- il posizionamento sceglie sopra, sotto, destra o sinistra in base allo spazio;
- l’intera interfaccia sottostante è attenuata e non interattiva;
- il pop-up rimane in primo piano;
- il campo di esempio del mockup è `Partita IVA`.

Contenuto:

- titolo `Verifica {nome campo}`;
- etichetta `Valore attuale`;
- valore corrente non modificabile;
- `Nota facoltativa` per l’azienda;
- `Richiedi revisione`;
- `Verifica`;
- `×`.

### 12.4 Esiti

- `Verifica`: salva `VERIFIED`, chiude il pop-up, sostituisce il `!` con la spunta e aggiorna KPI/contatori.
- `Richiedi revisione`: salva `REVISION_REQUIRED`, conserva la nota, chiude il pop-up, sostituisce il `!` con l’icona arancione e aggiorna KPI/contatori.
- `×`, `Escape` o click sull’overlay: chiude senza cambiare stato. Se è stata digitata una nota non inviata, il contenuto può essere scartato senza S05 perché non è ancora una modifica persistente del modulo.

Durante la mutation disabilitare le due azioni. In caso di errore mantenere aperto il pop-up, conservare la nota e mostrare un errore recuperabile.

Il comportamento interattivo delle icone verde e arancione non è richiesto dai mockup: possono mostrare tooltip e stato. Una futura funzione per riesaminare un esito deve riusare lo stesso componente, senza duplicare il flusso.

---

## 13. Visibilità dei campi — S10

### 13.1 Vista Consulente

- accanto all’etichetta di ogni singolo campo appare un controllo a forma di occhio;
- occhio aperto blu: campo visibile all’Azienda;
- occhio barrato: campo nascosto all’Azienda;
- il campo nascosto resta nella stessa posizione logica per il Consulente;
- il contenitore del campo nascosto appare attenuato/scuro, ma resta leggibile e azionabile;
- valore, verifica e cronologia restano invariati;
- mostrare la nota `I campi oscurati non sono visibili all’azienda`.

Il controllo non deve comparire sui titoli `Identificazione camerale`, `Iscrizione al Registro Imprese`, `Date` o su altri titoli di gruppo. Agisce solo sul singolo campo.

Nel riferimento S10 gli esempi nascosti sono:

- `Codice fiscale`;
- `Data ultimo bilancio approvato`.

### 13.2 Vista Azienda

- nessun controllo occhio;
- nessuna indicazione che esistano campi nascosti;
- il campo nascosto non viene renderizzato;
- righe e colonne si ricompongono senza lasciare spazi vuoti intenzionali;
- l’API non restituisce il campo nascosto, salvo metadati strettamente necessari e non sensibili.

### 13.3 Persistenza

Il toggle è una configurazione autonoma, salvata immediatamente:

1. mostra stato di caricamento sul controllo;
2. invia la mutation;
3. su successo aggiorna lo stato canonico;
4. su errore ripristina lo stato precedente e mostra feedback.

Non deve sporcare la bozza del modulo e non deve aprire S05. L’autorizzazione è esclusivamente da Consulente.

---

## 14. Completezza e stati di sezione

Gli stati di completezza e quelli di verifica sono domini separati.

```ts
interface SectionSummary {
  sectionKey: string;
  completionStatus: CompletionStatus;
  verificationSummary?: {
    verified: number;
    pending: number;
    revisionRequired: number;
  };
}
```

Poiché nessun campo è obbligatorio, il client non deve dedurre `COMPLETE` dalla presenza di campi `required`. La fonte autorevole deve essere una regola di business o un valore restituito dal backend.

Finché tale regola non è formalizzata nel dominio esistente:

- trattare `completionStatus` come server-authoritative;
- non cambiarlo quando un campo viene nascosto;
- non cambiarlo quando cambia uno stato di verifica;
- non impedire salvataggi parziali;
- non inventare soglie nel frontend.

---

## 15. Contratto dati/API consigliato

Adattare nomi, protocollo e convenzioni allo stack esistente. Non introdurre una seconda architettura API se il repository ne possiede già una.

### 15.1 Lettura Panoramica

```http
GET /api/companies/{companyId}/registry/overview
```

Risposta minima:

```json
{
  "companyId": "uuid",
  "completion": { "completedSections": 4, "totalSections": 14, "percentage": 29 },
  "quality": { "verified": 32, "pending": 3, "revisionRequired": 3, "percentage": 84 },
  "recentChanges": [],
  "groups": [],
  "version": 17
}
```

Per Azienda, omettere `quality` se non previsto dal prodotto.

### 15.2 Lettura sezione

```http
GET /api/companies/{companyId}/registry/sections/{sectionKey}
```

```json
{
  "sectionKey": "company-information",
  "title": "Informazioni societarie",
  "completionStatus": "COMPLETE",
  "groups": [
    {
      "key": "chamber-identification",
      "title": "Identificazione camerale",
      "fields": [
        {
          "key": "vatNumber",
          "label": "Partita IVA",
          "dataType": "vat-number",
          "value": "12345678901",
          "visibleToCompany": true,
          "verificationStatus": "PENDING_VERIFICATION",
          "revisionNote": null,
          "updatedAt": "2026-08-13T20:00:00Z"
        }
      ]
    }
  ],
  "version": 17
}
```

Per Azienda il serializer deve rimuovere i campi con `visibleToCompany = false` e omettere proprietà di verifica non necessarie.

### 15.3 Salvataggio dati

Preferire un salvataggio batch della singola sezione:

```http
PATCH /api/companies/{companyId}/registry/sections/{sectionKey}
If-Match: "17"
Content-Type: application/json

{
  "fields": {
    "vatNumber": "12345678901",
    "legalForm": null
  }
}
```

Il backend deve:

- validare i soli valori non vuoti;
- normalizzare formati;
- aggiornare atomicamente valori e stati di verifica;
- impostare a `PENDING_VERIFICATION` ogni valore non vuoto modificato;
- impostare a `null` lo stato di un valore svuotato;
- incrementare la versione;
- restituire snapshot canonico e KPI aggiornati.

### 15.4 Visibilità

```http
PATCH /api/companies/{companyId}/registry/sections/{sectionKey}/fields/{fieldKey}/visibility

{ "visibleToCompany": false }
```

Solo Consulente. La risposta restituisce lo stato canonico del campo e la nuova versione.

### 15.5 Verifica

```http
POST /api/companies/{companyId}/registry/sections/{sectionKey}/fields/{fieldKey}/review

{
  "decision": "VERIFIED",
  "note": null,
  "expectedFieldVersion": 7
}
```

oppure:

```json
{
  "decision": "REVISION_REQUIRED",
  "note": "Verificare il numero comunicato.",
  "expectedFieldVersion": 7
}
```

Solo Consulente. La risposta include campo aggiornato, conteggi qualità e versione.

### 15.6 Concorrenza

Usare ETag/versione o il meccanismo già presente. Se il valore cambia mentre il pop-up di verifica è aperto, rifiutare la decisione obsoleta con `409 Conflict`, ricaricare il valore e chiedere al Consulente di riesaminarlo.

---

## 16. Persistenza e schema dati

Nel patrimonio fornito è presente la tabella `ana_identificazione_camerale`, che contiene:

- `ragione_sociale`;
- `forma_giuridica`;
- `codice_fiscale`;
- `partita_iva`;
- `camera_commercio_competente`;
- `ufficio_registro_imprese`;
- `numero_rea`;
- `provincia_rea`;
- `stato_attivita`;
- `data_atto_costitutivo`;
- `data_inizio_attivita`;
- `data_ultimo_protocollo`.

### 16.1 Gap fra mockup e tabella esistente

| Campo UI | Colonna candidata | Azione prima di modificare lo schema |
|---|---|---|
| Ragione sociale | `ragione_sociale` | riusare |
| Forma giuridica | `forma_giuridica` | riusare |
| Codice fiscale | `codice_fiscale` | riusare |
| Partita IVA | `partita_iva` | riusare |
| Numero REA | `numero_rea` | riusare |
| Provincia REA | `provincia_rea` | riusare |
| Numero iscrizione | assente | cercare prima nello schema globale, poi aggiungere se necessario |
| Data iscrizione | assente | cercare prima nello schema globale, poi aggiungere se necessario |
| Sede legale | assente | verificare se esiste un’entità indirizzo/sede; non duplicare automaticamente |
| Stato impresa | `stato_attivita` forse correlata | confermare semantica prima del mapping |
| Data costituzione | `data_atto_costitutivo` forse equivalente | confermare semantica |
| Termine esercizio | assente | cercare e aggiungere solo se necessario |
| Inizio esercizio | `data_inizio_attivita` non necessariamente equivalente | non mappare senza conferma semantica |
| Data ultimo bilancio approvato | assente | cercare e aggiungere solo se necessario |

Claude Code deve cercare migrazioni, tabelle e modelli esistenti prima di generare nuove colonne.

### 16.2 Metadati trasversali consigliati

Poiché verifica e visibilità valgono per tutte le future sezioni, evitare colonne duplicate `*_status` su ogni tabella di dominio. Preferire metadati trasversali.

```sql
CREATE TYPE ana_verification_status AS ENUM (
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REVISION_REQUIRED'
);

CREATE TABLE ana_field_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES sys_aziende(id),
  section_key VARCHAR(100) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  visible_to_company BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status ana_verification_status,
  revision_note TEXT,
  field_version INTEGER NOT NULL DEFAULT 1,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (azienda_id, section_key, field_key)
);
```

Il nome e i tipi vanno adattati allo schema esistente. Aggiungere vincoli applicativi o database affinché un campo vuoto non mantenga uno stato di verifica. Se lo schema usa soft delete, tenancy o RLS, rispettarne le convenzioni.

### 16.3 Audit

Registrare almeno:

- cambio di valore;
- valore precedente e nuovo secondo le policy di sicurezza;
- cambio automatico a `PENDING_VERIFICATION`;
- verifica;
- richiesta di revisione e nota;
- cambio di visibilità;
- attore, ruolo e timestamp.

Riutilizzare l’audit log esistente se presente. Non duplicare dati sensibili in log applicativi non protetti.

---

## 17. Componentizzazione consigliata

Adattare i nomi al framework esistente.

```text
RegistryPage
├── RegistryTabs
├── OverviewDashboard
│   ├── CompletionCard
│   ├── DataQualityCard
│   ├── RecentChangesCard
│   └── SectionGroupList
└── WorkspaceSurface
    ├── TemporaryDrawer
    ├── FullSectionSurface
    └── SplitView
        └── SectionPanel
            ├── SectionHeader
            ├── SectionGroups
            │   └── FieldRow
            │       ├── VisibilityToggle
            │       └── VerificationIndicator
            ├── SectionActionBar
            ├── LocalLoadingState
            └── LocalErrorState

Global overlays
├── UnsavedChangesDialog
└── ReviewPopover
```

### Separazione dello stato

- **Server state:** sezioni, KPI, visibilità, verifiche, versioni.
- **Draft state:** valori in modifica, errori, dirty state per sezione.
- **Workspace state:** schede aperte, scheda attiva, modalità, pannelli visibili.
- **Overlay state:** dialogo modifiche non salvate e pop-up di verifica.

Non introdurre una nuova libreria di stato se il repository possiede già una soluzione adeguata. Le bozze devono essere indicizzate per `companyId + sectionKey`, così due sezioni affiancate restano indipendenti.

---

## 18. Accessibilità e interazione da tastiera

- tutti i controlli iconici devono avere `aria-label` e tooltip;
- occhio aperto: `Nascondi {nome campo} all’azienda`;
- occhio barrato: `Mostra {nome campo} all’azienda`;
- indicatore rosso: `Da verificare: {nome campo}`;
- non usare il colore come unico segnale;
- ordine di tabulazione coerente con l’ordine visivo;
- focus visibile;
- `Escape` chiude pop-up e dialoghi secondo le regole definite;
- all’apertura di un dialogo spostare il focus sul titolo o sulla prima azione;
- alla chiusura restituire il focus al controllo originario;
- bloccare lo scroll sottostante quando è attivo un overlay globale;
- associare gli errori agli input con `aria-describedby`;
- annunciare salvataggio, successo ed errore con una live region non invasiva;
- rispettare il contrasto WCAG AA usando i token del design system.

---

## 19. Gestione errori e feedback

- nessun aggiornamento ottimistico irreversibile;
- visibility toggle: ottimistico con rollback visibile;
- review decision: preferibilmente pessimistica, con pulsanti disabilitati fino al successo;
- salvataggio sezione: mantenere la bozza in caso di errore;
- errori di rete generici non devono sostituire messaggi di validazione campo;
- `401/403`: seguire il flusso globale di autenticazione/autorizzazione;
- `409`: mostrare conflitto, ricaricare snapshot e non sovrascrivere silenziosamente;
- retry locale per caricamento sezione;
- evitare toast duplicati se il componente mostra già l’errore inline.

---

## 20. Criteri di accettazione

### AC-01 — Panoramica

- La pagina apre S01 senza sezioni attive.
- Panoramica non ha `×`.
- KPI, modifiche recenti, Informazioni societarie, Sedi, Contatti e Dati CCIAA sono presenti.

### AC-02 — Pannello temporaneo

- `Visualizza dettagli` apre la sezione sul 50% destro.
- La Panoramica è visibile, attenuata e non interattiva.
- `Affianca`, `Apri in scheda` e `×` funzionano.

### AC-03 — Modifica nel pannello

- `Modifica dati` mantiene il pannello al 50%.
- Nessun campo è obbligatorio.
- Un valore non vuoto invalido blocca il salvataggio e mostra errore locale.
- I valori vuoti non bloccano il salvataggio.

### AC-04 — Scheda intera

- `Apri in scheda` porta la stessa sezione e la stessa bozza a tutta larghezza.
- Una bozza non salvata mostra il pallino arancione.
- `Affianca` non perde la bozza.

### AC-05 — Affiancamento

- S04A mostra Panoramica riadattata e sezione 50/50 senza overlay.
- Aprire una nuova sezione da S04A produce S04B.
- Due pannelli mantengono stato e azioni indipendenti.
- `A tutta larghezza` conserva l’altro pannello come scheda.

### AC-06 — Modifiche non salvate

- Qualunque uscita distruttiva da una bozza sporca mostra S05.
- Le tre azioni hanno gli effetti definiti.
- Nessun cambio di layout non distruttivo apre S05.
- Un errore durante `Salva ed esci` impedisce l’uscita.

### AC-07 — Caricamento ed errore

- Skeleton ed errore interessano solo la sezione coinvolta.
- Panoramica o pannello fratello restano utilizzabili.
- `Riprova` non ricarica l’intera pagina.

### AC-08 — Modulo non compilato

- Aprendo una sezione senza dati appare il modulo predefinito vuoto.
- Non appare uno stato vuoto generico.
- Nessun campo vuoto mostra indicatore di verifica.

### AC-09 — Invarianti di verifica

- Ogni campo compilato restituito al Consulente mostra una sola icona.
- Ogni campo vuoto non mostra icone.
- L’Azienda non vede icone o dati interni di verifica.
- Modificare un valore verificato lo porta a `PENDING_VERIFICATION`.
- Svuotare il campo rimuove lo stato.

### AC-10 — Pop-up di verifica

- Il click sul `!` apre il pop-up ancorato al campo.
- Lo sfondo è attenuato e bloccato.
- `Verifica` produce spunta verde e aggiorna i conteggi.
- `Richiedi revisione` produce icona arancione, conserva la nota e aggiorna i conteggi.
- `×` non modifica nulla.

### AC-11 — Visibilità

- Solo il Consulente vede l’occhio su ogni etichetta di campo.
- Un campo nascosto resta visibile e attenuato al Consulente.
- Lo stesso campo è assente nella risposta e nella UI Azienda.
- Il layout Azienda si ricompone.
- Toggle visibilità non altera valore, verifica, KPI, completezza o dirty state.

### AC-12 — Sicurezza e concorrenza

- Le API rifiutano visibility/review da ruolo Azienda.
- I campi nascosti non sono esposti all’Azienda.
- Una decisione su un valore obsoleto produce conflitto, non sovrascrittura.

### AC-13 — Accessibilità

- Tutti i controlli sono raggiungibili da tastiera.
- Dialoghi e pop-up gestiscono focus e `Escape`.
- Icone e stati hanno nomi accessibili e non dipendono solo dal colore.

---

## 21. Piano di test minimo

### Unit test

- `isEmpty` su `null`, stringa vuota, spazi, `0`, `false`, array;
- transizioni di `verificationStatus`;
- calcolo KPI;
- dirty comparison normalizzata;
- filtro dei campi per ruolo;
- mapping degli stati in icone/etichette.

### Component test

- `FieldRow` per Azienda e Consulente;
- `VisibilityToggle` con successo e rollback;
- `VerificationIndicator` per i tre stati;
- `ReviewPopover` e mutation error;
- `UnsavedChangesDialog` con le tre azioni;
- loading/error locali;
- pannelli indipendenti in split view.

### End-to-end

1. S01 → S02A → S02B → S03 → S04A.
2. S04A → apertura seconda sezione → S04B.
3. Modifica e chiusura → tutte le diramazioni S05.
4. Caricamento e retry locale.
5. Azienda modifica valore → Consulente vede rosso → verifica verde.
6. Consulente richiede revisione → Azienda corregge → ritorno al rosso.
7. Consulente nasconde campo → Azienda non lo riceve né vede → Consulente lo riattiva.
8. Conflitto fra modifica e verifica contemporanee.

### Visual regression

Creare baseline desktop per S01–S10 alla viewport di riferimento del progetto. Verificare soprattutto:

- proporzione 50/50;
- overlay;
- posizione dei pop-up;
- griglie della Panoramica ridotta;
- barre azioni;
- icone e campi oscurati;
- assenza di layout shift negli skeleton.

---

## 22. Sequenza consigliata di implementazione

1. **Ricognizione repository:** stack, design system, router, form library, fetch/cache, autorizzazioni, schema e test.
2. **Modello dominio:** ruoli, sezione, field metadata, review status, visibility e versioni.
3. **Shell:** Panoramica, tabs e workspace modes.
4. **SectionPanel riusabile:** view/edit, griglie, action bar e dirty state.
5. **Transizioni:** drawer, full, split e persistenza bozze.
6. **Unsaved guard:** S05 in tutti i punti di uscita.
7. **Stati tecnici:** loading, error, retry e modulo vuoto strutturato.
8. **Review workflow:** indicatori, KPI, pop-up, audit e permessi.
9. **Visibility workflow:** filtri server, toggle, reflow e audit.
10. **Accessibilità, test e visual regression.**

Preferire commit o PR verticali e verificabili. Non implementare tutti gli stati come markup duplicato: costruire primitive riusabili e alimentate dal modello dati.

---

## 23. Definition of Done

L’attività è conclusa quando:

- S01–S10 sono riproducibili tramite dati/stati controllati;
- tutti i criteri AC-01–AC-13 passano;
- nessun asterisco o vincolo `required` non autorizzato è presente;
- campi nascosti e permessi sono protetti lato server;
- dirty state e dialogo di uscita funzionano in ogni modalità;
- bozze sopravvivono ai cambi di layout non distruttivi;
- loading ed errori rimangono locali;
- KPI e conteggi sono matematicamente coerenti;
- migrazioni e rollback sono documentati;
- test unitari, component e principali E2E passano;
- lint, typecheck e build del repository passano;
- le differenze visuali rispetto ai mockup sono intenzionali e documentate;
- non è stato introdotto lavoro responsive fuori ambito.

---

## 24. Prompt operativo da incollare in Claude Code

```text
Devi implementare la pagina desktop “Anagrafica Aziendale” della Webbapp.

FONTI:
- Leggi integralmente SPECIFICA_FUNZIONALE_ANAGRAFICA_AZIENDALE_PER_CLAUDE_CODE.md.
- Usa i mockup S01–S10 in docs/mockups/anagrafica-aziendale/ come riferimento visuale.
- In caso di conflitto prevale la specifica scritta.

VINCOLI PRINCIPALI:
- Nessun campo è obbligatorio.
- Responsive tablet/mobile escluso.
- Panoramica permanente.
- Pannello temporaneo destro 50%, scheda intera e split view 50/50 condividono la stessa bozza.
- Modifiche non salvate protette in ogni modalità.
- Loading ed errori locali alla sezione.
- Campi vuoti senza stato di verifica; ogni campo compilato con esattamente uno stato.
- Stati e controlli di verifica visibili solo al Consulente.
- Il Consulente può nascondere singoli campi; l’Azienda non deve riceverli né vederli.
- Visibilità, verifica e completezza sono domini separati.

METODO DI LAVORO:
1. Leggi AGENTS.md e le istruzioni del repository.
2. Ispeziona stack, design system, router, modelli, API, migrazioni, autorizzazioni e test esistenti.
3. Cerca prima di creare: riusa componenti e convenzioni correnti.
4. Confronta lo schema esistente con la sezione 16 della specifica. Non mappare colonne semanticamente dubbie e non duplicare entità già presenti.
5. Presenta un piano breve con file da modificare, modello dati, API, rischi e strategia di test.
6. Implementa per tranche verticali nell’ordine della sezione 22.
7. Dopo ogni tranche esegui i test pertinenti.
8. Aggiungi unit test, component test, E2E e visual regression secondo la sezione 21.
9. Esegui lint, typecheck, test e build finali.
10. Consegna un riepilogo con file modificati, migrazioni, test eseguiti, risultati e ogni scostamento intenzionale dai mockup.

NON FARE:
- non creare una seconda app o un prototipo isolato se esiste già l’applicazione;
- non sostituire il design system;
- non duplicare markup per drawer/full/split;
- non nascondere dati sensibili solo via CSS;
- non calcolare “Completa” da campi required;
- non scartare bozze durante cambi di layout;
- non inventare responsive, campi obbligatori o nuovi flussi non descritti;
- non sovrascrivere silenziosamente conflitti di versione.

Se manca una regola puramente tecnica, scegli la soluzione più coerente con il repository e documentala. Fermati a chiedere solo quando una scelta cambierebbe dati, autorizzazioni o comportamento di prodotto.
```

---

## 25. Decisioni tecniche lasciate intenzionalmente allo stack esistente

Queste scelte non richiedono una nuova decisione di prodotto:

- framework e librerie;
- nomi effettivi di componenti, route ed endpoint;
- soluzione di state management;
- meccanismo form/validation;
- sistema di toast;
- libreria popover/floating positioning;
- strumenti di test;
- token esatti di colore, spaziatura e tipografia;
- strategia ETag/versione equivalente;
- struttura precisa delle migrazioni, purché rispetti le invarianti.

Claude Code deve aderire alle convenzioni già presenti e documentare qualsiasi adattamento.

