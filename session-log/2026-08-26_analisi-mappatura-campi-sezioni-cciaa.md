# Analisi campo-per-campo — Mappatura sezioni CCIAA (26-08-2026)

Analisi richiesta da `Mappatura_campi_sezioni_CCIAA_26-08-2026.md` (cap. 3 e
14 del documento): matrice completa campo → tabella → colonna/relazione →
API → componente, **prima di qualunque modifica al codice**. Nessuna riga di
codice o migrazione è stata scritta in questa sessione.

Analisi fatta sullo stato **di lavoro** del repository (le modifiche non
committate elencate in `git status` all'apertura sessione), non sull'ultimo
commit — la riorganizzazione CCIAA del 2026-08-25/26 (motore incarichi
generico, `ana_persone`, macrosezione CCIAA) è già in corso e questa analisi
la assume come base.

## 0. Come leggere questo documento

- Per i campi con stato **Esistente e correttamente utilizzabile** le righe
  sono raggruppate per sotto-sezione in tabelle compatte (il documento
  originale ne ha oltre 250; il formato a matrice singola riga-per-riga di
  §3 è rispettato, ma senza prosa ripetuta quando la mappatura è 1:1 e senza
  ambiguità).
- Per i campi **mal collocati**, **da correggere**, **ambigui** o
  **mancanti** ogni voce ha spiegazione dedicata.
- I campi mancanti sono raggruppati per **decisione strutturale** (nuova
  tabella o nuove colonne), non uno per uno: molti campi mancanti condividono
  la stessa struttura proposta. Ogni gruppo segue comunque il formato a 10
  voci richiesto da §3 del documento mappatura.
- Stato ammessi (come da §3): Esistente e correttamente utilizzabile /
  Esistente ma collegato alla sezione sbagliata / Esistente ma con
  funzionamento da correggere / Esistente in un'altra tabella o modulo /
  Derivabile da dati esistenti / Mancante / Ambiguo o non individuato.

---

## 1. Quadro d'insieme

Il lavoro in corso ha già costruito:

- **Motore generico "incarico"** (`Mod. Personale/006`, `Cataloghi/002-004,007`):
  `ana_persone` + `cat_ruoli` + `cat_caratteristiche_incarico` +
  `rel_ruoli_caratteristiche` + `per_incarichi`/`per_incarichi_valori`.
  Sostituisce le vecchie `qual_*` (rimosse in `Mod. Anagrafica Aziendale/.../024`
  e `Mod. Personale/007`). Copre **esattamente** il principio guida del
  documento mappatura §4.4/§13.2: la card CCIAA salva relazione/carica, mai
  una copia di nome/cognome/codice fiscale. Ruoli camerali già presenti nel
  catalogo: SOCIO (R035), AMMINISTRATORE (R003), AMMINISTRATORE_DELEGATO
  (R031), COMPONENTE_CDA (R032), SINDACO (R033), REVISORE_LEGALE (R034).
- **Macrosezione CCIAA** (`frontend/lib/cciaa-viste.ts`,
  `components/registro/cciaa-section-panel.tsx`): 9 pannelli (`sede`,
  `statuto`, `soci`, `amministratori`, `sindaci`, `attivita-albi`,
  `personale-occupazione`, `sedi-secondarie`, `aggiornamento-impresa`), più
  `capitale-sociale` aperto direttamente come sezione a registro.
- **14 tabelle `ana_*`** già esistenti sotto "Dati estrapolati dalla CCIA"
  (identificazione camerale, iscrizioni RI, durata/esercizi, attività,
  codici ATECO, capitale, amministrazione/controllo, SOA, certificazioni,
  addetti visura/comune, albi/ruoli/licenze, sedi, contatti) con CRUD
  completo (`backend/app/api/anagrafica.py`) ed endpoint generico catalogo
  (`GET /api/anagrafica/cataloghi/{nome}`).
- **Registro campo-per-campo** (verifica/nota/visibilità) per 4 sezioni:
  `informazioni-societarie`, `capitale-sociale`, `durata-societa-esercizi`,
  `amministrazione-controllo` (`backend/app/core/registro_campi.py`).

**Gap strutturale principale, trasversale a più sezioni**: `doc_documenti`
è dichiaratamente un placeholder minimo (commento nel file SQL stesso:
"struttura completa... rimandata a una sessione dedicata"). **Non esiste
alcuna infrastruttura di importazione/parsing della visura**: nessun hash
documento, nessuno stato di importazione, nessuna riconciliazione, nessun
collegamento "campo ↔ documento sorgente". Questo rende **mancante in blocco**
tutta la sezione 0.2 e la sezione 11.2 del documento mappatura, e rende
"Ambiguo/da chiarire con l'utente" ogni campo che il documento presume
provenire "dal documento importato" (es. Testo originale, Valore sorgente,
Fonte come provenienza di un parsing automatico). Oggi la piattaforma è a
**compilazione manuale** (form Consulente), non a estrazione automatica da
PDF/JSON camerale — è una decisione the utente deve confermare prima di
proseguire (vedi Decisione D-B sotto).

**Sezione completamente assente (0% di copertura)**: la 7,
"Trasferimenti d'azienda, fusioni, scissioni e subentri" — nessuna tabella,
nessun modello, nessun endpoint, nessuna voce in `CciaaVistaKey`.

---

## 2. Sezione 0 — Dati di sintesi non presenti nelle sezioni successive

| Sottosezione | Campo | Tabella/colonna individuata | API | Stato |
|---|---|---|---|---|
| 0.2 | Tipo di visura, Camera emittente **del documento**, Numero documento, Data di estrazione, QR code | — | — | **Mancante** (dipende dall'infrastruttura di importazione, vedi D-B) |
| 0.3 | Stato attività impresa | `ana_identificazione_camerale.stato_attivita` | CRUD esistente | Esistente ma non ancora mostrato in un pannello sintesi (oggi mostrato solo dentro "Informazioni societarie") |
| 0.3 | Codice NACE | `ana_codici_ateco.codice_nace` (colonna per-riga, non company-level) | CRUD esistente | **Ambiguo**: il documento vuole un valore di sintesi unico impresa, la colonna oggi vive ripetuta su ogni riga ATECO — vedi D-P |
| 0.3 | Versione NACE | — | — | **Mancante** |
| 0.3 | Attività import/export | `ana_attivita_esercitata.presenza_attivita_import_export` | CRUD esistente | Esistente ma non ancora mostrato in sintesi |
| 0.3 | Contratto di rete (indicatore Sì/No sintetico) | `ana_contratti_rete` esiste ma è nel modulo Organizzazione (ISO 9001, fuori scope dichiarato per la riorganizzazione CCIAA) | — | **Ambiguo**: derivare l'indicatore da quella tabella significherebbe collegare la sintesi CCIAA a un modulo esplicitamente escluso — decisione utente necessaria |
| 0.3 | Presenza albi/ruoli/licenze; presenza albi/registri ambientali | Derivabile da `EXISTS` su `ana_albi_ruoli_licenze` (nessuna colonna "ambientale" per distinguerli) | — | **Derivabile parzialmente**: non esiste un modo per distinguere "registri ambientali" dagli altri albi — flag `tipologia` è testo libero |
| 0.4 | Numero titolari di cariche | `ana_amministrazione_controllo.numero_titolari_cariche` | CRUD esistente | Esistente ma collegato alla sezione sbagliata (oggi nel pannello "Amministratori"/"Sindaci" tramite `SectionContent sectionKey="amministrazione-controllo"`, il documento lo vuole in sezione 0) |
| 0.4 | Pratiche inviate ultimi 12 mesi; Trasferimenti di quote; Trasferimenti di sede; Partecipazioni in altre società | — | — | **Mancante** (vedi D-M) |
| 0.5 | Documenti consultabili (Bilanci/Fascicolo/Statuto/Altri atti) | — | — | **Mancante**, stesso gap dell'infrastruttura documentale (D-B) |

---

## 3. Sezione 1 — Sede

| Campo | Tabella/colonna | Stato |
|---|---|---|
| Comune, Provincia, Numero civico, CAP, Nazione | `ana_sedi.comune/provincia/numero_civico/cap/nazione` | Esistente e correttamente utilizzabile |
| Toponimo, Denominazione stradale | `ana_sedi.indirizzo` (colonna unica) | **Ambiguo**: il documento vuole due componenti distinti (es. "Via" + "Roma"), lo schema ne ha uno solo — vedi D-E1 |
| Indirizzo completo originale (sola lettura, valore sorgente) | nessuna colonna dedicata (coincide con `indirizzo`) | **Ambiguo**, stesso motivo |
| Domicilio digitale/PEC dell'impresa | `ana_contatti` (`tipo_contatto`/`valore`/`principale`) | Esistente e correttamente utilizzabile — già distinta dalle PEC personali (che vivono altrove, vedi §6 sotto) |
| Partita IVA | `ana_identificazione_camerale.partita_iva` | Esistente e correttamente utilizzabile |
| Numero REA attuale | `ana_identificazione_camerale.numero_rea` + `provincia_rea` | Esistente e correttamente utilizzabile |
| Trasferimento da altra provincia (presenza, provincia provenienza, REA precedente, data) | — | **Mancante** (vedi D-E2) |
| Codice fiscale (§1.5, non duplicare) | già in `ana_identificazione_camerale.codice_fiscale`, oggi mostrato solo nella sezione statuto/informazioni-societarie | Esistente e correttamente collocato — **verificare in fase implementativa** che nessun pannello "Sede" lo duplichi |
| Camera di Commercio competente (§1.5, non deve essere in Sede) | oggi non mostrata in nessun pannello (colonna `camera_commercio_competente` esiste ma è esclusa dal catalogo registro dal 2026-08-14, vedi commento in migrazione 023) | Esistente ma non ancora mostrato — va collocata in 2.1, non in Sede (nessuna correzione da fare: oggi non è nemmeno in Sede) |

---

## 4. Sezione 2 — Informazioni da statuto/atto costitutivo

| Sottosezione | Campo | Tabella/colonna | Stato |
|---|---|---|---|
| 2.1 | Codice fiscale e numero di iscrizione | `ana_identificazione_camerale.codice_fiscale` + `numero_iscrizione` | Esistente e correttamente utilizzabile |
| 2.1 | Registro delle Imprese competente | `ana_identificazione_camerale.ufficio_registro_imprese` | Esistente ma non ancora mostrato (colonna esclusa dal catalogo registro, va reintrodotta qui) |
| 2.1 | Data di iscrizione | `ana_identificazione_camerale.data_iscrizione` | Esistente e correttamente utilizzabile |
| 2.2 | Sezione, Data iscrizione | `ana_iscrizioni_registro_imprese.tipo_iscrizione/sezione/data_iscrizione` | Esistente e correttamente utilizzabile |
| 2.2 | Stato iscrizione, Data di cessazione, Note/denominazione sorgente | — | **Mancante** (vedi D-F) |
| 2.3 | Denominazione legale, Forma giuridica, Data atto costitutivo | `ana_identificazione_camerale.ragione_sociale/forma_giuridica/data_atto_costitutivo` | Esistente e correttamente utilizzabile |
| 2.3 | Notaio/pubblico ufficiale, Numero di repertorio, Località dell'atto | — | **Mancante** (vedi D-F) |
| 2.4.1 | Tipo di durata, Data termine società | `ana_durata_societa_esercizi.data_termine_societa` (solo data, non "tipo") | Esistente parzialmente — manca "Tipo di durata"/"Regola o descrizione" come campi distinti |
| 2.4.2 | Scadenza primo esercizio, scadenza esercizi successivi | `ana_durata_societa_esercizi.scadenza_primo_esercizio/scadenza_esercizi_successivi` **E ANCHE** `ana_identificazione_camerale.inizio_esercizio/termine_esercizio` | **Ambiguo/duplicato**: due tabelle diverse sembrano modellare lo stesso concetto con nomi diversi — vedi D-C1, decisione bloccante prima di costruire la UI di 2.4.2 |
| 2.4.2 | Giorni di proroga approvazione bilancio | — | **Mancante** |
| 2.4.3 | Sistema di amministrazione adottato | `ana_sistemi_amministrazione.sistema_amministrazione` (repeatable, ma non esposto nel catalogo registro) | Esistente ma non ancora mostrato |
| 2.4.3 | Soggetto/funzione controllo contabile | — | **Mancante** |
| 2.4.4 | Organi amministrativi previsti (tabella ripetibile: tipologia, in carica, min/max componenti, regole decisionali, deleghe, rappresentanza, opposizione) | `ana_sistemi_amministrazione` ha solo `sistema_amministrazione` (testo) | **Esistente ma con funzionamento da correggere** per la tipologia; tutte le altre colonne **mancanti** (vedi D-C2) |
| 2.5 | Oggetto sociale | — | **Mancante** (vedi D-D) |
| 2.6 | Poteri da statuto | — | **Mancante** (vedi D-D) |
| 2.7 | Ripartizione utili e perdite (tabella) | — | **Mancante** (vedi D-D) |
| 2.8 | Altri riferimenti statutari (clausole recesso/esclusione/prelazione, tabella) | — | **Mancante** (vedi D-D) |
| 2.9 | Regole su deleghe/opposizione/rappresentanza generali → sezione 2, non 5 | nessuna di queste esiste ancora in nessuna sezione | Coerente con D-C2: quando create, vanno legate a `ana_sistemi_amministrazione`, mai al motore incarichi persona-per-persona |

---

## 5. Sezione 3 — Capitale e strumenti finanziari

| Campo | Tabella/colonna | Stato |
|---|---|---|
| Capitale deliberato/sottoscritto/versato, Valuta | `ana_capitale_sociale.*` | Esistente e correttamente utilizzabile |
| Data di riferimento (snapshot) | — | **Mancante** (colonna singola da aggiungere ad `ana_capitale_sociale`, bassa complessità) |
| 3.2 Strumenti finanziari previsti dallo statuto (tabella ripetibile) | — | **Mancante** (vedi D-G) |

---

## 6. Sezione 4 — Soci e titolari di diritti su azioni e quote

| Campo | Tabella/colonna | Stato |
|---|---|---|
| 4.1 Numero soci (conteggio) | Derivabile da `COUNT(per_incarichi WHERE ruolo=SOCIO)` | Derivabile da dati esistenti |
| 4.1 Data di riferimento composizione, Capitale rappresentato | — | **Mancante** (vedi D-H, dato di testata elenco soci, non per-persona) |
| 4.2 Estremi elenco soci (data riferimento/atto/deposito/protocollo, numero protocollo, capitale dichiarato) | — | **Mancante** (vedi D-H) |
| 4.3 Soggetto, Tipo soggetto, Nome/CF (da persona) | `ana_persone` via `per_incarichi.persona_id` | Esistente e correttamente utilizzabile |
| 4.3 Cittadinanza / Stato di costituzione | `ana_persone` non ha "cittadinanza" come colonna propria (ha `nazionalita`) | Esistente con nome diverso — riutilizzabile, nessuna nuova colonna |
| 4.3 Tipologia partecipazione, Valore nominale, Importo versato, N. azioni/quote, Percentuale, Tipo diritto, Quota diritto, Titolarità, Vincoli | `cat_caratteristiche_incarico` A57/A53/A56/A58/A54/A55/A59/A60/A61 (ruolo SOCIO) | Esistente e correttamente utilizzabile — aggiunte proprio per questo scopo da `Cataloghi/007` |
| 4.3 Domicilio (del titolare, con periodo/fonte) | — | **Mancante** (vedi D-H2, condiviso con 5.2/6.2) |
| 4.3 Rappresentante comune + estremi nomina | — | **Mancante**, basso utilizzo atteso — da confermare se serve ora o si rimanda |
| 4.3 Stato della relazione | Caratteristica A25 "Stato dell'incarico" (già associata a SOCIO) | Esistente e correttamente utilizzabile |
| 4.4 Regola: mai copiare anagrafica nella riga CCIAA | Rispettata dal design `per_incarichi` | Esistente e correttamente utilizzabile |

---

## 7. Sezione 5 — Amministratori

| Campo | Tabella/colonna | Stato |
|---|---|---|
| 5.1 Tipologia organo in carica, Numero componenti, Tipo durata, Data scadenza, Descrizione durata | `ana_amministrazione_controllo.organo_amministrativo_in_carica/numero_amministratori_in_carica/durata_in_carica_organo` | **Esistente ma con funzionamento da correggere**: sono numeri/testo inseriti manualmente, non derivati dalle righe attive di `per_incarichi` come richiede il documento (§13.3) — da correggere per far coesistere snapshot ufficiale + conteggio calcolato, senza sovrascrivere silenziosamente |
| 5.1 Bilancio/esercizio di riferimento della scadenza | — | **Mancante** (piccola, valutare se serve una caratteristica A-nuova o basta A51 già esistente per persona) |
| 5.2 Persona, Nome, Cognome, Luogo/Stato/Data nascita, Codice fiscale, Cittadinanza | `ana_persone` via `per_incarichi.persona_id` | Esistente e correttamente utilizzabile |
| 5.2 Domicilio (per la carica) | — | **Mancante**, condiviso con 4.3/6.2 (vedi D-H2) |
| 5.2 PEC personale/professionale | — | **Mancante** (vedi D-H2) |
| 5.2 Carica, Rappresentante impresa, Date nomina/iscrizione/scadenza, Tipo durata, Esercizio scadenza, Poteri/limitazioni, Modalità firma, Stato carica | `cat_caratteristiche_incarico` A01/A49/A50/A51/A29/A23/A21/A22/A24/A02/A25 (ruoli AMMINISTRATORE/_DELEGATO/COMPONENTE_CDA) | Esistente e correttamente utilizzabile |
| 5.3 Numero titolari di cariche → sezione 0, non 5 | vedi §2 sopra | Esistente ma collegato alla sezione sbagliata (stesso item di 0.4) |
| 5.3 Regole statutarie generali → sezione 2, non 5 | Nessuna esiste ancora in nessuna sezione | Da costruire in 2.4.4 (D-C2), mai nel motore incarichi |

---

## 8. Sezione 6 — Sindaci e membri degli organi di controllo

| Campo | Tabella/colonna | Stato |
|---|---|---|
| 6.1 Tipologia organo/funzione controllo | `ana_amministrazione_controllo` non ha una colonna dedicata (solo conteggio) | **Mancante** come campo testuale/catalogo distinto |
| 6.1 Numero componenti effettivi / supplenti (separati) | `ana_amministrazione_controllo.numero_sindaci_organi_controllo` (aggregato unico) | **Esistente ma con funzionamento da correggere**: non distingue effettivi da supplenti |
| 6.1 Funzione organo interno, Soggetto revisione, Titolo/presupposto nomina, Tipo durata, Data/esercizio scadenza | — | **Mancante** |
| 6.2 Soggetto, Nominativo, Tipo soggetto, CF, Luogo/Stato/Data nascita | `ana_persone` via `per_incarichi` | Esistente e correttamente utilizzabile |
| 6.2 Domicilio | — | **Mancante**, condiviso (D-H2) |
| 6.2 Carica, Funzione, Date nomina/iscrizione, Tipo durata, Data/esercizio scadenza, Stato carica | `cat_caratteristiche_incarico` A01/A49/A50/A51/A29/A25/A02 (ruoli SINDACO/REVISORE_LEGALE) | Esistente e correttamente utilizzabile |
| 6.2 Registro/albo professionale, Numero iscrizione professionale | A11/A12/A13 (SINDACO), A34/A35/A36 (REVISORE_LEGALE, Registro Revisori Legali) | Esistente e correttamente utilizzabile |

---

## 9. Sezione 7 — Trasferimenti d'azienda, fusioni, scissioni e subentri

**Sezione interamente mancante.** Nessuna tabella, modello, endpoint,
componente o voce `CciaaVistaKey`. Vedi D-A.

---

## 10. Sezione 8 — Attività, albi, ruoli e licenze

| Sottosezione | Campo | Tabella/colonna | Stato |
|---|---|---|---|
| 8.1 | Data inizio attività, Attività prevalente esercitata | `ana_attivita_esercitata.data_decorrenza_attivita/descrizione_attivita_esercitata` | Esistente e correttamente utilizzabile |
| 8.1 | Attività presso sede legale + relativa data inizio | non distinta da quella d'impresa nello schema attuale | **Ambiguo**: `ana_attivita_esercitata` è unica per azienda (vincolo `UNIQUE(azienda_id)`), il documento vuole due concetti distinti (impresa / sede legale) — vedi D-I |
| 8.2 | Sistema classificazione, versione, codice, descrizione, importanza (ruolo_codice), fonte, riclassificato, validità, testo originale | `ana_codici_ateco.*` | Esistente e correttamente utilizzabile — già repeatable/versionato come richiesto |
| 8.2 | Riclassificato d'ufficio | — | **Mancante** (colonna singola, bassa complessità) |
| 8.3 | Albi/ruoli/registri (tipologia, ente, numero, sezione, date, stato) | `ana_albi_ruoli_licenze.*` | Esistente e correttamente utilizzabile (tabella condivisa con 8.4, distinta per `tipologia`) |
| 8.4 | Licenze/autorizzazioni | stessa tabella `ana_albi_ruoli_licenze` | Esistente e correttamente utilizzabile — **verificare in fase implementativa** che la UI distingua le due viste come richiesto da §8.8 finale del documento ("aprire il form corretto") |
| 8.5 | Categorie SOA (fonte, categoria, tipo, classifica, importo limite, attestazione collegata) | `ana_soa_categorie.*` (FK a `ana_soa`) | Esistente e correttamente utilizzabile |
| 8.5 | Fonte (Casellario ANAC vs altro) | non distinta a livello di `ana_soa_categorie` | **Ambiguo**, bassa priorità |
| 8.6 | Attestazioni SOA (numero, denominazione organismo, date, regolamento, stato) | `ana_soa.*` | Esistente e correttamente utilizzabile per tutto tranne "Stato attestazione" |
| 8.6 | Stato attestazione (valida/scaduta/sospesa/revocata) | — | **Derivabile** dalle date esistenti (`data_scadenza`), ma il documento vuole anche uno stato ufficiale distinto dal calcolato (come per le certificazioni, §8.8) — **Mancante** come colonna esplicita |
| 8.7 | Informazioni Casellario ANAC | — | **Mancante** — bassa priorità, nessun indizio di utilizzo imminente nel resto del codice |
| 8.8 | Certificazioni (fonte, tipologia, sigla, norma, numero, date, organismo, stato ufficiale) | `ana_certificazioni.*` | Esistente e correttamente utilizzabile |
| 8.8 | Stato calcolato (distinto da stato ufficiale) | — | **Mancante** (stessa osservazione di 8.6) |
| 8.8 | Scopo della certificazione (attività/sedi coperte) | — | **Mancante**, bassa priorità |
| 8.8.1 | Settori IAF della certificazione | `ana_certificazioni_settori_iaf.*` | Esistente e correttamente utilizzabile |

---

## 11. Sezione 9 — Personale e occupazione

| Campo | Tabella/colonna | Stato |
|---|---|---|
| Fonte, Anno rilevazione, Data rilevazione | `ana_addetti_visura.fonte/anno_riferimento/data_rilevazione` | Esistente e correttamente utilizzabile |
| Trimestre, Dipendenti, Indipendenti, Totale addetti, Collaboratori | `ana_addetti_visura_periodi.periodo/numero_dipendenti/numero_indipendenti/numero_totale_addetti/numero_collaboratori` | Esistente e correttamente utilizzabile |
| Distribuzione per contratto (tipologia, %, numero) | `ana_addetti_visura_periodi.percentuale_tempo_determinato/indeterminato` | Esistente parzialmente — percentuali sì, "numero addetti derivato" non calcolato lato backend oggi (nessun problema strutturale, calcolo applicativo) |
| Distribuzione per orario | `percentuale_tempo_pieno/parziale` | Esistente e correttamente utilizzabile (stesso schema di sopra) |
| Distribuzione per qualifica | `percentuale_operai/impiegati` (solo 2 valori, il documento ne cita altri: apprendista, quadro, dirigente) | **Esistente ma incompleto**: schema a colonne fisse invece che repeatable, copre solo 2 delle qualifiche citate dal documento — valutare se serve estendere |
| Distribuzione territoriale (comune, provincia, sedi, dipendenti/indipendenti/totale) | `ana_addetti_comune` + `ana_addetti_comune_periodi` | Esistente e correttamente utilizzabile |
| Regola: non confondere con fotografia 31/12 o elenco nominativo | Rispettata: nessuna tabella di questa sezione tocca `ana_persone` | Esistente e correttamente utilizzabile |

---

## 12. Sezione 10 — Sedi secondarie e unità locali

| Campo | Tabella/colonna | Stato |
|---|---|---|
| Riferimento (sigla+progressivo), Tipologia, Denominazione, Data apertura | `ana_sedi.numero_unita_locale` (stringa unica, non sigla+progressivo separati) `/tipo_sede/denominazione_sede/data_apertura` | Esistente parzialmente — "sigla territoriale" e "numero progressivo" non sono colonne distinte |
| Indirizzo (comune, provincia, toponimo, denominazione stradale, civico, CAP, nazione, indirizzo originale) | `ana_sedi.*` | Stesso gap di §3 (Sede): toponimo/denominazione stradale non separati, nessun "indirizzo originale" distinto |
| Numero REA dell'unità | — | **Mancante** |
| Data di chiusura, Stato dell'unità | — | **Mancante** (vedi D-L) |
| Attività esercitate presso l'unità (tabella ripetibile) | — | **Mancante**, nessun collegamento sede↔attività oggi |
| Classificazioni ATECO dell'unità (con collegamento a `ana_codici_ateco`) | `ana_codici_ateco` non ha FK a `ana_sedi` | **Mancante** il collegamento (la tabella base 8.2 esiste già, manca solo l'aggancio) |
| Albi/licenze dell'unità | `ana_albi_ruoli_licenze` non ha FK a `ana_sedi` | **Mancante** il collegamento, stesso motivo |
| 10.3 Numero unità locali come conteggio derivato | Derivabile da `COUNT(ana_sedi WHERE tipo_sede NOT ILIKE '%legale%')` | Derivabile da dati esistenti |

---

## 13. Sezione 11 — Aggiornamento impresa

| Campo | Tabella/colonna | Stato |
|---|---|---|
| 11.1 Data ultimo protocollo | `ana_identificazione_camerale.data_ultimo_protocollo` (colonna esistente dal 2026-08-03, esclusa dal catalogo registro nel 2026-08-14) | **Esistente ma collegato alla sezione sbagliata**: oggi il pannello "Aggiornamento impresa" mostra l'intera sezione `informazioni-societarie` (`cciaa-section-panel.tsx` riga 143), non questo campo specifico |
| 11.2 Metadati tecnici (documento sorgente, hash, import, parser, riconciliazione, conferma) | — | **Mancante in blocco**, vedi D-B |
| 11.3 Cronologia aggiornamenti | — | **Mancante**, stesso gap di D-B |
| 11.4 I 4 indicatori (pratiche/trasferimenti quote/trasferimenti sede/partecipazioni) → sezione 0, non 11 | Nessuno di questi è oggi mostrato in "Aggiornamento impresa" (il pannello mostra solo `informazioni-societarie`) | Nessuna correzione da fare: la collocazione errata descritta dal documento non è presente nel codice attuale — quando questi indicatori verranno creati (D-M) andranno direttamente in sezione 0 |

---

## 14. Sezione 12 — Vista di sintesi camerale

Nessuna vista di sintesi dedicata esiste oggi con questa forma (banner +
"impresa in cifre" + certificazioni + documenti, tutto a sola lettura da
altre sezioni). La Home attuale (`frontend/app/(app)/anagrafica/page.tsx`)
mostra le categorie come sezioni collassabili, non un cruscotto di sintesi
separato. **Mancante come componente**, ma quasi interamente derivabile una
volta risolte le sezioni 0–11 sopra: nessuna nuova colonna DB prevista da
questa sezione, solo composizione frontend.

---

## 15. Decisioni richieste prima di qualunque modifica

Per ciascuna, il formato è quello richiesto da §3 del documento mappatura.

### D-A — Sezione 7, Trasferimenti/fusioni/scissioni/subentri (intera sezione)

| Voce | Contenuto |
|---|---|
| Campo mancante | Intera sezione 7: tabella "Operazioni societarie" (§7.1) + sottotabella "Soggetti coinvolti" (§7.2) |
| Verifiche eseguite | Cercato in tutto il repository (`fusion`, `scission`, `trasferimento.*azienda`, `subentr`) — zero occorrenze in tabelle, modelli, API, frontend |
| Necessità effettiva | Nessuna struttura esistente rappresenta eventi societari di questo tipo; non è derivabile da nient'altro |
| Collocazione consigliata | Due nuove tabelle in `database_struttura/Mod. Anagrafica Aziendale/Dati estrapolati dalla CCIA/`: `ana_operazioni_societarie` (una riga per evento/fase) e `ana_operazioni_societarie_soggetti` (dettaglio soggetti coinvolti, FK alla prima) |
| Nome tecnico proposto | `ana_operazioni_societarie` (famiglia, tipo_atto, descrizione, date multiple, numero_protocollo, camera_competente, stato) + `ana_operazioni_societarie_soggetti` (operazione_id FK, soggetto/ruolo/cf/sede — soggetto come testo libero o FK opzionale a `sys_aziende`/`ana_persone` se il soggetto è già censito) |
| Tipo di dato | Date `DATE` nullable, testo `VARCHAR`/`TEXT`, stato `VARCHAR` con lista valori applicativa |
| Relazioni | FK `azienda_id → sys_aziende`; FK opzionale della sottotabella verso soggetti già censiti se disponibili |
| Impatto | Nuova migrazione, nuovi modelli SQLAlchemy, nuovo router/schema backend, nuovo componente frontend, nuova voce `CciaaVistaKey` |
| Alternative | Nessuna: non c'è una tabella esistente semanticamente vicina (non è una carica di persona, non è un'iscrizione RI) |
| Decisione richiesta | Creare / Non creare / Posticipare |

