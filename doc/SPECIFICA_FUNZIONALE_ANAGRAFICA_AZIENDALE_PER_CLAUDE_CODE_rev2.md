# Webbapp — Anagrafica Aziendale

## Master Implementation Blueprint per Claude Code

**Stato:** approvato per implementazione desktop  
**Versione:** 2.0  
**Data:** 14 agosto 2026  
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

---

# PARTE II — BLUEPRINT ESECUTIVO VINCOLANTE

Le sezioni seguenti trasformano la specifica funzionale in un modello esecutivo. Non sono suggerimenti generici: definiscono i comportamenti, i dati e i confini che l’implementazione deve rispettare. Se il repository usa nomi, cartelle o linguaggi diversi, Claude Code deve tradurre la struttura tecnica mantenendo invariati contratti, transazioni, autorizzazioni e risultati visivi.

## 26. Convergenza normativa dei mockup

I mockup sono stati creati in momenti successivi. Non devono essere copiati isolatamente: ciascuno stabilisce una parte diversa del risultato finale.

| Riferimento | È normativo per | Non è normativo per |
|---|---|---|
| S01 | architettura e densità della Panoramica a tutta larghezza | indicatori e visibilità di dettaglio |
| S02A/S02B | pannello temporaneo, overlay, consultazione/modifica | asterischi e vecchio catalogo campi |
| S03 | scheda interna a tutta larghezza, tab e dirty dot | asterischi e vecchio catalogo campi |
| S04A/S04B | affiancamento, adattamento Panoramica e due pannelli | catalogo campi dei primi mockup |
| S05 | dialogo modifiche non salvate | contenuto sottostante |
| S06 | caricamento locale | dati specifici dello skeleton |
| S07 | errore locale | stato funzionale della sezione |
| S08 | catalogo finale campi e tre stati di verifica | eventuali numeri KPI incoerenti |
| S09 | pop-up ancorato e oscuramento globale | modifica diretta del valore |
| S10 | occhi, campi oscurati e legenda finale | occhi sui titoli di gruppo, da non implementare |

### 26.1 Regola di fusione

La schermata finale non è la copia letterale di un solo mockup. Deve essere ottenuta così:

```text
contenuto finale = catalogo campi S10
stati verifica = S08
popup verifica = S09
visibilità = S10
layout corrente = S01, S02, S03 o S04 in base alla modalità
stati tecnici = S05, S06 o S07 quando attivi
```

Pertanto, in S02–S04 Claude Code deve usare il catalogo campi finale della sezione 28, anche se le immagini più vecchie mostrano etichette differenti.

---

## 27. Architettura di riferimento obbligatoria

### 27.1 Strati

L’implementazione deve avere quattro strati separati:

1. **Database PostgreSQL:** valori di dominio, stato sezione, metadati campo, audit.
2. **Backend application service:** autorizzazione, transazioni, validazione, versioni e DTO filtrati per ruolo.
3. **Frontend feature layer:** query/mutation, workspace state, draft state e componenti.
4. **Presentation layer:** layout S01–S10, design token, accessibilità e feedback.

La UI non deve accedere direttamente al database. I conteggi non devono essere ricostruiti in più componenti. Le autorizzazioni non devono vivere solo nel client.

### 27.2 Moduli logici

Se il repository non possiede già una struttura equivalente, usare questa:

```text
src/
  features/company-registry/
    domain/
      registry.types.ts
      registry.catalog.ts
      registry.validation.ts
      registry.transitions.ts
    api/
      registry.api.ts
      registry.queries.ts
      registry.mutations.ts
    state/
      registry-workspace.reducer.ts
      registry-drafts.store.ts
      registry-selectors.ts
    components/
      RegistryPage
      RegistryTabs
      OverviewDashboard
      RegistryWorkspace
      TemporarySectionDrawer
      SplitWorkspace
      SectionPanel
      SectionView
      SectionForm
      FieldDisplay
      FieldEditor
      FieldVisibilityToggle
      VerificationBadge
      ReviewPopover
      UnsavedChangesDialog
      LocalSectionSkeleton
      LocalSectionError
    styles/
      registry.tokens.css
      registry.layout.css
server/
  company-registry/
    registry.controller
    registry.service
    registry.repository
    registry.authorization
    registry.mapper
    registry.audit
db/
  migrations/
tests/
  unit/company-registry/
  component/company-registry/
  e2e/company-registry/
  visual/company-registry/
docs/mockups/anagrafica-aziendale/
```

Se il progetto separa frontend e backend, replicare gli stessi confini nei rispettivi package. Non è obbligatorio mantenere i nomi dei file; è obbligatorio mantenere le responsabilità separate.

### 27.3 Dipendenze

- usare il design system esistente;
- usare la libreria form già presente;
- usare la soluzione query/cache già presente;
- usare il router già presente;
- per il pop-up usare il sistema popover/floating già presente oppure Floating UI/Popper equivalente;
- non introdurre dipendenze solo per replicare una funzione già disponibile;
- non creare un microservizio separato per questa pagina.

---

## 28. Catalogo finale dei dati di “Informazioni societarie”

Questo catalogo è autorevole per tutte le modalità S02–S10.

### 28.1 Definizione dei gruppi e campi

| Ordine | Gruppo | `fieldKey` | Etichetta | Tipo UI | Colonna canonica | Validazione se valorizzato |
|---:|---|---|---|---|---|---|
| 1 | Identificazione camerale | `businessName` | Ragione sociale | text | `ragione_sociale` | trim, max 255 |
| 2 | Identificazione camerale | `legalForm` | Forma giuridica | select/text | `forma_giuridica` | trim, max 150 |
| 3 | Identificazione camerale | `taxCode` | Codice fiscale | text uppercase | `codice_fiscale` | 11 cifre oppure 16 caratteri alfanumerici italiani |
| 4 | Identificazione camerale | `vatNumber` | Partita IVA | text numeric | `partita_iva` | esattamente 11 cifre |
| 5 | Iscrizione al Registro Imprese | `reaNumber` | Numero REA | text uppercase | `numero_rea` | trim, max 30 |
| 6 | Iscrizione al Registro Imprese | `registrationNumber` | Numero iscrizione | text | `numero_iscrizione` | trim, max 50 |
| 7 | Iscrizione al Registro Imprese | `reaProvince` | Provincia REA | text uppercase/select | `provincia_rea` | sigla 2 caratteri; mantenere max 5 per compatibilità |
| 8 | Iscrizione al Registro Imprese | `registrationDate` | Data iscrizione | date | `data_iscrizione` | data ISO valida, non futura salvo regola esistente |
| 9 | Iscrizione al Registro Imprese | `registeredOffice` | Sede legale | address/text | `sede_legale_testo` o relazione sede esistente | trim, max 500 |
| 10 | Iscrizione al Registro Imprese | `companyStatus` | Stato impresa | select | `stato_attivita` | valore del catalogo esistente |
| 11 | Date | `incorporationDate` | Data costituzione | date | `data_atto_costitutivo` | data ISO valida |
| 12 | Date | `fiscalYearEnd` | Termine esercizio | day/month | `termine_esercizio` | formato `GG/MM` |
| 13 | Date | `fiscalYearStart` | Inizio esercizio | day/month | `inizio_esercizio` | formato `GG/MM` |
| 14 | Date | `lastApprovedFinancialStatementDate` | Data ultimo bilancio approvato | date | `data_ultimo_bilancio_approvato` | data ISO valida |

### 28.2 Campi precedenti non mostrati nel catalogo finale

Le colonne esistenti `camera_commercio_competente`, `ufficio_registro_imprese`, `data_inizio_attivita` e `data_ultimo_protocollo` non devono essere eliminate. Rimangono dati di dominio disponibili per future viste, ma non fanno parte della prima implementazione grafica finale di questa sottosezione, salvo che il repository dimostri che il mockup finale le rappresenta con un alias già approvato.

### 28.3 Catalogo in codice

Creare una definizione ordinata e unica, usata da mapper, validazione e UI:

```ts
export const COMPANY_INFORMATION_CATALOG = [
  {
    key: 'chamberIdentification',
    title: 'Identificazione camerale',
    fields: [
      { key: 'businessName', label: 'Ragione sociale', type: 'text' },
      { key: 'legalForm', label: 'Forma giuridica', type: 'legal-form' },
      { key: 'taxCode', label: 'Codice fiscale', type: 'tax-code' },
      { key: 'vatNumber', label: 'Partita IVA', type: 'vat-number' }
    ]
  },
  {
    key: 'businessRegister',
    title: 'Iscrizione al Registro Imprese',
    fields: [
      { key: 'reaNumber', label: 'Numero REA', type: 'text' },
      { key: 'registrationNumber', label: 'Numero iscrizione', type: 'text' },
      { key: 'reaProvince', label: 'Provincia REA', type: 'province' },
      { key: 'registrationDate', label: 'Data iscrizione', type: 'date' },
      { key: 'registeredOffice', label: 'Sede legale', type: 'address' },
      { key: 'companyStatus', label: 'Stato impresa', type: 'company-status' }
    ]
  },
  {
    key: 'dates',
    title: 'Date',
    fields: [
      { key: 'incorporationDate', label: 'Data costituzione', type: 'date' },
      { key: 'fiscalYearEnd', label: 'Termine esercizio', type: 'day-month' },
      { key: 'fiscalYearStart', label: 'Inizio esercizio', type: 'day-month' },
      {
        key: 'lastApprovedFinancialStatementDate',
        label: 'Data ultimo bilancio approvato',
        type: 'date'
      }
    ]
  }
] as const;
```

