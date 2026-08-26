// Caratteristiche del catalogo `cat_caratteristiche_incarico` rilevanti per
// ciascun ruolo camerale nelle card Soci/Amministratori/Sindaci (§4/§5/§6
// della specifica CCIAA, incrociata con i valori dimostrativi del prototipo
// HTML 25-08-26, blocco "administrators"/"control-bodies"/"shareholders").
//
// `rel_ruoli_caratteristiche` associa a questi ruoli anche caratteristiche
// generiche pensate per altri usi del motore incarichi (documenti di nomina,
// assenza di cause ostative/condanne, interno/esterno...): sono catalogo
// condiviso con il futuro modulo Personale, quindi non vanno rimosse dal
// database. Questa mappa filtra e ordina, solo lato CCIAA, quali di quelle
// già associate sono effettivamente pertinenti alla visura camerale — senza
// alcuna modifica allo schema o ai dati.
//
// Migrazione 0024 (Cataloghi/007_correzione_ruoli_cciaa.sql) ha portato a
// FACOLTATIVA le caratteristiche non pertinenti alla visura camerale per i
// 5 ruoli camerali, aggiunto i valori ammessi per A25/A29 e le
// caratteristiche A57-A61 per il ruolo Socio (tipologia della
// partecipazione, numero azioni/quote, quota del diritto in comproprietà,
// titolarità individuale/congiunta, descrizione di vincoli ulteriori):
// tutti i campi della specifica §4.4 sono ora rappresentabili.
export const CARATTERISTICHE_VISIBILI_PER_RUOLO: Record<string, string[]> = {
  // §4.1/4.4: decorrenza ed eventuale cessazione della partecipazione,
  // tipologia/quota/percentuale/tipo di diritto/versamento/numero titoli/
  // quota del diritto/titolarità/vincoli, nota e verifica interna.
  SOCIO: [
    "A01",
    "A02",
    "A57",
    "A52",
    "A53",
    "A54",
    "A55",
    "A56",
    "A58",
    "A59",
    "A60",
    "A61",
    "A62",
    "A63",
    "A18",
    "A32",
  ],

  // §5.4: data assegnazione/nomina, data di iscrizione, scadenza, criterio
  // di scadenza, stato della carica, rappresentanza legale, poteri e
  // limitazioni, modalità di firma. A62/A63 (domicilio della carica, PEC
  // personale/professionale, migrazione 0031) in coda, facoltative.
  AMMINISTRATORE: ["A01", "A49", "A50", "A51", "A29", "A25", "A23", "A21", "A22", "A24", "A02", "A62", "A63", "A18", "A32"],
  AMMINISTRATORE_DELEGATO: [
    "A01", "A49", "A50", "A51", "A29", "A25", "A23", "A21", "A22", "A24", "A02", "A62", "A63", "A18", "A32",
  ],
  COMPONENTE_CDA: ["A01", "A49", "A50", "A51", "A29", "A25", "A23", "A21", "A22", "A24", "A02", "A62", "A63", "A18", "A32"],

  // §6.1/6.2: data nomina/iscrizione, durata, stato della carica, registro o
  // albo professionale del sindaco.
  SINDACO: ["A01", "A49", "A50", "A51", "A25", "A29", "A11", "A12", "A13", "A02", "A62", "A63", "A18", "A32"],

  // §6.2: come sindaco, con l'iscrizione al Registro dei Revisori Legali al
  // posto dell'albo generico.
  REVISORE_LEGALE: ["A01", "A49", "A50", "A51", "A25", "A29", "A34", "A35", "A36", "A02", "A62", "A63", "A18", "A32"],
};

/** Separa le caratteristiche restituite dall'API in "principali" (curatela
 * CCIAA sopra, in evidenza nel form) e "altre" (il resto delle
 * caratteristiche associate al ruolo nel catalogo condiviso — spesso
 * obbligatorie per usi non CCIAA del motore incarichi, es. documenti di
 * nomina o assenza di cause ostative per ruoli di sicurezza/personale).
 *
 * Le "altre" non vanno mai scartate: `app.core.incarichi.valida_e_salva_valori`
 * rifiuta la creazione se manca una qualunque caratteristica OBBLIGATORIA
 * del ruolo, quindi il form deve comunque poterle mostrare e compilare,
 * solo con priorità visiva più bassa. Rimuoverle davvero dal catalogo del
 * ruolo (cambiandone l'obbligatorietà) è una modifica ai dati esistenti di
 * `rel_ruoli_caratteristiche`: una migrazione da approvare esplicitamente,
 * non qualcosa che questo modulo può decidere da solo. */
export function separaCaratteristicheCciaa<T extends { codice: string }>(
  ruoloCodice: string,
  tutte: T[],
): { principali: T[]; altre: T[] } {
  const ordine = CARATTERISTICHE_VISIBILI_PER_RUOLO[ruoloCodice];
  if (!ordine) return { principali: tutte, altre: [] };
  const insieme = new Set(ordine);
  const perCodice = new Map(tutte.map((c) => [c.codice, c]));
  const principali = ordine.map((codice) => perCodice.get(codice)).filter((c): c is T => c !== undefined);
  const altre = tutte.filter((c) => !insieme.has(c.codice));
  return { principali, altre };
}