### D-B — Infrastruttura di importazione documentale (sezioni 0.2, 0.5, 11.2, 11.3, e ogni "Testo/Valore originale")

| Voce | Contenuto |
|---|---|
| Campo mancante | Tipo visura, Camera emittente (del documento), Numero documento, Data estrazione, QR (0.2); Documenti consultabili con annualità bilanci (0.5); hash, stato importazione, versione parser, stato riconciliazione, conferma (11.2); cronologia eventi (11.3) |
| Verifiche eseguite | `doc_documenti` letto per intero: è un placeholder di 4 colonne (`id`, `azienda_id`, `created_at`, `updated_at`), commento esplicito nel file "struttura completa... rimandata a una sessione dedicata"; nessuna tabella `sys_import*`/hash/parser trovata nel resto dello schema |
| Necessità effettiva | Questi campi presuppongono una pipeline di acquisizione automatica della visura (PDF/JSON) che oggi non esiste: la piattaforma raccoglie questi dati tramite compilazione manuale del Consulente |
| Collocazione consigliata | Nessuna adesso — è un modulo Documenti a sé stante, già segnalato come lavoro futuro in CLAUDE.md/AMBIENTE-SVILUPPO.md |
| Nome tecnico proposto | — (da definire quando si affronta il modulo Documenti) |
| Tipo di dato | — |
| Relazioni | — |
| Impatto | Se costruito ora: backend (nuove tabelle + servizio di parsing), storage, frontend (upload, viewer). Impatto grande, fuori dall'ambito "riorganizzazione vista CCIAA" di questo documento |
| Alternative | Costruire solo i campi 0.2/11.1(già esistente)/11.2 come metadati manuali (senza vera automazione di parsing) — rappresenterebbe comunque dati "finti" se non c'è un documento realmente importato dietro |
| Decisione richiesta | **Consigliato: Posticipare** l'intera sezione 0.2/0.5/11.2/11.3 a quando il modulo Documenti sarà affrontato; confermare che per ora quei blocchi restino assenti o nascosti nella UI CCIAA invece di mostrare campi vuoti permanenti |