Il catalogo non contiene proprietà `required`.

---

## 29. Schema PostgreSQL completo di riferimento

La migrazione deve essere adattata a naming, ownership, RLS e schema namespace del repository, ma deve produrre capacità equivalenti.

### 29.1 Estensione della tabella di dominio

```sql
ALTER TABLE ana_identificazione_camerale
  ADD COLUMN IF NOT EXISTS numero_iscrizione VARCHAR(50),
  ADD COLUMN IF NOT EXISTS data_iscrizione DATE,
  ADD COLUMN IF NOT EXISTS sede_legale_testo VARCHAR(500),
  ADD COLUMN IF NOT EXISTS termine_esercizio CHAR(5),
  ADD COLUMN IF NOT EXISTS inizio_esercizio CHAR(5),
  ADD COLUMN IF NOT EXISTS data_ultimo_bilancio_approvato DATE,
  ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 1;

ALTER TABLE ana_identificazione_camerale
  ADD CONSTRAINT ck_ana_termine_esercizio
  CHECK (
    termine_esercizio IS NULL OR
    termine_esercizio ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
  );

ALTER TABLE ana_identificazione_camerale
  ADD CONSTRAINT ck_ana_inizio_esercizio
  CHECK (
    inizio_esercizio IS NULL OR
    inizio_esercizio ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])$'
  );
```

Prima di aggiungere `sede_legale_testo`, cercare un’entità sede/indirizzo già autorevole. Se esiste, il DTO `registeredOffice` deve essere costruito dalla relazione esistente e la colonna testuale non deve essere creata.

### 29.2 Stato della sezione

```sql
DO $$ BEGIN
  CREATE TYPE ana_completion_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ana_section_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  completion_status ana_completion_status NOT NULL DEFAULT 'NOT_STARTED',
  lock_version BIGINT NOT NULL DEFAULT 1,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (azienda_id, section_key)
);

CREATE INDEX IF NOT EXISTS ix_ana_section_state_company
  ON ana_section_state (azienda_id);
```

### 29.3 Stato trasversale del campo

```sql
DO $$ BEGIN
  CREATE TYPE ana_verification_status AS ENUM (
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REVISION_REQUIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ana_field_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  visible_to_company BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status ana_verification_status,
  revision_note TEXT,
  value_version BIGINT NOT NULL DEFAULT 0,
  state_version BIGINT NOT NULL DEFAULT 1,
  reviewed_value_version BIGINT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (azienda_id, section_key, field_key),
  CONSTRAINT ck_ana_field_review_version
    CHECK (
      reviewed_value_version IS NULL OR
      reviewed_value_version <= value_version
    )
);

CREATE INDEX IF NOT EXISTS ix_ana_field_state_company_section
  ON ana_field_state (azienda_id, section_key);

CREATE INDEX IF NOT EXISTS ix_ana_field_state_review
  ON ana_field_state (azienda_id, verification_status)
  WHERE verification_status IS NOT NULL;
```

### 29.4 Audit eventi

```sql
DO $$ BEGIN
  CREATE TYPE ana_field_event_type AS ENUM (
    'VALUE_CHANGED',
    'VALUE_CLEARED',
    'MARKED_PENDING',
    'VERIFIED',
    'REVISION_REQUESTED',
    'VISIBILITY_HIDDEN',
    'VISIBILITY_SHOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ana_field_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES sys_aziende(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  event_type ana_field_event_type NOT NULL,
  actor_id UUID NOT NULL,
  actor_role VARCHAR(30) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  note TEXT,
  value_version BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_ana_field_event_timeline
  ON ana_field_event (azienda_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_ana_field_event_field
  ON ana_field_event (azienda_id, section_key, field_key, created_at DESC);
```

Applicare le policy del prodotto ai valori sensibili nell’audit. Se non è consentito conservare il valore precedente, salvare un fingerprint o un diff minimizzato.

### 29.5 Trigger `updated_at`

Riutilizzare il trigger condiviso del repository. Se non esiste:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applicarlo alle tre tabelle mutabili. Non creare duplicati se esiste già una funzione equivalente.

### 29.6 Backfill

La migrazione dati deve:

1. creare `ana_section_state` per ogni azienda con riga in `ana_identificazione_camerale`;
2. creare uno stato campo per ciascun `fieldKey` valorizzato;
3. assegnare `PENDING_VERIFICATION` ai valori non vuoti senza storia;
4. lasciare `verification_status = NULL` sui valori vuoti;
5. assegnare `visible_to_company = TRUE` per default;
6. inizializzare `value_version = 1` sui valori compilati e `0` sui vuoti;
7. non creare eventi audit fittizi oppure marcarli esplicitamente come migrazione, secondo convenzione.

---

## 30. Contratti backend eseguibili

Le firme TypeScript sono un contratto semantico. In un backend non TypeScript vanno riprodotte con tipi equivalenti.

### 30.1 Contesto autorizzativo

```ts
interface ActorContext {
  userId: string;
  role: 'COMPANY' | 'CONSULTANT';
  companyIds: string[];
  tenantId?: string;
}

async function assertRegistryReadAccess(
  actor: ActorContext,
  companyId: string
): Promise<void>;

async function assertRegistryWriteAccess(
  actor: ActorContext,
  companyId: string
): Promise<void>;

function assertConsultant(actor: ActorContext): void;
```

`companyIds` non deve essere considerato attendibile se arriva dal client: il backend deve ricavarlo dalla sessione/autorizzazione.

### 30.2 DTO canonici

```ts
interface RegistryOverviewDto {
  companyId: string;
  completion: {
    completedSections: number;
    totalSections: number;
    percentage: number;
  };
  quality?: {
    verified: number;
    pending: number;
    revisionRequired: number;
    filledFields: number;
    percentage: number;
  };
  recentChanges: RecentChangeDto[];
  groups: OverviewGroupDto[];
  version: number;
}

interface RegistryFieldDto {
  key: string;
  label: string;
  type: string;
  value: unknown;
  displayValue: string;
  visibleToCompany?: boolean;
  verificationStatus?: VerificationStatus | null;
  revisionNote?: string | null;
  valueVersion: number;
  stateVersion?: number;
  updatedAt?: string;
  updatedBy?: { id: string; displayName: string };
}

interface RegistrySectionDto {
  key: string;
  title: string;
  completionStatus: CompletionStatus;
  groups: Array<{
    key: string;
    title: string;
    fields: RegistryFieldDto[];
  }>;
  lockVersion: number;
}
```

Nel DTO Azienda omettere `visibleToCompany`, `verificationStatus`, `revisionNote` e `stateVersion` se non necessari. Non inviarli con valore `null` soltanto per poi nasconderli.

### 30.3 Servizio: lettura Panoramica

```ts
async function getRegistryOverview(
  actor: ActorContext,
  companyId: string
): Promise<RegistryOverviewDto>;
```

Algoritmo:

1. autorizzare l’attore;
2. caricare stati delle 14 sezioni previste dal catalogo generale;
3. contare `COMPLETE` senza derivarlo da campi obbligatori;
4. se Consulente, aggregare `ana_field_state` per i soli valori attualmente compilati;
5. caricare gli ultimi eventi consentiti;
6. costruire card e CTA da stato sezione;
7. restituire una versione aggregata stabile;
8. non esporre metadati riservati all’Azienda.

### 30.4 Servizio: lettura sezione

```ts
async function getRegistrySection(
  actor: ActorContext,
  companyId: string,
  sectionKey: 'companyInformation'
): Promise<RegistrySectionDto>;
```

Algoritmo:

1. autorizzare;
2. caricare la riga di dominio e `lock_version`;
3. caricare in una sola query tutti gli `ana_field_state` della sezione;
4. iterare `COMPANY_INFORMATION_CATALOG` per garantire ordine e presenza dei campi vuoti;
5. normalizzare e formattare i valori;
6. per Consulente, aggiungere visibilità e verifica;
7. per Azienda, eliminare i campi nascosti prima della serializzazione;
8. restituire tutti i gruppi, anche se completamente vuoti;
9. non dedurre stato `COMPLETE` nel mapper.

### 30.5 Servizio: salvataggio sezione

```ts
interface SaveRegistrySectionInput {
  companyId: string;
  sectionKey: 'companyInformation';
  expectedLockVersion: number;
  fields: Partial<Record<CompanyInformationFieldKey, unknown>>;
}

async function saveRegistrySection(
  actor: ActorContext,
  input: SaveRegistrySectionInput
): Promise<RegistrySectionDto>;
```

Transazione obbligatoria:

1. autorizzare scrittura;
2. aprire transazione;
3. selezionare la riga di dominio `FOR UPDATE`;
4. confrontare `expectedLockVersion`; se diverso, `409 SECTION_VERSION_CONFLICT`;
5. rifiutare `fieldKey` non presenti nel catalogo;
6. normalizzare ogni valore (`trim`, uppercase, date ISO, vuoto → `NULL`);
7. validare solo valori non vuoti;
8. calcolare i campi realmente cambiati dopo normalizzazione;
9. aggiornare la riga di dominio una sola volta;
10. per ogni campo cambiato, fare upsert di `ana_field_state`:
    - incrementare `value_version`;
    - se vuoto: stato `NULL`, nota `NULL`, dati review `NULL`;
    - se non vuoto: `PENDING_VERIFICATION`, nota precedente rimossa, dati review rimossi;
11. inserire eventi audit nella stessa transazione;
12. incrementare `lock_version` una sola volta;
13. aggiornare lo stato sezione solo tramite regola server esistente;
14. commit;
15. rileggere e restituire il DTO canonico filtrato per ruolo;
16. invalidare cache Panoramica e sezione.

Se nessun valore cambia, non incrementare versioni e restituire lo snapshot attuale.

### 30.6 Servizio: visibilità

```ts
interface SetFieldVisibilityInput {
  companyId: string;
  sectionKey: 'companyInformation';
  fieldKey: CompanyInformationFieldKey;
  visibleToCompany: boolean;
  expectedStateVersion: number;
}

async function setRegistryFieldVisibility(
  actor: ActorContext,
  input: SetFieldVisibilityInput
): Promise<{ field: RegistryFieldDto; overview: RegistryOverviewDto }>;
```

Transazione:

1. `assertConsultant` e autorizzazione azienda;
2. verificare `fieldKey` nel catalogo;
3. lock/upsert dello stato campo;
4. confrontare `expectedStateVersion`, altrimenti `409 FIELD_STATE_CONFLICT`;
5. aggiornare soltanto `visible_to_company`, `state_version`, `updated_by`;
6. non cambiare `value_version`, verifica, nota o completezza;
7. scrivere evento `VISIBILITY_HIDDEN` o `VISIBILITY_SHOWN`;
8. commit e restituzione stato canonico.

### 30.7 Servizio: decisione di verifica

```ts
interface ReviewRegistryFieldInput {
  companyId: string;
  sectionKey: 'companyInformation';
  fieldKey: CompanyInformationFieldKey;
  decision: 'VERIFIED' | 'REVISION_REQUIRED';
  note?: string | null;
  expectedValueVersion: number;
  expectedStateVersion: number;
}

async function reviewRegistryField(
  actor: ActorContext,
  input: ReviewRegistryFieldInput
): Promise<{
  field: RegistryFieldDto;
  quality: RegistryOverviewDto['quality'];
}>;
```

Transazione:

1. autorizzare Consulente;
2. lock di valore e stato campo;
3. verificare che il valore non sia vuoto;
4. confrontare entrambe le versioni;
5. se il valore è cambiato, `409 FIELD_VALUE_CHANGED`;
6. applicare decisione;
7. salvare nota normalizzata, max 2000 caratteri;
8. impostare `reviewed_value_version = value_version`;
9. impostare `reviewed_by` e `reviewed_at`;
10. incrementare `state_version`;
11. scrivere audit;
12. calcolare i conteggi qualità nella stessa transazione o da query coerente;
13. commit;
14. restituire campo e KPI aggiornati.

### 30.8 Errori API canonici

| HTTP | Codice | Uso UI |
|---:|---|---|
| 400 | `INVALID_FIELD_VALUE` | errore vicino al campo |
| 401 | `UNAUTHENTICATED` | flusso globale login |
| 403 | `REGISTRY_FORBIDDEN` | pagina/azione non consentita |
| 404 | `COMPANY_NOT_FOUND` | stato pagina |
| 404 | `SECTION_NOT_FOUND` | errore locale sezione |
| 409 | `SECTION_VERSION_CONFLICT` | mantenere bozza e offrire ricarica/confronto |
| 409 | `FIELD_STATE_CONFLICT` | rollback toggle e ricarica metadati |
| 409 | `FIELD_VALUE_CHANGED` | tenere pop-up aperto e mostrare nuovo valore |
| 422 | `VALIDATION_FAILED` | mappa errori campi |
| 500/503 | `REGISTRY_UNAVAILABLE` | errore locale e Riprova |

Formato:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Alcuni valori non sono validi.",
    "fields": {
      "vatNumber": "Inserisci una Partita IVA di 11 cifre."
    },
    "requestId": "..."
  }
}
```

---

## 31. Contratto HTTP completo

| Metodo | Endpoint | Ruolo | Scopo |
|---|---|---|---|
| GET | `/api/companies/:companyId/registry/overview` | entrambi | S01/S04A |
| GET | `/api/companies/:companyId/registry/sections/company-information` | entrambi | S02–S04, S06–S10 |
| PATCH | `/api/companies/:companyId/registry/sections/company-information` | entrambi | salvataggio modulo |
| PATCH | `/api/companies/:companyId/registry/sections/company-information/fields/:fieldKey/visibility` | Consulente | S10 |
| POST | `/api/companies/:companyId/registry/sections/company-information/fields/:fieldKey/review` | Consulente | S09 |
| GET | `/api/companies/:companyId/registry/changes?cursor=...` | secondo policy | cronologia |

### 31.1 Cache e invalidazione

- chiave overview: `registry-overview:{companyId}:{role}`;
- chiave sezione: `registry-section:{companyId}:companyInformation:{role}`;
- un salvataggio invalida entrambe le chiavi;
- visibility invalida almeno la sezione Azienda e Consulente; non modifica KPI;
- review invalida sezione Consulente e overview Consulente;
- non condividere cache serializzate fra ruoli;
- non usare come chiave il solo `companyId`.

### 31.2 Idempotenza

- PATCH sezione con stessi valori è no-op;
- visibility con stesso boolean è no-op;
- review ripetuta con stessa decisione e stessa versione può essere no-op sicuro oppure restituire conflitto secondo convenzione; non deve creare eventi duplicati;
- impedire doppi invii in UI.

---

## 32. Stato frontend completo

### 32.1 Workspace state

```ts
interface OpenSectionTab {
  sectionKey: string;
  title: string;
  dirty: boolean;
  lastFocusedAt: number;
}

interface RegistryWorkspaceState {
  mode: 'OVERVIEW' | 'TEMPORARY_DRAWER' | 'FULL_SECTION' | 'SPLIT_VIEW';
  openTabs: OpenSectionTab[];
  activeTab: 'overview' | string;
  drawerSectionKey: string | null;
  split: {
    left: 'overview' | string;
    right: string;
  } | null;
  pendingDestructiveAction: PendingDestructiveAction | null;
  reviewTarget: { sectionKey: string; fieldKey: string } | null;
}
```

### 32.2 Draft state per sezione

```ts
interface SectionDraftState {
  initialValues: Record<string, unknown>;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: boolean;
  saveStatus: 'IDLE' | 'SAVING' | 'ERROR';
  lockVersion: number;
  lastSaveError: string | null;
}

type DraftStore = Record<string, SectionDraftState>;
```

Chiave raccomandata: `${companyId}:${sectionKey}`.

### 32.3 Eventi reducer

```ts
type WorkspaceEvent =
  | { type: 'OPEN_TEMPORARY'; sectionKey: string }
  | { type: 'ENTER_EDIT'; sectionKey: string }
  | { type: 'OPEN_FULL'; sectionKey: string }
  | { type: 'PIN_SPLIT'; sectionKey: string }
  | { type: 'OPEN_SECOND_IN_SPLIT'; sectionKey: string }
  | { type: 'EXPAND_PANEL'; sectionKey: string }
  | { type: 'REQUEST_CLOSE'; sectionKey: string }
  | { type: 'CONFIRM_DISCARD' }
  | { type: 'CONFIRM_SAVE_AND_EXIT' }
  | { type: 'CANCEL_DESTRUCTIVE_ACTION' }
  | { type: 'OPEN_REVIEW'; sectionKey: string; fieldKey: string }
  | { type: 'CLOSE_REVIEW' }
  | { type: 'SELECT_TAB'; tabKey: string };
```

### 32.4 Matrice di transizione

| Stato corrente | Evento | Stato risultante |
|---|---|---|
| S01 | `OPEN_TEMPORARY(A)` | S02A con A nel drawer |
| S02A | `ENTER_EDIT(A)` | S02B, stesso drawer |
| S02A/S02B | `OPEN_FULL(A)` | S03, bozza conservata |
| S02A/S02B | `PIN_SPLIT(A)` | S04A, overview sinistra/A destra |
| S03 | `PIN_SPLIT(A)` | S04A |
| S04A | `OPEN_SECOND_IN_SPLIT(B)` | S04B, A sinistra/B destra |
| S04B | `EXPAND_PANEL(A)` | S03 A, B resta tab |
| qualunque sezione pulita | `REQUEST_CLOSE(A)` | chiusura immediata |
| qualunque sezione sporca | `REQUEST_CLOSE(A)` | S05 con callback pendente |
| qualunque | `OPEN_REVIEW(field)` | S09 sopra lo stato corrente |

La callback dell’azione distruttiva deve essere rappresentata come dato serializzabile o closure controllata, non duplicata nei componenti.

---

## 33. Design system e misure desktop normative

I valori seguenti sono il fallback quando il design system non possiede token equivalenti. Se esistono token aziendali, usarli mantenendo contrasto e gerarchia.

### 33.1 Token

```css
:root {
  --registry-bg: #f8faff;
  --registry-surface: #ffffff;
  --registry-ink: #10195f;
  --registry-text: #172267;
  --registry-muted: #6372a4;
  --registry-border: #e1e7f0;
  --registry-primary: #0b4df5;
  --registry-primary-hover: #083dcc;
  --registry-primary-soft: #eef3ff;
  --registry-success: #009b72;
  --registry-success-soft: #e8f7f2;
  --registry-danger: #d71920;
  --registry-danger-soft: #fdeced;
  --registry-warning: #f36b00;
  --registry-warning-soft: #fff0e5;
  --registry-hidden-bg: #f0f1f4;
  --registry-overlay-local: rgba(20, 36, 91, 0.42);
  --registry-overlay-global: rgba(18, 31, 83, 0.58);
  --registry-radius-sm: 8px;
  --registry-radius-md: 12px;
  --registry-radius-lg: 16px;
  --registry-shadow-popover: 0 18px 48px rgba(13, 27, 79, 0.22);
  --registry-space-1: 4px;
  --registry-space-2: 8px;
  --registry-space-3: 12px;
  --registry-space-4: 16px;
  --registry-space-5: 20px;
  --registry-space-6: 24px;
  --registry-space-8: 32px;
  --registry-tabbar-height: 50px;
  --registry-actionbar-height: 72px;
}
```

### 33.2 Tipografia

- usare il font sans-serif del prodotto; fallback `Inter, system-ui, sans-serif`;
- titolo pagina: 24 px, 700, line-height 32 px;
- titolo sezione: 20 px, 700, line-height 28 px;
- titolo gruppo: 16 px, 700, line-height 24 px;
- label campo: 12–13 px, 600, line-height 18 px;
- valore: 14 px, 600, line-height 20 px;
- testo secondario: 12–13 px, 400–500;
- pulsante: 14 px, 600.

### 33.3 Contenitori

- tab bar alta 50 px, bordo inferiore 1 px, sfondo bianco;
- contenuto pagina con padding 24 px;
- card con bordo 1 px, raggio 12 px, sfondo bianco;
- gap standard fra card 16 px;
- divider di gruppo 1 px `--registry-border`;
- altezza minima controllo 40 px;
- focus ring 2 px primary con offset 2 px;
- nessuna ombra pesante sulle card; ombra solo su dialoghi/pop-up.

### 33.4 Regole di ridimensionamento desktop

- breakpoint di questa fase: `min-width: 1024px`;
- sotto 1024 px non è richiesta una riprogettazione, ma non provocare eccezioni JavaScript;
- drawer e split usano il 50% esatto della superficie sotto la tab bar;
- ogni pannello ha `min-width: 0` per evitare overflow della grid;
- i contenuti lunghi vanno troncati con tooltip o mandati a capo secondo tipo;
- le action bar restano sticky in fondo al pannello, non al viewport globale quando esistono due pannelli.

---

## 34. Blueprint S01 — Panoramica base

### 34.1 Scopo e precondizioni

Stato iniziale dopo accesso alla pagina. Nessuna sezione di dettaglio è visibile. `activeTab = overview`, `mode = OVERVIEW`.

### 34.2 Chiamate backend

All’ingresso eseguire:

```ts
getRegistryOverview(actor, companyId)
```

Non caricare automaticamente tutti i dettagli delle sezioni. Il payload Panoramica deve contenere soltanto KPI, riepiloghi, stati e ultime modifiche necessari a S01.

### 34.3 Albero componenti

```text
RegistryPage
├── RegistryTabs(active=overview)
└── OverviewDashboard(variant=full)
    ├── OverviewHeader
    ├── OverviewKpiGrid
    │   ├── CompletionCard
    │   ├── DataQualityCard [solo Consulente]
    │   └── RecentChangesCard
    ├── CompanyInformationAccordion(expanded=true)
    │   └── SectionSummaryGrid(4 colonne)
    ├── CollapsibleSummaryRow(Sedi)
    ├── CollapsibleSummaryRow(Contatti)
    └── NavigationSummaryRow(Dati CCIAA)
```

### 34.4 Geometria

- header pagina su una riga: icona 48 × 48, testo a destra;
- KPI grid a tre colonne uguali per il Consulente;
- se il KPI qualità è omesso per Azienda, usare due colonne, senza card vuota;
- altezza card KPI coerente, circa 190–200 px alla viewport di riferimento;
- `Informazioni societarie` occupa tutta la larghezza;
- quattro sottosezioni in quattro colonne alla vista piena;
- righe `Sedi`, `Contatti`, `Dati CCIAA` alte almeno 48 px;
- nessuna sidebar aggiuntiva.

### 34.5 Contenuto

`CompletionCard`:

- donut percentuale;
- testo `{completedSections} di {totalSections}`;
- CTA `Visualizza dettagli`.

`DataQualityCard`, solo Consulente:

- donut qualità;
- tre righe conteggio con le stesse icone di S08;
- CTA `Visualizza verifiche`.

`RecentChangesCard`:

- massimo tre eventi recenti;
- descrizione, tempo relativo, autore;
- CTA `Vedi cronologia`.

### 34.6 Interazioni

- click `Visualizza dettagli` su una sottosezione → S02A;
- click `Compila sezione` → S02B o S02A con CTA di compilazione, secondo convenzione form esistente; il modulo visualizzato deve essere quello predefinito;
- espandi/comprimi accordion senza chiamate di dettaglio non necessarie;
- click Dati CCIAA usa il routing definito dalla piattaforma.

### 34.7 Stati e errori

- loading iniziale pagina: skeleton della Panoramica, non S06;
- errore overview: stato pagina con retry, perché non è disponibile alcun contesto principale;
- errore di una card secondaria non deve necessariamente bloccare l’intera pagina se l’API è già segmentata.

### 34.8 Accessibilità

- donut con testo equivalente (`29% — 4 sezioni completate su 14`);
- accordion con `aria-expanded` e `aria-controls`;
- card non cliccabile interamente se contiene più azioni; CTA esplicite;
- tempi relativi con `datetime` o testo completo accessibile.

### 34.9 Test S01

- snapshot Consulente e Azienda;
- qualità assente per Azienda senza buco layout;
- quattro CTA aprono la corretta sezione;
- accordion conserva stato finché la pagina resta montata;
- 4/14 produce 29% con arrotondamento definito.

---

## 35. Blueprint S02A — Pannello temporaneo in consultazione

### 35.1 Trigger

Da S01, click su `Visualizza dettagli` della sottosezione `Identificazione camerale` o sul riepilogo Informazioni societarie.

### 35.2 Sequenza dati

1. dispatch `OPEN_TEMPORARY('companyInformation')`;
2. aprire immediatamente shell e skeleton S06 nel lato destro;
3. eseguire `getRegistrySection`;
4. sostituire skeleton con `SectionView` o S07;
5. aggiungere/riattivare tab `Informazioni societarie`.

### 35.3 DOM e layering

```text
RegistryWorkspace
├── OverviewDashboard(aria-hidden=true, inert=true)
├── TemporaryBackdrop
└── TemporarySectionDrawer(role=dialog, aria-modal=true)
    └── SectionPanel(mode=view)