### D-C1 — Sezione 2.4.2, possibile duplicazione scadenza esercizi

| Voce | Contenuto |
|---|---|
| Campo mancante/ambiguo | "Scadenza primo esercizio" / "Scadenza esercizi successivi" |
| Verifiche eseguite | Trovate **due** rappresentazioni: `ana_durata_societa_esercizi.scadenza_primo_esercizio` (DATE) + `.scadenza_esercizi_successivi` (VARCHAR(50)); e **anche** `ana_identificazione_camerale.inizio_esercizio`/`termine_esercizio` (CHAR(5), formato GG/MM, aggiunte dalla migrazione 023 per il catalogo "Informazioni societarie") |
| Necessità effettiva | Non è mancante — è duplicato con granularità diversa (una tabella con date assolute, l'altra con giorno/mese ricorrente) |
| Collocazione consigliata | Va scelta UNA fonte autorevole per la UI di 2.4.2; l'altra o si allinea o resta per uso diverso (dichiarato, non silenzioso) |
| Nome tecnico proposto | — |
| Tipo di dato | — |
| Relazioni | — |
| Impatto | Solo frontend/registro_campi.py se si sceglie una fonte; nessuna migrazione se si tiene solo una tabella come autorevole per la UI |
| Alternative | (a) usare `ana_identificazione_camerale.inizio_esercizio/termine_esercizio` (già nel catalogo registro, formato GG/MM ricorrente) per 2.4.2 e lasciare `ana_durata_societa_esercizi` per l'uso già esistente in sezione "Durata società ed esercizi"; (b) il contrario |
| Decisione richiesta | Quale delle due tabelle è la fonte per il campo di sezione 2.4.2 nella nuova vista? |

### D-C2 — Sezione 2.4.4, dettaglio organi amministrativi previsti

| Voce | Contenuto |
|---|---|
| Campo mancante | Numero minimo/massimo componenti, Regole decisionali, Deleghe previste, Regime di rappresentanza, Gestione dell'opposizione (per ciascuna configurazione alternativa di organo prevista dallo statuto) |
| Verifiche eseguite | `ana_sistemi_amministrazione` ha solo `sistema_amministrazione` (testo) + FK a `ana_amministrazione_controllo`; nessuna di queste colonne esiste altrove (né nel motore incarichi, che è persona-per-persona, non statuto-generale) |
| Necessità effettiva | Dati esplicitamente statutari, non legati a una singola persona: non riutilizzabili dal motore incarichi (che modella cariche assegnate, non regole statutarie generali) |
| Collocazione consigliata | Estendere `ana_sistemi_amministrazione` con le nuove colonne |
| Nome tecnico proposto | `numero_minimo_componenti INTEGER`, `numero_massimo_componenti INTEGER`, `regole_decisionali TEXT`, `deleghe_previste TEXT`, `regime_rappresentanza TEXT`, `gestione_opposizione TEXT`, `in_carica BOOLEAN NOT NULL DEFAULT FALSE` |
| Tipo di dato | Come sopra, tutti nullable tranne `in_carica` |
| Relazioni | Nessuna nuova, resta FK esistente verso `ana_amministrazione_controllo` |
| Impatto | Migrazione ALTER TABLE, aggiornamento modello SQLAlchemy, esposizione nel catalogo registro o come risorsa CRUD dedicata, nuovo blocco frontend nel pannello "statuto" |
| Alternative | Nessuna tabella alternativa già esistente è pertinente |
| Decisione richiesta | Creare / Non creare / Posticipare |

### D-D — Sezioni 2.5/2.6/2.7/2.8, contenuto statutario testuale

| Voce | Contenuto |
|---|---|
| Campo mancante | Oggetto sociale (2.5), Poteri da statuto (2.6), Ripartizione utili/perdite (2.7, tabella), Altri riferimenti statutari/clausole (2.8, tabella ripetibile) |
| Verifiche eseguite | Cercato in `ana_identificazione_camerale` e in tutte le altre tabelle "Dati estrapolati dalla CCIA": nessuna colonna di testo esteso per oggetto sociale o poteri; nessuna tabella per clausole statutarie |
| Necessità effettiva | Contenuti esplicitamente richiesti dal documento come sezioni a sé, non ricavabili da altro |
| Collocazione consigliata | Oggetto sociale e Poteri da statuto come colonne `TEXT` su `ana_identificazione_camerale` (1:1 con azienda, come gli altri campi già lì); Ripartizione utili/perdite e Altri riferimenti statutari come due nuove tabelle ripetibili (`ana_ripartizione_utili`, `ana_clausole_statutarie`) |
| Nome tecnico proposto | `ana_identificazione_camerale.oggetto_sociale TEXT`, `.poteri_statuto TEXT`; `ana_ripartizione_utili(azienda_id, riferimento_statutario, regola)`; `ana_clausole_statutarie(azienda_id, tipologia_clausola, presenza, testo_riferimento)` |
| Tipo di dato | Testo libero, nullable |
| Relazioni | FK `azienda_id → sys_aziende` per le due nuove tabelle |
| Impatto | Migrazione ALTER + 2 nuove tabelle, modelli SQLAlchemy, esposizione nel catalogo registro (per i 2 campi testo) e come risorsa CRUD (per le 2 tabelle), nuovo blocco nel pannello "statuto" |
| Alternative | Nessuna |
| Decisione richiesta | Creare tutti e 4 / Crearne solo alcuni (specificare quali) / Posticipare |

### D-E1 — Sezione 1.1/10.2, componenti dell'indirizzo (Toponimo + Denominazione stradale)

| Voce | Contenuto |
|---|---|
| Campo mancante/ambiguo | Toponimo (Via/Viale/Piazza) separato da Denominazione stradale; Indirizzo completo originale in sola lettura |
| Verifiche eseguite | `ana_sedi.indirizzo` è un'unica colonna VARCHAR; nessuna colonna "toponimo" o "indirizzo originale" separata |
| Necessità effettiva | Il documento vuole scomporre l'indirizzo in componenti per costruire la vista senza sostituirli con una stringa unica; oggi c'è solo la stringa unica |
| Collocazione consigliata | Estendere `ana_sedi` con `toponimo VARCHAR(30)` (es. "Via", "Piazza") e rinominare concettualmente `indirizzo` a denominazione stradale; aggiungere `indirizzo_originale TEXT` per il valore sorgente non ricomposto |
| Nome tecnico proposto | `ana_sedi.toponimo VARCHAR(30)`, `.indirizzo_originale TEXT` (mantenendo `indirizzo` come denominazione stradale) |
| Tipo di dato | `VARCHAR`/`TEXT`, nullable |
| Relazioni | Nessuna |
| Impatto | Migrazione ALTER su `ana_sedi` (usata sia da Sede sia da Sedi secondarie), modello, schema, form frontend sedi |
| Alternative | Lasciare `indirizzo` come stringa unica e comporre "Toponimo" via parsing euristico lato frontend (rischio di errori, sconsigliato dal documento che vuole dati strutturati) |
| Decisione richiesta | Creare le due colonne / Non creare (mantenere indirizzo unico) |

### D-E2 — Sezione 1.4, Trasferimento da altra provincia

| Voce | Contenuto |
|---|---|
| Campo mancante | Presenza trasferimento, Provincia di provenienza, Numero REA precedente, Data del trasferimento |
| Verifiche eseguite | Non presenti né in `ana_identificazione_camerale` né in `ana_iscrizioni_registro_imprese` |
| Necessità effettiva | Blocco condizionale esplicitamente richiesto, nessun dato equivalente altrove |
| Collocazione consigliata | Nuove colonne su `ana_identificazione_camerale` (1:1 con azienda, coerente con gli altri dati camerali singoli) |
| Nome tecnico proposto | `provincia_provenienza VARCHAR(5)`, `numero_rea_precedente VARCHAR(30)`, `data_trasferimento_provincia DATE` (la "presenza" è derivabile da `provincia_provenienza IS NOT NULL`) |
| Tipo di dato | Come sopra, tutti nullable |
| Relazioni | Nessuna |
| Impatto | Migrazione ALTER, aggiornamento catalogo registro "Informazioni societarie", nuovo blocco condizionale nel pannello "Sede" |
| Alternative | Nessuna |
| Decisione richiesta | Creare / Non creare / Posticipare |

### D-F — Sezione 2.1/2.2/2.3, dettagli iscrizione e costituzione mancanti

| Voce | Contenuto |
|---|---|
| Campo mancante | Stato iscrizione + Data cessazione (per riga, 2.2); Notaio/pubblico ufficiale, Numero repertorio, Località atto (2.3) |
| Verifiche eseguite | `ana_iscrizioni_registro_imprese` ha solo `tipo_iscrizione/sezione/data_iscrizione`; `ana_identificazione_camerale` non ha notaio/repertorio/località |
| Necessità effettiva | Campi esplicitamente richiesti, non derivabili |
| Collocazione consigliata | `stato_iscrizione`/`data_cessazione` su `ana_iscrizioni_registro_imprese`; `notaio`, `numero_repertorio`, `localita_atto` su `ana_identificazione_camerale` |
| Nome tecnico proposto | `ana_iscrizioni_registro_imprese.stato_iscrizione VARCHAR(50)`, `.data_cessazione DATE`; `ana_identificazione_camerale.notaio VARCHAR(255)`, `.numero_repertorio VARCHAR(50)`, `.localita_atto VARCHAR(200)` |
| Tipo di dato | Testo/date, nullable |
| Relazioni | Nessuna nuova |
| Impatto | 2 migrazioni ALTER, aggiornamento modelli/schemi, catalogo registro, form frontend |
| Alternative | Nessuna |
| Decisione richiesta | Creare tutti / Crearne solo alcuni / Posticipare |

### D-G — Sezione 3.2, Strumenti finanziari previsti dallo statuto

| Voce | Contenuto |
|---|---|
| Campo mancante | Tabella ripetibile: Tipologia strumento, Riferimento statutario, Descrizione |
| Verifiche eseguite | Nessuna tabella esistente rappresenta strumenti finanziari diversi dal capitale |
| Necessità effettiva | Dato esplicitamente ripetibile e condizionale, non presente |
| Collocazione consigliata | Nuova tabella `ana_strumenti_finanziari` (azienda_id, tipologia, riferimento_statutario, descrizione) |
| Nome tecnico proposto | `ana_strumenti_finanziari` |
| Tipo di dato | Testo libero + FK azienda |
| Relazioni | FK `azienda_id → sys_aziende` |
| Impatto | Nuova migrazione, modello, schema, endpoint CRUD, blocco frontend condizionale nel pannello "Capitale sociale" |
| Alternative | Nessuna |
| Decisione richiesta | Creare / Non creare / Posticipare |

### D-H — Sezione 4.1/4.2, estremi elenco soci (dato di testata, non per-persona)

| Voce | Contenuto |
|---|---|
| Campo mancante | Data riferimento elenco/composizione, Data atto, Data deposito, Data protocollo, Numero protocollo, Capitale sociale dichiarato |
| Verifiche eseguite | Il motore incarichi modella solo la relazione persona↔ruolo↔caratteristiche; questi dati sono a livello di "intero elenco soci per l'azienda in un dato momento", non di singola riga socio |
| Necessità effettiva | Non rappresentabile nel motore incarichi (che non ha un concetto di "snapshot dell'elenco") |
| Collocazione consigliata | Nuova tabella 1:1 con azienda, sul modello di `ana_capitale_sociale` |
| Nome tecnico proposto | `ana_elenco_soci_estremi` (azienda_id, data_riferimento, data_atto, data_deposito, data_protocollo, numero_protocollo, capitale_sociale_dichiarato) |
| Tipo di dato | Date + `NUMERIC(15,2)` per il capitale, nullable |
| Relazioni | FK `azienda_id → sys_aziende`, UNIQUE su azienda_id |
| Impatto | Nuova migrazione, modello, schema, esposizione nel catalogo registro, nuovo blocco nel pannello "Soci" |
| Alternative | Aggiungere le stesse colonne a `ana_capitale_sociale` (già 1:1 con azienda) invece di una tabella nuova — meno pulito semanticamente ma nessuna nuova tabella |
| Decisione richiesta | Nuova tabella dedicata / Estendere `ana_capitale_sociale` / Posticipare |

### D-H2 — Sezioni 4.3/5.2/6.2, Domicilio della carica e PEC personale/professionale

| Voce | Contenuto |
|---|---|
| Campo mancante | "Domicilio" riferito alla carica (con fonte/validità) per soci, amministratori, sindaci; "PEC personale/professionale" per amministratori/sindaci |
| Verifiche eseguite | `ana_persone.residenza` esiste ma è un indirizzo di residenza personale generico, non un "domicilio per la carica con periodo/fonte" come richiesto; nessuna caratteristica A01-A61 rappresenta PEC o domicilio-con-periodo |
| Necessità effettiva | Il documento distingue esplicitamente "domicilio riportato in visura per la carica" da un generico indirizzo anagrafico, e la PEC professionale dalla PEC aziendale — nessuno dei due è rappresentato oggi |
| Collocazione consigliata | Due nuove caratteristiche nel catalogo condiviso `cat_caratteristiche_incarico` (riutilizzabili da tutti i ruoli camerali con `rel_ruoli_caratteristiche`), non nuove colonne su `ana_persone` (che è anagrafica, non specifica della carica) |
| Nome tecnico proposto | Nuove caratteristiche `A62` (Domicilio per la carica, tipo TESTO_LUNGO) e `A63` (PEC personale/professionale, tipo TESTO) |
| Tipo di dato | Come da tabella `cat_caratteristiche_incarico` esistente |
| Relazioni | Associazione in `rel_ruoli_caratteristiche` per SOCIO/AMMINISTRATORE/AMMINISTRATORE_DELEGATO/COMPONENTE_CDA/SINDACO/REVISORE_LEGALE, obbligatorietà FACOLTATIVA (nessuno di questi dati è sempre disponibile in visura) |
| Impatto | Migrazione INSERT su cataloghi esistenti (nessun ALTER strutturale), nessun modello nuovo — il motore incarichi già supporta caratteristiche aggiuntive |
| Alternative | Rappresentare il domicilio come relazione verso `ana_sedi`/un indirizzo strutturato invece di testo libero — più corretto ma più complesso; da valutare se il beneficio giustifica la complessità in questa fase |
| Decisione richiesta | Creare come testo libero (A62/A63) / Creare come struttura indirizzo collegata / Non creare ora |

### D-L — Sezione 10, gap struttura unità locali

| Voce | Contenuto |
|---|---|
| Campo mancante | Numero REA dell'unità, Data di chiusura, Stato dell'unità, Sigla territoriale/numero progressivo separati, collegamento unità↔attività/ATECO/albi-licenze |
| Verifiche eseguite | `ana_sedi` ha solo `tipo_sede/numero_unita_locale/denominazione_sede/data_apertura/indirizzo...`; nessuna FK da `ana_codici_ateco` o `ana_albi_ruoli_licenze` verso `ana_sedi` |
| Necessità effettiva | Il documento vuole un dettaglio unità locale completo con stato del ciclo di vita e classificazioni proprie, non rappresentabile oggi |
| Collocazione consigliata | Estendere `ana_sedi` con le colonne mancanti; aggiungere `sede_id UUID NULL` (FK opzionale) su `ana_codici_ateco` e `ana_albi_ruoli_licenze` per il collegamento (NULL = riferito all'intera azienda, valorizzato = riferito a una specifica unità) |
| Nome tecnico proposto | `ana_sedi.numero_rea_unita VARCHAR(30)`, `.data_chiusura DATE`, `.stato VARCHAR(50)`, `.sigla_territoriale VARCHAR(10)`, `.numero_progressivo VARCHAR(20)`; `ana_codici_ateco.sede_id UUID NULL REFERENCES ana_sedi(id)`; `ana_albi_ruoli_licenze.sede_id UUID NULL REFERENCES ana_sedi(id)` |
| Tipo di dato | Come sopra, tutti nullable |
| Relazioni | 2 nuove FK opzionali |
| Impatto | Migrazione ALTER su 3 tabelle, aggiornamento modelli/schemi/API (filtro per sede), nuovo blocco "Attività esercitate presso l'unità" (tabella completamente nuova, non coperta da nessuna struttura esistente) |
| Alternative | Nessuna |
| Decisione richiesta | Creare tutto il pacchetto / Creare solo un sottoinsieme (specificare) / Posticipare |

### D-M — Sezione 0.4, indicatori "impresa in cifre" mancanti

| Voce | Contenuto |
|---|---|
| Campo mancante | Pratiche inviate ultimi 12 mesi, Trasferimenti di quote, Trasferimenti di sede, Partecipazioni in altre società |
| Verifiche eseguite | Nessuna colonna in `ana_identificazione_camerale` o altrove rappresenta questi 4 indicatori |
| Necessità effettiva | Indicatori di sintesi esplicitamente richiesti in prima pagina, non derivabili (Trasferimenti di sede potrebbe in futuro derivare da D-A una volta costruita la sezione 7, ma non oggi) |
| Collocazione consigliata | 4 nuove colonne su `ana_identificazione_camerale` (stesso pattern degli altri indicatori di sintesi già lì) |
| Nome tecnico proposto | `pratiche_ultimi_12_mesi INTEGER`, `trasferimenti_quote INTEGER`, `trasferimenti_sede INTEGER`, `partecipazioni_altre_societa BOOLEAN` |
| Tipo di dato | Interi nullable ≥0, booleano nullable |
| Relazioni | Nessuna |
| Impatto | Migrazione ALTER, catalogo registro, nuovo pannello "sintesi" (sezione 0, oggi non esiste come vista) |
| Alternative | Nessuna |
| Decisione richiesta | Creare / Non creare / Posticipare |

### D-P — Sezione 0.3/12.4, Codice NACE come valore di sintesi

| Voce | Contenuto |
|---|---|
| Campo mancante/ambiguo | Codice NACE e versione come valore unico di sintesi impresa |
| Verifiche eseguite | `ana_codici_ateco.codice_nace` esiste ma è una colonna per-riga di una tabella repeatable/versionata (una riga per classificazione), non un valore singolo per azienda |
| Necessità effettiva | Il documento (§0.3, §12.4) vuole un valore di sintesi unico, oggi la colonna è ripetuta identica su ogni riga ATECO (probabile ridondanza, non un errore ma un disegno per un uso diverso) |
| Collocazione consigliata | Nessuna nuova struttura: leggere il NACE dalla riga ATECO più recente/prevalente (stesso criterio già usato per "Codice ATECO prevalente" in §12.4) |
| Nome tecnico proposto | — (nessuna nuova colonna) |
| Tipo di dato | — |
| Relazioni | — |
| Impatto | Solo logica di lettura (backend o frontend), nessuna migrazione |
| Alternative | Aggiungere `codice_nace`/`versione_nace` come colonne singole su `ana_identificazione_camerale` se si preferisce un valore esplicitamente indipendente dalle righe ATECO |
| Decisione richiesta | Derivare dalla riga ATECO prevalente (nessuna modifica DB) / Creare colonne dedicate su identificazione camerale |

---

## 16. Tabelle del prototipo riusabili senza modifiche grafiche

Stile, intestazioni, scroll, stato riga, azioni CRUD, responsive: già
riusati correttamente per `SediTable`, `ContattiTable`, `CodiciAtecoTable`,
`AlbiTable`, `SoaTable`, `CertificazioniTable`, `AddettiVisuraTable`,
`AddettiComuneTable`, `IscrizioniTable`, `IncaricoTable`. Nessuna modifica
grafica necessaria per queste — solo le correzioni di collocazione/contenuto
sopra elencate.

## 17. Tabelle che richiedono nuove colonne o un dettaglio espandibile

`ana_sistemi_amministrazione` (D-C2), `ana_sedi` (D-E1, D-L),
`ana_identificazione_camerale` (D-D, D-E2, D-F, D-M), `ana_capitale_sociale`
(data di riferimento), `ana_soa`/`ana_certificazioni` (stato calcolato
esplicito).

## 18. Verifica storicizzazione — sezione Personale e occupazione

Confermata: `ana_addetti_visura`/`ana_addetti_comune` sono append-only per
rilevazione (vincoli UNIQUE su fonte+anno+data, non su azienda da sola), non
sovrascrivono rilevazioni precedenti. Nessuna azione richiesta.

## 19. Riepilogo decisioni da prendere

| Id | Oggetto | Raccomandazione |
|---|---|---|
| D-A | Sezione 7 intera (operazioni societarie) | Creare (sezione a zero copertura) |
| D-B | Infrastruttura importazione documentale | Posticipare (fuori scope, modulo Documenti dedicato) |
| D-C1 | Duplicazione scadenza esercizi | Scegliere una fonte autorevole tra le due tabelle esistenti |
| D-C2 | Dettaglio organi amministrativi previsti | Creare (piccola estensione di tabella esistente) |
| D-D | Oggetto sociale/poteri/ripartizione utili/clausole | Creare, eventualmente in più fasi |
| D-E1 | Toponimo/indirizzo originale | Creare (piccola estensione) |
| D-E2 | Trasferimento da altra provincia | Creare o posticipare (basso utilizzo atteso) |
| D-F | Notaio/repertorio/località atto, stato/cessazione iscrizione | Creare |
| D-G | Strumenti finanziari | Creare o posticipare (dipende da quante aziende reali li hanno) |
| D-H | Estremi elenco soci | Creare (nuova tabella dedicata) |
| D-H2 | Domicilio carica + PEC personale | Creare come caratteristiche testo libero (A62/A63) |
| D-L | Gap unità locali | Creare, valutare se in un'unica fase o incrementale |
| D-M | Indicatori impresa in cifre | Creare |
| D-P | NACE come valore di sintesi | Derivare da ATECO prevalente, nessuna nuova colonna |

**In attesa della risposta dell'utente su queste 14 decisioni prima di
procedere con qualunque migrazione, modello o componente frontend**, come
richiesto esplicitamente dal documento mappatura (§3, §14).

## 20. Decisioni prese dall'utente (2026-08-26, in chat)

| Id | Decisione |
|---|---|
| D-A | **Posticipare** — sezione 7 (operazioni societarie) resta assente dalla vista CCIAA |
| D-B | **Posticipare** — infrastruttura importazione documentale (0.2/0.5/11.2/11.3) rimandata al modulo Documenti dedicato |
| D-C1 | Fonte autorevole per 2.4.2 = **`ana_identificazione_camerale.inizio_esercizio`/`termine_esercizio`** (GG/MM); `ana_durata_societa_esercizi` resta per il suo uso attuale in "Durata società ed esercizi" |
| D-C2 | **Creare** — 6 nuove colonne su `ana_sistemi_amministrazione` |
| D-D | **Nessuna per ora** — oggetto sociale, poteri da statuto, ripartizione utili/perdite, clausole statutarie tutte posticipate |
| D-E1 | **Creare** — `ana_sedi.toponimo` + `.indirizzo_originale` |
| D-E2 | **Creare** — 3 colonne su `ana_identificazione_camerale` per il trasferimento da altra provincia |
| D-F | **Posticipare entrambi** — notaio/repertorio/località atto e stato/cessazione iscrizioni |
| D-G | **Posticipare** — strumenti finanziari (sezione 3.2) |
| D-H | **Creare** — nuova tabella dedicata `ana_elenco_soci_estremi` |
| D-H2 | **Creare** — caratteristiche A62 (Domicilio per la carica) e A63 (PEC personale/professionale) come testo libero nel catalogo condiviso |
| D-L | **Creare tutto il pacchetto** — colonne su `ana_sedi`, FK opzionali `sede_id` su `ana_codici_ateco`/`ana_albi_ruoli_licenze`, nuova tabella attività per-unità |
| D-M | **Creare** — 4 colonne su `ana_identificazione_camerale` + nuovo pannello di sintesi (sezione 0) |
| D-P | **Derivare da ATECO prevalente** — nessuna nuova colonna, solo logica di lettura |

Prossimo passo: pianificare l'implementazione (migrazioni, modelli, schemi,
frontend) per le decisioni "Creare", nell'ordine e con la numerazione delle
migrazioni definita nel piano di esecuzione (non ancora scritto a questa
data).