```

L’overlay copre la superficie Panoramica sotto la tab bar. Il drawer è sopra l’overlay. La tab bar resta visibile, ma i controlli che cambierebbero contesto devono rispettare il focus/modal behavior.

### 35.4 Geometria

- drawer ancorato a destra, top 50 px, bottom 0;
- larghezza 50% della superficie;
- bordo sinistro 1 px;
- header interno sticky;
- body scrollabile;
- action bar sticky in basso;
- nessun margine esterno che riduca il 50%;
- overlay sinistro con tinta blu-grigia, senza blur obbligatorio.

### 35.5 Header

- icona sezione;
- titolo `Informazioni societarie`;
- pill `Completa`, `Da completare` o stato server equivalente;
- azioni `Affianca`, `Apri in scheda`, `×`;
- `×` con label `Chiudi Informazioni societarie`.

### 35.6 Corpo

Renderizzare i tre gruppi e 14 campi della sezione 28. In consultazione:

- griglia a due colonne all’interno del pannello;
- gruppi separati da divider;
- valore vuoto `—`;
- indicatori e occhi secondo ruolo;
- action bar `Modifica dati` e stato `Dati verificati` quando applicabile.

### 35.7 Transizioni

- `Modifica dati` → S02B senza cambiare dimensione;
- `Affianca` → S04A;
- `Apri in scheda` → S03 in modalità corrente;
- `×` pulita → S01 e rimozione tab se non mantenuta da altra vista;
- `×` sporca, se il drawer contiene una bozza → S05.

### 35.8 Test S02A

- drawer esattamente metà superficie;
- Panoramica attenuata e non cliccabile;
- focus entra nel drawer e torna alla CTA originaria alla chiusura;
- dati vuoti mostrano trattino;
- ruolo Azienda non riceve campi nascosti né controlli Consulente;
- tutte le transizioni conservano dati caricati.

---

## 36. Blueprint S02B — Pannello temporaneo in modifica

### 36.1 Ingresso

Da S02A con `Modifica dati`, oppure da `Compila sezione` se il prodotto entra direttamente in edit.

### 36.2 Creazione bozza

Alla prima entrata in edit:

```ts
draft.initialValues = normalize(section.fields);
draft.values = structuredClone(draft.initialValues);
draft.lockVersion = section.lockVersion;
draft.dirty = false;
```

Se esiste già una bozza per la sezione, riutilizzarla senza sovrascrivere.

### 36.3 Layout form

- stessi gruppi e ordine della consultazione;
- due colonne nel pannello quando lo spazio lo consente;
- label sempre visibile sopra l’input;
- nessun asterisco;
- input altezza 40 px; textarea indirizzo se il design system lo prevede;
- error message sotto input, senza spostare campi non correlati più del necessario;
- action bar con `Annulla` e `Salva modifiche`;
- riepilogo `Modifica i campi evidenziati` sopra action bar quando esistono errori.

### 36.4 Validazione client

Usare la stessa funzione di normalizzazione/validazione del contratto backend:

```ts
validateField(fieldKey, value): string | null
```

- vuoto → valido;
- Partita IVA non vuota e diversa da 11 cifre → errore;
- Codice fiscale non vuoto e non conforme → errore;
- date non valide → errore;
- GG/MM impossibile → errore;
- trim prima del confronto dirty, non necessariamente a ogni battuta.

### 36.5 Salvataggio

1. bloccare doppio invio;
2. validare tutti i valori non vuoti;
3. inviare soltanto i campi cambiati più `expectedLockVersion`;
4. mostrare stato `SAVING` nel pulsante;
5. su successo sostituire snapshot e bozza col DTO canonico;
6. impostare `dirty = false` e rimuovere pallino tab;
7. aggiornare/invalidate overview;
8. restare nella modalità corrente salvo azione `Salva ed esci`.

### 36.6 Annullamento e uscita

- `Annulla` con bozza pulita torna a view;
- `Annulla` con bozza sporca apre S05 usando l’azione originaria `EXIT_EDIT`;
- cambio a S03/S04 conserva bozza e non apre S05;
- close/navigazione distruttiva apre S05.

### 36.7 Conflitto

Su `409 SECTION_VERSION_CONFLICT`:

- non scartare la bozza;
- mostrare banner locale `I dati sono stati aggiornati da un altro utente`;
- offrire `Ricarica dati` e, se supportato, `Confronta modifiche`;
- non fare auto-merge silenzioso di campi toccati da entrambi.

### 36.8 Test S02B

- salvataggio con tutti i campi vuoti è permesso;
- valore invalido blocca solo il salvataggio;
- dirty torna false ripristinando il valore originale;
- bozza sopravvive a S03 e S04;
- successo resetta versione e indicatori coerentemente;
- errore rete mantiene valori digitati.

---

## 37. Blueprint S03 — Scheda a tutta larghezza

### 37.1 Ingresso

Da S02 tramite `Apri in scheda`, da S04 tramite `A tutta larghezza` oppure click su una tab non attiva.

### 37.2 Stato

```ts
mode = 'FULL_SECTION';
activeTab = 'companyInformation';
drawerSectionKey = null;
split = null;
```

Non resettare query cache, draft o scroll logico della sezione.

### 37.3 Tab bar

- Panoramica sempre prima;
- Informazioni societarie attiva;
- `×` a destra del titolo;
- pallino arancione se `draft.dirty`;
- click `×` segue S05 se sporca;
- click Panoramica non deve scartare la bozza: la sezione resta tab aperta. Se il componente viene smontato ma la bozza resta nello store, non serve S05.

### 37.4 Geometria

- superficie sotto tab bar a piena larghezza;
- padding 24–32 px;
- header sezione su una riga;
- body max-width non inferiore a 1100 px alla viewport di riferimento, oppure fluido;
- gruppi separati e campi su due colonne;
- action bar sticky al fondo della superficie;
- `Affianca` nell’header.

### 37.5 Comportamento view/edit

Riutilizzare esattamente `SectionView` e `SectionForm` di S02; cambia solo il contenitore. Nessuna logica dati duplicata. In full width, input e righe possono avere larghezza maggiore, ma ordine, label, errori e azioni restano identici.

### 37.6 Test S03

- stessa bozza prima e dopo ingresso;
- nessuna seconda fetch se cache fresca;
- full width mantiene 14 campi e tre gruppi;
- dirty dot appare e scompare correttamente;
- click Panoramica conserva tab e bozza;
- chiusura sporca apre S05.

---

## 38. Blueprint S04A — Panoramica + sezione affiancate

### 38.1 Ingresso

Da S02 o S03 con `Affianca`.

```ts
mode = 'SPLIT_VIEW';
split = { left: 'overview', right: 'companyInformation' };
```

### 38.2 Layout

```css
.registry-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  height: calc(100dvh - var(--registry-tabbar-height));
}
```

- divider verticale 1 px;
- ciascun pannello scrolla indipendentemente;
- nessun overlay;
- Panoramica non è un’immagine ritagliata: usa `variant="compact"`.

### 38.3 Panoramica compact

- padding 24 px;
- KPI `Completamento` e `Qualità` in due colonne;
- `Ultime modifiche` a tutta larghezza sotto i KPI;
- quattro sottosezioni in griglia 2 × 2;
- Sedi, Contatti e Dati CCIAA a tutta larghezza;
- testi lunghi ridotti con line clamp solo se necessario;
- tutte le CTA restano disponibili.

### 38.4 Sezione destra

- stesso `SectionPanel` di S02 senza semantic dialog;
- header con `A tutta larghezza` e `×`;
- action bar locale;
- consultazione/modifica indipendente dalla Panoramica.

### 38.5 Apertura nuova sezione

Se dalla Panoramica compact si apre `Sedi operative`:

1. preservare Informazioni societarie;
2. aggiungere tab Sedi operative;
3. trasformare split in `{ left: 'companyInformation', right: 'operatingOffices' }`;
4. caricare la nuova sezione con skeleton locale nel pannello destro;
5. produrre S04B.

### 38.6 Test S04A

- 50/50 reale a diverse larghezze desktop;
- scroll indipendente;
- overview compact 2+1 e griglia 2×2;
- nessun overlay o `aria-modal`;
- bozza nel pannello destro integra;
- nuova sezione produce S04B senza chiudere la precedente.

---

## 39. Blueprint S04B — Due sezioni affiancate

### 39.1 Stato di riferimento

- sinistra: Informazioni societarie in consultazione;
- destra: Sedi operative in modifica;
- entrambe presenti nella tab bar;
- dirty dot solo sulla sezione realmente sporca.

### 39.2 Regole generiche

Il componente deve supportare qualunque coppia di sezioni, non codificare Informazioni societarie/Sedi come caso speciale.

```ts
split = { left: leftSectionKey, right: rightSectionKey };
```

Per ciascun pannello:

- query, loading ed error indipendenti;
- draft e versioni indipendenti;
- action bar indipendente;
- `A tutta larghezza` indipendente;
- `×` indipendente;
- focus e scroll indipendenti.

### 39.3 Apertura di una terza sezione

Poiché sono visibili al massimo due pannelli:

- la nuova sezione sostituisce il pannello che ha originato l’azione o il pannello meno recentemente attivo;
- una sezione sporca che verrebbe smontata richiede S05;
- una sezione pulita resta comunque disponibile come tab se già aperta;
- non creare un terzo pannello né restringere sotto il 50%.

Se il prodotto possiede già una regola di focus per il workspace, essa prevale purché non perda bozze.

### 39.4 Espansione e chiusura

- `A tutta larghezza` su sinistra → S03 della sinistra; destra resta tab;
- `A tutta larghezza` su destra → S03 della destra; sinistra resta tab;
- close pulita → pannello residuo diventa full width;
- close sporca → S05 locale a quella sezione;
- nessuna azione su un pannello deve cambiare `dirty` dell’altro.

### 39.5 Test S04B

- due query possono risolversi in ordine inverso senza mescolare dati;
- salvataggio destro non rerenderizza distruttivamente sinistro;
- error destro non blocca sinistro;
- close/expand rispettano tabs;
- terza sezione non elimina una bozza senza conferma.

---

## 40. Blueprint S05 — Dialogo modifiche non salvate

### 40.1 Modello azione pendente

```ts
type PendingDestructiveAction =
  | { kind: 'CLOSE_SECTION'; sectionKey: string }
  | { kind: 'EXIT_EDIT'; sectionKey: string }
  | { kind: 'REPLACE_SPLIT_PANEL'; sectionKey: string; nextSectionKey: string }
  | { kind: 'LEAVE_REGISTRY'; sectionKey: string; destination: string };
```

All’apertura salvare l’intenzione, non eseguirla. Le tre azioni del dialogo operano sulla stessa intenzione.

### 40.2 DOM

```text
ModalPortal
├── GlobalBackdrop
└── AlertDialog
    ├── WarningIcon
    ├── Title
    ├── Description
    ├── CloseButton
    └── Actions
        ├── ContinueEditing
        ├── ExitWithoutSaving
        └── SaveAndExit
```

### 40.3 Geometria e stile

- centered fixed;
- larghezza 540 px, max-width `calc(100vw - 48px)`;
- padding 24 px;
- radius 12–16 px;
- overlay globale `--registry-overlay-global`;
- titolo e testo allineati a sinistra;
- azioni in fondo, su una riga alla viewport desktop;
- `Continua a modificare` neutra;
- `Esci senza salvare` danger/outline;
- `Salva ed esci` primary.

### 40.4 Copy esatta

- Titolo: `Modifiche non salvate`
- Corpo: `Hai modifiche non salvate. Se esci ora, i dati inseriti andranno persi.`
- Pulsanti: `Continua a modificare`, `Esci senza salvare`, `Salva ed esci`.

### 40.5 Comportamento

`Continua a modificare`/`×`/`Escape`:

- chiudono modal;
- cancellano `pendingDestructiveAction`;
- ripristinano focus al trigger;
- non toccano la bozza.

`Esci senza salvare`:

- reset bozza allo snapshot;
- imposta dirty false;
- esegue l’azione pendente;
- chiude modal.

`Salva ed esci`:

- disabilita tutte le azioni;
- chiama `saveRegistrySection`;
- su successo esegue azione pendente;
- su errore resta aperto, mostra errore e riabilita;
- su validation error chiude modal e focalizza il primo campo invalido nella sezione.

### 40.6 Browser unload

Registrare `beforeunload` solo mentre esiste almeno una bozza sporca. Rimuovere listener quando tutte sono pulite. Non promettere copy personalizzata nel dialogo nativo.

### 40.7 Test S05

- ogni `PendingDestructiveAction` su tutti e tre gli esiti;
- focus trap e Escape;
- save failure non naviga;
- discard rimuove dirty dot;
- listener beforeunload registrato una sola volta.

---

## 41. Blueprint S06 — Caricamento locale

### 41.1 Quando usarlo

- prima apertura di una sezione;
- refetch senza dati precedenti;
- apertura seconda sezione in split.

Se esistono dati cache validi durante un refetch, mantenerli visibili con un indicatore discreto; non sostituirli obbligatoriamente con skeleton.

### 41.2 Struttura

Il `SectionPanel` renderizza sempre header e contenitore. Solo il body diventa skeleton.

```text
SectionPanel
├── SectionHeader (reale)
├── LoadingAnnouncement: “Caricamento dati…”
├── SkeletonGroup × 3
│   └── SkeletonField × numero campi del gruppo
└── DisabledActionBar
```

### 41.3 Geometria

- skeleton segue la griglia reale a due colonne;
- blocchi label 30–40% della colonna;
- blocchi value/input 65–90%;
- tre gruppi con divider negli stessi punti;
- altezza totale simile alla vista caricata;
- nessun full-page spinner.

### 41.4 Comportamento

- `aria-busy=true` sul pannello;
- live region `Caricamento dati…` una sola volta;
- azioni interne disabilitate;
- `×` e `A tutta larghezza` possono restare disponibili se non causano perdita dati;
- Panoramica/pannello fratello restano attivi;
- cancellare richieste obsolete quando cambia company/section;
- evitare che una risposta vecchia sovrascriva quella nuova.

### 41.5 Test S06

- layout shift entro soglia visuale accettabile;
- overview cliccabile in S04A, non in drawer temporaneo per via dell’overlay, ma non a causa del loading;
- risposta obsoleta ignorata;
- skeleton non espone testo casuale o indicatori di verifica.

---

## 42. Blueprint S07 — Errore locale

### 42.1 Trigger

Errore nel caricamento della singola sezione dopo apertura o retry.

### 42.2 Struttura

```text
SectionPanel
├── SectionHeader (reale)
├── LocalErrorState(role=status)
│   ├── ErrorIcon
│   ├── “Impossibile caricare i dati”
│   ├── “Si è verificato un problema. Riprova tra qualche istante.”
│   └── RetryButton
└── Disabled/hidden content actions
```

### 42.3 Geometria

- errore centrato nel body del pannello;
- nessun overlay;
- larghezza messaggio 320–420 px;
- `Riprova` sotto il testo;
- header e dimensione pannello invariati.

### 42.4 Retry

```ts
async function retrySection(sectionKey: string) {
  if (query.isFetching) return;
  await query.refetch({ cancelRefetch: true });
}
```

- durante retry sostituire pulsante con stato loading o disabilitarlo;
- non duplicare richieste;
- non ricaricare overview;
- non cambiare stato funzionale della sezione;
- registrare request ID per diagnostica, non mostrarlo salvo pannello tecnico.

### 42.5 Test S07

- errore destro in split non blocca sinistro;
- retry successo mostra contenuto;
- retry ripetuto non duplica chiamate;
- chiusura e full-width restano coerenti;
- screen reader riceve il messaggio senza loop.

---

## 43. Blueprint S08 — Stati di verifica del Consulente

### 43.1 Precondizioni

- ruolo `CONSULTANT`;
- sezione caricata con i 14 campi finali;
- metadati `verificationStatus` presenti per tutti i valori non vuoti.

### 43.2 Posizionamento indicatori

- occhio, se presente, è accanto alla label;
- indicatore di verifica è immediatamente dopo il valore;
- gap 8 px;
- icona 18–20 px;
- non allineare l’indicatore alla label perché rappresenta il valore;
- valore vuoto `—` senza indicatore.

### 43.3 Componente

```ts
interface VerificationBadgeProps {
  fieldKey: string;
  label: string;
  status: VerificationStatus;
  interactive: boolean;
  onOpenReview?: () => void;
}
```

Mapping:

```ts
const verificationPresentation = {
  PENDING_VERIFICATION: {
    icon: 'exclamation',
    color: 'danger',
    label: 'Da verificare'
  },
  VERIFIED: {
    icon: 'check',
    color: 'success',
    label: 'Verificata'
  },
  REVISION_REQUIRED: {
    icon: 'rotate',
    color: 'warning',
    label: 'Da revisionare'
  }
};
```

Solo `PENDING_VERIFICATION` deve essere necessariamente interattivo in questa fase. Verde e arancione espongono tooltip e stato; non inventare un menu non approvato.

### 43.4 Legenda

In fondo al body, prima dell’action bar:

```text
! Da verificare    ✓ Verificata    ↻ Da revisionare
```

- stessa iconografia dei campi;
- ordine rosso, verde, arancione;
- visibile solo al Consulente;
- non sticky separatamente.

### 43.5 KPI e consistenza

La query deve contare solo campi effettivamente valorizzati nel dominio. Non fidarsi di righe `ana_field_state` orfane.

```sql
-- pseudocodice: il repository deve costruire filled_fields dal catalogo/valori
verified + pending + revision_required = filled_fields
```

Se l’invariante fallisce:

- il backend deve correggere i record legacy o marcare i campi compilati senza stato come pending;
- il frontend non deve mostrare un campo compilato senza icona;
- inviare telemetria tecnica.

### 43.6 Visibilità per ruolo

Nel mapper Azienda gli indicatori non devono essere solo `display:none`: le proprietà di review vengono omesse. La card Qualità può essere omessa o sostituita secondo il layout S01; non esporre conteggi interni senza autorizzazione.

### 43.7 Test S08

- matrice 14 campi × vuoto/tre stati;
- esattamente una icona per valore compilato;
- nessuna icona su trattino;
- conteggi e percentuale coerenti;
- campi nascosti inclusi nei KPI Consulente;
- nessun metadato review nel DTO Azienda.

---

## 44. Blueprint S09 — Pop-up orientato di verifica

### 44.1 Trigger e target

Click o `Enter/Space` sul `!` rosso di Partita IVA o di qualunque altro campo pending.

```ts
reviewTarget = { sectionKey, fieldKey };
```

Il pop-up legge il valore dallo snapshot server canonico, non dalla bozza non salvata. Se la sezione è in edit e il campo ha una modifica locale non salvata, disabilitare l’apertura o mostrare `Salva prima le modifiche per verificare questo valore`.

### 44.2 Layering

```text
ReviewOverlayPortal
├── GlobalBackdrop(inert background)
└── AnchoredReviewPopover(role=dialog)
```

- overlay copre tab bar, overview e pannello;
- pop-up ancorato all’elemento trigger tramite riferimento DOM;
- z-index overlay sotto pop-up ma sopra tutta l’app;
- bloccare scroll globale e interazione sottostante.

### 44.3 Posizionamento

- placement preferito `bottom-start` o `bottom-end` in base al campo;
- offset trigger 12 px;
- middleware `flip`, `shift` e `arrow`;
- padding viewport 16 px;
- larghezza 324 px; max 360 px;
- altezza determinata dal contenuto;
- freccia 12 × 12 orientata al centro dell’icona, non al centro della riga;
- il mockup Partita IVA usa una posizione sotto l’indicatore, leggermente spostata a sinistra per restare nel pannello.

### 44.4 Contenuto e stile

- titolo 16–18 px bold `Verifica Partita IVA`;
- `×` in alto a destra;
- label `Valore attuale` muted;
- valore `12345678901` in evidenza;
- label `Nota facoltativa`;
- textarea min-height 78 px, max 2000 caratteri;
- footer due colonne uguali;
- `Richiedi revisione` outline;
- `Verifica` primary;
- surface bianca, radius 12 px, shadow popover.

### 44.5 Mutation

`Verifica`:

```ts
reviewRegistryField({
  decision: 'VERIFIED',
  note: normalizeOptionalNote(note),
  expectedValueVersion,
  expectedStateVersion
});
```

`Richiedi revisione` usa `REVISION_REQUIRED`.

Su successo:

1. aggiornare cache campo;
2. aggiornare KPI dalla risposta server;
3. chiudere pop-up;
4. spostare focus sull’indicatore nuovo o sul contenitore campo;
5. annunciare `Partita IVA verificata` o `Revisione richiesta per Partita IVA`.

Su errore:

- mantenere nota e pop-up;
- mostrare messaggio inline;
- su `FIELD_VALUE_CHANGED`, aggiornare valore corrente e richiedere nuova decisione;
- non applicare icona ottimistica prima della risposta.

### 44.6 Chiusura

- `×` ed `Escape` chiudono senza mutation;
- click overlay chiude se la convenzione modale del prodotto lo consente; altrimenti non fa nulla, ma deve essere coerente con gli altri dialoghi;
- la nota non inviata viene scartata senza S05.

### 44.7 Test S09

- ancoraggio corretto per campi ai quattro bordi;
- flip/shift evita clipping;
- overlay blocca sottostante;
- entrambe le decisioni aggiornano icona e KPI;
- conflitto valore mantiene pop-up;
- focus restoration e Escape;
- apertura impedita su valore modificato non salvato.

---

## 45. Blueprint S10 — Controllo di visibilità dei campi

### 45.1 Posizionamento

Per Consulente, il controllo è accanto alla label, non al valore:

```text
[Label del campo] [occhio]
[Valore] [indicatore verifica]
```

- icona 16–18 px;
- hit area minima 32 × 32 px;
- nessun occhio sui titoli dei gruppi;
- tooltip e `aria-label` dinamici.

### 45.2 Stato visibile

- sfondo normale;
- occhio aperto blu;
- tooltip `Nascondi {label} all’azienda`;
- click avvia mutation a `false`.

### 45.3 Stato nascosto, vista Consulente

- contenitore del solo campo con `--registry-hidden-bg`;
- radius 8 px e padding interno 12 px;
- occhio barrato blu-grigio;
- label e valore restano leggibili, con contrasto sufficiente;
- indicatore di verifica resta visibile;
- tooltip `Mostra {label} all’azienda`;
- non disabilitare Modifica dati per quel campo;
- mostrare nota globale `I campi oscurati non sono visibili all’azienda`.

### 45.4 Mutation UI

```ts
async function toggleVisibility(field: RegistryFieldDto) {
  const previous = field.visibleToCompany;
  optimisticallySet(!previous);
  try {
    const result = await setRegistryFieldVisibility({
      fieldKey: field.key,
      visibleToCompany: !previous,
      expectedStateVersion: field.stateVersion
    });
    commit(result.field);
  } catch (error) {
    rollback(previous);
    announce('Impossibile aggiornare la visibilità del campo.');
  }
}
```

- disabilitare solo l’occhio in mutation;
- non bloccare l’intera sezione;
- deduplicare click rapidi;
- non modificare draft o dirty dot;
- su conflitto ricaricare lo stato campo.

### 45.5 Vista Azienda

Il filtro deve avvenire nel backend prima del DTO. Nel frontend Azienda:

- iterare solo campi ricevuti;
- non renderizzare placeholder per field key mancanti;
- grid auto-flow ricompone gli spazi;
- se un gruppo non contiene più campi visibili, omettere il gruppo intero;
- non mostrare legenda visibilità;
- non mostrare occhi;
- non mostrare stato review.

### 45.6 Esempi S10

- `taxCode` nascosto: Consulente vede card attenuata e occhio barrato; Azienda non riceve il campo.
- `lastApprovedFinancialStatementDate` nascosto: stesso comportamento pur essendo valorizzato e pending; stato e KPI restano invariati.

### 45.7 Test S10

- toggle entrambi i versi;
- rollback rete;
- autorizzazione 403 Azienda;
- verifica risposta DTO Azienda priva del campo;
- valore/stato/audit invariati salvo visibilità;
- reflow con primo, secondo o entrambi i campi di una riga nascosti;
- gruppo interamente nascosto omesso;
- nessun occhio sui titoli gruppo.

---

## 46. Specifica delle primitive riusabili

### 46.1 `SectionPanel`

Props minime:

```ts
interface SectionPanelProps {
  sectionKey: string;
  surface: 'drawer' | 'full' | 'split';
  mode: 'view' | 'edit';
  onClose(): void;
  onExpand?(): void;
  onPin?(): void;
}
```

Responsabilità:

- orchestration query/draft;
- header/action bar;
- switch loading/error/view/edit;
- non contiene logica specifica Partita IVA o visibilità.

### 46.2 `FieldDisplay`

```ts
interface FieldDisplayProps {
  field: RegistryFieldDto;
  role: UserRole;
  onToggleVisibility?: () => void;
  onReview?: () => void;
}
```

Ordine DOM: label → visibility control → value → verification. Lo stato nascosto applica classe al wrapper del campo.

### 46.3 `FieldEditor`

Deve ricevere definizione catalogo, valore, errore e callback. Non deve conoscere API. La form orchestra save e validation.

### 46.4 `RegistryTabs`

- derive dirty dot dallo store;
- Panoramica non closeable;
- `REQUEST_CLOSE`, mai rimuovere direttamente tab sporca;
- supporto overflow orizzontale usando il componente design system esistente;
- tastiera frecce se usa pattern ARIA tabs.

### 46.5 `ReviewPopover`

- portal;
- position engine;
- focus trap;
- snapshot field version;
- mutation pessimistica;
- nessuna dipendenza dal pannello sottostante.

### 46.6 `UnsavedChangesDialog`

- singleton a livello pagina;
- legge `pendingDestructiveAction` dallo store;
- non duplicato in ogni pannello;
- impedisce due dialoghi simultanei.

---

## 47. Sicurezza applicativa

1. Tutti gli endpoint richiedono sessione valida.
2. Verificare associazione attore–azienda a ogni richiesta.
3. `fieldKey` e `sectionKey` provengono da allowlist, non diventano nomi colonna arbitrari.
4. Le query di update usano mapping statico field key → colonna.
5. Non interpolare field key direttamente in SQL.
6. Solo Consulente può review/visibility.
7. Il serializer Azienda filtra server-side.
8. Le note vanno escape/renderizzate come testo, mai HTML.
9. Limitare nota a 2000 caratteri.
10. Applicare rate limit/coalescing alle mutation se previsto dall’app.
11. Audit append-only per utenti normali.
12. Non includere valori completi in log di errore.
13. Usare transazioni per valore + field state + audit.
14. Non accettare ruolo o company ID autorevoli dal body.

---

## 48. Performance e consistenza

- overview in una richiesta aggregata;
- dettaglio caricato on-demand;
- evitare N+1 sui 14 field state;
- una query metadati per sezione;
- cache separata per ruolo;
- memoizzare field rows solo se necessario, senza complicare prematuremente;
- debounce non necessario per form normale perché il salvataggio è esplicito;
- cancellare richieste obsolete;
- mantenere previous data durante mode switch;
- transizioni layout non devono causare refetch obbligatorio;
- invalidare selettivamente dopo mutation;
- usare `valueVersion/stateVersion` per evitare lost update;
- KPI restituiti dal server dopo review, non ricalcolati solo ottimisticamente.

---

## 49. Telemetria funzionale

Se il progetto possiede analytics, emettere eventi senza valori sensibili:

| Evento | Proprietà consentite |
|---|---|
| `registry_overview_viewed` | role, company pseudonymous id |
| `registry_section_opened` | sectionKey, surface, role |
| `registry_edit_started` | sectionKey, surface |
| `registry_save_succeeded` | sectionKey, changedFieldCount |
| `registry_save_failed` | sectionKey, errorCode |
| `registry_unsaved_dialog_opened` | actionKind, sectionKey |
| `registry_review_completed` | fieldKey, decision |
| `registry_visibility_changed` | fieldKey, visible |
| `registry_section_retry` | sectionKey |

Non inviare valori dei campi, note, codice fiscale o Partita IVA.

---

## 50. Piano di implementazione in milestone vincolanti

### Milestone 0 — Ricognizione

Output obbligatorio di Claude Code prima di scrivere codice:

- stack e versioni;
- posizione pagina esistente;
- componenti design system riusabili;
- schema DB e migrazioni rilevanti;
- modello auth/ruoli;
- API/query layer;
- form e validation;
- test harness;
- mappa file da modificare;
- gap rispetto al blueprint.

### Milestone 1 — Database e dominio

- migrazione colonne mancanti;
- section state, field state, audit;
- backfill;
- repository e mapping field key → colonna;
- unit test transizioni.

Gate: migrazione up/down o rollback verificato; invarianti review passano.

### Milestone 2 — API e autorizzazioni

- overview;
- section read role-filtered;
- save transazionale;
- visibility;
- review;
- errors/version conflicts;
- integration test API.

Gate: Azienda non può ottenere campo nascosto né usare endpoint Consulente.

### Milestone 3 — Shell S01–S04

- tabs;
- overview full/compact;
- drawer;
- full;
- split;
- draft store;
- visual baseline.

Gate: passaggio fra modalità non perde dati.

### Milestone 4 — Form e S05–S07

- edit/validation;
- dirty;
- unsaved dialog;
- loading local;
- error local;
- structured empty form.

Gate: tutte le uscite distruttive coperte e save failure sicuro.

### Milestone 5 — S08–S10

- indicatori/KPI;
- pop-up review;
- occhi e visibilità;
- ruolo Azienda;
- audit;
- concorrenza.

Gate: invarianti campo e autorizzazioni complete.

### Milestone 6 — Qualità finale

- accessibility audit;
- unit/component/E2E;
- visual regression S01–S10;
- lint/typecheck/build;
- documentazione migrazioni e API;
- elenco scostamenti intenzionali.

---

## 51. Checklist di confronto visuale per mockup

| Schermata | Punti da confrontare pixel/visivamente |
|---|---|
| S01 | tab bar, header, 3 KPI, 4 card sottosezione, 3 righe inferiori |
| S02A | metà esatta, overlay solo background, header/CTA, footer |
| S02B | griglia input, errori inline, action bar, nessun required |
| S03 | full width, tabs, dirty dot, Affianca, footer sticky |
| S04A | divider, 50/50, overview 2+1, griglia 2×2 |
| S04B | due header e due footer indipendenti, dirty locale |
| S05 | overlay globale, modal centrata, 3 azioni |
| S06 | header reale, skeleton locale, nessun layout shift |
| S07 | errore centrato nel pannello, Riprova, resto attivo |
| S08 | icone dopo valore, legenda, tutti i compilati con stato |
| S09 | pop-up orientato al `!`, freccia, overlay, 2 azioni |
| S10 | occhio su label, 2 campi attenuati, nota, reflow Azienda |

La visual regression non deve congelare testi dinamici, date relative o ID. Usare fixture deterministiche.

---

## 52. Fixture canonica per test e Storybook

```ts
export const companyInformationFixture = {
  businessName: value('Prova Srl', 'VERIFIED'),
  legalForm: empty(),
  taxCode: empty({ visibleToCompany: false }),
  vatNumber: value('12345678901', 'PENDING_VERIFICATION'),
  reaNumber: value('1234567', 'PENDING_VERIFICATION'),
  registrationNumber: value('123456/2010', 'VERIFIED'),
  reaProvince: value('RM', 'REVISION_REQUIRED'),
  registrationDate: value('2010-03-15', 'VERIFIED'),
  registeredOffice: value('Via Roma, 10, 00100 Roma RM, Italia', 'VERIFIED'),
  companyStatus: value('Attiva', 'VERIFIED'),
  incorporationDate: value('2010-03-10', 'REVISION_REQUIRED'),
  fiscalYearEnd: value('31/12', 'VERIFIED'),
  fiscalYearStart: value('01/01', 'VERIFIED'),
  lastApprovedFinancialStatementDate: value(
    '2024-06-30',
    'PENDING_VERIFICATION',
    { visibleToCompany: false }
  )
};
```

La fixture S10 produce:

- due campi vuoti, entrambi senza indicatore;
- un campo vuoto nascosto (`taxCode`);
- un campo compilato nascosto e pending (`lastApprovedFinancialStatementDate`);
- tutti i valori compilati con esattamente uno stato;
- esempi di rosso, verde e arancione.

Per S08, rendere `taxCode` visibile ma vuoto e mantenere invariati gli altri stati. Per S09 usare `vatNumber` come target.

---

## 53. Prompt definitivo per Claude Code — versione vincolante

```text
OBIETTIVO
Implementa integralmente il modulo desktop “Anagrafica Aziendale” seguendo il Master Implementation Blueprint v2.0 e i mockup S01–S10. Il risultato deve essere funzionante end-to-end: database, backend, autorizzazioni, API, stato frontend, componenti, stile, accessibilità e test.

FONTE DI VERITÀ
1. SPECIFICA_FUNZIONALE_ANAGRAFICA_AZIENDALE_PER_CLAUDE_CODE.md, inclusa tutta la PARTE II.
2. Mockup rinominati S01–S10.
3. Convenzioni del repository, solo dove il blueprint lascia una decisione tecnica.

CONVERGENZA MOCKUP
- S01 definisce la Panoramica.
- S02–S04 definiscono contenitori e transizioni, non il vecchio catalogo campi.
- S05–S07 definiscono gli stati trasversali.
- S08–S10 definiscono catalogo finale, verifica, popup e visibilità.
- Nessun campo è required.
- Nessun occhio sui titoli di gruppo.

PRIMA DI MODIFICARE
1. Leggi AGENTS.md e tutte le istruzioni repository.
2. Ispeziona frontend, backend, database, auth, design system e test.
3. Cerca ogni tabella/colonna correlata, inclusa ana_identificazione_camerale e le entità sede.
4. Produci un report di ricognizione e una mappa blueprint → file reali.
5. Evidenzia solo i blocchi che cambiano dati o permessi; non chiedere preferenze cosmetiche già definite.

IMPLEMENTAZIONE
Segui Milestone 0–6 della sezione 50. Per ogni milestone:
- implementa una fetta verticale verificabile;
- usa componenti riusabili fra drawer/full/split;
- esegui i test pertinenti;
- non avanzare con errori noti;
- documenta migrazioni e decisioni.

BACKEND OBBLIGATORIO
- PostgreSQL con capacità equivalenti alle tabelle della sezione 29.
- Funzioni e transazioni equivalenti alla sezione 30.
- Filtraggio server-side dei campi nascosti.
- Endpoint review/visibility solo Consulente.
- Versioni ottimistiche e 409 per conflitti.
- Audit atomico con le mutation.
- Ogni valore compilato ha uno stato; ogni vuoto ha stato null.

FRONTEND OBBLIGATORIO
- Stato workspace e draft separati come sezione 32.
- S01–S10 realizzabili tramite route/fixture/test.
- Bozza unica conservata fra drawer, full e split.
- S05 globale e identico in tutte le modalità.
- S06/S07 locali.
- S09 ancorato all’icona con overlay globale.
- S10: occhio sulla label, attenuazione Consulente, rimozione completa Azienda.
- Design token e geometrie della sezione 33.
- Nessuna duplicazione del form fra contenitori.

TEST OBBLIGATORI
- unit per invarianti, validazione, reducer e KPI;
- integration API per autorizzazioni, transazioni e conflitti;
- component test per primitive e overlay;
- E2E per tutti i flussi principali;
- visual regression S01–S10 con fixture sezione 52;
- lint, typecheck, test e build finali.

DIVIETI
- non creare un prototipo separato;
- non aggiungere required;
- non mostrare indicatori/occhi all’Azienda;
- non spedire campi nascosti all’Azienda;
- non associare fieldKey a SQL dinamico non allowlisted;
- non perdere bozze nei mode switch;
- non usare un solo stato globale per due pannelli;
- non ricalcolare KPI con numeri incoerenti;
- non implementare responsive mobile/tablet;
- non cambiare il catalogo finale senza segnalare un blocco di dominio;
- non mappare semanticamente colonne dubbie senza ispezionare lo schema.

CONSEGNA
Fornisci:
1. riepilogo architetturale;
2. file modificati;
3. migrazioni e rollback;
4. endpoint e permessi;
5. screenshot/baseline S01–S10;
6. test eseguiti con risultato;
7. eventuali scostamenti, con motivazione e impatto.
```

---

## 54. Esito atteso

Consegnando a Claude Code questo file e i mockup S01–S10, il lavoro non deve ridursi a “ricreare delle schermate”. Claude deve realizzare un’unica feature coerente in cui:

- le dieci schermate sono stati della stessa macchina applicativa;
- ogni dato deriva da un contratto backend autorizzato;
- ogni mutation è transazionale e versionata;
- i ruoli ricevono payload differenti;
- la grafica è costruita con primitive condivise;
- i mockup sono riproducibili con fixture deterministiche;
- la feature è verificabile automaticamente e pronta a evolvere verso altre sezioni.
